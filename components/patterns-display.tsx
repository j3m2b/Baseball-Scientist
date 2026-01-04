'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

interface DetectedPattern {
  id: string;
  pattern_type: 'overestimation' | 'underestimation' | 'volatility' | 'consistency' | 'category_bias';
  entity: string;
  confidence: number;
  evidence: any;
  cycle_count: number;
  last_updated_at: string;
}

interface PatternsDisplayProps {
  patterns: DetectedPattern[];
}

export function PatternsDisplay({ patterns }: PatternsDisplayProps) {
  if (!patterns || patterns.length === 0) {
    return (
      <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Activity className="h-16 w-16 mx-auto mb-4 text-blue-400/50" />
            <p className="text-blue-300/70 text-lg">
              No patterns detected yet.
            </p>
            <p className="text-blue-400/50 text-sm mt-2">
              At least 5 research cycles needed to detect patterns.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by confidence (highest first)
  const sortedPatterns = [...patterns].sort((a, b) => b.confidence - a.confidence);

  // Group by pattern type
  const overestimations = sortedPatterns.filter(p => p.pattern_type === 'overestimation');
  const underestimations = sortedPatterns.filter(p => p.pattern_type === 'underestimation');
  const volatility = sortedPatterns.filter(p => p.pattern_type === 'volatility');
  const consistency = sortedPatterns.filter(p => p.pattern_type === 'consistency');
  const biases = sortedPatterns.filter(p => p.pattern_type === 'category_bias');

  const getIcon = (type: string) => {
    switch (type) {
      case 'overestimation':
        return <TrendingUp className="h-5 w-5" />;
      case 'underestimation':
        return <TrendingDown className="h-5 w-5" />;
      case 'volatility':
        return <Activity className="h-5 w-5" />;
      case 'consistency':
        return <CheckCircle className="h-5 w-5" />;
      case 'category_bias':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return 'text-red-400';
    if (confidence >= 50) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 75) return <Badge variant="destructive">High Confidence</Badge>;
    if (confidence >= 50) return <Badge variant="warning">Medium Confidence</Badge>;
    return <Badge variant="info">Low Confidence</Badge>;
  };

  const formatEvidence = (evidence: any) => {
    if (Array.isArray(evidence) && evidence.length > 0) {
      const sample = evidence.slice(0, 3);
      return sample.map((e, i) => (
        <div key={i} className="text-xs text-blue-300/60">
          {e.probability !== undefined && `• ${e.probability.toFixed(1)}%`}
          {e.date && ` (${new Date(e.date).toLocaleDateString()})`}
        </div>
      ));
    }
    return null;
  };

  const PatternCard = ({ pattern }: { pattern: DetectedPattern }) => (
    <div className="p-4 rounded-lg bg-slate-900/50 border border-blue-500/20 hover:border-blue-500/40 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${
            pattern.pattern_type === 'overestimation' ? 'bg-red-500/20' :
            pattern.pattern_type === 'underestimation' ? 'bg-blue-500/20' :
            pattern.pattern_type === 'volatility' ? 'bg-yellow-500/20' :
            pattern.pattern_type === 'consistency' ? 'bg-green-500/20' :
            'bg-orange-500/20'
          }`}>
            {getIcon(pattern.pattern_type)}
          </div>
          <div>
            <h4 className="font-semibold text-blue-100">{pattern.entity}</h4>
            <p className="text-xs text-blue-400/60 capitalize">{pattern.pattern_type.replace('_', ' ')}</p>
          </div>
        </div>
        {getConfidenceBadge(pattern.confidence)}
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-300/80">Confidence:</span>
          <span className={`font-semibold ${getConfidenceColor(pattern.confidence)}`}>
            {pattern.confidence.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-300/80">Detected in:</span>
          <span className="text-blue-100">{pattern.cycle_count} cycles</span>
        </div>
      </div>

      {formatEvidence(pattern.evidence) && (
        <div className="mt-3 pt-3 border-t border-blue-500/10">
          <p className="text-xs text-blue-300/60 mb-1">Recent evidence:</p>
          {formatEvidence(pattern.evidence)}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-blue-100 text-2xl">
                Detected Patterns ({patterns.length})
              </CardTitle>
              <p className="text-blue-300/70 mt-1">
                Automatically identified biases from analyzing past research cycles
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overestimation Patterns */}
      {overestimations.length > 0 && (
        <Card className="bg-slate-800/90 border-red-500/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-red-500/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-400" />
              <CardTitle className="text-blue-100">Overestimation Patterns</CardTitle>
              <Badge variant="destructive">{overestimations.length}</Badge>
            </div>
            <p className="text-sm text-blue-300/60 mt-1">
              Entities you consistently rate too high
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3">
              {overestimations.map(pattern => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Underestimation Patterns */}
      {underestimations.length > 0 && (
        <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-blue-500/20">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-blue-100">Underestimation Patterns</CardTitle>
              <Badge variant="info">{underestimations.length}</Badge>
            </div>
            <p className="text-sm text-blue-300/60 mt-1">
              Entities you consistently rate too low
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3">
              {underestimations.map(pattern => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volatility Patterns */}
      {volatility.length > 0 && (
        <Card className="bg-slate-800/90 border-yellow-500/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-yellow-500/20">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-yellow-400" />
              <CardTitle className="text-blue-100">Volatility Patterns</CardTitle>
              <Badge variant="warning">{volatility.length}</Badge>
            </div>
            <p className="text-sm text-blue-300/60 mt-1">
              Predictions that swing wildly between cycles
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3">
              {volatility.map(pattern => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consistency Patterns */}
      {consistency.length > 0 && (
        <Card className="bg-slate-800/90 border-green-500/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-green-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <CardTitle className="text-blue-100">Consistency Patterns</CardTitle>
              <Badge variant="success">{consistency.length}</Badge>
            </div>
            <p className="text-sm text-blue-300/60 mt-1">
              Predictions that remain stable and accurate
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3">
              {consistency.map(pattern => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Bias Patterns */}
      {biases.length > 0 && (
        <Card className="bg-slate-800/90 border-orange-500/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-orange-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              <CardTitle className="text-blue-100">Category Biases</CardTitle>
              <Badge className="bg-orange-500 text-white">{biases.length}</Badge>
            </div>
            <p className="text-sm text-blue-300/60 mt-1">
              Systematic biases in specific prediction categories
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3">
              {biases.map(pattern => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
