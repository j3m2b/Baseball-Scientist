import { NextRequest, NextResponse } from 'next/server';
import { runResearchCycle } from '@/lib/research-cycle';

/**
 * POST /api/trigger
 * Manual research cycle trigger endpoint (used by frontend UI)
 * Accepts { secret: string } in request body
 */
export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();

    // Validate the secret
    if (secret !== process.env.CRON_SECRET) {
      console.error('[Trigger] Unauthorized: secret does not match');
      return NextResponse.json({ error: 'Unauthorized - Invalid secret' }, { status: 401 });
    }

    console.error('[Trigger] Secret verified, starting research cycle...');

    // Run the research cycle using shared logic
    const result = await runResearchCycle();

    if (!result.success) {
      console.error('[Trigger] Research cycle failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.error('[Trigger] Research cycle completed successfully');

    return NextResponse.json({
      success: true,
      experimentId: result.experimentId,
      title: result.title,
      hypothesesCount: result.hypothesesCount,
      insightsCount: result.insightsCount,
      nextExperimentsCount: result.nextExperimentsCount
    });
  } catch (error) {
    console.error('[Trigger] Error:', error);
    return NextResponse.json({
      error: 'Failed to trigger research: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}
