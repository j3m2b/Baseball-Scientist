import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

type Experiment = Database['public']['Tables']['experiments']['Row'];

export async function GET() {
  const supabase = supabaseServer;

  // Get the latest experiment
  const result = await supabase
    .from('experiments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const experiment = result.data as Experiment | null;
  if (!experiment) {
    return NextResponse.json({ error: 'No experiments found' }, { status: 404 });
  }

  const experimentId = experiment.id;

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

  const { data: reflections } = await supabase
    .from('reflections')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    experiment: experiment,
    hypotheses: hypotheses || [],
    insights: insights || [],
    probabilities: probabilities || [],
    reflections: reflections || [],
  });
}