/**
 * Adaptive Config Calculator - Dynamically adjusts analysis parameters based on performance
 * Part of Phase 4: Adaptive Parameters
 */

import { supabaseServer } from '@/lib/supabase/server';
import { AccuracyMetrics } from '@/lib/accuracy-calculator';

export interface AdaptiveConfig {
  boldness_level: number; // 0-100, affects how bold hypotheses are
  surprise_threshold_low: number; // 1-10, minimum for "Medium" surprise
  surprise_threshold_high: number; // 1-10, minimum for "High" surprise
  confidence_adjustment: number; // -1.0 to +1.0, adjustment to probability confidence
  hypothesis_count_target: number; // 3-12, target number of hypotheses per cycle
  rationale: string; // Explanation of why these parameters were chosen
  based_on_accuracy: number | null;
  based_on_trend: string | null;
  based_on_cycles: number | null;
}

/**
 * Calculate optimal adaptive configuration based on accuracy metrics
 * @param accuracyMetrics Current accuracy metrics
 * @returns Adaptive configuration with rationale
 */
export function calculateAdaptiveConfig(accuracyMetrics: AccuracyMetrics): AdaptiveConfig {
  const {
    overall_hypothesis_accuracy,
    total_hypotheses_evaluated,
    surprise_calibration,
    high_surprise_total,
    improvement_trend,
    recent_accuracy,
    team_probability_brier_score,
    total_teams_evaluated
  } = accuracyMetrics;

  // Default baseline configuration
  let boldness = 50.0;
  let surpriseLow = 3.0;
  let surpriseHigh = 7.0;
  let confidenceAdj = 0.0;
  let hypothesisTarget = 6;
  const rationale: string[] = [];

  // Insufficient data - use defaults
  if (total_hypotheses_evaluated < 5 && total_teams_evaluated < 5) {
    return {
      boldness_level: boldness,
      surprise_threshold_low: surpriseLow,
      surprise_threshold_high: surpriseHigh,
      confidence_adjustment: confidenceAdj,
      hypothesis_count_target: hypothesisTarget,
      rationale: 'Insufficient data for adaptive tuning - using baseline configuration. Need at least 5 evaluated outcomes.',
      based_on_accuracy: null,
      based_on_trend: null,
      based_on_cycles: null
    };
  }

  // 1. Adjust boldness based on overall accuracy
  if (overall_hypothesis_accuracy !== null && total_hypotheses_evaluated >= 5) {
    if (overall_hypothesis_accuracy >= 75) {
      // Excellent accuracy - increase boldness significantly
      boldness = 75.0;
      rationale.push(`Excellent accuracy (${overall_hypothesis_accuracy.toFixed(1)}%) - increasing boldness to 75`);
    } else if (overall_hypothesis_accuracy >= 65) {
      // Good accuracy - moderate increase
      boldness = 65.0;
      rationale.push(`Good accuracy (${overall_hypothesis_accuracy.toFixed(1)}%) - increasing boldness to 65`);
    } else if (overall_hypothesis_accuracy >= 50) {
      // Acceptable accuracy - slight increase
      boldness = 55.0;
      rationale.push(`Acceptable accuracy (${overall_hypothesis_accuracy.toFixed(1)}%) - maintaining moderate boldness at 55`);
    } else if (overall_hypothesis_accuracy >= 40) {
      // Below average - reduce boldness
      boldness = 40.0;
      rationale.push(`Below-average accuracy (${overall_hypothesis_accuracy.toFixed(1)}%) - reducing boldness to 40`);
    } else {
      // Poor accuracy - significantly reduce boldness
      boldness = 30.0;
      rationale.push(`Poor accuracy (${overall_hypothesis_accuracy.toFixed(1)}%) - reducing boldness to 30`);
    }
  }

  // 2. Adjust based on improvement trend
  if (improvement_trend === 'improving') {
    boldness = Math.min(100, boldness + 5);
    rationale.push('Performance is improving - boosting boldness by +5');
  } else if (improvement_trend === 'declining') {
    boldness = Math.max(0, boldness - 10);
    rationale.push('Performance is declining - reducing boldness by -10');
  }

  // 3. Adjust surprise thresholds based on calibration
  if (surprise_calibration !== null && high_surprise_total >= 5) {
    if (surprise_calibration > 70) {
      // Over-surprising (too many high-surprise predictions come true)
      // This means we're being too conservative with surprise ratings - lower thresholds
      surpriseLow = 2.5;
      surpriseHigh = 6.0;
      rationale.push(`High surprise calibration (${surprise_calibration.toFixed(1)}%) - lowering surprise thresholds (easier to mark as surprising)`);
    } else if (surprise_calibration < 40) {
      // Under-surprising (high-surprise predictions rarely come true)
      // This means we're calling too many things surprising - raise thresholds
      surpriseLow = 4.0;
      surpriseHigh = 8.0;
      rationale.push(`Low surprise calibration (${surprise_calibration.toFixed(1)}%) - raising surprise thresholds (harder to mark as surprising)`);
    } else {
      // Well-calibrated
      rationale.push(`Surprise calibration is well-balanced (${surprise_calibration.toFixed(1)}%) - maintaining current thresholds`);
    }
  }

  // 4. Adjust confidence based on Brier score
  if (team_probability_brier_score !== null && total_teams_evaluated >= 5) {
    if (team_probability_brier_score < 0.10) {
      // Excellent probabilistic accuracy - increase confidence
      confidenceAdj = 0.10;
      rationale.push(`Excellent Brier score (${team_probability_brier_score.toFixed(4)}) - increasing confidence by +0.10`);
    } else if (team_probability_brier_score > 0.20) {
      // Poor probabilistic accuracy - decrease confidence
      confidenceAdj = -0.15;
      rationale.push(`High Brier score (${team_probability_brier_score.toFixed(4)}) - decreasing confidence by -0.15`);
    } else {
      // Moderate probabilistic accuracy
      confidenceAdj = 0.00;
      rationale.push(`Moderate Brier score (${team_probability_brier_score.toFixed(4)}) - no confidence adjustment needed`);
    }
  }

  // 5. Adjust hypothesis count based on accuracy
  if (overall_hypothesis_accuracy !== null && total_hypotheses_evaluated >= 10) {
    if (overall_hypothesis_accuracy >= 70) {
      // High accuracy - can handle more hypotheses
      hypothesisTarget = 8;
      rationale.push('High accuracy allows for more hypotheses (target: 8)');
    } else if (overall_hypothesis_accuracy < 50) {
      // Low accuracy - focus on fewer, higher quality hypotheses
      hypothesisTarget = 4;
      rationale.push('Low accuracy suggests focusing on fewer hypotheses (target: 4)');
    }
  }

  // 6. Special case: Recent performance vs historical
  if (recent_accuracy !== null && overall_hypothesis_accuracy !== null && total_hypotheses_evaluated >= 15) {
    const recentVsOverall = recent_accuracy - overall_hypothesis_accuracy;
    if (recentVsOverall < -10) {
      // Recent performance much worse than overall
      boldness = Math.max(0, boldness - 5);
      rationale.push('Recent performance significantly worse than historical - applying additional -5 boldness penalty');
    } else if (recentVsOverall > 10) {
      // Recent performance much better than overall
      boldness = Math.min(100, boldness + 5);
      rationale.push('Recent performance significantly better than historical - applying additional +5 boldness bonus');
    }
  }

  return {
    boldness_level: Math.round(boldness * 100) / 100,
    surprise_threshold_low: Math.round(surpriseLow * 100) / 100,
    surprise_threshold_high: Math.round(surpriseHigh * 100) / 100,
    confidence_adjustment: Math.round(confidenceAdj * 100) / 100,
    hypothesis_count_target: hypothesisTarget,
    rationale: rationale.join('. ') + '.',
    based_on_accuracy: overall_hypothesis_accuracy,
    based_on_trend: improvement_trend,
    based_on_cycles: total_hypotheses_evaluated
  };
}

