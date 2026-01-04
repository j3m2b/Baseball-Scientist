/**
 * Historical Research Cycle Runner
 * Runs a single research cycle with historical MLB data
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from '../../lib/supabase/server';
import type { MLBDataSnapshot, BackfillCycleResult } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function runHistoricalCycle(
  snapshot: MLBDataSnapshot
): Promise<BackfillCycleResult> {
  console.log(`[${snapshot.date}] Starting historical research cycle...`);
  console.log(`[${snapshot.date}] Games played: ${snapshot.gamesPlayed}`);
  console.log(`[${snapshot.date}] Key events:`, snapshot.keyEvents.join(', '));
  console.log();

  try {
    // Build prompt for Claude with historical context
    const prompt = buildHistoricalPrompt(snapshot);

    // Call Claude to generate predictions
    console.log(`[${snapshot.date}] Calling Claude to generate predictions...`);
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 0.7,
      system: buildSystemPrompt(snapshot),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse Claude's response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Expected text response from Claude');
    }

    const analysisText = content.text;
    console.log(`[${snapshot.date}] Claude response received (${analysisText.length} chars)`);

    // Extract hypotheses and probabilities from response
    const { hypotheses, teamProbabilities } = parseClaudeResponse(analysisText, snapshot);

    console.log(`[${snapshot.date}] Parsed ${hypotheses.length} hypotheses`);
    console.log(`[${snapshot.date}] Parsed ${teamProbabilities.length} team probabilities`);

    // Store in database
    const experimentId = await storeHistoricalCycle(
      snapshot,
      analysisText,
      hypotheses,
      teamProbabilities
    );

    console.log(`[${snapshot.date}] ✅ Stored in database as experiment ${experimentId}`);

    return {
      cycleNumber: snapshot.cycleNumber,
      date: snapshot.date,
      hypothesesGenerated: hypotheses.length,
      teamProbabilitiesGenerated: teamProbabilities.length,
      experimentId,
      success: true,
    };
  } catch (error) {
    console.error(`[${snapshot.date}] ❌ Error:`, error);
    return {
      cycleNumber: snapshot.cycleNumber,
      date: snapshot.date,
      hypothesesGenerated: 0,
      teamProbabilitiesGenerated: 0,
      experimentId: '',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildSystemPrompt(snapshot: MLBDataSnapshot): string {
  return `You are Baseball Scientist, an MLB analysis AI with a True Learning Loop.

CRITICAL CONTEXT - TIME TRAVEL MODE:
- You are analyzing baseball AS IF IT IS: ${snapshot.date}
- Games played this season: ${snapshot.gamesPlayed}
- This is a HISTORICAL research cycle for training your learning loop
- Make predictions as if you are in ${snapshot.date} (you don't know what happens after this date)

Your task:
1. Analyze the provided MLB data snapshot from ${snapshot.date}
2. Generate testable hypotheses about the remainder of the season
3. Provide team World Series probabilities
4. Make bold predictions that can be validated later

Be scientific, data-driven, and bold. Your predictions will be validated against actual 2025 season results.

Generate your response in this EXACT format:

# Baseball Scientist Analysis (${snapshot.date})

## Executive Summary
[Brief summary of current state]

## Key Trends
[3-5 major trends you observe]

## Testable Hypotheses
[List 5-8 specific, testable hypotheses]

HYPOTHESIS 1: [Statement]
Confidence: [0-100]%
Rationale: [Why you believe this]

HYPOTHESIS 2: [Statement]
Confidence: [0-100]%
Rationale: [Why you believe this]

[Continue for all hypotheses...]

## Team World Series Probabilities
[List probabilities for all playoff contenders]

LA Dodgers: X.X%
Atlanta Braves: X.X%
Baltimore Orioles: X.X%
[etc.]

## Bold Predictions
[3-5 bold, specific predictions for validation]

Be specific, quantifiable, and bold!`;
}

function buildHistoricalPrompt(snapshot: MLBDataSnapshot): string {
  return `${snapshot.mlbData}

---

Based on the MLB data above from ${snapshot.date} (${snapshot.gamesPlayed} games played), generate your research analysis.

Remember:
- You are analyzing AS IF it is ${snapshot.date}
- You do NOT know what happens after this date
- Make bold, testable predictions
- Be specific and quantifiable

Key events since last analysis:
${snapshot.keyEvents.map((e) => `• ${e}`).join('\n')}

Generate your complete analysis now.`;
}

interface ParsedHypothesis {
  statement: string;
  confidence: number;
  rationale: string;
}

interface ParsedTeamProbability {
  teamName: string;
  probability: number;
}

function parseClaudeResponse(
  text: string,
  snapshot: MLBDataSnapshot
): {
  hypotheses: ParsedHypothesis[];
  teamProbabilities: ParsedTeamProbability[];
} {
  const hypotheses: ParsedHypothesis[] = [];
  const teamProbabilities: ParsedTeamProbability[] = [];

  // Parse hypotheses (look for "HYPOTHESIS N:" pattern)
  const hypothesisRegex = /HYPOTHESIS \d+: (.+?)[\n\r]+Confidence: (\d+)%[\n\r]+Rationale: (.+?)(?=[\n\r]+HYPOTHESIS|\n\n|$)/gis;
  let match;

  while ((match = hypothesisRegex.exec(text)) !== null) {
    hypotheses.push({
      statement: match[1].trim(),
      confidence: parseInt(match[2], 10),
      rationale: match[3].trim(),
    });
  }

  // Parse team probabilities (look for "Team: X.X%" pattern)
  const probabilityRegex = /^(.+?):\s*(\d+(?:\.\d+)?)%/gim;

  while ((match = probabilityRegex.exec(text)) !== null) {
    const teamName = match[1].trim();
    const probability = parseFloat(match[2]);

    // Only include if looks like a team name and reasonable probability
    if (teamName.length > 2 && probability >= 0 && probability <= 100) {
      teamProbabilities.push({
        teamName,
        probability,
      });
    }
  }

  return { hypotheses, teamProbabilities };
}

async function storeHistoricalCycle(
  snapshot: MLBDataSnapshot,
  analysisText: string,
  hypotheses: ParsedHypothesis[],
  teamProbabilities: ParsedTeamProbability[]
): Promise<string> {
  const supabase = supabaseServer;

  // Create experiment record with historical date
  const { data: experiment, error: expError } = await supabase
    .from('experiments')
    .insert({
      mlb_data_summary: `${snapshot.description} (${snapshot.gamesPlayed} games)`,
      claude_analysis: analysisText,
      created_at: new Date(snapshot.date).toISOString(), // Use historical date!
    })
    .select()
    .single();

  if (expError || !experiment) {
    throw new Error(`Failed to create experiment: ${expError?.message}`);
  }

  // Store hypotheses
  if (hypotheses.length > 0) {
    const hypothesisRecords = hypotheses.map((h) => ({
      experiment_id: experiment.id,
      hypothesis_text: h.statement,
      confidence_level: h.confidence,
      rationale: h.rationale,
      created_at: new Date(snapshot.date).toISOString(),
    }));

    const { error: hypError } = await supabase.from('hypotheses').insert(hypothesisRecords);

    if (hypError) {
      throw new Error(`Failed to insert hypotheses: ${hypError.message}`);
    }
  }

  // Store team probabilities
  if (teamProbabilities.length > 0) {
    const probabilityRecords = teamProbabilities.map((tp) => ({
      experiment_id: experiment.id,
      team_name: tp.teamName,
      world_series_probability: tp.probability,
      created_at: new Date(snapshot.date).toISOString(),
    }));

    const { error: probError } = await supabase.from('team_probabilities').insert(probabilityRecords);

    if (probError) {
      throw new Error(`Failed to insert team probabilities: ${probError.message}`);
    }
  }

  return experiment.id;
}
