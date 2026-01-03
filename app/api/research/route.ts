import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import { join } from 'path';

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
    .select('hypothesis, isValidated, surpriseLevel, experiment_id')
    .in('experiment_id', expIds);

  const { data: pastProbs } = await supabase
    .from('team_probabilities')
    .select('teamName, probability, experiment_id')
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
      historyContext += `Key Hypotheses: ${hyps.map((h: any) => `${h.hypothesis} (${h.isValidated ? '✓' : '✗'}, Surprise ${h.surpriseLevel})`).join('; ') || 'None'}\n`;
      historyContext += `Top Teams: ${probs.map((p: any) => `${p.teamName} ${p.probability}%`).join(', ') || 'None'}\n\n`;
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

    // Your existing parseClaudeResponse + Supabase insert logic here (unchanged)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
