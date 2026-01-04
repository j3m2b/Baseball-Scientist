/**
 * Accuracy Calculator - Measures Claude's prediction accuracy over time
 * Part of Phase 3: Accuracy Tracking & Validation
 */

import { supabaseServer } from '@/lib/supabase/server';

export interface AccuracyMetrics {
  overall_hypothesis_accuracy: number | null; // % of hypotheses with outcomes that were validated correctly (0-100)
  total_hypotheses_evaluated: number; // Total hypotheses with recorded outcomes
  correctly_predicted: number; // Number of correct predictions
  incorrectly_predicted: number; // Number of incorrect predictions
  team_probability_brier_score: number | null; // Average Brier score (0 = perfect, 1 = worst)
  total_teams_evaluated: number; // Total team predictions with outcomes
  surprise_calibration: number | null; // % of high-surprise hypotheses that actually came true
  high_surprise_total: number; // Total high-surprise hypotheses evaluated
  high_surprise_correct: number; // High-surprise hypotheses that came true
  improvement_trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  recent_accuracy: number | null; // Accuracy in last 10 cycles
  historical_accuracy: number | null; // Accuracy in cycles 11-30
}

/**
 * Calculate comprehensive accuracy metrics across all predictions
 * @param cyclesToAnalyze Number of past cycles to analyze
 * @returns AccuracyMetrics object with all calculated metrics
 */
export async function calculateAccuracyMetrics(cyclesToAnalyze: number = 50): Promise<AccuracyMetrics> {
  const supabase = supabaseServer;

  // Initialize metrics
  const metrics: AccuracyMetrics = {
    overall_hypothesis_accuracy: null,
    total_hypotheses_evaluated: 0,
    correctly_predicted: 0,
    incorrectly_predicted: 0,
    team_probability_brier_score: null,
    total_teams_evaluated: 0,
    surprise_calibration: null,
    high_surprise_total: 0,
    high_surprise_correct: 0,
    improvement_trend: 'insufficient_data',
    recent_accuracy: null,
    historical_accuracy: null
  };

  // Get past experiments
  const { data: experiments } = await supabase
    .from('experiments')
    .select('id, experiment_number, created_at')
    .order('created_at', { ascending: false })
    .limit(cyclesToAnalyze);

  if (!experiments || experiments.length === 0) {
    return metrics;
  }

  const experimentIds = (experiments as any[]).map((e: any) => e.id);

  // 1. Calculate hypothesis accuracy
  const hypothesisMetrics = await calculateHypothesisAccuracy(experimentIds, experiments as any[]);
  metrics.overall_hypothesis_accuracy = hypothesisMetrics.overall_accuracy;
  metrics.total_hypotheses_evaluated = hypothesisMetrics.total_evaluated;
  metrics.correctly_predicted = hypothesisMetrics.correct;
  metrics.incorrectly_predicted = hypothesisMetrics.incorrect;
  metrics.surprise_calibration = hypothesisMetrics.surprise_calibration;
  metrics.high_surprise_total = hypothesisMetrics.high_surprise_total;
  metrics.high_surprise_correct = hypothesisMetrics.high_surprise_correct;
  metrics.recent_accuracy = hypothesisMetrics.recent_accuracy;
  metrics.historical_accuracy = hypothesisMetrics.historical_accuracy;
  metrics.improvement_trend = hypothesisMetrics.improvement_trend;

  // 2. Calculate team probability accuracy (Brier score)
  const teamMetrics = await calculateTeamProbabilityAccuracy(experimentIds);
  metrics.team_probability_brier_score = teamMetrics.avg_brier_score;
  metrics.total_teams_evaluated = teamMetrics.total_evaluated;

  return metrics;
}

/**
 * Calculate hypothesis prediction accuracy
 */
