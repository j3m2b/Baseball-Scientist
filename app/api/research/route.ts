import { NextRequest, NextResponse } from 'next/server';
import { runResearchCycle } from '@/lib/research-cycle';

/**
 * GET /api/research?secret=CRON_SECRET
 * Main research cycle endpoint for Vercel Cron
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Validate cron secret
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Run the research cycle using shared logic
  const result = await runResearchCycle();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    experimentId: result.experimentId,
    title: result.title,
    hypothesesCount: result.hypothesesCount,
    insightsCount: result.insightsCount,
    nextExperimentsCount: result.nextExperimentsCount
  });
}
