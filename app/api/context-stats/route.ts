import { NextResponse } from 'next/server';
import { getContextStats } from '@/lib/context-optimizer';

/**
 * GET /api/context-stats
 * Returns context compression statistics and token budget info
 */
export async function GET() {
  try {
    const stats = await getContextStats();

    return NextResponse.json({
      stats,
      success: true,
      interpretation: {
        efficiency: stats.compressionRatio,
        scalability: stats.projectedAt100Cycles < 20000 ? 'Excellent' : stats.projectedAt100Cycles < 30000 ? 'Good' : 'Needs optimization',
        tokenBudgetUsed: `${((stats.compressedTokens / 50000) * 100).toFixed(1)}%`,
        canScale: stats.projectedAt100Cycles < 50000
      }
    });
  } catch (error) {
    console.error('[API /context-stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get context statistics' },
      { status: 500 }
    );
  }
}
