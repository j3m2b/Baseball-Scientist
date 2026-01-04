'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, Activity, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AccuracyMetrics {
  overall_hypothesis_accuracy: number | null;
  total_hypotheses_evaluated: number;
  correctly_predicted: number;
  incorrectly_predicted: number;
  team_probability_brier_score: number | null;
  total_teams_evaluated: number;
  surprise_calibration: number | null;
  high_surprise_total: number;
  high_surprise_correct: number;
  improvement_trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  recent_accuracy: number | null;
  historical_accuracy: number | null;
}

interface AccuracyDisplayProps {
  metrics: AccuracyMetrics | null;
}

export function AccuracyDisplay({ metrics }: AccuracyDisplayProps) {
  if (!metrics || (metrics.total_hypotheses_evaluated === 0 && metrics.total_teams_evaluated === 0)) {
    return (
      <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-blue-100">No Accuracy Data Yet</CardTitle>
              <CardDescription className="text-blue-300/70">
                Start recording outcomes to track Claude's prediction accuracy
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-blue-200/80">
            <p className="text-sm">
              To measure accuracy, you need to manually input actual outcomes:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-2">
              <li>Use POST /api/outcomes to record whether hypotheses came true</li>
              <li>Use POST /api/team-outcomes to record team results (won WS, made playoffs, etc.)</li>
              <li>Accuracy metrics will appear here automatically</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (metrics.improvement_trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-400" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-400" />;
      case 'stable':
        return <Minus className="h-5 w-5 text-blue-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTrendBadge = () => {
    switch (metrics.improvement_trend) {
      case 'improving':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">📈 Improving</Badge>;
      case 'declining':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">📉 Declining</Badge>;
      case 'stable':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">➡️ Stable</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-400 border-gray-500/30">Insufficient Data</Badge>;
    }
  };

  const getAccuracyBadge = (accuracy: number | null) => {
    if (accuracy === null) return null;
    if (accuracy >= 70) {
      return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Excellent</Badge>;
    } else if (accuracy >= 55) {
      return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Good</Badge>;
    } else if (accuracy >= 40) {
      return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Fair</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Needs Improvement</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Performance Card */}
      <Card className="bg-gradient-to-br from-slate-800/90 to-blue-900/30 border-blue-500/30 backdrop-blur-sm shadow-xl">
        <CardHeader className="border-b border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-blue-100">Overall Performance</CardTitle>
                <CardDescription className="text-blue-300/70">
                  Claude's prediction accuracy across all evaluated outcomes
                </CardDescription>
              </div>
            </div>
            {getTrendBadge()}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hypothesis Accuracy */}
            {metrics.total_hypotheses_evaluated > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <h4 className="text-sm font-semibold text-blue-200">Hypothesis Accuracy</h4>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {metrics.overall_hypothesis_accuracy?.toFixed(1)}%
                  </span>
                  {getAccuracyBadge(metrics.overall_hypothesis_accuracy)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-900/50 rounded-lg p-2 border border-blue-500/20">
                    <div className="text-blue-400/70">Total</div>
                    <div className="text-blue-100 font-semibold">{metrics.total_hypotheses_evaluated}</div>
                  </div>
                  <div className="bg-green-900/20 rounded-lg p-2 border border-green-500/30">
                    <div className="text-green-400/70 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Correct
                    </div>
                    <div className="text-green-300 font-semibold">{metrics.correctly_predicted}</div>
                  </div>
                  <div className="bg-red-900/20 rounded-lg p-2 border border-red-500/30">
                    <div className="text-red-400/70 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Wrong
                    </div>
                    <div className="text-red-300 font-semibold">{metrics.incorrectly_predicted}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Probability Accuracy */}
            {metrics.total_teams_evaluated > 0 && metrics.team_probability_brier_score !== null && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-400" />
                  <h4 className="text-sm font-semibold text-blue-200">Probability Accuracy (Brier Score)</h4>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {metrics.team_probability_brier_score.toFixed(4)}
                  </span>
                  <Badge variant="outline" className="text-purple-300 border-purple-500/30">
                    Lower = Better
                  </Badge>
                </div>
                <div className="text-xs text-blue-300/70 bg-slate-900/50 rounded-lg p-2 border border-blue-500/20">
                  {metrics.total_teams_evaluated} team predictions evaluated
                  <div className="mt-1 text-blue-400/60">
                    0 = perfect, 1 = worst possible
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis Card */}
      {metrics.improvement_trend !== 'insufficient_data' && (
        <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-blue-500/20">
            <div className="flex items-center gap-3">
              {getTrendIcon()}
              <div>
                <CardTitle className="text-blue-100">Performance Trend</CardTitle>
                <CardDescription className="text-blue-300/70">
                  Comparing recent predictions to historical performance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              {metrics.recent_accuracy !== null && (
                <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 rounded-lg p-4 border border-blue-500/20">
                  <div className="text-sm text-blue-400/70 mb-1">Recent (Last 10 cycles)</div>
                  <div className="text-3xl font-bold text-blue-100">{metrics.recent_accuracy.toFixed(1)}%</div>
                </div>
              )}
              {metrics.historical_accuracy !== null && (
                <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 rounded-lg p-4 border border-purple-500/20">
                  <div className="text-sm text-purple-400/70 mb-1">Historical (Cycles 11-30)</div>
                  <div className="text-3xl font-bold text-purple-100">{metrics.historical_accuracy.toFixed(1)}%</div>
                </div>
              )}
            </div>
            {metrics.recent_accuracy !== null && metrics.historical_accuracy !== null && (
              <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-blue-500/20">
                <div className="text-sm text-blue-300">
                  {metrics.improvement_trend === 'improving' && (
                    <span className="text-green-400">
                      ✨ Performance has improved by {(metrics.recent_accuracy - metrics.historical_accuracy).toFixed(1)}% over time
                    </span>
                  )}
                  {metrics.improvement_trend === 'declining' && (
                    <span className="text-red-400">
                      ⚠️ Performance has declined by {(metrics.historical_accuracy - metrics.recent_accuracy).toFixed(1)}% - consider adjusting approach
                    </span>
                  )}
                  {metrics.improvement_trend === 'stable' && (
                    <span className="text-blue-400">
                      ➡️ Performance has remained stable (within ±5%)
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Surprise Calibration Card */}
      {metrics.high_surprise_total > 0 && metrics.surprise_calibration !== null && (
        <Card className="bg-slate-800/90 border-purple-500/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-blue-100">Surprise Calibration</CardTitle>
                <CardDescription className="text-blue-300/70">
                  How often do high-surprise predictions actually come true?
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {metrics.surprise_calibration.toFixed(1)}%
              </span>
              <span className="text-sm text-purple-300/70">
                ({metrics.high_surprise_correct} of {metrics.high_surprise_total} high-surprise predictions)
              </span>
            </div>
            <div className="text-sm text-blue-300/80 bg-slate-900/50 rounded-lg p-3 border border-purple-500/20">
              <p className="mb-2">
                <strong>Interpretation:</strong>
              </p>
              {metrics.surprise_calibration >= 60 && (
                <p className="text-purple-300">
                  ✅ Good calibration - your high-surprise hypotheses are truly surprising and often validated
                </p>
              )}
              {metrics.surprise_calibration >= 30 && metrics.surprise_calibration < 60 && (
                <p className="text-blue-300">
                  ⚖️ Moderate calibration - some high-surprise predictions come true, but not consistently
                </p>
              )}
              {metrics.surprise_calibration < 30 && (
                <p className="text-yellow-300">
                  ⚠️ Low calibration - most high-surprise hypotheses don't come true. Consider being more conservative with surprise ratings.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
