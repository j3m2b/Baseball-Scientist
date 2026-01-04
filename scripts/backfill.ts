#!/usr/bin/env node
/**
 * Backfill Script - Creates historical research cycles for 2025 season
 *
 * This script:
 * 1. Runs research cycles for 12 monthly snapshots (Jan 2025 - Jan 2026)
 * 2. Validates predictions against known 2025 outcomes
 * 3. Populates database with "experienced" learning data
 *
 * Usage: node scripts/backfill.ts
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables first
config({ path: '.env.local' });

// Now use dynamic imports for modules that need env vars
async function main() {
  const { supabaseServer } = await import('../lib/supabase/server.js');
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const { HISTORICAL_SNAPSHOTS, getSnapshotData } = await import('../lib/historical-data.js');

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY,
    baseURL: process.env.ANTHROPIC_BASE_URL,
  });

  const systemPrompt = readFileSync(join(process.cwd(), 'claude.code.md'), 'utf-8');

  // Team codes mapping
  const TEAM_CODES = {
    'Diamondbacks': 'ARI', 'Braves': 'ATL', 'Orioles': 'BAL', 'Red Sox': 'BOS',
    'Cubs': 'CHC', 'White Sox': 'CWS', 'Reds': 'CIN', 'Guardians': 'CLE',
    'Rockies': 'COL', 'Tigers': 'DET', 'Astros': 'HOU', 'Royals': 'KCR',
    'Angels': 'LAA', 'Dodgers': 'LAD', 'Marlins': 'MIA', 'Brewers': 'MIL',
    'Twins': 'MIN', 'Mets': 'NYM', 'Yankees': 'NYY', 'Athletics': 'OAK',
    'Phillies': 'PHI', 'Pirates': 'PIT', 'Padres': 'SD', 'Giants': 'SF',
    'Mariners': 'SEA', 'Cardinals': 'STL', 'Rays': 'TBR', 'Rangers': 'TEX',
    'Blue Jays': 'TOR', 'Nationals': 'WSN'
  };

  // Simple XML parser (same as in lib/parsers.ts)
  function extractTagContent(xml: string, tag: string) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
  }

  function extractRepeatedTags(xml: string, tag: string) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
      matches.push(match[1].trim());
    }
    return matches;
  }

  function parseSurpriseLevel(level: number) {
    if (level <= 3) return 'Low';
    if (level <= 7) return 'Medium';
    return 'High';
  }

  function parseClaudeResponse(text: string) {
    const experimentContent = extractTagContent(text, 'experiment');
    const title = extractTagContent(experimentContent, 'title');
    const summary = extractTagContent(experimentContent, 'summary');

    const hypothesisBlocks = extractRepeatedTags(experimentContent, 'hypothesis');
    const hypotheses = hypothesisBlocks.map(block => ({
      text: extractTagContent(block, 'text'),
      isValidated: extractTagContent(block, 'isValidated').toLowerCase() === 'true',
      surpriseLevel: parseSurpriseLevel(parseInt(extractTagContent(block, 'surpriseLevel')) || 5),
      explanation: extractTagContent(block, 'explanation')
    }));

    const teamBlocks = extractRepeatedTags(experimentContent, 'team');
    const teamProbabilities = teamBlocks.map(block => ({
      name: extractTagContent(block, 'name'),
      probability: parseFloat(extractTagContent(block, 'probability')),
      change: parseFloat(extractTagContent(block, 'change') || '0')
    }));

    const insights = extractRepeatedTags(experimentContent, 'insight');
    const nextExperiments = extractRepeatedTags(experimentContent, 'next');

    return { title, summary, hypotheses, teamProbabilities, insights, nextExperiments };
  }

  async function runResearchCycle(snapshot: any, experimentNumber: number, pastExps: any[] = []) {
    console.log(`\n🔄 Running Cycle ${experimentNumber}: ${snapshot.month} ${snapshot.year} - ${snapshot.title}`);

    // Build context from previous cycles
    let historyContext = 'No previous research cycles yet.';
    if (pastExps && pastExps.length > 0) {
      historyContext = '### Previous Research Cycles (for reflection only):\n\n';
      pastExps.forEach((exp: any, i: number) => {
        historyContext += `Cycle ${experimentNumber - pastExps.length + i}: ${exp.title}\n`;
        historyContext += `${exp.summary}\n`;
      });
    }

    // Get historical data for this snapshot
    const snapshotData = getSnapshotData(snapshot);

    // Add reflection prompt for learning
    const reflectionPrompt = pastExps.length > 0 ? `
### Learning & Reflection
Review your previous predictions and what actually happened:
- Which hypotheses were validated? Which were invalidated?
- What patterns do you notice in your predictions?
- Adjust your probabilistic reasoning based on what you've learned.
` : '';

    const userPrompt = `${reflectionPrompt}\n\n${snapshotData}\n\nGenerate your research cycle for ${snapshot.month} ${snapshot.year}.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      if (!text) {
        throw new Error('Empty response from Claude');
      }

      console.log(`✓ Claude response received (${text.length} chars)`);

      return parseClaudeResponse(text);
    } catch (error: any) {
      console.error(`✗ Error running cycle:`, error.message);
      return null;
    }
  }

  async function saveExperiment(experimentData: any, snapshot: any, experimentNumber: number) {
    const supabase = supabaseServer;

    try {
      // Create experiment
      const expResult = await supabase
        .from('experiments')
        .insert({
          experiment_number: experimentNumber,
          title: `${snapshot.month} ${snapshot.year}: ${experimentData.title}`,
          summary: `${experimentData.summary}\n\n[Historical context: ${snapshot.description}]`
        } as any)
        .select('id')
        .single();

      const expData = expResult.data as any;
      if (expResult.error || !expData) {
        throw new Error(`Failed to create experiment: ${expResult.error?.message}`);
      }

      const experimentId = expData.id;
      console.log(`  ✓ Experiment created (ID: ${experimentId.slice(0, 8)}...)`);

      // Insert hypotheses
      if (experimentData.hypotheses.length > 0) {
        const hypothesesToInsert = experimentData.hypotheses.map((h: any) => ({
          experiment_id: experimentId,
          hypothesis: h.text,
          is_validated: h.isValidated,
          evidence: h.explanation,
          surprise_level: h.surpriseLevel
        }));

        const { error: hypError } = await supabase
          .from('hypotheses')
          .insert(hypothesesToInsert as any);

        if (hypError) {
          throw new Error(`Failed to insert hypotheses: ${hypError.message}`);
        }
        console.log(`  ✓ ${experimentData.hypotheses.length} hypotheses saved`);
      }

      // Insert team probabilities
      if (experimentData.teamProbabilities.length > 0) {
        const sortedTeams = [...experimentData.teamProbabilities].sort((a: any, b: any) => b.probability - a.probability);

        const probabilitiesToInsert = sortedTeams.map((t: any, index: number) => ({
          experiment_id: experimentId,
          team_code: (TEAM_CODES as any)[t.name] || t.name.slice(0, 3).toUpperCase(),
          team_name: t.name,
          probability: t.probability,
          rank: index + 1,
          change_from_previous: t.change
        }));

        const { error: probError } = await supabase
          .from('team_probabilities')
          .insert(probabilitiesToInsert as any);

        if (probError) {
          throw new Error(`Failed to insert probabilities: ${probError.message}`);
        }
        console.log(`  ✓ ${sortedTeams.length} team probabilities saved`);
      }

      // Insert insights
      if (experimentData.insights.length > 0) {
        const insightsToInsert = experimentData.insights.map((insight: string) => ({
          experiment_id: experimentId,
          insight: insight,
          details: ''
        }));

        await supabase
          .from('insights')
          .insert(insightsToInsert as any);

        console.log(`  ✓ ${experimentData.insights.length} insights saved`);
      }

      // Insert next experiments
      if (experimentData.nextExperiments.length > 0) {
        const nextToInsert = experimentData.nextExperiments.map((next: string) => ({
          experiment_id: experimentId,
          description: next
        }));

        await supabase
          .from('next_experiments')
          .insert(nextToInsert as any);

        console.log(`  ✓ ${experimentData.nextExperiments.length} next experiments saved`);
      }

      return { success: true, experimentId };
    } catch (error: any) {
      console.error(`✗ Error saving experiment:`, error.message);
      return { success: false, error: error.message };
    }
  }

  console.log('🚀 Starting Historical Backfill');
  console.log(`📅 Processing ${HISTORICAL_SNAPSHOTS.length} monthly snapshots\n`);

  const supabase = supabaseServer;

  // Check current state - get ALL existing experiment numbers
  const { data: allExps } = await supabase
    .from('experiments')
    .select('id, experiment_number, title, summary, created_at')
    .order('experiment_number', { ascending: true });

  const allExperiments = allExps as any[] | null;

  // Get the set of existing experiment numbers for quick lookup
  const existingNumbers = new Set((allExperiments ?? []).map((e: any) => e.experiment_number));

  // Find the next available experiment number
  let nextNumber = 1;
  while (existingNumbers.has(nextNumber)) {
    nextNumber++;
  }

  console.log(`📊 Found ${allExperiments?.length ?? 0} existing experiments`);
  console.log(`📊 Starting from experiment #${nextNumber}\n`);

  const completedCycles: any[] = [];

  // Process each snapshot
  for (const snapshot of HISTORICAL_SNAPSHOTS) {
    // Find next available experiment number (skip any that exist)
    let experimentNumber = nextNumber + completedCycles.length;
    let adjustment = 0;
    while (existingNumbers.has(experimentNumber + adjustment)) {
      adjustment++;
    }
    experimentNumber += adjustment;

    // Run research cycle
    const experimentData = await runResearchCycle(snapshot, experimentNumber, allExperiments ?? []);

    if (!experimentData) {
      console.log(`⚠️  Skipping ${snapshot.month} ${snapshot.year} - no data generated`);
      continue;
    }

    // Save to database
    const result = await saveExperiment(experimentData, snapshot, experimentNumber);

    if (result.success) {
      completedCycles.push({ ...snapshot, experimentNumber, experimentId: result.experimentId });
      (allExperiments ?? []).push({
        id: result.experimentId,
        experiment_number: experimentNumber,
        title: `${snapshot.month} ${snapshot.year}: ${experimentData.title}`,
        summary: experimentData.summary,
        created_at: new Date().toISOString()
      });
      // Mark this number as used to avoid conflicts
      existingNumbers.add(experimentNumber);

      // Rate limiting to avoid overwhelming the API
      if (completedCycles.length < HISTORICAL_SNAPSHOTS.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.log(`\n✅ Backfill Complete!`);
  console.log(`   ${completedCycles.length}/${HISTORICAL_SNAPSHOTS.length} cycles created`);
  console.log(`   Database now has learning data for pattern detection and adaptive tuning`);
}

main().catch(console.error);
