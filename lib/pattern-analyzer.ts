/**
 * Pattern Analyzer - Detects recurring biases in Claude's predictions
 * Part of Phase 2: True Learning Loop
 */

import { supabaseServer } from '@/lib/supabase/server';

export interface DetectedPattern {
  pattern_type: 'overestimation' | 'underestimation' | 'volatility' | 'consistency' | 'category_bias';
  entity: string;
  confidence: number;
  evidence: any[];
  description: string;
}

interface TeamProbHistory {
  team_name: string;
  experiment_id: string;
  probability: number;
  created_at: string;
}

interface HypothesisHistory {
  hypothesis: string;
  is_validated: boolean;
  experiment_id: string;
  created_at: string;
}

/**
 * Analyzes past research cycles to detect patterns
 * @param cyclesToAnalyze Number of past cycles to analyze (default 20)
 * @returns Array of detected patterns
 */
export async function detectPatterns(cyclesToAnalyze: number = 20): Promise<DetectedPattern[]> {
  const supabase = supabaseServer;
  const patterns: DetectedPattern[] = [];

  // Get past experiments
  const { data: experiments } = await supabase
    .from('experiments')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(cyclesToAnalyze);

  if (!experiments || experiments.length < 5) {
    // Need at least 5 cycles to detect patterns
    return patterns;
  }

  const experimentIds = (experiments as any[]).map((e: any) => e.id);

  // Detect team probability patterns
  const teamPatterns = await detectTeamProbabilityPatterns(experimentIds);
  patterns.push(...teamPatterns);

  // Detect hypothesis validation patterns
  const hypothesisPatterns = await detectHypothesisPatterns(experimentIds);
  patterns.push(...hypothesisPatterns);

  return patterns;
}

/**
 * Detects teams that are consistently over or underestimated
 */
async function detectTeamProbabilityPatterns(experimentIds: string[]): Promise<DetectedPattern[]> {
  const supabase = supabaseServer;
  const patterns: DetectedPattern[] = [];

  // Get all team probabilities for these experiments
  const { data: probabilities } = await supabase
    .from('team_probabilities')
    .select('team_name, team_code, probability, experiment_id, created_at')
    .in('experiment_id', experimentIds)
    .order('created_at', { ascending: true });

  if (!probabilities) return patterns;

  // Group by team
  const teamData: Record<string, TeamProbHistory[]> = {};
  probabilities.forEach((prob: any) => {
    if (!teamData[prob.team_name]) {
      teamData[prob.team_name] = [];
    }
    teamData[prob.team_name].push(prob);
  });

  // Analyze each team
  for (const [teamName, history] of Object.entries(teamData)) {
    if (history.length < 3) continue; // Need at least 3 data points

    // Calculate volatility (standard deviation)
    const probs = history.map(h => h.probability);
    const mean = probs.reduce((a, b) => a + b, 0) / probs.length;
    const variance = probs.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / probs.length;
    const stdDev = Math.sqrt(variance);

    // High volatility pattern (swings > 5%)
    if (stdDev > 5) {
      patterns.push({
        pattern_type: 'volatility',
        entity: teamName,
        confidence: Math.min(100, stdDev * 10), // Higher stdDev = higher confidence
        evidence: history.map(h => ({ probability: h.probability, date: h.created_at })),
        description: `${teamName} probability swings wildly (±${stdDev.toFixed(1)}% avg deviation)`
      });
    }

    // Consistency pattern (very stable predictions)
    if (stdDev < 1.5 && history.length >= 5) {
      patterns.push({
        pattern_type: 'consistency',
        entity: teamName,
        confidence: Math.max(50, 100 - stdDev * 30),
        evidence: history.map(h => ({ probability: h.probability, date: h.created_at })),
        description: `${teamName} probability very stable (${mean.toFixed(1)}% ±${stdDev.toFixed(1)}%)`
      });
    }

    // Trend detection - consistently increasing or decreasing
    if (history.length >= 5) {
      const trend = calculateTrend(probs);
      if (Math.abs(trend) > 0.5) {
        // Trend > 0.5% per cycle
        const trendType = trend > 0 ? 'overestimation' : 'underestimation';
        patterns.push({
          pattern_type: trendType,
          entity: teamName,
          confidence: Math.min(100, Math.abs(trend) * 20),
          evidence: history.map(h => ({ probability: h.probability, date: h.created_at })),
          description: `${teamName} probability trending ${trend > 0 ? 'up' : 'down'} (${Math.abs(trend).toFixed(1)}% per cycle)`
        });
      }
    }
  }

  return patterns;
}

/**
 * Detects patterns in hypothesis validation rates
 */
