import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseClaudeResponse, TEAM_CODES } from '@/lib/parsers';
import { getCurrentMLBData } from '@/lib/mlb-data';

// Simple client-friendly trigger endpoint
// In production, you'd want proper authentication (e.g., Supabase auth, session checks)
export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();

    // Verify the secret matches
    if (secret !== process.env.CRON_SECRET) {
      console.error('[Trigger] Unauthorized: secret does not match');
      return NextResponse.json({ error: 'Unauthorized - Invalid secret' }, { status: 401 });
    }

    console.error('[Trigger] Secret verified, starting research cycle...');

    // Import and run the research logic directly instead of fetching
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.ANTHROPIC_BASE_URL,
    });

    const systemPrompt = readFileSync(join(process.cwd(), 'claude.code.md'), 'utf-8');

    // Fetch past cycles for reflection
    const supabase = supabaseServer;
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

    // Fetch current MLB data automatically
    const currentMLBData = await getCurrentMLBData();

    const userPrompt = `${historyContext}\n\n${currentMLBData}\n\nNow run the next research cycle.`;

    console.error('[Trigger] Calling Claude API...');

    const response = await anthropic.messages.create({
      model: 'glm-4.7',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    if (!text) {
      console.error('[Trigger] Empty response from Claude');
      return NextResponse.json({ error: 'Empty response from Claude' }, { status: 500 });
    }

    console.error('[Trigger] Claude response received, length:', text.length);

    // Parse the XML response
    const parsed = parseClaudeResponse(text);

    // Validate parsed data
    if (!parsed.title || !parsed.summary) {
      console.error('[Trigger] Failed to parse:', { title: parsed.title, summary: parsed.summary });
      return NextResponse.json({ error: 'Failed to parse Claude response - missing title or summary' }, { status: 500 });
    }

    console.error('[Trigger] Parsed data:', { title: parsed.title, hypotheses: parsed.hypotheses.length, teams: parsed.teamProbabilities.length });

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
      console.error('[Trigger] Failed to create experiment:', expResult.error);
      return NextResponse.json({ error: 'Failed to create experiment: ' + (expResult.error?.message || 'Unknown error') }, { status: 500 });
    }

    const experimentId = experiment.id;
    console.error('[Trigger] Experiment created:', experimentId);

    // Insert hypotheses
    if (parsed.hypotheses.length > 0) {
      const hypothesesToInsert = parsed.hypotheses.map((h: any) => ({
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
        console.error('[Trigger] Failed to insert hypotheses:', hypError);
        await supabase.from('experiments').delete().eq('id', experimentId);
        return NextResponse.json({ error: 'Failed to save hypotheses: ' + hypError.message }, { status: 500 });
      }
      console.error('[Trigger] Inserted', parsed.hypotheses.length, 'hypotheses');
    }

    // Calculate and insert team probabilities with rankings
    if (parsed.teamProbabilities.length > 0) {
      const sortedTeams = [...parsed.teamProbabilities].sort((a: any, b: any) => b.probability - a.probability);

      const probabilitiesToInsert = sortedTeams.map((t: any, index: number) => ({
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
        console.error('[Trigger] Failed to insert probabilities:', probError);
        await supabase.from('experiments').delete().eq('id', experimentId);
        return NextResponse.json({ error: 'Failed to save probabilities: ' + probError.message }, { status: 500 });
      }
      console.error('[Trigger] Inserted', sortedTeams.length, 'team probabilities');
    }

    // Insert insights
    if (parsed.insights.length > 0) {
      const insightsToInsert = parsed.insights.map((insight: string) => ({
        experiment_id: experimentId,
        insight: insight,
        details: ''
      }));

      const { error: insError } = await supabase
        .from('insights')
        .insert(insightsToInsert as any);

      if (insError) {
        console.error('[Trigger] Failed to insert insights:', insError);
      }
      console.error('[Trigger] Inserted', parsed.insights.length, 'insights');
    }

    console.error('[Trigger] Research cycle completed successfully');

    return NextResponse.json({
      success: true,
      experimentId,
      title: parsed.title,
      hypothesesCount: parsed.hypotheses.length,
      insightsCount: parsed.insights.length
    });
  } catch (error) {
    console.error('[Trigger] Error:', error);
    return NextResponse.json({
      error: 'Failed to trigger research: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}