async function calculateHypothesisAccuracy(
  experimentIds: string[],
  experiments: any[]
): Promise<{
  overall_accuracy: number | null;
  total_evaluated: number;
  correct: number;
  incorrect: number;
  surprise_calibration: number | null;
  high_surprise_total: number;
  high_surprise_correct: number;
  recent_accuracy: number | null;
  historical_accuracy: number | null;
  improvement_trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
}> {
  const supabase = supabaseServer;

  // Get all hypotheses with outcomes
  const { data: hypothesesWithOutcomes } = await supabase
    .from('hypotheses')
    .select(`
      id,
      hypothesis,
      is_validated,
      surprise_level,
      experiment_id,
      created_at,
      prediction_outcomes (
        id,
        actual_outcome,
        outcome_date
      )
    `)
    .in('experiment_id', experimentIds)
    .not('prediction_outcomes', 'is', null);

  if (!hypothesesWithOutcomes || hypothesesWithOutcomes.length === 0) {
    return {
      overall_accuracy: null,
      total_evaluated: 0,
      correct: 0,
      incorrect: 0,
      surprise_calibration: null,
      high_surprise_total: 0,
      high_surprise_correct: 0,
      recent_accuracy: null,
      historical_accuracy: null,
      improvement_trend: 'insufficient_data'
    };
  }

  // Filter to only hypotheses with at least one outcome
  const evaluated = (hypothesesWithOutcomes as any[]).filter(
    (h: any) => h.prediction_outcomes && h.prediction_outcomes.length > 0
  );

  if (evaluated.length === 0) {
    return {
      overall_accuracy: null,
      total_evaluated: 0,
      correct: 0,
      incorrect: 0,
      surprise_calibration: null,
      high_surprise_total: 0,
      high_surprise_correct: 0,
      recent_accuracy: null,
      historical_accuracy: null,
      improvement_trend: 'insufficient_data'
    };
  }

  // Calculate overall accuracy
  let correct = 0;
  let incorrect = 0;
  let highSurpriseTotal = 0;
  let highSurpriseCorrect = 0;

  evaluated.forEach((h: any) => {
    const outcome = h.prediction_outcomes[0]; // Get first outcome
    const predictedValidated = h.is_validated;
    const actualValidated = outcome.actual_outcome;

    if (predictedValidated === actualValidated) {
      correct++;
    } else {
      incorrect++;
    }

    // Track surprise calibration (High = surprise level High)
    if (h.surprise_level === 'High') {
      highSurpriseTotal++;
      if (actualValidated) {
        highSurpriseCorrect++;
      }
    }
  });

  const overallAccuracy = (correct / (correct + incorrect)) * 100;
  const surpriseCalibration = highSurpriseTotal > 0
    ? (highSurpriseCorrect / highSurpriseTotal) * 100
    : null;

  // Calculate improvement trend (recent vs historical)
  const recent = evaluated.filter((h: any) => {
    const expNum = experiments.find((e: any) => e.id === h.experiment_id)?.experiment_number;
    return expNum && expNum >= (experiments[0]?.experiment_number - 10);
  });

  const historical = evaluated.filter((h: any) => {
    const expNum = experiments.find((e: any) => e.id === h.experiment_id)?.experiment_number;
    return expNum && expNum < (experiments[0]?.experiment_number - 10) && expNum >= (experiments[0]?.experiment_number - 30);
  });

  let recentAccuracy = null;
  let historicalAccuracy = null;
  let improvementTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data' = 'insufficient_data';

  if (recent.length >= 5) {
    const recentCorrect = recent.filter((h: any) => {
      const outcome = h.prediction_outcomes[0];
      return h.is_validated === outcome.actual_outcome;
    }).length;
    recentAccuracy = (recentCorrect / recent.length) * 100;
  }

  if (historical.length >= 5) {
    const historicalCorrect = historical.filter((h: any) => {
      const outcome = h.prediction_outcomes[0];
      return h.is_validated === outcome.actual_outcome;
    }).length;
    historicalAccuracy = (historicalCorrect / historical.length) * 100;
  }

  // Determine trend
  if (recentAccuracy !== null && historicalAccuracy !== null) {
    const diff = recentAccuracy - historicalAccuracy;
    if (diff > 5) {
      improvementTrend = 'improving';
    } else if (diff < -5) {
      improvementTrend = 'declining';
    } else {
      improvementTrend = 'stable';
    }
  }

  return {
    overall_accuracy: overallAccuracy,
    total_evaluated: evaluated.length,
    correct,
    incorrect,
    surprise_calibration: surpriseCalibration,
    high_surprise_total: highSurpriseTotal,
    high_surprise_correct: highSurpriseCorrect,
    recent_accuracy: recentAccuracy,
    historical_accuracy: historicalAccuracy,
    improvement_trend: improvementTrend
  };
}