async function detectHypothesisPatterns(experimentIds: string[]): Promise<DetectedPattern[]> {
  const supabase = supabaseServer;
  const patterns: DetectedPattern[] = [];

  // Get all hypotheses
  const { data: hypotheses } = await supabase
    .from('hypotheses')
    .select('hypothesis, is_validated, experiment_id, created_at')
    .in('experiment_id', experimentIds);

  if (!hypotheses || hypotheses.length < 10) return patterns;

  // Categorize hypotheses by keywords
  const categories = {
    'pitching': ['pitcher', 'pitching', 'bullpen', 'rotation', 'ERA', 'strikeout'],
    'hitting': ['hitter', 'batting', 'offense', 'home run', 'RBI', 'OPS'],
    'defense': ['defense', 'fielding', 'glove', 'errors'],
    'young_players': ['prospect', 'rookie', 'breakout', 'young', 'call-up'],
    'free_agency': ['signed', 'free agent', 'contract', 'acquisition'],
    'trades': ['traded', 'trade', 'acquired'],
  };

  // Analyze validation rates by category
  for (const [category, keywords] of Object.entries(categories)) {
    const categoryHyps = hypotheses.filter((h: any) =>
      keywords.some(kw => h.hypothesis.toLowerCase().includes(kw))
    );

    if (categoryHyps.length < 5) continue;

    const validatedCount = categoryHyps.filter((h: any) => h.is_validated).length;
    const validationRate = (validatedCount / categoryHyps.length) * 100;

    // Low validation rate = potential bias
    if (validationRate < 40) {
      patterns.push({
        pattern_type: 'category_bias',
        entity: category,
        confidence: Math.min(100, (50 - validationRate) * 2),
        evidence: categoryHyps.map((h: any) => ({
          hypothesis: h.hypothesis.substring(0, 100),
          validated: h.is_validated,
          date: h.created_at
        })),
        description: `Only ${validationRate.toFixed(0)}% of ${category} hypotheses validated (${validatedCount}/${categoryHyps.length})`
      });
    }

    // High validation rate = strong category
    if (validationRate > 70 && categoryHyps.length >= 8) {
      patterns.push({
        pattern_type: 'consistency',
        entity: `${category}_predictions`,
        confidence: Math.min(100, validationRate),
        evidence: categoryHyps.map((h: any) => ({
          hypothesis: h.hypothesis.substring(0, 100),
          validated: h.is_validated
        })),
        description: `Strong ${category} prediction accuracy: ${validationRate.toFixed(0)}% validated (${validatedCount}/${categoryHyps.length})`
      });
    }
  }

  return patterns;
}

/**
 * Calculates linear trend (slope) of data points
 * Returns average change per data point
 */
function calculateTrend(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

/**
 * Saves detected patterns to database
 * Updates existing patterns or creates new ones
 */
export async function saveDetectedPatterns(patterns: DetectedPattern[]): Promise<void> {
  const supabase = supabaseServer;

  for (const pattern of patterns) {
    // Check if pattern already exists
    const { data: existing } = await supabase
      .from('detected_patterns')
      .select('id, cycle_count')
      .eq('pattern_type', pattern.pattern_type)
      .eq('entity', pattern.entity)
      .single();

    if (existing) {
      // Update existing pattern
      const existingPattern = existing as any;
      await (supabase as any)
        .from('detected_patterns')
        .update({
          confidence: pattern.confidence,
          evidence: pattern.evidence,
          cycle_count: existingPattern.cycle_count + 1,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', existingPattern.id);
    } else {
      // Insert new pattern
      await supabase
        .from('detected_patterns')
        .insert({
          pattern_type: pattern.pattern_type,
          entity: pattern.entity,
          confidence: pattern.confidence,
          evidence: pattern.evidence,
          description: pattern.description
        } as any);
    }
  }
}

/**
 * Formats patterns for inclusion in Claude's prompt
 */
export function formatPatternsForPrompt(patterns: DetectedPattern[]): string {
  if (patterns.length === 0) {
    return '';
  }

  // Sort by confidence (highest first)
  const sortedPatterns = [...patterns].sort((a, b) => b.confidence - a.confidence);

  // Take top 10 most confident patterns
  const topPatterns = sortedPatterns.slice(0, 10);

  let formatted = '### 🔍 Detected Patterns in Your Past Predictions:\n\n';
  formatted += 'Based on analysis of your previous research cycles, these patterns were identified:\n\n';

  topPatterns.forEach((pattern, index) => {
    formatted += `${index + 1}. **${pattern.description}**\n`;
    formatted += `   - Pattern: ${pattern.pattern_type}\n`;
    formatted += `   - Confidence: ${pattern.confidence.toFixed(0)}%\n`;
    if (pattern.pattern_type === 'overestimation' || pattern.pattern_type === 'underestimation') {
      formatted += `   - ⚠️ Consider adjusting your ${pattern.entity} projections\n`;
    }
    formatted += '\n';
  });

  formatted += '**Use these insights to calibrate your current cycle\'s predictions.**\n';

  return formatted;
}
