import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * POST /api/team-outcomes
 * Records actual team results to calculate probability accuracy
 *
 * Body:
 * {
 *   experiment_id: string;
 *   team_code: string;
 *   actual_result: 'won_ws' | 'made_ws' | 'made_playoffs' | 'missed_playoffs' | 'tbd';
 *   result_date?: string; // ISO date string (required unless tbd)
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = supabaseServer;

  try {
    const body = await request.json();
    const { experiment_id, team_code, actual_result, result_date } = body;

    // Validate required fields
    if (!experiment_id || !team_code || !actual_result) {
      return NextResponse.json(
        { error: 'Missing required fields: experiment_id, team_code, actual_result' },
        { status: 400 }
      );
    }

    // Validate actual_result
    const validResults = ['won_ws', 'made_ws', 'made_playoffs', 'missed_playoffs', 'tbd'];
    if (!validResults.includes(actual_result)) {
      return NextResponse.json(
        { error: `Invalid actual_result. Must be one of: ${validResults.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate result_date if not tbd
    if (actual_result !== 'tbd' && !result_date) {
      return NextResponse.json(
        { error: 'result_date is required when actual_result is not tbd' },
        { status: 400 }
      );
    }

    // Get the team's predicted probability from this experiment
    const { data: probability, error: probError } = await supabase
      .from('team_probabilities')
      .select('team_name, probability')
      .eq('experiment_id', experiment_id)
      .eq('team_code', team_code)
      .single();

    if (probError || !probability) {
      return NextResponse.json(
        { error: `No probability prediction found for team ${team_code} in experiment ${experiment_id}` },
        { status: 404 }
      );
    }

    // Check if outcome already exists
    const { data: existing } = await supabase
      .from('probability_accuracy')
      .select('id')
      .eq('experiment_id', experiment_id)
      .eq('team_code', team_code)
      .single();

    if (existing) {
      // Update existing outcome
      const { data: updated, error: updateError } = await (supabase as any)
        .from('probability_accuracy')
        .update({
          actual_result,
          result_date: result_date || null,
          updated_at: new Date().toISOString()
          // Brier score is calculated automatically by database trigger
        })
        .eq('experiment_id', experiment_id)
        .eq('team_code', team_code)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Team outcome updated',
        outcome: updated
      });
    } else {
      // Insert new outcome
      const { data: inserted, error: insertError } = await supabase
        .from('probability_accuracy')
        .insert({
          experiment_id,
          team_code,
          team_name: (probability as any).team_name,
          predicted_probability: (probability as any).probability,
          actual_result,
          result_date: result_date || null
          // Brier score is calculated automatically by database trigger
        } as any)
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Team outcome recorded',
        outcome: inserted
      });
    }
  } catch (error) {
    console.error('[API /team-outcomes] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/team-outcomes
 * Fetches all team outcome records with details
 */
export async function GET() {
  const supabase = supabaseServer;

  try {
    const { data: outcomes, error } = await supabase
      .from('probability_accuracy')
      .select(`
        *,
        experiments (
          experiment_number,
          title,
          created_at
        )
      `)
      .order('result_date', { ascending: false, nullsFirst: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      outcomes: outcomes || [],
      count: outcomes?.length || 0
    });
  } catch (error) {
    console.error('[API /team-outcomes GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
