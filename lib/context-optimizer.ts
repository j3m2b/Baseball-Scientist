/**
 * Context Optimizer - Intelligent memory compression for scaling to 100+ cycles
 * Part of Phase 5: Context Window Optimization
 */

import { supabaseServer } from '@/lib/supabase/server';

/**
 * Rough token estimation: 1 token ≈ 4 characters for English text
 * This is a conservative estimate for context budget calculations
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Time-tiered history compression
 * - Recent 10 cycles: Full detail (all hypotheses, probabilities, reflections)
 * - Cycles 11-30: Medium detail (key hypotheses, top teams, main reflections)
 * - Cycles 31+: Compressed (title, summary, top team, key learning only)
 *
 * Target token budget: ~15K tokens for all history
 */
export async function compressHistory(maxCycles: number = 100): Promise<{
  compressed: string;
  tokenCount: number;
  cyclesIncluded: number;
  compressionRatio: string;
}> {
  const supabase = supabaseServer;

  // Get all experiments up to maxCycles
  const { data: allExperiments } = await supabase
    .from('experiments')
    .select('id, experiment_number, title, summary, created_at')
    .order('experiment_number', { ascending: false })
    .limit(maxCycles);

  if (!allExperiments || allExperiments.length === 0) {
    return {
      compressed: 'No previous research cycles yet.',
      tokenCount: 7,
      cyclesIncluded: 0,
      compressionRatio: 'N/A'
    };
  }

  const totalCycles = allExperiments.length;
  let output = '### Previous Research Cycles (for reflection only):\n\n';

  // Recent 10 cycles: Full detail
  const recentCycles = allExperiments.slice(0, Math.min(10, totalCycles));
  const recentSection = await formatRecentCycles(recentCycles);
  output += recentSection;

  // Cycles 11-30: Medium detail
  if (totalCycles > 10) {
    const mediumCycles = allExperiments.slice(10, Math.min(30, totalCycles));
    const mediumSection = await formatMediumCycles(mediumCycles);
    output += mediumSection;
  }

  // Cycles 31+: Compressed
  if (totalCycles > 30) {
    const compressedCycles = allExperiments.slice(30);
    const compressedSection = await formatCompressedCycles(compressedCycles);
    output += compressedSection;
  }

  const tokenCount = estimateTokens(output);
  const originalEstimate = totalCycles * 200; // Rough estimate if all were full detail
  const compressionRatio = `${((1 - (tokenCount / originalEstimate)) * 100).toFixed(0)}%`;

  return {
    compressed: output,
    tokenCount,
    cyclesIncluded: totalCycles,
    compressionRatio
  };
}

/**
 * Format recent cycles with full detail
 * Target: ~150 tokens per cycle × 10 = ~1500 tokens
 */
async function formatRecentCycles(cycles: any[]): Promise<string> {
  const supabase = supabaseServer;
  let output = '';

  for (let i = 0; i < cycles.length; i++) {
    const exp = cycles[i];
    const cycleNumber = cycles.length - i;

    // Get hypotheses
    const { data: hyps } = await supabase
      .from('hypotheses')
      .select('hypothesis, is_validated, surprise_level')
      .eq('experiment_id', exp.id)
      .limit(8);

    // Get top 6 team probabilities
    const { data: probs } = await supabase
      .from('team_probabilities')
      .select('team_name, probability')
      .eq('experiment_id', exp.id)
      .order('rank', { ascending: true })
      .limit(6);

    // Get reflections
    const { data: reflections } = await supabase
      .from('reflections')
      .select('reflection_type, content')
      .eq('experiment_id', exp.id)
      .limit(3);

    output += `Cycle ${cycleNumber} (${new Date(exp.created_at).toLocaleDateString()}):\n`;
    output += `${exp.title}\n${exp.summary}\n`;

    if (hyps && hyps.length > 0) {
      const hypSummary = hyps.map((h: any) =>
        `${h.hypothesis} (${h.is_validated ? '✓' : '✗'}, Surprise ${h.surprise_level})`
      ).join('; ');
      output += `Key Hypotheses: ${hypSummary}\n`;
    }

    if (probs && probs.length > 0) {
      const probSummary = probs.map((p: any) => `${p.team_name} ${p.probability}%`).join(', ');
      output += `Top Teams: ${probSummary}\n`;
    }

    if (reflections && reflections.length > 0) {
      const learnedReflections = (reflections as any[]).filter((r: any) => r.reflection_type === 'learned');
      if (learnedReflections.length > 0) {
        output += `Learned: ${(learnedReflections[0] as any).content}\n`;
      }
    }

    output += '\n';
  }

  return output;
}

/**
 * Format medium cycles with moderate detail
 * Target: ~80 tokens per cycle × 20 = ~1600 tokens
 */
