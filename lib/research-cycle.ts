/**
 * Shared research cycle logic
 * Eliminates code duplication between /api/research and /api/trigger
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseClaudeResponse, TEAM_CODES } from '@/lib/parsers';
import { fetchMLBData } from '@/lib/mlb-data-fetcher';
import { detectPatterns, saveDetectedPatterns, formatPatternsForPrompt } from '@/lib/pattern-analyzer';
import { calculateAccuracyMetrics, formatAccuracyForPrompt } from '@/lib/accuracy-calculator';
import { getActiveConfig, calculateAdaptiveConfig, updateActiveConfig, formatAdaptiveConfigForPrompt } from '@/lib/adaptive-config-calculator';

export interface ResearchCycleConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  pastCyclesToFetch?: number;
}

export interface ResearchCycleResult {
  success: boolean;
  experimentId?: string;
  title?: string;
  hypothesesCount?: number;
  insightsCount?: number;
  nextExperimentsCount?: number;
  reflectionsCount?: number;
  error?: string;
}

const DEFAULT_CONFIG: Required<ResearchCycleConfig> = {
  model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
  maxTokens: parseInt(process.env.MAX_TOKENS || '4096'),
  temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
  pastCyclesToFetch: parseInt(process.env.PAST_CYCLES_TO_FETCH || '10'),
};

/**
 * Run a complete research cycle
 * @param config Optional configuration overrides
 * @returns Research cycle result
 */
