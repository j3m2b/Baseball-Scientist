import { NextResponse } from 'next/server';
import { getActiveConfig, updateActiveConfig, calculateAdaptiveConfig } from '@/lib/adaptive-config-calculator';
import { calculateAccuracyMetrics } from '@/lib/accuracy-calculator';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * GET /api/adaptive-config
 * Fetches the current active adaptive configuration
 */
export async function GET() {
  try {
    const config = await getActiveConfig();

    if (!config) {
      return NextResponse.json(
        { error: 'No active configuration found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      config,
      success: true
    });
  } catch (error) {
    console.error('[API /adaptive-config GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adaptive configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/adaptive-config
 * Recalculates adaptive configuration based on current accuracy metrics
 * and updates the active config
 */
export async function POST() {
  try {
    // Calculate current accuracy metrics
    const accuracyMetrics = await calculateAccuracyMetrics(50);

    // Calculate optimal adaptive config based on accuracy
    const newConfig = calculateAdaptiveConfig(accuracyMetrics);

    // Update the active config in database
    await updateActiveConfig(newConfig);

    return NextResponse.json({
      config: newConfig,
      message: 'Adaptive configuration updated based on current performance',
      success: true
    });
  } catch (error) {
    console.error('[API /adaptive-config POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update adaptive configuration' },
      { status: 500 }
    );
  }
}
