'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo } from '@/lib/utils';
import { FlaskConical, TrendingUp, LineChart, Clock, Play, AlertCircle, CheckCircle, Sparkles, Zap, Target, Brain, Lightbulb, Activity, BarChart } from 'lucide-react';
import { ProbabilityChart } from './probability-chart';
import { LearningsDisplay } from './learnings-display';
import { PatternsDisplay } from './patterns-display';
import { AccuracyDisplay } from './accuracy-display';

interface Experiment {
  id: string;
  experiment_number: number;
  title: string;
  summary: string;
  created_at: string;
}

interface Hypothesis {
  id: string;
  hypothesis: string;
  is_validated: boolean;
  evidence: string;
  surprise_level: 'Low' | 'Medium' | 'High';
  created_at: string;
}

interface Insight {
  id: string;
  insight: string;
  details: string;
  created_at: string;
}

interface TeamProbability {
  id: string;
  team_code: string;
  team_name: string;
  probability: number;
  rank: number;
  change_from_previous: number | null;
}

interface NextExperiment {
  id: string;
  description: string;
}

interface Reflection {
  id: string;
  reflection_type: 'learned' | 'bias_identified' | 'adjustment_made';
  content: string;
  created_at: string;
}

interface DetectedPattern {
  id: string;
  pattern_type: 'overestimation' | 'underestimation' | 'volatility' | 'consistency' | 'category_bias';
  entity: string;
  confidence: number;
  description: string;
  evidence: any;
  cycle_count: number;
  first_detected_at: string;
  last_updated_at: string;
}

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

interface LatestData {
  experiment: Experiment;
  hypotheses: Hypothesis[];
  insights: Insight[];
  teamProbabilities: TeamProbability[];
  nextExperiments: NextExperiment[];
  reflections: Reflection[];
}

