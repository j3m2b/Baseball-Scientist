/**
 * Team Outcomes Auto-Validator
 * Automatically validates team probability predictions by checking actual playoff/WS results
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from '@/lib/supabase/server';
import { fetchMLBData } from '@/lib/mlb-data-fetcher';

export interface TeamOutcomeResult {
  experimentId: string;
  teamCode: string;
  teamName: string;
  predictedProbability: number;
  actualResult: 'won_ws' | 'made_ws' | 'made_playoffs' | 'missed_playoffs';
  resultDate: string;
}

/**
 * Auto-validates team probability predictions by checking actual season results
 * @param maxExperimentsToCheck Maximum number of experiments to check per cycle (default: 3)
 * @returns Array of team outcome results
 */
export async function autoValidateTeamOutcomes(
  maxExperimentsToCheck: number = 3
): Promise<TeamOutcomeResult[]> {
  const supabase = supabaseServer;

  try {
    // Find experiments with team probabilities that don't have outcomes yet
    // Focus on experiments from previous seasons (at least 6 months old)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: experiments, error: expError } = await supabase
      .from('experiments')
      .select(`
        id,
        experiment_number,
        title,
        created_at,
        team_probabilities (
          team_code,
          team_name,
          probability
        )
      `)
      .lt('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(maxExperimentsToCheck * 3); // Fetch more, filter later

    if (expError || !experiments || experiments.length === 0) {
      console.log('[TeamOutcomesValidator] No old experiments found for validation');
      return [];
    }

    // Filter experiments that have team probabilities but no outcomes
    const experimentsWithProbabilities = experiments.filter(
      exp => (exp as any).team_probabilities && (exp as any).team_probabilities.length > 0
    );

    if (experimentsWithProbabilities.length === 0) {
      console.log('[TeamOutcomesValidator] No experiments with team probabilities found');
      return [];
    }

    // Check which experiments already have outcomes
    const experimentIds = experimentsWithProbabilities.map(e => e.id);
    const { data: existingOutcomes } = await supabase
      .from('probability_accuracy')
      .select('experiment_id, team_code')
      .in('experiment_id', experimentIds);

    // Build a set of experiment_id + team_code combinations that already have outcomes
    const validatedSet = new Set(
      existingOutcomes?.map(o => `${o.experiment_id}:${o.team_code}`) || []
    );

    // Find experiments that need validation
    const needsValidation: Array<{
      experimentId: string;
      experimentNumber: number;
      experimentTitle: string;
      experimentDate: string;
      teams: Array<{ code: string; name: string; probability: number }>;
    }> = [];

    for (const exp of experimentsWithProbabilities) {
      const teams = (exp as any).team_probabilities;
      const unvalidatedTeams = teams.filter(
        (t: any) => !validatedSet.has(`${exp.id}:${t.team_code}`)
      );

      if (unvalidatedTeams.length > 0) {
        needsValidation.push({
          experimentId: exp.id,
          experimentNumber: exp.experiment_number,
          experimentTitle: exp.title,
          experimentDate: new Date(exp.created_at).toLocaleDateString(),
          teams: unvalidatedTeams.map((t: any) => ({
            code: t.team_code,
            name: t.team_name,
            probability: t.probability
          }))
        });
      }
    }

    if (needsValidation.length === 0) {
      console.log('[TeamOutcomesValidator] All team probabilities already validated');
      return [];
    }

    // Limit to max experiments to validate this cycle
    const toValidate = needsValidation.slice(0, maxExperimentsToCheck);
    console.log(`[TeamOutcomesValidator] Validating ${toValidate.length} experiments with team outcomes...`);

    // Fetch current MLB data for validation
    const currentMLBData = await fetchMLBData();

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.ANTHROPIC_BASE_URL,
    });

    const results: TeamOutcomeResult[] = [];

    // Validate each experiment's team outcomes
    for (const exp of toValidate) {
      try {
        const validationPrompt = buildTeamValidationPrompt(exp, currentMLBData);

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 2000,
          temperature: 0.3, // Lower temperature for factual validation
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
        const parsed = parseTeamValidationResponse(validationText, exp.teams);

        if (parsed && parsed.length > 0) {
          // Save to database
          for (const outcome of parsed) {
            await supabase
              .from('probability_accuracy')
              .insert({
                experiment_id: exp.experimentId,
                team_code: outcome.teamCode,
                team_name: outcome.teamName,
                predicted_probability: outcome.predictedProbability,
                actual_result: outcome.actualResult,
                result_date: outcome.resultDate
              });

            results.push({
              experimentId: exp.experimentId,
              teamCode: outcome.teamCode,
              teamName: outcome.teamName,
              predictedProbability: outcome.predictedProbability,
              actualResult: outcome.actualResult,
              resultDate: outcome.resultDate
            });

            console.log(`[TeamOutcomesValidator] ✓ Validated: ${outcome.teamName} → ${outcome.actualResult.toUpperCase()}`);
          }
        }
      } catch (error) {
        console.error(`[TeamOutcomesValidator] Error validating experiment ${exp.experimentId}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('[TeamOutcomesValidator] Error in auto-validation:', error);
    return [];
  }
}

/**
 * Builds the validation prompt for team outcomes
 */
function buildTeamValidationPrompt(
  experiment: {
    experimentNumber: number;
    experimentTitle: string;
    experimentDate: string;
    teams: Array<{ code: string; name: string; probability: number }>;
  },
  currentMLBData: string
): string {
  const teamsList = experiment.teams
    .map(t => `- ${t.name} (${t.code}): ${t.probability}% chance to win World Series`)
    .join('\n');

  return `You are validating team World Series probability predictions from an experiment conducted on ${experiment.experimentDate} (Experiment #${experiment.experimentNumber}: "${experiment.experimentTitle}").

**TEAM PREDICTIONS TO VALIDATE:**
${teamsList}

**CURRENT MLB DATA (for validation):**
${currentMLBData}

**YOUR TASK:**
For each team, determine their actual result for that season:
- won_ws: Won the World Series
- made_ws: Made the World Series but lost
- made_playoffs: Made the playoffs but didn't make WS
- missed_playoffs: Did not make the playoffs

**RESPONSE FORMAT (you MUST use this exact format for EACH team):**
TEAM: [team code]
RESULT: [won_ws, made_ws, made_playoffs, or missed_playoffs]
DATE: [YYYY-MM-DD when the result was finalized - use playoff end date for playoff results, or regular season end date]

(Repeat for each team)

**VALIDATION GUIDELINES:**
1. Use your knowledge of MLB history and the current data provided
2. The experiment date was ${experiment.experimentDate} - determine which season this was predicting
3. If you cannot determine the outcome for a specific team (e.g., season hasn't concluded), skip that team
4. Be precise about which season you're validating (based on the experiment date)
5. For regular season end dates, use approximately October 1st of that year
6. For playoff results, use the actual date the playoffs/WS concluded

Begin your validation:`;
}

/**
 * Parses Claude's team validation response
 */
function parseTeamValidationResponse(
  text: string,
  teams: Array<{ code: string; name: string; probability: number }>
): Array<{
  teamCode: string;
  teamName: string;
  predictedProbability: number;
  actualResult: 'won_ws' | 'made_ws' | 'made_playoffs' | 'missed_playoffs';
  resultDate: string;
}> | null {
  try {
    const results: Array<{
      teamCode: string;
      teamName: string;
      predictedProbability: number;
      actualResult: 'won_ws' | 'made_ws' | 'made_playoffs' | 'missed_playoffs';
      resultDate: string;
    }> = [];

    // Create a map of team codes to team info
    const teamMap = new Map(teams.map(t => [t.code, t]));

    // Split into individual team validations
    const teamBlocks = text.split(/(?=TEAM:)/);

    for (const block of teamBlocks) {
      if (!block.trim()) continue;

      // Extract TEAM code
      const teamMatch = block.match(/TEAM:\s*([A-Z]{3})/i);
      if (!teamMatch) continue;
      const teamCode = teamMatch[1].toUpperCase();

      // Extract RESULT
      const resultMatch = block.match(/RESULT:\s*(won_ws|made_ws|made_playoffs|missed_playoffs)/i);
      if (!resultMatch) continue;
      const actualResult = resultMatch[1].toLowerCase() as 'won_ws' | 'made_ws' | 'made_playoffs' | 'missed_playoffs';

      // Extract DATE
      const dateMatch = block.match(/DATE:\s*(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) continue;
      const resultDate = dateMatch[1];

      // Get team info from map
      const teamInfo = teamMap.get(teamCode);
      if (!teamInfo) continue;

      results.push({
        teamCode,
        teamName: teamInfo.name,
        predictedProbability: teamInfo.probability,
        actualResult,
        resultDate
      });
    }

    return results.length > 0 ? results : null;
  } catch (error) {
    console.error('[TeamOutcomesValidator] Error parsing team validation response:', error);
    return null;
  }
}
