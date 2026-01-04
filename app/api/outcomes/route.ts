import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * POST /api/outcomes
 * Records actual outcome for a hypothesis to measure prediction accuracy
 *
 * Body:
 * {
 *   hypothesis_id: string;
 *   actual_outcome: boolean; // true if hypothesis came true
 *   outcome_date: string; // ISO date string
 *   evidence?: string; // optional explanation
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = supabaseServer;

  try {
    const body = await request.json();
    const { hypothesis_id, actual_outcome, outcome_date, evidence } = body;

    // Validate required fields
    if (!hypothesis_id || typeof actual_outcome !== 'boolean' || !outcome_date) {
      return NextResponse.json(
        { error: 'Missing required fields: hypothesis_id, actual_outcome, outcome_date' },
        { status: 400 }
      );
    }

    // Verify hypothesis exists
    const { data: hypothesis, error: hypothesisError } = await supabase
      .from('hypotheses')
      .select('id, hypothesis')
      .eq('id', hypothesis_id)
      .single();

    if (hypothesisError || !hypothesis) {
      return NextResponse.json(
        { error: 'Hypothesis not found' },
        { status: 404 }
      );
    }

    // Check if outcome already exists
    const { data: existing } = await supabase
      .from('prediction_outcomes')
      .select('id')
      .eq('hypothesis_id', hypothesis_id)
      .single();

    if (existing) {
      // Update existing outcome
      const { data: updated, error: updateError } = await (supabase as any)
        .from('prediction_outcomes')
        .update({
          actual_outcome,
          outcome_date,
          evidence: evidence || null,
          updated_at: new Date().toISOString()
        })
        .eq('hypothesis_id', hypothesis_id)
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
        message: 'Outcome updated',
        outcome: updated
      });
    } else {
      // Insert new outcome
      const { data: inserted, error: insertError } = await supabase
        .from('prediction_outcomes')
        .insert({
          hypothesis_id,
          actual_outcome,
          outcome_date,
          evidence: evidence || null
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
        message: 'Outcome recorded',
        outcome: inserted
      });
    }
  } catch (error) {
    console.error('[API /outcomes] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/outcomes
 * Fetches all prediction outcomes with hypothesis details
 */
export async function GET() {
  const supabase = supabaseServer;

  try {
    const { data: outcomes, error } = await supabase
      .from('prediction_outcomes')
      .select(`
        *,
        hypotheses (
          id,
          hypothesis,
          is_validated,
          surprise_level,
          experiment_id,
          experiments (
            experiment_number,
            title
          )
        )
      `)
      .order('outcome_date', { ascending: false });

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
    console.error('[API /outcomes GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