export function ResearchFeedV2() {
  const [latestData, setLatestData] = useState<LatestData | null>(null);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [accuracyMetrics, setAccuracyMetrics] = useState<AccuracyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null);
  const [secretInput, setSecretInput] = useState('');
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [rememberSecret, setRememberSecret] = useState(false);

  useEffect(() => {
    fetchLatestData();
    fetchPatterns();
    fetchAccuracy();
    subscribeToUpdates();

    // Load saved secret if available
    const savedSecret = localStorage.getItem('cron_secret');
    if (savedSecret) {
      setSecretInput(savedSecret);
      setRememberSecret(true);
    }
  }, []);

  async function fetchLatestData() {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();

      if (data.experiment) {
        setLatestData({
          experiment: data.experiment,
          hypotheses: data.hypotheses || [],
          insights: data.insights || [],
          teamProbabilities: data.probabilities || [],
          nextExperiments: [],
          reflections: data.reflections || []
        });
      } else if (data.error && data.error.includes('No experiments found')) {
        setLatestData(null);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPatterns() {
    try {
      const response = await fetch('/api/patterns');
      const data = await response.json();
      setPatterns(data.patterns || []);
    } catch (error) {
      console.error('Failed to fetch patterns:', error);
    }
  }

  async function fetchAccuracy() {
    try {
      const response = await fetch('/api/accuracy');
      const data = await response.json();
      setAccuracyMetrics(data.metrics || null);
    } catch (error) {
      console.error('Failed to fetch accuracy:', error);
    }
  }

  function subscribeToUpdates() {
    const channel = supabase
      .channel('research-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'experiments',
        },
        () => {
          fetchLatestData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function triggerResearch() {
    if (!secretInput.trim()) {
      setTriggerError('Please enter your cron secret');
      return;
    }

    setTriggering(true);
    setTriggerError(null);
    setTriggerSuccess(null);

    if (rememberSecret) {
      localStorage.setItem('cron_secret', secretInput.trim());
    }

    try {
      const response = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secretInput.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger research');
      }

      setTriggerSuccess(`Research cycle started! ${data.hypothesesCount} hypotheses generated.`);

      setTimeout(() => {
        fetchLatestData();
      }, 3000);
    } catch (error) {
      setTriggerError(error instanceof Error ? error.message : 'Failed to trigger research');
    } finally {
      setTriggering(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <FlaskConical className="h-16 w-16 mx-auto mb-6 text-blue-400 animate-pulse" />
            <div className="absolute inset-0 blur-xl bg-blue-500/30 animate-pulse rounded-full"></div>
          </div>
          <p className="text-xl text-blue-100 font-medium">Loading research data...</p>
          <p className="text-sm text-blue-300/70 mt-2">Analyzing latest MLB insights</p>
        </div>
      </div>
    );
  }

  if (!latestData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-2xl">
          <CardHeader className="border-b border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <FlaskConical className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-blue-100">No Research Yet</CardTitle>
                <CardDescription className="text-blue-300/70">
                  The Auto-Baseball-Scientist hasn't run its first experiment yet.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-200">Cron Secret</label>
              <input
                type="password"
                placeholder="Enter your CRON_SECRET..."
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && triggerResearch()}
                disabled={triggering}
                className="w-full px-4 py-3 rounded-lg border border-blue-500/30 bg-slate-900/50 text-blue-100 placeholder:text-blue-400/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <label className="flex items-center gap-2 text-sm text-blue-300/80">
                <input
                  type="checkbox"
                  checked={rememberSecret}
                  onChange={(e) => setRememberSecret(e.target.checked)}
                  className="rounded bg-slate-900/50 border-blue-500/30"
                />
                Remember secret (stored in browser)
              </label>
            </div>

            {triggerError && (
              <div className="flex items-center gap-2 text-sm text-red-300 bg-red-900/30 p-4 rounded-lg border border-red-500/30">
                <AlertCircle className="h-4 w-4" />
                {triggerError}
              </div>
            )}

            {triggerSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-300 bg-green-900/30 p-4 rounded-lg border border-green-500/30">
                <CheckCircle className="h-4 w-4" />
                {triggerSuccess}
              </div>
            )}

            <button
              onClick={triggerResearch}
              disabled={triggering}
              className="w-full inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 h-12 px-6 py-3 shadow-lg shadow-blue-500/25"
            >
              {triggering ? (
                <>
                  <FlaskConical className="h-4 w-4 mr-2 animate-pulse" />
                  Running Research Cycle...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run First Research Cycle
                </>
              )}
            </button>

            <p className="text-xs text-blue-400/60 text-center">
              This will call Claude 4.5 to analyze current MLB data and generate bold hypotheses
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { experiment, hypotheses, insights, teamProbabilities, nextExperiments, reflections } = latestData;

  const getSurpriseBadge = (level: 'Low' | 'Medium' | 'High') => {
    switch (level) {
      case 'High':
        return <Badge variant="gradient" className="gap-1"><Sparkles className="h-3 w-3" />High Surprise</Badge>;
      case 'Medium':
        return <Badge variant="warning" className="gap-1"><Zap className="h-3 w-3" />Medium</Badge>;
      default:
        return <Badge variant="info" className="gap-1">Low</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Header */}
      <div className="border-b border-blue-500/20 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Auto-Baseball-Scientist
                </h1>
              </div>
              <p className="text-blue-300/80 text-lg">
                Live Research Feed • 2025-2026 Offseason → 2026 Season Analysis
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {showSecretInput && (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="CRON_SECRET"
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && triggerResearch()}
                    disabled={triggering}
                    className="w-40 px-3 py-2 rounded-lg border border-blue-500/30 bg-slate-900/50 text-sm text-blue-100 placeholder:text-blue-400/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="flex items-center gap-1 text-xs text-blue-300/80 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={rememberSecret}
                      onChange={(e) => setRememberSecret(e.target.checked)}
                      className="rounded bg-slate-900/50 border-blue-500/30"
                    />
                    Remember
                  </label>
                </div>
              )}
              <button
                onClick={() => {
                  if (!secretInput) {
                    setShowSecretInput(true);
                  } else {
                    triggerResearch();
                  }
                }}
                disabled={triggering}
                className={`inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all h-10 px-4 py-2 shadow-lg ${
                  secretInput
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-blue-500/25'
                    : 'border border-blue-500/30 bg-slate-800/50 text-blue-100 hover:bg-slate-700/50'
                } disabled:opacity-50`}
              >
                {triggering ? (
                  <>
                    <FlaskConical className="h-4 w-4 mr-2 animate-pulse" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {secretInput ? 'Run New Cycle' : 'Enter Secret'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="container mx-auto px-4 max-w-7xl">
        {triggerError && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-300 bg-red-900/30 p-4 rounded-lg border border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            {triggerError}
          </div>
        )}

        {triggerSuccess && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-300 bg-green-900/30 p-4 rounded-lg border border-green-500/30">
            <CheckCircle className="h-4 w-4" />
            {triggerSuccess}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 lg:w-auto lg:inline-flex bg-slate-800/50 border border-blue-500/20 p-1 rounded-lg">
            <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Clock className="h-4 w-4" />
              Latest Activity
            </TabsTrigger>
            <TabsTrigger value="learnings" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Lightbulb className="h-4 w-4" />
              What I Learned
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Activity className="h-4 w-4" />
              Detected Patterns
            </TabsTrigger>
            <TabsTrigger value="accuracy" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <BarChart className="h-4 w-4" />
              Accuracy
            </TabsTrigger>
            <TabsTrigger value="findings" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Target className="h-4 w-4" />
              Research Findings
            </TabsTrigger>
            <TabsTrigger value="visuals" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <LineChart className="h-4 w-4" />
              Probability Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-blue-500/20 px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="gradient" className="gap-1">
                        <FlaskConical className="h-3 w-3" />
                        Experiment #{experiment.experiment_number}
                      </Badge>
                      <Badge variant="outline" className="text-blue-300 border-blue-500/30">
                        {formatTimeAgo(experiment.created_at)}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl text-blue-100 font-bold">{experiment.title}</CardTitle>
                    <CardDescription className="text-blue-300/80 mt-2 text-base">
                      {experiment.summary}
                    </CardDescription>
                  </div>
                </div>
              </div>
              <CardContent className="pt-6 space-y-6">
                {hypotheses.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-blue-100 mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Hypotheses Tested ({hypotheses.length})
                    </h4>
                    <div className="grid gap-2">
                      {hypotheses.map((h) => (
                        <div key={h.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-blue-500/20">
                          <span className="text-xl mt-0.5">
                            {h.is_validated ? '✓' : '✗'}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-blue-100">{h.hypothesis}</p>
                          </div>
                          {getSurpriseBadge(h.surprise_level)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="learnings" className="space-y-4">
            <LearningsDisplay
              reflections={reflections}
              experimentNumber={experiment.experiment_number}
            />
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <PatternsDisplay patterns={patterns} />
          </TabsContent>

          <TabsContent value="accuracy" className="space-y-4">
            <AccuracyDisplay metrics={accuracyMetrics} />
          </TabsContent>

          <TabsContent value="findings" className="space-y-4">
            {hypotheses.map((hypothesis) => (
              <Card key={hypothesis.id} className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl overflow-hidden">
                <div className={`px-6 py-4 border-b ${
                  hypothesis.is_validated
                    ? 'bg-green-900/20 border-green-500/20'
                    : 'bg-red-900/20 border-red-500/20'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-3xl">{hypothesis.is_validated ? '✓' : '✗'}</span>
                      <div className="flex-1">
                        <CardTitle className="text-lg text-blue-100 font-semibold mb-2">
                          {hypothesis.hypothesis}
                        </CardTitle>
                      </div>
                    </div>
                    {getSurpriseBadge(hypothesis.surprise_level)}
                  </div>
                </div>
                <CardContent className="pt-4">
                  <p className="text-blue-200/90 leading-relaxed">{hypothesis.evidence}</p>
                </CardContent>
              </Card>
            ))}

            {insights.map((insight) => (
              <Card key={insight.id} className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-lg text-purple-100">{insight.insight}</CardTitle>
                  </div>
                </CardHeader>
                {insight.details && (
                  <CardContent>
                    <p className="text-purple-200/80">{insight.details}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="visuals" className="space-y-4">
            <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl">
              <CardHeader className="border-b border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-blue-100">Top 10 Teams by World Series Win Probability</CardTitle>
                    <CardDescription className="text-blue-300/70">
                      After {experiment.experiment_number} research cycles
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ProbabilityChart data={teamProbabilities} />
              </CardContent>
            </Card>

            <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm shadow-xl">
              <CardHeader className="border-b border-blue-500/20">
                <CardTitle className="text-blue-100">Detailed Probabilities</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-3">
                  {teamProbabilities.map((team, index) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-900/80 to-slate-900/40 border border-blue-500/20 hover:border-blue-500/40 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white' :
                          index === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white' :
                          'bg-slate-700/50 text-blue-300'
                        }`}>
                          #{team.rank}
                        </div>
                        <div>
                          <p className="font-semibold text-blue-100 text-lg">{team.team_name}</p>
                          <p className="text-sm text-blue-400/70">{team.team_code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-100">{team.probability.toFixed(1)}%</p>
                        {team.change_from_previous !== null && (
                          <p className={`text-sm font-medium ${
                            team.change_from_previous > 0
                              ? 'text-green-400'
                              : team.change_from_previous < 0
                              ? 'text-red-400'
                              : 'text-blue-400/50'
                          }`}>
                            {team.change_from_previous > 0 ? '↑' : team.change_from_previous < 0 ? '↓' : '→'}{' '}
                            {Math.abs(team.change_from_previous).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
