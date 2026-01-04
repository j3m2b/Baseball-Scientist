'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';

interface Reflection {
  id: string;
  reflection_type: 'learned' | 'bias_identified' | 'adjustment_made';
  content: string;
  created_at: string;
}

interface LearningsDisplayProps {
  reflections: Reflection[];
  experimentNumber: number;
}

export function LearningsDisplay({ reflections, experimentNumber }: LearningsDisplayProps) {
  if (!reflections || reflections.length === 0) {
    return (
      <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Brain className="h-16 w-16 mx-auto mb-4 text-blue-400/50" />
            <p className="text-blue-300/70 text-lg">
              No reflections yet from this research cycle.
            </p>
            <p className="text-blue-400/50 text-sm mt-2">
              Claude will document learnings in future cycles.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const learned = reflections.filter(r => r.reflection_type === 'learned');
  const biases = reflections.filter(r => r.reflection_type === 'bias_identified');
  const adjustments = reflections.filter(r => r.reflection_type === 'adjustment_made');

  const getIcon = (type: string) => {
    switch (type) {
      case 'learned':
        return <Lightbulb className="h-5 w-5" />;
      case 'bias_identified':
        return <TrendingDown className="h-5 w-5" />;
      case 'adjustment_made':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const getBadgeVariant = (type: string): 'gradient' | 'warning' | 'success' => {
    switch (type) {
      case 'learned':
        return 'gradient';
      case 'bias_identified':
        return 'warning';
      case 'adjustment_made':
        return 'success';
      default:
        return 'gradient';
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'learned':
        return 'Learned';
      case 'bias_identified':
        return 'Bias Identified';
      case 'adjustment_made':
        return 'Adjustment Made';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/30 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-blue-100 text-2xl">
                What Claude Learned (Experiment #{experimentNumber})
              </CardTitle>
              <p className="text-blue-300/70 mt-1">
                Self-reflection and bias identification from analyzing past research cycles
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Insights Learned */}
      {learned.length > 0 && (
        <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-blue-500/20">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-blue-100">Insights Learned</CardTitle>
              <Badge variant="gradient">{learned.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {learned.map((reflection) => (
                <div
                  key={reflection.id}
                  className="p-4 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg mt-0.5">
                      <Lightbulb className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="text-blue-100 leading-relaxed flex-1">
                      {reflection.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Biases Identified */}
      {biases.length > 0 && (
        <Card className="bg-slate-800/90 border-yellow-500/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-yellow-500/20">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-yellow-400" />
              <CardTitle className="text-blue-100">Biases Identified</CardTitle>
              <Badge variant="warning">{biases.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {biases.map((reflection) => (
                <div
                  key={reflection.id}
                  className="p-4 rounded-lg bg-yellow-900/10 border border-yellow-500/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg mt-0.5">
                      <TrendingDown className="h-4 w-4 text-yellow-400" />
                    </div>
                    <p className="text-blue-100 leading-relaxed flex-1">
                      {reflection.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustments Made */}
      {adjustments.length > 0 && (
        <Card className="bg-slate-800/90 border-green-500/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-green-500/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <CardTitle className="text-blue-100">Adjustments Made</CardTitle>
              <Badge variant="success">{adjustments.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {adjustments.map((reflection) => (
                <div
                  key={reflection.id}
                  className="p-4 rounded-lg bg-green-900/10 border border-green-500/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg mt-0.5">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    </div>
                    <p className="text-blue-100 leading-relaxed flex-1">
                      {reflection.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Reflections Combined (fallback view) */}
      {learned.length === 0 && biases.length === 0 && adjustments.length === 0 && reflections.length > 0 && (
        <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-blue-500/20">
            <CardTitle className="text-blue-100">All Reflections</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {reflections.map((reflection) => (
                <div
                  key={reflection.id}
                  className="p-4 rounded-lg bg-slate-900/50 border border-blue-500/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg mt-0.5">
                      {getIcon(reflection.reflection_type)}
                    </div>
                    <div className="flex-1">
                      <Badge variant={getBadgeVariant(reflection.reflection_type)} className="mb-2">
                        {getLabel(reflection.reflection_type)}
                      </Badge>
                      <p className="text-blue-100 leading-relaxed">
                        {reflection.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