/**
 * Calculate team probability prediction accuracy using Brier scores
 */
async function calculateTeamProbabilityAccuracy(experimentIds: string[]): Promise<{
  avg_brier_score: number | null;
  total_evaluated: number;
}> {
  const supabase = supabaseServer;

  // Get all probability accuracy records
  const { data: accuracyRecords } = await supabase
    .from('probability_accuracy')
    .select('brier_score, actual_result')
    .in('experiment_id', experimentIds)
    .neq('actual_result', 'tbd')
    .not('brier_score', 'is', null);

  if (!accuracyRecords || accuracyRecords.length === 0) {
    return {
      avg_brier_score: null,
      total_evaluated: 0
    };
  }

  const scores = (accuracyRecords as any[]).map((r: any) => r.brier_score);
  const avgBrierScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;

  return {
    avg_brier_score: avgBrierScore,
    total_evaluated: accuracyRecords.length
  };
}

/**
 * Format accuracy metrics for inclusion in Claude's prompt
 */
export function formatAccuracyForPrompt(metrics: AccuracyMetrics): string {
  if (metrics.total_hypotheses_evaluated === 0 && metrics.total_teams_evaluated === 0) {
    return '';
  }

  let output = '\n\n### Your Historical Accuracy:\n';

  if (metrics.total_hypotheses_evaluated > 0) {
    output += `**Hypothesis Predictions:** ${metrics.overall_hypothesis_accuracy?.toFixed(1)}% accurate (${metrics.correctly_predicted} correct, ${metrics.incorrectly_predicted} incorrect out of ${metrics.total_hypotheses_evaluated} evaluated)\n`;

    if (metrics.improvement_trend !== 'insufficient_data') {
      const trendEmoji = metrics.improvement_trend === 'improving' ? '📈' : metrics.improvement_trend === 'declining' ? '📉' : '➡️';
      output += `**Trend:** ${trendEmoji} ${metrics.improvement_trend.charAt(0).toUpperCase() + metrics.improvement_trend.slice(1)}`;
      if (metrics.recent_accuracy !== null && metrics.historical_accuracy !== null) {
        output += ` (recent: ${metrics.recent_accuracy.toFixed(1)}%, historical: ${metrics.historical_accuracy.toFixed(1)}%)\n`;
      } else {
        output += '\n';
      }
    }

    if (metrics.surprise_calibration !== null && metrics.high_surprise_total > 0) {
      output += `**Surprise Calibration:** ${metrics.surprise_calibration.toFixed(1)}% of high-surprise predictions came true (${metrics.high_surprise_correct}/${metrics.high_surprise_total})\n`;
    }
  }

  if (metrics.total_teams_evaluated > 0 && metrics.team_probability_brier_score !== null) {
    output += `**Team Probability Accuracy (Brier Score):** ${metrics.team_probability_brier_score.toFixed(4)} (${metrics.total_teams_evaluated} teams evaluated, closer to 0 = better)\n`;
  }

  output += '\n**Guidance:** Use these metrics to calibrate your confidence levels and boldness. If accuracy is declining, be more conservative. If improving, maintain your approach.\n';

  return output;
}