/**
 * Get the current active adaptive configuration from database
 */
export async function getActiveConfig(): Promise<AdaptiveConfig | null> {
  const supabase = supabaseServer;

  const { data, error } = await supabase
    .from('adaptive_config')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    boldness_level: (data as any).boldness_level,
    surprise_threshold_low: (data as any).surprise_threshold_low,
    surprise_threshold_high: (data as any).surprise_threshold_high,
    confidence_adjustment: (data as any).confidence_adjustment,
    hypothesis_count_target: (data as any).hypothesis_count_target,
    rationale: (data as any).rationale || '',
    based_on_accuracy: (data as any).based_on_accuracy,
    based_on_trend: (data as any).based_on_trend,
    based_on_cycles: (data as any).based_on_cycles
  };
}

/**
 * Update the active configuration in database
 */
export async function updateActiveConfig(config: AdaptiveConfig): Promise<void> {
  const supabase = supabaseServer;

  // Get current active config
  const { data: current } = await supabase
    .from('adaptive_config')
    .select('id')
    .eq('is_active', true)
    .single();

  if (current) {
    // Update existing config
    await (supabase as any)
      .from('adaptive_config')
      .update({
        boldness_level: config.boldness_level,
        surprise_threshold_low: config.surprise_threshold_low,
        surprise_threshold_high: config.surprise_threshold_high,
        confidence_adjustment: config.confidence_adjustment,
        hypothesis_count_target: config.hypothesis_count_target,
        rationale: config.rationale,
        based_on_accuracy: config.based_on_accuracy,
        based_on_trend: config.based_on_trend,
        based_on_cycles: config.based_on_cycles,
        updated_at: new Date().toISOString()
      })
      .eq('id', (current as any).id);
  } else {
    // Insert new config
    await supabase
      .from('adaptive_config')
      .insert({
        boldness_level: config.boldness_level,
        surprise_threshold_low: config.surprise_threshold_low,
        surprise_threshold_high: config.surprise_threshold_high,
        confidence_adjustment: config.confidence_adjustment,
        hypothesis_count_target: config.hypothesis_count_target,
        rationale: config.rationale,
        based_on_accuracy: config.based_on_accuracy,
        based_on_trend: config.based_on_trend,
        based_on_cycles: config.based_on_cycles,
        is_active: true
      } as any);
  }
}

