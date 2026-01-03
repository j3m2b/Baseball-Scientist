import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Load the system prompt
const systemPrompt = readFileSync(
  join(process.cwd(), 'claude.code.md'),
  'utf-8'
);

// Current MLB data (update this regularly or fetch from an API)
const CURRENT_MLB_DATA = `
**Current World Series Futures Odds (January 2026)**
- Los Angeles Dodgers: +450 (18.2%)
- New York Yankees: +550 (15.4%)
- Baltimore Orioles: +700 (12.5%)
- Atlanta Braves: +750 (11.8%)
- Philadelphia Phillies: +850 (10.5%)
- Houston Astros: +900 (10.0%)
- San Diego Padres: +1100 (8.3%)
- New York Mets: +1200 (7.7%)
- Milwaukee Brewers: +1400 (6.7%)
- Seattle Mariners: +1600 (5.9%)

**Recent Major Moves (Last 7 Days)**
- Baltimore Orioles signed Pete Alonso (5yr/$150M) - major offensive upgrade
- Orioles acquired Ryan Helsley from Cardinals - elite closer addition
- Blue Jays signed Dylan Cease (4yr/$84M) - rotation strengthening
- Pirates extended Paul Skenes long-term - securing ace for future
- Mariners signed Justin Turner - veteran leadership for young roster
- Dodgers re-signed Teoscar Hernández (3yr/$66M) - maintaining depth

**Key Injuries/Concerns**
- Braves: Spencer Strider still recovering from elbow surgery
- Yankees: Aaron Judge minor hamstring concern (expected ready for spring)
- Astros: Aging core concerns, pitching depth questions
`;

interface ParsedExperiment {
  experimentNumber: number;
  title: string;
  summary: string;
  hypotheses: Array<{
    hypothesis: string;
    isValidated: boolean;
    evidence: string;
    surpriseLevel: 'Low' | 'Medium' | 'High';
  }>;
  insights: Array<{
    insight: string;
    details: string;
  }>;
  teamProbabilities: Array<{
    teamCode: string;
    teamName: string;
    probability: number;
    rank: number;
  }>;
  nextExperiments: string[];
}