async function formatMediumCycles(cycles: any[]): Promise<string> {
  const supabase = supabaseServer;
  let output = '### Cycles 11-30 (Medium Detail):\n\n';

  for (const exp of cycles) {
    // Get top 3 hypotheses (most important ones)
    const { data: hyps } = await supabase
      .from('hypotheses')
      .select('hypothesis, is_validated')
      .eq('experiment_id', exp.id)
      .limit(3);

    // Get top 3 teams
    const { data: probs } = await supabase
      .from('team_probabilities')
      .select('team_name, probability')
      .eq('experiment_id', exp.id)
      .order('rank', { ascending: true })
      .limit(3);

    // Get one key reflection
    const { data: reflections } = await supabase
      .from('reflections')
      .select('content')
      .eq('experiment_id', exp.id)
      .eq('reflection_type', 'learned')
      .limit(1);

    output += `Cycle ${exp.experiment_number}: ${exp.title}. `;

    if (hyps && hyps.length > 0) {
      const validated = hyps.filter((h: any) => h.is_validated).length;
      output += `Validated ${validated}/${hyps.length} hypotheses. `;
    }

    if (probs && probs.length > 0) {
      const probsArray = probs as any[];
      output += `Top: ${probsArray[0].team_name} (${probsArray[0].probability}%). `;
    }

    if (reflections && reflections.length > 0) {
      const reflectionsArray = reflections as any[];
      output += `Learned: ${reflectionsArray[0].content}`;
    }

    output += '\n';
  }

  output += '\n';
  return output;
}

/**
 * Format old cycles with minimal detail (highly compressed)
 * Target: ~30 tokens per cycle × 70 = ~2100 tokens
 */
async function formatCompressedCycles(cycles: any[]): Promise<string> {
  const supabase = supabaseServer;
  let output = `### Cycles 31-${cycles[0].experiment_number} (Compressed Summary):\n\n`;

  // Group into batches of 10 for even more compression
  for (let i = 0; i < cycles.length; i += 10) {
    const batch = cycles.slice(i, i + 10);
    const batchStart = batch[batch.length - 1].experiment_number;
    const batchEnd = batch[0].experiment_number;

    // Get aggregate stats for this batch
    const experimentIds = batch.map((e: any) => e.id);

    const { data: stats } = await supabase
      .from('hypotheses')
      .select('is_validated')
      .in('experiment_id', experimentIds);

    const totalHyps = stats?.length || 0;
    const validated = stats?.filter((h: any) => h.is_validated).length || 0;
    const accuracy = totalHyps > 0 ? ((validated / totalHyps) * 100).toFixed(0) : 'N/A';

    // Get most common top team in this batch
    const { data: topTeams } = await supabase
      .from('team_probabilities')
      .select('team_name')
      .in('experiment_id', experimentIds)
      .eq('rank', 1);

    const teamCounts: Record<string, number> = {};
    topTeams?.forEach((t: any) => {
      teamCounts[t.team_name] = (teamCounts[t.team_name] || 0) + 1;
    });

    const mostCommonTeam = Object.keys(teamCounts).length > 0
      ? Object.entries(teamCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';

    output += `Cycles ${batchStart}-${batchEnd}: ${batch.length} experiments, ${accuracy}% validation accuracy, most predicted: ${mostCommonTeam}\n`;
  }

  output += '\n';
  return output;
}

/**
 * Check if context budget is within limits
 * Target: Keep total context under 50K tokens (out of 200K available)
 */
export function validateContextBudget(components: {
  systemPrompt: string;
  history: string;
  patterns: string;
  accuracy: string;
  adaptiveConfig: string;
  mlbData: string;
}): {
  isValid: boolean;
  totalTokens: number;
  breakdown: Record<string, number>;
  warning: string | null;
} {
  const breakdown = {
    systemPrompt: estimateTokens(components.systemPrompt),
    history: estimateTokens(components.history),
    patterns: estimateTokens(components.patterns),
    accuracy: estimateTokens(components.accuracy),
    adaptiveConfig: estimateTokens(components.adaptiveConfig),
    mlbData: estimateTokens(components.mlbData)
  };

  const totalTokens = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const targetBudget = 50000; // Conservative target to leave room for response
  const maxBudget = 150000; // Hard limit (leaving 50K for response)

  let warning = null;
  if (totalTokens > maxBudget) {
    warning = `Context exceeds hard limit! ${totalTokens} > ${maxBudget} tokens. Response may fail.`;
  } else if (totalTokens > targetBudget) {
    warning = `Context exceeds target budget. ${totalTokens} > ${targetBudget} tokens. Consider more aggressive compression.`;
  }

  return {
    isValid: totalTokens <= maxBudget,
    totalTokens,
    breakdown,
    warning
  };
}

/**
 * Get context statistics for monitoring
 */
export async function getContextStats(): Promise<{
  totalCycles: number;
  estimatedFullDetailTokens: number;
  compressedTokens: number;
  compressionRatio: string;
  projectedAt100Cycles: number;
}> {
  const supabase = supabaseServer;

  const { data: experiments, count } = await supabase
    .from('experiments')
    .select('*', { count: 'exact' });

  const totalCycles = count || 0;

  // Estimate full detail tokens (no compression)
  const estimatedFullDetailTokens = totalCycles * 200; // ~200 tokens per cycle if all full detail

  // Get actual compressed tokens
  const { compressed, tokenCount } = await compressHistory(100);
  const compressedTokens = tokenCount;

  const compressionRatio = estimatedFullDetailTokens > 0
    ? `${((1 - (compressedTokens / estimatedFullDetailTokens)) * 100).toFixed(0)}%`
    : '0%';

  // Project what it would be at 100 cycles
  const projectedAt100Cycles = totalCycles > 0
    ? Math.ceil((compressedTokens / totalCycles) * 100)
    : 0;

  return {
    totalCycles,
    estimatedFullDetailTokens,
    compressedTokens,
    compressionRatio,
    projectedAt100Cycles
  };
}
