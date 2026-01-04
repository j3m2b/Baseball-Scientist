'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, TrendingUp, AlertCircle, Target } from 'lucide-react';

interface AdaptiveConfig {
  boldness_level: number;
  surprise_threshold_low: number;
  surprise_threshold_high: number;
  confidence_adjustment: number;
  hypothesis_count_target: number;
  rationale: string;
  based_on_accuracy: number | null;
  based_on_trend: string | null;
  based_on_cycles: number | null;
}

interface AdaptiveConfigDisplayProps {
  config: AdaptiveConfig | null;
}

export function AdaptiveConfigDisplay({ config }: AdaptiveConfigDisplayProps) {
  if (!config) {
    return (
      <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-blue-100">Adaptive Parameters</CardTitle>
              <CardDescription className="text-blue-300/70">
                Auto-tuned configuration based on performance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-blue-200/80 text-sm">
            No adaptive configuration loaded yet. Configuration will appear after sufficient performance data is collected.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getBoldnessLevel = () => {
    if (config.boldness_level >= 70) {
      return { label: 'Very High', color: 'from-red-500 to-orange-500', desc: 'Be very bold and contrarian' };
    } else if (config.boldness_level >= 55) {
      return { label: 'High', color: 'from-orange-500 to-yellow-500', desc: 'Be reasonably bold' };
    } else if (config.boldness_level >= 45) {
      return { label: 'Moderate', color: 'from-blue-500 to-purple-500', desc: 'Balanced approach' };
    } else if (config.boldness_level >= 30) {
      return { label: 'Low', color: 'from-green-500 to-blue-500', desc: 'Be more conservative' };
    } else {
      return { label: 'Very Low', color: 'from-gray-500 to-slate-500', desc: 'Be very conservative' };
    }
  };

  const boldnessInfo = getBoldnessLevel();

  const getConfidenceAdjustmentBadge = () => {
    if (config.confidence_adjustment > 0.05) {
      return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Increase Confidence</Badge>;
    } else if (config.confidence_adjustment < -0.05) {
      return <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">Decrease Confidence</Badge>;
    } else {
      return <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">No Adjustment</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Config Card */}
      <Card className="bg-gradient-to-br from-slate-800/90 to-purple-900/30 border-purple-500/30 backdrop-blur-sm shadow-xl">
        <CardHeader className="border-b border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-blue-100">Adaptive Parameters</CardTitle>
                <CardDescription className="text-blue-300/70">
                  Auto-tuned based on {config.based_on_cycles} evaluated predictions
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30">
              <Zap className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Boldness Level */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-blue-200">Boldness Level</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className={`text-4xl font-bold bg-gradient-to-r ${boldnessInfo.color} bg-clip-text text-transparent`}>
                    {config.boldness_level.toFixed(0)}
                  </span>
                  <span className="text-sm text-blue-300/70">/100</span>
                  <Badge className={`bg-gradient-to-r ${boldnessInfo.color} bg-opacity-20 text-white border-0`}>
                    {boldnessInfo.label}
                  </Badge>
                </div>
                <div className="w-full bg-slate-900/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${boldnessInfo.color}`}
                    style={{ width: `${config.boldness_level}%` }}
                  />
                </div>
                <p className="text-xs text-blue-300/70">{boldnessInfo.desc}</p>
              </div>
            </div>

            {/* Surprise Thresholds */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <h4 className="text-sm font-semibold text-blue-200">Surprise Thresholds</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-blue-400/70 mb-1">Low Threshold</div>
                    <div className="text-2xl font-bold text-blue-100">
                      {config.surprise_threshold_low.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-blue-400/50">→</div>
                  <div className="flex-1">
                    <div className="text-xs text-purple-400/70 mb-1">High Threshold</div>
                    <div className="text-2xl font-bold text-purple-100">
                      {config.surprise_threshold_high.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2 border border-blue-500/20">
                  <p className="text-xs text-blue-300/70">
                    &lt;{config.surprise_threshold_low.toFixed(1)} = Low, {config.surprise_threshold_low.toFixed(1)}-{config.surprise_threshold_high.toFixed(1)} = Medium, &gt;{config.surprise_threshold_high.toFixed(1)} = High
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence Adjustment */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-400" />
                <h4 className="text-sm font-semibold text-blue-200">Confidence Adjustment</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className={`text-3xl font-bold ${config.confidence_adjustment >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                    {config.confidence_adjustment > 0 ? '+' : ''}{config.confidence_adjustment.toFixed(2)}
                  </span>
                  {getConfidenceAdjustmentBadge()}
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2 border border-blue-500/20">
                  <p className="text-xs text-blue-300/70">
                    {config.confidence_adjustment > 0.05 && `Increase probability estimates by ${(config.confidence_adjustment * 100).toFixed(0)}%`}
                    {config.confidence_adjustment < -0.05 && `Decrease probability estimates by ${Math.abs(config.confidence_adjustment * 100).toFixed(0)}%`}
                    {Math.abs(config.confidence_adjustment) <= 0.05 && 'No adjustment needed - current confidence is well-calibrated'}
                  </p>
                </div>
              </div>
            </div>

            {/* Hypothesis Target */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-400" />
                <h4 className="text-sm font-semibold text-blue-200">Target Hypotheses</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-blue-100">
                    {config.hypothesis_count_target}
                  </span>
                  <span className="text-sm text-blue-300/70">hypotheses</span>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2 border border-blue-500/20">
                  <p className="text-xs text-blue-300/70">
                    Generate approximately {config.hypothesis_count_target} hypotheses this cycle
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rationale */}
          {config.rationale && (
            <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-purple-500/20">
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Configuration Rationale</h4>
              <p className="text-sm text-blue-200/90 leading-relaxed">{config.rationale}</p>
            </div>
          )}

          {/* Based On Stats */}
          {config.based_on_accuracy !== null && (
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-blue-300/70">
              <div className="flex items-center gap-1">
                <span className="text-blue-400/70">Based on accuracy:</span>
                <span className="text-blue-200 font-semibold">{config.based_on_accuracy.toFixed(1)}%</span>
              </div>
              {config.based_on_trend && (
                <div className="flex items-center gap-1">
                  <span className="text-blue-400/70">Trend:</span>
                  <span className="text-blue-200 font-semibold">{config.based_on_trend}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-100 text-base">How Adaptive Parameters Work</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-200/80">
            <li className="flex gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span><strong>Automatically calculated</strong> based on your historical prediction accuracy</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span><strong>Updates with each cycle</strong> as more performance data becomes available</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span><strong>Claude follows these parameters</strong> in its next research cycle to optimize performance</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span><strong>High accuracy</strong> → More boldness, more hypotheses, higher confidence</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span><strong>Low accuracy</strong> → Less boldness, fewer hypotheses, adjusted confidence</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