function parseClaudeResponse(response: string): ParsedExperiment {
  // Extract experiment number from title or generate incrementally
  const experimentMatch = response.match(/Experiment #(\d+)/i);
  const experimentNumber = experimentMatch ? parseInt(experimentMatch[1]) : Date.now();

  // Extract title
  const titleMatch = response.match(/Experiment #\d+:\s*([^\n(]+)/);
  const title = titleMatch ? titleMatch[1].trim() : 'MLB Off-Season Analysis';

  // Extract summary
  const summaryMatch = response.match(/—\s*([^\n]+)/);
  const summary = summaryMatch ? summaryMatch[1].trim() : 'Research cycle completed';

  // Extract hypotheses
  const hypotheses: ParsedExperiment['hypotheses'] = [];
  const hypothesisRegex = /\*\*Hypothesis:\s*([^✓✗\n]+)\s*([✓✗])/g;
  let hypMatch;
  while ((hypMatch = hypothesisRegex.exec(response)) !== null) {
    const hypothesis = hypMatch[1].trim();
    const isValidated = hypMatch[2] === '✓';

    // Extract evidence (next few sentences after hypothesis)
    const startIdx = hypMatch.index + hypMatch[0].length;
    const nextSection = response.slice(startIdx, startIdx + 500);
    const evidenceMatch = nextSection.match(/([^-\n*]+(?:\n[^-\n*]+)?)/);
    const evidence = evidenceMatch ? evidenceMatch[1].trim() : 'Analysis in progress';

    // Extract surprise level
    const surpriseLevelMatch = nextSection.match(/Surprise Level:\s*(Low|Medium|High)/i);
    const surpriseLevel = (surpriseLevelMatch?.[1] as 'Low' | 'Medium' | 'High') || 'Medium';

    hypotheses.push({ hypothesis, isValidated, evidence, surpriseLevel });
  }

  // Extract insights
  const insights: ParsedExperiment['insights'] = [];
  const insightRegex = /\*\*Insight:\s*([^\n]+)\n\s*([^\n]+)/g;
  let insightMatch;
  while ((insightMatch = insightRegex.exec(response)) !== null) {
    insights.push({
      insight: insightMatch[1].trim(),
      details: insightMatch[2].trim(),
    });
  }

  // Extract team probabilities from table
  const teamProbabilities: ParsedExperiment['teamProbabilities'] = [];
  const tableRegex = /\|\s*([A-Z]{2,3})\s*\|\s*([\d.]+)%/g;
  let tableMatch;
  let rank = 1;
  while ((tableMatch = tableRegex.exec(response)) !== null) {
    const teamCode = tableMatch[1].trim();
    const probability = parseFloat(tableMatch[2]);
    teamProbabilities.push({
      teamCode,
      teamName: getTeamName(teamCode),
      probability,
      rank: rank++,
    });
  }

  // Extract next experiments
  const nextExperiments: string[] = [];
  const nextExpSection = response.split('#### Next Experiments Planned')[1];
  if (nextExpSection) {
    const expMatches = nextExpSection.matchAll(/[-*]\s*([^\n]+)/g);
    for (const match of expMatches) {
      const desc = match[1].trim();
      if (desc && !desc.includes('|') && !desc.includes('#')) {
        nextExperiments.push(desc);
      }
    }
  }

  return {
    experimentNumber,
    title,
    summary,
    hypotheses,
    insights,
    teamProbabilities,
    nextExperiments,
  };
}

function getTeamName(code: string): string {
  const teams: Record<string, string> = {
    LAD: 'Los Angeles Dodgers',
    NYY: 'New York Yankees',
    BAL: 'Baltimore Orioles',
    ATL: 'Atlanta Braves',
    PHI: 'Philadelphia Phillies',
    HOU: 'Houston Astros',
    SD: 'San Diego Padres',
    NYM: 'New York Mets',
    MIL: 'Milwaukee Brewers',
    SEA: 'Seattle Mariners',
    TOR: 'Toronto Blue Jays',
    PIT: 'Pittsburgh Pirates',
    DET: 'Detroit Tigers',
    KC: 'Kansas City Royals',
  };
  return teams[code] || code;
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for scheduled runs
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call Claude API with system prompt
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: CURRENT_MLB_DATA,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse Claude's response
    const parsed = parseClaudeResponse(responseText);

    // Get the latest experiment number from database
    const { data: latestExp } = await supabaseServer
      .from('experiments')
      .select('experiment_number')
      .order('experiment_number', { ascending: false })
      .limit(1)
      .single();

    const nextExperimentNumber = latestExp ? latestExp.experiment_number + 1 : 1;

    // Store in Supabase
    const { data: experiment, error: expError } = await supabaseServer
      .from('experiments')
      .insert({
        experiment_number: nextExperimentNumber,
        title: parsed.title,
        summary: parsed.summary,
      })
      .select()
      .single();

    if (expError || !experiment) {
      throw new Error('Failed to create experiment: ' + expError?.message);
    }

    // Insert hypotheses
    if (parsed.hypotheses.length > 0) {
      await supabaseServer.from('hypotheses').insert(
        parsed.hypotheses.map((h) => ({
          experiment_id: experiment.id,
          hypothesis: h.hypothesis,
          is_validated: h.isValidated,
          evidence: h.evidence,
          surprise_level: h.surpriseLevel,
        }))
      );
    }

    // Insert insights
    if (parsed.insights.length > 0) {
      await supabaseServer.from('insights').insert(
        parsed.insights.map((i) => ({
          experiment_id: experiment.id,
          insight: i.insight,
          details: i.details,
        }))
      );
    }

    // Insert team probabilities
    if (parsed.teamProbabilities.length > 0) {
      await supabaseServer.from('team_probabilities').insert(
        parsed.teamProbabilities.map((t) => ({
          experiment_id: experiment.id,
          team_code: t.teamCode,
          team_name: t.teamName,
          probability: t.probability,
          rank: t.rank,
        }))
      );
    }

    // Insert next experiments
    if (parsed.nextExperiments.length > 0) {
      await supabaseServer.from('next_experiments').insert(
        parsed.nextExperiments.map((desc) => ({
          experiment_id: experiment.id,
          description: desc,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      experiment: experiment,
      rawResponse: responseText,
    });
  } catch (error) {
    console.error('Research cycle error:', error);
    return NextResponse.json(
      { error: 'Failed to run research cycle', details: String(error) },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint (for testing)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Call POST handler
  const req = new NextRequest(request.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  });

  return POST(req);
}