/**
 * Format adaptive config for inclusion in Claude's prompt
 */
export function formatAdaptiveConfigForPrompt(config: AdaptiveConfig): string {
  let output = '\n\n### Adaptive Analysis Parameters:\n';
  output += `**Current Configuration** (auto-tuned based on your performance):\n`;
  output += `- **Boldness Level:** ${config.boldness_level}/100 `;

  if (config.boldness_level >= 70) {
    output += '(High - be very bold and contrarian)\n';
  } else if (config.boldness_level >= 55) {
    output += '(Moderate-High - be reasonably bold)\n';
  } else if (config.boldness_level >= 45) {
    output += '(Moderate - balanced approach)\n';
  } else if (config.boldness_level >= 30) {
    output += '(Low - be more conservative)\n';
  } else {
    output += '(Very Low - be very conservative and careful)\n';
  }

  output += `- **Surprise Thresholds:** Low=${config.surprise_threshold_low}, High=${config.surprise_threshold_high} `;
  output += '(Use these to calibrate your surprise ratings)\n';

  output += `- **Confidence Adjustment:** ${config.confidence_adjustment > 0 ? '+' : ''}${config.confidence_adjustment.toFixed(2)} `;
  if (config.confidence_adjustment > 0.05) {
    output += '(Increase your probability estimates slightly)\n';
  } else if (config.confidence_adjustment < -0.05) {
    output += '(Decrease your probability estimates slightly)\n';
  } else {
    output += '(No adjustment needed)\n';
  }

  output += `- **Target Hypotheses:** ${config.hypothesis_count_target} hypotheses per cycle\n`;

  output += `\n**Rationale:** ${config.rationale}\n`;

  output += '\n**Apply these parameters** to your analysis this cycle. Adjust your approach accordingly.\n';

  return output;
}
