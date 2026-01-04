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

/**
 * GET /api/adaptive-config/history
 * Fetches configuration history to see how parameters evolved
 */
export async function GET_HISTORY() {
  try {
    const supabase = supabaseServer;

    const { data: history, error } = await supabase
      .from('config_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      history: history || [],
      count: history?.length || 0
    });
  } catch (error) {
    console.error('[API /adaptive-config/history] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration history' },
      { status: 500 }
    );
  }
}
