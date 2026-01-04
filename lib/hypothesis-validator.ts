/**
 * Hypothesis Auto-Validator
 * Automatically validates old hypotheses by having Claude examine current data
 * and determine if past predictions came true
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from '@/lib/supabase/server';
import { fetchMLBData } from '@/lib/mlb-data-fetcher';

export interface ValidationResult {
  hypothesisId: string;
  hypothesis: string;
  actualOutcome: boolean;
  evidence: string;
  outcomeDate: string;
}

/**
 * Validates old hypotheses that haven't been validated yet
 * @param maxHypothesesToValidate Maximum number of hypotheses to validate per cycle (default: 5)
 * @returns Array of validation results
 */
export async function autoValidateHypotheses(
  maxHypothesesToValidate: number = 5
): Promise<ValidationResult[]> {
  const supabase = supabaseServer;

  try {
    // Find hypotheses that need validation:
    // 1. At least 30 days old (enough time has passed)
    // 2. Not already validated (no entry in prediction_outcomes)
    // 3. From experiments where is_validated = true (Claude marked them as testable)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await supabase
      .from('hypotheses')
      .select(`
        id,
        hypothesis,
        surprise_level,
        created_at,
        experiments!inner (
          id,
          experiment_number,
          title,
          created_at
        )
      `)
      .eq('is_validated', true)
      .lt('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })
      .limit(maxHypothesesToValidate * 2); // Fetch more, filter later

    const hypotheses = result.data as any[] | null;
    const fetchError = result.error;

    if (fetchError || !hypotheses || hypotheses.length === 0) {
      console.log('[HypothesisValidator] No old hypotheses found for validation');
      return [];
    }

    // Filter out hypotheses that already have outcomes
    const hypothesisIds = hypotheses.map((h: any) => h.id);
    const { data: existingOutcomes } = await supabase
      .from('prediction_outcomes')
      .select('hypothesis_id')
      .in('hypothesis_id', hypothesisIds);

    const validatedIds = new Set((existingOutcomes as any[] || []).map((o: any) => o.hypothesis_id));
    const unvalidatedHypotheses = (hypotheses as any[]).filter((h: any) => !validatedIds.has(h.id));

    if (unvalidatedHypotheses.length === 0) {
      console.log('[HypothesisValidator] All old hypotheses already validated');
      return [];
    }

    // Limit to max hypotheses to validate this cycle
    const toValidate = unvalidatedHypotheses.slice(0, maxHypothesesToValidate);
    console.log(`[HypothesisValidator] Validating ${toValidate.length} hypotheses...`);

    // Fetch current MLB data for validation
    const currentMLBData = await fetchMLBData();

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.ANTHROPIC_BASE_URL,
    });

    const results: ValidationResult[] = [];

    // Validate each hypothesis
    for (const hyp of toValidate) {
      try {
        const validationPrompt = buildValidationPrompt(hyp, currentMLBData);

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1000,
          temperature: 0.3, // Lower temperature for more factual validation
          messages: [
            {
              role: 'user',
              content: validationPrompt
            }
          ]
        });

        const validationText = response.content[0].type === 'text'
          ? response.content[0].text
          : '';

        // Parse Claude's validation response
        const parsed = parseValidationResponse(validationText);

        if (parsed) {
          // Save to database
          await supabase
            .from('prediction_outcomes')
            .insert({
              hypothesis_id: hyp.id,
              actual_outcome: parsed.outcome,
              outcome_date: parsed.outcomeDate,
              evidence: parsed.evidence
            } as any);

          results.push({
            hypothesisId: hyp.id,
            hypothesis: hyp.hypothesis,
            actualOutcome: parsed.outcome,
            evidence: parsed.evidence,
            outcomeDate: parsed.outcomeDate
          });

          console.log(`[HypothesisValidator] ✓ Validated: "${hyp.hypothesis.substring(0, 60)}..." → ${parsed.outcome ? 'TRUE' : 'FALSE'}`);
        }
      } catch (error) {
        console.error(`[HypothesisValidator] Error validating hypothesis ${hyp.id}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('[HypothesisValidator] Error in auto-validation:', error);
    return [];
  }
}

/**
 * Builds the validation prompt for Claude
 */
function buildValidationPrompt(hypothesis: any, currentMLBData: string): string {
  const hypText = hypothesis.hypothesis;
  const createdDate = new Date(hypothesis.created_at).toLocaleDateString();
  const experimentInfo = (hypothesis as any).experiments;

  return `You are validating a baseball hypothesis that was made on ${createdDate} (Experiment #${experimentInfo.experiment_number}: "${experimentInfo.title}").

**HYPOTHESIS TO VALIDATE:**
"${hypText}"

**CURRENT MLB DATA (for validation):**
${currentMLBData}

**YOUR TASK:**
Analyze the current data and determine if this hypothesis has come true or been invalidated.

**RESPONSE FORMAT (you MUST use this exact format):**
OUTCOME: [TRUE or FALSE]
DATE: [YYYY-MM-DD when the outcome was determined]
EVIDENCE: [2-3 sentence explanation of why the hypothesis came true or was invalidated, citing specific data]

**VALIDATION GUIDELINES:**
1. TRUE = hypothesis was validated by events/data
2. FALSE = hypothesis was invalidated or disproven
3. If there's insufficient data to determine the outcome yet, respond with "INSUFFICIENT_DATA" for OUTCOME
4. Be objective and evidence-based
5. Use today's date (${new Date().toISOString().split('T')[0]}) as DATE if determining outcome now
6. If the hypothesis references a specific date/timeframe that hasn't arrived yet, use "INSUFFICIENT_DATA"

Begin your validation:`;
}

/**
 * Parses Claude's validation response
 */
function parseValidationResponse(text: string): { outcome: boolean; outcomeDate: string; evidence: string } | null {
  try {
    // Check for insufficient data
    if (text.includes('INSUFFICIENT_DATA')) {
      return null;
    }

    // Extract OUTCOME
    const outcomeMatch = text.match(/OUTCOME:\s*(TRUE|FALSE)/i);
    if (!outcomeMatch) return null;
    const outcome = outcomeMatch[1].toUpperCase() === 'TRUE';

    // Extract DATE
    const dateMatch = text.match(/DATE:\s*(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) return null;
    const outcomeDate = dateMatch[1];

    // Extract EVIDENCE
    const evidenceMatch = text.match(/EVIDENCE:\s*([\s\S]+?)(?:\n\n|\n$|$)/);
    if (!evidenceMatch) return null;
    const evidence = evidenceMatch[1].trim();

    return { outcome, outcomeDate, evidence };
  } catch (error) {
    console.error('[HypothesisValidator] Error parsing validation response:', error);
    return null;
  }
}
