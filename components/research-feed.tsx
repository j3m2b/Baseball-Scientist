'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTimeAgo } from '@/lib/utils';
import { FlaskConical, TrendingUp, LineChart, Clock } from 'lucide-react';
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

  useEffect(() => {
    fetchLatestData();
    subscribeToUpdates();
  }, []);

  async function fetchLatestData() {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      if (data.latest) {
        setLatestData(data.latest);
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
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Research Yet</CardTitle>
            <CardDescription>
              The Auto-Baseball-Scientist hasn't run its first experiment yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { experiment, hypotheses, insights, teamProbabilities, nextExperiments } = latestData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Auto-Baseball-Scientist</h1>
        <p className="text-muted-foreground">
          Live Research Feed — 2026 MLB Off-Season Analysis
        </p>
      </div>

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