export async function runResearchCycle(
  config: ResearchCycleConfig = {}
): Promise<ResearchCycleResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.ANTHROPIC_BASE_URL,
    });

    // Load system prompt
    const systemPrompt = readFileSync(join(process.cwd(), 'claude.code.md'), 'utf-8');

    // Fetch current MLB data (now using real data!)
    const currentMLBData = await fetchMLBData();

    // Fetch past cycles for reflection
    const supabase = supabaseServer;
    const { data: pastExps } = await supabase
      .from('experiments')
      .select('id, created_at, title, summary')
      .order('created_at', { ascending: false })
      .limit(finalConfig.pastCyclesToFetch);

    const expIds = pastExps?.map((e: any) => e.id) || [];

    const { data: pastHyps } = await supabase
      .from('hypotheses')
      .select('hypothesis, is_validated, surprise_level, experiment_id')
      .in('experiment_id', expIds);

    const { data: pastProbs } = await supabase
      .from('team_probabilities')
      .select('team_name, probability, experiment_id')
      .in('experiment_id', expIds);

    // Format history context for reflection
    let historyContext = 'No previous research cycles yet.';
    if (pastExps && pastExps.length > 0) {
      historyContext = '### Previous Research Cycles (for reflection only):\n\n';
      pastExps.forEach((exp: any, i: number) => {
        const hyps = pastHyps?.filter((h: any) => h.experiment_id === exp.id) || [];
        const probs = pastProbs?.filter((p: any) => p.experiment_id === exp.id).slice(0, 6) || [];
        historyContext += `Cycle ${pastExps.length - i} (${new Date(exp.created_at).toLocaleDateString()}):\n`;
        historyContext += `${exp.title}\n${exp.summary}\n`;
        historyContext += `Key Hypotheses: ${hyps.map((h: any) => `${h.hypothesis} (${h.is_validated ? '✓' : '✗'}, Surprise ${h.surprise_level})`).join('; ') || 'None'}\n`;
        historyContext += `Top Teams: ${probs.map((p: any) => `${p.team_name} ${p.probability}%`).join(', ') || 'None'}\n\n`;
      });
    }

    // Phase 2: Detect patterns in past predictions
    let patternsContext = '';
    if (pastExps && pastExps.length >= 5) {
      console.log('[ResearchCycle] Detecting patterns in past cycles...');
      const detectedPatterns = await detectPatterns(20);
      if (detectedPatterns.length > 0) {
        patternsContext = '\n\n' + formatPatternsForPrompt(detectedPatterns);
        // Save detected patterns to database
        await saveDetectedPatterns(detectedPatterns);
        console.log(`[ResearchCycle] Detected ${detectedPatterns.length} patterns`);
      }
    }

    // Phase 3: Calculate accuracy metrics
    let accuracyContext = '';
    let accuracyMetrics = null;
    if (pastExps && pastExps.length >= 3) {
      console.log('[ResearchCycle] Calculating accuracy metrics...');
      accuracyMetrics = await calculateAccuracyMetrics(50);
      if (accuracyMetrics.total_hypotheses_evaluated > 0 || accuracyMetrics.total_teams_evaluated > 0) {
        accuracyContext = formatAccuracyForPrompt(accuracyMetrics);
        console.log(`[ResearchCycle] Accuracy: ${accuracyMetrics.overall_hypothesis_accuracy?.toFixed(1)}% (${accuracyMetrics.total_hypotheses_evaluated} hypotheses evaluated)`);
      }
    }

    // Phase 4: Adaptive configuration (auto-tune parameters based on performance)
    let adaptiveConfigContext = '';
    if (accuracyMetrics && (accuracyMetrics.total_hypotheses_evaluated >= 5 || accuracyMetrics.total_teams_evaluated >= 5)) {
      console.log('[ResearchCycle] Calculating adaptive configuration...');
      const newConfig = calculateAdaptiveConfig(accuracyMetrics);
      await updateActiveConfig(newConfig);
      adaptiveConfigContext = formatAdaptiveConfigForPrompt(newConfig);
      console.log(`[ResearchCycle] Adaptive Config: Boldness=${newConfig.boldness_level}, Surprise=[${newConfig.surprise_threshold_low},${newConfig.surprise_threshold_high}]`);
    } else {
      // Use existing config if available
      const existingConfig = await getActiveConfig();
      if (existingConfig) {
        adaptiveConfigContext = formatAdaptiveConfigForPrompt(existingConfig);
        console.log('[ResearchCycle] Using existing adaptive config');
      }
    }

    const userPrompt = `${historyContext}${patternsContext}${accuracyContext}${adaptiveConfigContext}\n\n### Current MLB Data:\n${currentMLBData}\n\nNow run the next research cycle.`;

    // Call Claude API with retry logic
    const response = await callClaudeWithRetry(
      anthropic,
      systemPrompt,
      userPrompt,
      finalConfig
    );

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    if (!text) {
      return { success: false, error: 'Empty response from Claude' };
    }

    // Parse the XML response
    const parsed = parseClaudeResponse(text);

    // Validate parsed data
    if (!parsed.title || !parsed.summary) {
      console.error('[ResearchCycle] Failed to parse experiment:', { parsed });
      return { success: false, error: 'Failed to parse Claude response - missing title or summary' };
    }

    // Get next experiment number
    const lastExpResult = await supabase
      .from('experiments')
      .select('experiment_number')
      .order('experiment_number', { ascending: false })
      .limit(1)
      .single();

    const lastExp = lastExpResult.data as { experiment_number: number } | null;
    const nextExperimentNumber = (lastExp?.experiment_number ?? 0) + 1;

    // Create experiment record
    const expResult = await supabase
      .from('experiments')
      .insert({
        experiment_number: nextExperimentNumber,
        title: parsed.title,
        summary: parsed.summary
      } as any)
      .select('id')
      .single();

    const experiment = expResult.data as { id: string } | null;
    if (expResult.error || !experiment) {
      console.error('[ResearchCycle] Failed to create experiment:', expResult.error);
      return { success: false, error: 'Failed to create experiment: ' + (expResult.error?.message || 'Unknown error') };
    }

    const experimentId = experiment.id;

    // Insert hypotheses
    if (parsed.hypotheses.length > 0) {
      const hypothesesToInsert = parsed.hypotheses.map((h: any) => ({
        experiment_id: experimentId,
        hypothesis: h.text,
        is_validated: h.isValidated,
        evidence: h.explanation,
        surprise_level: h.surpriseLevel
      }));

      const { error: hypError } = await supabase
        .from('hypotheses')
        .insert(hypothesesToInsert as any);

      if (hypError) {
        console.error('[ResearchCycle] Failed to insert hypotheses:', hypError);
        await supabase.from('experiments').delete().eq('id', experimentId);
        return { success: false, error: 'Failed to save hypotheses: ' + hypError.message };
      }
    }

    // Insert team probabilities with rankings
    if (parsed.teamProbabilities.length > 0) {
      const sortedTeams = [...parsed.teamProbabilities].sort((a: any, b: any) => b.probability - a.probability);

      const probabilitiesToInsert = sortedTeams.map((t: any, index: number) => ({
        experiment_id: experimentId,
        team_code: TEAM_CODES[t.name] || t.name.slice(0, 3).toUpperCase(),
        team_name: t.name,
        probability: t.probability,
        rank: index + 1,
        change_from_previous: t.change
      }));

      const { error: probError } = await supabase
        .from('team_probabilities')
        .insert(probabilitiesToInsert as any);

      if (probError) {
        console.error('[ResearchCycle] Failed to insert probabilities:', probError);
        await supabase.from('experiments').delete().eq('id', experimentId);
        return { success: false, error: 'Failed to save probabilities: ' + probError.message };
      }
    }

    // Insert insights
    if (parsed.insights.length > 0) {
      const insightsToInsert = parsed.insights.map((insight: string) => ({
        experiment_id: experimentId,
        insight: insight,
        details: '' // Field exists in schema but not used in current implementation
      }));

      const { error: insError } = await supabase
        .from('insights')
        .insert(insightsToInsert as any);

      if (insError) {
        console.error('[ResearchCycle] Failed to insert insights:', insError);
        // Don't fail on insights error, just log it
      }
    }

    // Insert next experiments
    if (parsed.nextExperiments && parsed.nextExperiments.length > 0) {
      const nextExperimentsToInsert = parsed.nextExperiments.map((description: string) => ({
        experiment_id: experimentId,
        description: description
      }));

      const { error: nextError } = await supabase
        .from('next_experiments')
        .insert(nextExperimentsToInsert as any);

      if (nextError) {
        console.error('[ResearchCycle] Failed to insert next_experiments:', nextError);
        // Don't fail on next_experiments error, just log it
      }
    }

    // Insert reflections (True Learning Loop - Phase 1)
    if (parsed.reflections && parsed.reflections.length > 0) {
      const reflectionsToInsert = parsed.reflections.map((reflection: any) => ({
        experiment_id: experimentId,
        reflection_type: reflection.type,
        content: reflection.content
      }));

      const { error: reflectionError } = await supabase
        .from('reflections')
        .insert(reflectionsToInsert as any);

      if (reflectionError) {
        console.error('[ResearchCycle] Failed to insert reflections:', reflectionError);
        // Don't fail on reflections error, just log it
      } else {
        console.log(`[ResearchCycle] Inserted ${parsed.reflections.length} reflections`);
      }
    }

    return {
      success: true,
      experimentId,
      title: parsed.title,
      hypothesesCount: parsed.hypotheses.length,
      insightsCount: parsed.insights.length,
      nextExperimentsCount: parsed.nextExperiments?.length || 0,
      reflectionsCount: parsed.reflections?.length || 0
    };
  } catch (error) {
    console.error('[ResearchCycle] Error:', error);
    return {
      success: false,
      error: 'Failed to run research cycle: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

/**
 * Call Claude API with exponential backoff retry logic
 */
async function callClaudeWithRetry(
  anthropic: Anthropic,
  systemPrompt: string,
  userPrompt: string,
  config: Required<ResearchCycleConfig>,
  maxRetries: number = 3
): Promise<Anthropic.Messages.Message> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const isRetryable = isRetryableError(error);

      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError;
      }

      // Exponential backoff: 2s, 4s, 8s
      const delayMs = Math.pow(2, attempt + 1) * 1000;
      console.warn(`[ResearchCycle] Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Failed to call Claude API after retries');
}

/**
 * Check if error is retryable (network, rate limit, etc.)
 */
function isRetryableError(error: any): boolean {
  // Rate limit errors (429)
  if (error?.status === 429) return true;

  // Network errors
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') return true;

  // Server errors (5xx)
  if (error?.status >= 500 && error?.status < 600) return true;

  return false;
}
