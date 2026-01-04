'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTimeAgo } from '@/lib/utils';
import { FlaskConical, TrendingUp, LineChart, Clock, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { ProbabilityChart } from './probability-chart';

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

interface LatestData {
  experiment: Experiment;
  hypotheses: Hypothesis[];
  insights: Insight[];
  teamProbabilities: TeamProbability[];
  nextExperiments: NextExperiment[];
}

export function ResearchFeed() {
  const [latestData, setLatestData] = useState<LatestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null);
  const [secretInput, setSecretInput] = useState('');
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [rememberSecret, setRememberSecret] = useState(false);

  useEffect(() => {
    fetchLatestData();
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

      // Handle the API response format
      if (data.experiment) {
        setLatestData({
          experiment: data.experiment,
          hypotheses: data.hypotheses || [],
          insights: data.insights || [],
          teamProbabilities: data.probabilities || [],
          nextExperiments: []
        });
      } else if (data.error && data.error.includes('No experiments found')) {
        // No data yet - show the "no research" state
        setLatestData(null);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
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

    // Save secret to localStorage if "remember" is checked
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

      setTriggerSuccess(`Research cycle #${data.experimentId.slice(0, 8)} started! ${data.hypothesesCount} hypotheses generated. Check back in a minute.`);

      // Refresh data after a short delay
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FlaskConical className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading research data...</p>
        </div>
      </div>
    );
  }

  if (!latestData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              No Research Yet
            </CardTitle>
            <CardDescription>
              The Auto-Baseball-Scientist hasn't run its first experiment yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cron Secret</label>
              <input
                type="password"
                placeholder="Enter your CRON_SECRET..."
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && triggerResearch()}
                disabled={triggering}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberSecret}
                  onChange={(e) => setRememberSecret(e.target.checked)}
                  className="rounded"
                />
                Remember secret (stored in browser)
              </label>
            </div>

            {triggerError && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {triggerError}
              </div>
            )}

            {triggerSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-500 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                {triggerSuccess}
              </div>
            )}

            <button
              onClick={triggerResearch}
              disabled={triggering}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
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

            <p className="text-xs text-muted-foreground text-center">
              This will call Claude 4.5 to analyze MLB data and generate hypotheses
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { experiment, hypotheses, insights, teamProbabilities, nextExperiments } = latestData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Auto-Baseball-Scientist</h1>
          <p className="text-muted-foreground">
            Live Research Feed — 2026 MLB Off-Season Analysis
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') triggerResearch();
                }}
                disabled={triggering}
                className="w-40 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={rememberSecret}
                  onChange={(e) => setRememberSecret(e.target.checked)}
                  className="rounded"
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
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${
              secretInput
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
            }`}
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
          {!secretInput && (
            <button
              onClick={() => setShowSecretInput(!showSecretInput)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {showSecretInput ? 'Hide' : 'Show Secret Input'}
            </button>
          )}
        </div>
      </div>

      {/* Show success/error messages at the top */}
      {triggerError && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          {triggerError}
        </div>
      )}

      {triggerSuccess && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-500 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          {triggerSuccess}
        </div>
      )}

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="activity" className="gap-2">
            <Clock className="h-4 w-4" />
            Latest Activity
          </TabsTrigger>
          <TabsTrigger value="findings" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Research Findings
          </TabsTrigger>
          <TabsTrigger value="visuals" className="gap-2">
            <LineChart className="h-4 w-4" />
            Progress Visuals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Experiment #{experiment.experiment_number}: {experiment.title}
              </CardTitle>
              <CardDescription>
                {formatTimeAgo(experiment.created_at)} — {experiment.summary}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hypotheses.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Hypotheses Tested</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {hypotheses.map((h) => (
                        <li key={h.id}>
                          {h.hypothesis} {h.is_validated ? '✓' : '✗'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {nextExperiments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Next Experiments Planned</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {nextExperiments.map((exp) => (
                        <li key={exp.id}>{exp.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          {hypotheses.map((hypothesis) => (
            <Card key={hypothesis.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">{hypothesis.is_validated ? '✓' : '✗'}</span>
                  Hypothesis: {hypothesis.hypothesis}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">{hypothesis.evidence}</p>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-semibold">Surprise Level:</span>
                  <span
                    className={
                      hypothesis.surprise_level === 'High'
                        ? 'text-red-500'
                        : hypothesis.surprise_level === 'Medium'
                        ? 'text-yellow-500'
                        : 'text-green-500'
                    }
                  >
                    {hypothesis.surprise_level}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {insights.map((insight) => (
            <Card key={insight.id} className="border-primary/50">
              <CardHeader>
                <CardTitle className="text-lg">💡 Insight: {insight.insight}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{insight.details}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="visuals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Teams by World Series Win Probability</CardTitle>
              <CardDescription>
                After {experiment.experiment_number} research cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProbabilityChart data={teamProbabilities} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Probabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamProbabilities.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground">
                        #{team.rank}
                      </span>
                      <div>
                        <p className="font-semibold">{team.team_name}</p>
                        <p className="text-sm text-muted-foreground">{team.team_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{team.probability.toFixed(1)}%</p>
                      {team.change_from_previous !== null && (
                        <p
                          className={`text-sm ${
                            team.change_from_previous > 0
                              ? 'text-green-500'
                              : team.change_from_previous < 0
                              ? 'text-red-500'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {team.change_from_previous > 0 ? '+' : ''}
                          {team.change_from_previous.toFixed(1)}%
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
  );
}
