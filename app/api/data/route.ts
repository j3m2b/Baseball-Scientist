import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Fetch latest experiment with all related data
    const { data: experiments, error: expError } = await supabase
      .from('experiments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (expError) throw expError;

    if (!experiments || experiments.length === 0) {
      return NextResponse.json({
        experiments: [],
        latest: null,
      });
    }

    const latestExperiment = experiments[0];

    // Fetch related data for latest experiment
    const [
      { data: hypotheses },
      { data: insights },
      { data: teamProbabilities },
      { data: nextExperiments },
    ] = await Promise.all([
      supabase
        .from('hypotheses')
        .select('*')
        .eq('experiment_id', latestExperiment.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('insights')
        .select('*')
        .eq('experiment_id', latestExperiment.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('team_probabilities')
        .select('*')
        .eq('experiment_id', latestExperiment.id)
        .order('rank', { ascending: true }),
      supabase
        .from('next_experiments')
        .select('*')
        .eq('experiment_id', latestExperiment.id)
        .order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      experiments,
      latest: {
        experiment: latestExperiment,
        hypotheses: hypotheses || [],
        insights: insights || [],
        teamProbabilities: teamProbabilities || [],
        nextExperiments: nextExperiments || [],
      },
    });
  } catch (error) {
    console.error('Data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    );
  }
}
