import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseClaudeResponse, TEAM_CODES } from '@/lib/parsers';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL, // For GLM-4.7
});

const systemPrompt = readFileSync(join(process.cwd(), 'claude.code.md'), 'utf-8');

const CURRENT_MLB_DATA = `Your latest off-season data here — update as needed`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = supabaseServer;

  // Fetch last 10 cycles for reflection
  const { data: pastExps } = await supabase
    .from('experiments')
    .select('id, created_at, title, summary')
    .order('created_at', { ascending: false })
    .limit(10);

  const expIds = pastExps?.map((e: any) => e.id) || [];

  const { data: pastHyps } = await supabase
    .from('hypotheses')
    .select('hypothesis, is_validated, surprise_level, experiment_id')
    .in('experiment_id', expIds);

  const { data: pastProbs } = await supabase
    .from('team_probabilities')
    .select('team_name, probability, experiment_id')
    .in('experiment_id', expIds);

  // Format history
  let historyContext = 'No previous research cycles yet.';
  if (pastExps && pastExps.length > 0) {
    historyContext = '### Previous Research Cycles (for reflection only):\n\n';
    pastExps.forEach((exp: any, i: number) => {
      const hyps = pastHyps?.filter((h: any) => h.experiment_id === exp.id) || [];
      const probs = pastProbs?.filter((p: any) => p.experiment_id === exp.id).slice(0, 6) || [];
      historyContext += `Cycle ${pastExps.length - i} (${new Date(exp.created_at).toLocaleDateString()}):\n`;
      historyContext += `${exp.title}\n${exp.summary}\n`;
      historyContext += `Key Hypotheses: ${hyps.map((h: any) => `${h.hypothesis} (${h.is_validated ? '✓' : '✗'}, Surprise ${h.surprise_level})`).join('; ') || 'None'}\n`;
      historyContext += `Top Teams: ${probs.map((p: any) => `${p.team_name} ${p.probability}%`).join(', ') || 'None'}\n\n`;
    });
  }

  const userPrompt = `${historyContext}\n\n### Current MLB Data:\n${CURRENT_MLB_DATA}\n\nNow run the next research cycle.`;

  try {
    const response = await anthropic.messages.create({
      model: 'glm-4.7', // Explicit for Z.ai
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    if (!text) {
      return NextResponse.json({ error: 'Empty response from Claude' }, { status: 500 });
    }

    // Parse the XML response
    const parsed = parseClaudeResponse(text);

    // Validate parsed data
    if (!parsed.title || !parsed.summary) {
      console.error('Failed to parse experiment:', { parsed, rawText: text });
      return NextResponse.json({ error: 'Failed to parse Claude response' }, { status: 500 });
    }

    // Get next experiment number
    const lastExpResult = await supabase
      .from('experiments')
      .select('experiment_number')
      .order('experiment_number', { ascending: false })
      .limit(1)
      .single();

    const lastExp = lastExpResult.data as { experiment_number: number } | null;
    const nextExperimentNumber = (lastExp?.experiment_number ?? 0) + 1;

    // Create experiment record
    const expResult = await supabase
      .from('experiments')
      .insert({
        experiment_number: nextExperimentNumber,
        title: parsed.title,
        summary: parsed.summary
      } as any)
      .select('id')
      .single();

    const experiment = expResult.data as { id: string } | null;
    if (expResult.error || !experiment) {
      console.error('Failed to create experiment:', expResult.error);
      return NextResponse.json({ error: 'Failed to create experiment' }, { status: 500 });
    }

    const experimentId = experiment.id;

    // Insert hypotheses
    if (parsed.hypotheses.length > 0) {
      const hypothesesToInsert = parsed.hypotheses.map(h => ({
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
        console.error('Failed to insert hypotheses:', hypError);
        // Cleanup: delete experiment on failure
        await supabase.from('experiments').delete().eq('id', experimentId);
        return NextResponse.json({ error: 'Failed to save hypotheses' }, { status: 500 });
      }
    }

    // Calculate and insert team probabilities with rankings
    if (parsed.teamProbabilities.length > 0) {
      // Sort by probability descending and assign ranks
      const sortedTeams = [...parsed.teamProbabilities].sort((a, b) => b.probability - a.probability);

      const probabilitiesToInsert = sortedTeams.map((t, index) => ({
        experiment_id: experimentId,
        team_code: TEAM_CODES[t.name] || t.name.slice(0, 3).toUpperCase(),
        team_name: t.name,
        probability: t.probability,
        rank: index + 1,
        change_from_previous: t.change
      }));

      const { error: probError } = await supabase
        .from('team_probabilities')
        .insert(probabilitiesToInsert as any);

      if (probError) {
        console.error('Failed to insert probabilities:', probError);
        // Cleanup: delete experiment and hypotheses on failure
        await supabase.from('experiments').delete().eq('id', experimentId);
        return NextResponse.json({ error: 'Failed to save probabilities' }, { status: 500 });
      }
    }

    // Insert insights
    if (parsed.insights.length > 0) {
      const insightsToInsert = parsed.insights.map(insight => ({
        experiment_id: experimentId,
        insight: insight,
        details: '' // Schema requires details but we only have brief insights
      }));

      const { error: insError } = await supabase
        .from('insights')
        .insert(insightsToInsert as any);

      if (insError) {
        console.error('Failed to insert insights:', insError);
        // Don't fail on insights error, just log it
      }
    }

    return NextResponse.json({
      success: true,
      experimentId,
      title: parsed.title,
      hypothesesCount: parsed.hypotheses.length,
      insightsCount: parsed.insights.length
    });
  } catch (error) {
    console.error('Research cycle error:', error);
    return NextResponse.json({ error: 'Failed to run research cycle' }, { status: 500 });
  }
}
