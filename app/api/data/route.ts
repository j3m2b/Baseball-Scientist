import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = supabaseServer;

  // Get the latest experiment
  const { data: latestExperiment, error: expError } = await supabase
    .from('experiments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (expError || !latestExperiment) {
    return NextResponse.json({ error: 'No experiments found' }, { status: 404 });
  }

  // Use non-null assertion (!) since we checked !latestExperiment above — TS should narrow but sometimes needs help with Supabase types
  const experimentId = latestExperiment!.id;

  // Get related data
  const { data: hypotheses } = await supabase
    .from('hypotheses')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('created_at', { ascending: false });

  const { data: insights } = await supabase
    .from('insights')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('created_at', { ascending: false });

  const { data: probabilities } = await supabase
    .from('team_probabilities')
    .select('*')
    .eq('experiment_id', experimentId);

  return NextResponse.json({
    experiment: latestExperiment,
    hypotheses: hypotheses || [],
    insights: insights || [],
    probabilities: probabilities || [],
  });
}