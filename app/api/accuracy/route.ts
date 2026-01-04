import { NextResponse } from 'next/server';
import { calculateAccuracyMetrics } from '@/lib/accuracy-calculator';

/**
 * GET /api/accuracy
 * Calculates and returns comprehensive accuracy metrics
 * Query params:
 *   - cycles: number of past cycles to analyze (default 50)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cycles = parseInt(searchParams.get('cycles') || '50', 10);

    if (cycles < 1 || cycles > 200) {
      return NextResponse.json(
        { error: 'Cycles parameter must be between 1 and 200' },
        { status: 400 }
      );
    }

    const metrics = await calculateAccuracyMetrics(cycles);

    return NextResponse.json({
      metrics,
      cycles_analyzed: cycles
    });
  } catch (error) {
    console.error('[API /accuracy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate accuracy metrics' },
      { status: 500 }
    );
  }
}
