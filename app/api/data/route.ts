import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = supabaseServer();

  // Get the latest experiment
  const { data: latestExperiment, error: expError } = await supabase
    .from('experiments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();  // Added .single() to return a single object (fixes TS error)

  if (expError || !latestExperiment) {
    return NextResponse.json({ error: 'No experiments found' }, { status: 404 });
  }

  // Get related data
  const { data: hypotheses } = await supabase
    .from('hypotheses')
    .select('*')
    .eq('experiment_id', latestExperiment.id)
    .order('created_at', { ascending: false });

  const { data: insights } = await supabase
    .from('insights')
    .select('*')
    .eq('experiment_id', latestExperiment.id)
    .order('created_at', { ascending: false });

  const { data: probabilities } = await supabase
    .from('team_probabilities')
    .select('*')
    .eq('experiment_id', latestExperiment.id);

  return NextResponse.json({
    experiment: latestExperiment,
    hypotheses: hypotheses || [],
    insights: insights || [],
    probabilities: probabilities || [],
  });
}