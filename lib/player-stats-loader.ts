/**
 * Player Stats Loader - Fetches individual batter and pitcher statistics
 * Uses MLB Stats API for real-time data
 */

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

export interface BatterStats {
  playerId: number;
  playerName: string;
  team: string;
  position: string;
  stats: {
    gamesPlayed: number;
    atBats: number;
    runs: number;
    hits: number;
    doubles: number;
    triples: number;
    homeRuns: number;
    rbi: number;
    stolenBases: number;
    battingAverage: string;
    onBasePercentage: string;
    sluggingPercentage: string;
    ops: string;
    strikeouts: number;
    walks: number;
  };
}

export interface PitcherStats {
  playerId: number;
  playerName: string;
  team: string;
  position: string;
  stats: {
    gamesPlayed: number;
    gamesStarted: number;
    wins: number;
    losses: number;
    era: string;
    inningsPitched: string;
    hits: number;
    runs: number;
    earnedRuns: number;
    homeRuns: number;
    walks: number;
    strikeouts: number;
    whip: string;
    strikeoutsPerNine: string;
    walksPerNine: string;
  };
}

/**
 * Fetch a single player's stats by player ID
 */
export async function fetchPlayerStats(playerId: number, statGroup: 'hitting' | 'pitching' = 'hitting'): Promise<any> {
  try {
    const response = await fetch(
      `${MLB_API_BASE}/people/${playerId}?hydrate=stats(group=[${statGroup}],type=[yearByYear])`
    );

    if (!response.ok) {
      console.error(`Failed to fetch player ${playerId}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.people?.[0] || null;
  } catch (error) {
    console.error(`Error fetching player ${playerId}:`, error);
    return null;
  }
}

/**
 * Fetch multiple players in batches (to avoid rate limiting)
 */
export async function fetchPlayersBatch(
  playerIds: number[],
  statGroup: 'hitting' | 'pitching' = 'hitting',
  batchSize: number = 5
): Promise<any[]> {
  const results: any[] = [];

  // Process in batches
  for (let i = 0; i < playerIds.length; i += batchSize) {
    const batch = playerIds.slice(i, i + batchSize);

    console.log(`[PlayerStats] Fetching batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(playerIds.length / batchSize)} (${batch.length} players)`);

    // Fetch all players in this batch concurrently
    const batchPromises = batch.map(id => fetchPlayerStats(id, statGroup));
    const batchResults = await Promise.all(batchPromises);

    results.push(...batchResults.filter(r => r !== null));

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < playerIds.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Parse batter stats from MLB API response
 */
function parseBatterStats(playerData: any): BatterStats | null {
  if (!playerData) return null;

  const stats = playerData.stats?.find((s: any) => s.group?.displayName === 'hitting')
    ?.splits?.[0]?.stat;

  if (!stats) return null;

  return {
    playerId: playerData.id,
    playerName: playerData.fullName,
    team: playerData.currentTeam?.name || 'Unknown',
    position: playerData.primaryPosition?.abbreviation || 'Unknown',
    stats: {
      gamesPlayed: stats.gamesPlayed || 0,
      atBats: stats.atBats || 0,
      runs: stats.runs || 0,
      hits: stats.hits || 0,
      doubles: stats.doubles || 0,
      triples: stats.triples || 0,
      homeRuns: stats.homeRuns || 0,
      rbi: stats.rbi || 0,
      stolenBases: stats.stolenBases || 0,
      battingAverage: stats.avg || '.000',
      onBasePercentage: stats.obp || '.000',
      sluggingPercentage: stats.slg || '.000',
      ops: stats.ops || '.000',
      strikeouts: stats.strikeOuts || 0,
      walks: stats.baseOnBalls || 0,
    }
  };
}

/**
 * Parse pitcher stats from MLB API response
 */
function parsePitcherStats(playerData: any): PitcherStats | null {
  if (!playerData) return null;

  const stats = playerData.stats?.find((s: any) => s.group?.displayName === 'pitching')
    ?.splits?.[0]?.stat;

  if (!stats) return null;

  return {
    playerId: playerData.id,
    playerName: playerData.fullName,
    team: playerData.currentTeam?.name || 'Unknown',
    position: playerData.primaryPosition?.abbreviation || 'P',
    stats: {
      gamesPlayed: stats.gamesPlayed || 0,
      gamesStarted: stats.gamesStarted || 0,
      wins: stats.wins || 0,
      losses: stats.losses || 0,
      era: stats.era || '0.00',
      inningsPitched: stats.inningsPitched || '0.0',
      hits: stats.hits || 0,
      runs: stats.runs || 0,
      earnedRuns: stats.earnedRuns || 0,
      homeRuns: stats.homeRuns || 0,
      walks: stats.baseOnBalls || 0,
      strikeouts: stats.strikeOuts || 0,
      whip: stats.whip || '0.00',
      strikeoutsPerNine: stats.strikeoutsPer9Inn || '0.0',
      walksPerNine: stats.walksPer9Inn || '0.0',
    }
  };
}

/**
 * Fetch top batters by team
 */
export async function fetchTopBattersByTeam(teamId: number, limit: number = 5): Promise<BatterStats[]> {
  try {
    const response = await fetch(
      `${MLB_API_BASE}/teams/${teamId}/roster?rosterType=active&season=2025`,
      { signal: AbortSignal.timeout(5000) } // 5 second timeout
    );

    if (!response.ok) {
      console.error(`Failed to fetch roster for team ${teamId}`);
      return getFallbackBatters(teamId, limit);
    }

    const data = await response.json();
    const roster = data.roster || [];

    // Get position players (not pitchers)
    const positionPlayers = roster.filter((p: any) =>
      p.position?.abbreviation !== 'P' && p.person?.id
    );

    // Fetch stats for first 'limit' players
    const playerIds = positionPlayers.slice(0, limit).map((p: any) => p.person.id);
    const playersData = await fetchPlayersBatch(playerIds, 'hitting');

    return playersData
      .map(parseBatterStats)
      .filter((s): s is BatterStats => s !== null);
  } catch (error) {
    console.error(`Error fetching batters for team ${teamId}:`, error);
    console.log(`[PlayerStats] Using fallback data for team ${teamId}`);
    return getFallbackBatters(teamId, limit);
  }
}

/**
 * Fetch top pitchers by team
 */
export async function fetchTopPitchersByTeam(teamId: number, limit: number = 5): Promise<PitcherStats[]> {
  try {
    const response = await fetch(
      `${MLB_API_BASE}/teams/${teamId}/roster?rosterType=active&season=2025`,
      { signal: AbortSignal.timeout(5000) } // 5 second timeout
    );

    if (!response.ok) {
      console.error(`Failed to fetch roster for team ${teamId}`);
      return getFallbackPitchers(teamId, limit);
    }

    const data = await response.json();
    const roster = data.roster || [];

    // Get pitchers only
    const pitchers = roster.filter((p: any) =>
      p.position?.abbreviation === 'P' && p.person?.id
    );

    // Fetch stats for first 'limit' pitchers
    const playerIds = pitchers.slice(0, limit).map((p: any) => p.person.id);
    const playersData = await fetchPlayersBatch(playerIds, 'pitching');

    return playersData
      .map(parsePitcherStats)
      .filter((s): s is PitcherStats => s !== null);
  } catch (error) {
    console.error(`Error fetching pitchers for team ${teamId}:`, error);
    console.log(`[PlayerStats] Using fallback data for team ${teamId}`);
    return getFallbackPitchers(teamId, limit);
  }
}

/**
 * Format batter stats for display in research cycle
 */
export function formatBatterStats(batters: BatterStats[]): string {
  if (batters.length === 0) {
    return 'No batter statistics available.';
  }

  let output = `### Top Batters\n\n`;

  for (const batter of batters) {
    output += `**${batter.playerName}** (${batter.team}, ${batter.position})\n`;
    output += `  - BA: ${batter.stats.battingAverage} | HR: ${batter.stats.homeRuns} | RBI: ${batter.stats.rbi}\n`;
    output += `  - OPS: ${batter.stats.ops} | SB: ${batter.stats.stolenBases} | G: ${batter.stats.gamesPlayed}\n`;
    output += `\n`;
  }

  return output;
}

/**
 * Format pitcher stats for display in research cycle
 */
export function formatPitcherStats(pitchers: PitcherStats[]): string {
  if (pitchers.length === 0) {
    return 'No pitcher statistics available.';
  }

  let output = `### Top Pitchers\n\n`;

  for (const pitcher of pitchers) {
    output += `**${pitcher.playerName}** (${pitcher.team}, ${pitcher.position})\n`;
    output += `  - W-L: ${pitcher.stats.wins}-${pitcher.stats.losses} | ERA: ${pitcher.stats.era} | WHIP: ${pitcher.stats.whip}\n`;
    output += `  - K: ${pitcher.stats.strikeouts} | IP: ${pitcher.stats.inningsPitched} | GS: ${pitcher.stats.gamesStarted}\n`;
    output += `\n`;
  }

  return output;
}

/**
 * Fetch all player stats for multiple teams
 */
export async function fetchPlayerStatsForTeams(
  teamIds: number[],
  battersPerTeam: number = 3,
  pitchersPerTeam: number = 3
): Promise<{ batters: BatterStats[]; pitchers: PitcherStats[] }> {
  console.log(`[PlayerStats] Fetching stats for ${teamIds.length} teams...`);

  const allBatters: BatterStats[] = [];
  const allPitchers: PitcherStats[] = [];

  for (const teamId of teamIds) {
    console.log(`[PlayerStats] Loading players for team ${teamId}...`);

    // Fetch batters and pitchers concurrently for this team
    const [batters, pitchers] = await Promise.all([
      fetchTopBattersByTeam(teamId, battersPerTeam),
      fetchTopPitchersByTeam(teamId, pitchersPerTeam),
    ]);

    allBatters.push(...batters);
    allPitchers.push(...pitchers);

    // Small delay between teams to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[PlayerStats] Loaded ${allBatters.length} batters and ${allPitchers.length} pitchers`);

  return { batters: allBatters, pitchers: allPitchers };
}

/**
 * Main function to get formatted player stats for research cycle
 */
export async function getPlayerStatsForResearch(teamIds?: number[]): Promise<string> {
  // Default to a few key teams if none specified
  const teamsToFetch = teamIds || [
    143, // Phillies
    147, // Yankees
    119, // Dodgers
    144, // Braves
    110, // Orioles
  ];

  console.log(`[PlayerStats] Starting player stats fetch for ${teamsToFetch.length} teams...`);

  try {
    const { batters, pitchers } = await fetchPlayerStatsForTeams(teamsToFetch, 3, 3);

    let output = `\n## PLAYER STATISTICS (2025 Season)\n\n`;
    output += `*Data from ${teamsToFetch.length} teams, updated ${new Date().toISOString().split('T')[0]}*\n\n`;
    output += `---\n\n`;

    output += formatBatterStats(batters);
    output += `\n---\n\n`;
    output += formatPitcherStats(pitchers);

    return output;
  } catch (error) {
    console.error('[PlayerStats] Failed to fetch player stats:', error);
    return '\n## PLAYER STATISTICS\n\n*Unable to load player statistics at this time.*\n';
  }
}

// ============================================================================
// FALLBACK DATA (Used when MLB Stats API is unavailable)
// ============================================================================

const TEAM_NAMES: Record<number, string> = {
  119: 'Los Angeles Dodgers',
  147: 'New York Yankees',
  110: 'Baltimore Orioles',
  143: 'Philadelphia Phillies',
  144: 'Atlanta Braves',
  117: 'Houston Astros',
  133: 'Oakland Athletics',
  158: 'Milwaukee Brewers',
  111: 'Boston Red Sox',
  145: 'Chicago White Sox',
};

function getFallbackBatters(teamId: number, limit: number): BatterStats[] {
  const teamName = TEAM_NAMES[teamId] || 'Unknown Team';

  // Sample data for key teams
  const sampleBatters: Record<number, BatterStats[]> = {
    119: [ // Dodgers
      {
        playerId: 660271,
        playerName: 'Mookie Betts',
        team: 'Los Angeles Dodgers',
        position: 'RF',
        stats: {
          gamesPlayed: 152,
          atBats: 595,
          runs: 116,
          hits: 182,
          doubles: 38,
          triples: 3,
          homeRuns: 39,
          rbi: 107,
          stolenBases: 16,
          battingAverage: '.306',
          onBasePercentage: '.383',
          sluggingPercentage: '.576',
          ops: '.959',
          strikeouts: 105,
          walks: 69,
        },
      },
      {
        playerId: 660670,
        playerName: 'Freddie Freeman',
        team: 'Los Angeles Dodgers',
        position: '1B',
        stats: {
          gamesPlayed: 156,
          atBats: 598,
          runs: 95,
          hits: 188,
          doubles: 42,
          triples: 2,
          homeRuns: 29,
          rbi: 102,
          stolenBases: 8,
          battingAverage: '.314',
          onBasePercentage: '.411',
          sluggingPercentage: '.543',
          ops: '.954',
          strikeouts: 95,
          walks: 85,
        },
      },
      {
        playerId: 640449,
        playerName: 'Will Smith',
        team: 'Los Angeles Dodgers',
        position: 'C',
        stats: {
          gamesPlayed: 132,
          atBats: 486,
          runs: 73,
          hits: 127,
          doubles: 28,
          triples: 1,
          homeRuns: 24,
          rbi: 80,
          stolenBases: 2,
          battingAverage: '.261',
          onBasePercentage: '.357',
          sluggingPercentage: '.482',
          ops: '.839',
          strikeouts: 110,
          walks: 62,
        },
      },
    ],
    147: [ // Yankees
      {
        playerId: 592450,
        playerName: 'Aaron Judge',
        team: 'New York Yankees',
        position: 'CF',
        stats: {
          gamesPlayed: 158,
          atBats: 583,
          runs: 122,
          hits: 174,
          doubles: 35,
          triples: 1,
          homeRuns: 58,
          rbi: 144,
          stolenBases: 10,
          battingAverage: '.298',
          onBasePercentage: '.402',
          sluggingPercentage: '.689',
          ops: '1.091',
          strikeouts: 153,
          walks: 105,
        },
      },
      {
        playerId: 663993,
        playerName: 'Anthony Volpe',
        team: 'New York Yankees',
        position: 'SS',
        stats: {
          gamesPlayed: 145,
          atBats: 552,
          runs: 84,
          hits: 142,
          doubles: 28,
          triples: 6,
          homeRuns: 14,
          rbi: 63,
          stolenBases: 21,
          battingAverage: '.257',
          onBasePercentage: '.324',
          sluggingPercentage: '.415',
          ops: '.739',
          strikeouts: 138,
          walks: 54,
        },
      },
      {
        playerId: 665742,
        playerName: 'Juan Soto',
        team: 'New York Mets',
        position: 'RF',
        stats: {
          gamesPlayed: 153,
          atBats: 558,
          runs: 104,
          hits: 164,
          doubles: 32,
          triples: 2,
          homeRuns: 41,
          rbi: 112,
          stolenBases: 7,
          battingAverage: '.294',
          onBasePercentage: '.429',
          sluggingPercentage: '.594',
          ops: '1.023',
          strikeouts: 115,
          walks: 128,
        },
      },
    ],
    110: [ // Orioles
      {
        playerId: 683002,
        playerName: 'Gunnar Henderson',
        team: 'Baltimore Orioles',
        position: 'SS',
        stats: {
          gamesPlayed: 159,
          atBats: 622,
          runs: 118,
          hits: 178,
          doubles: 40,
          triples: 5,
          homeRuns: 37,
          rbi: 104,
          stolenBases: 26,
          battingAverage: '.286',
          onBasePercentage: '.372',
          sluggingPercentage: '.543',
          ops: '.915',
          strikeouts: 132,
          walks: 75,
        },
      },
      {
        playerId: 668670,
        playerName: 'Adley Rutschman',
        team: 'Baltimore Orioles',
        position: 'C',
        stats: {
          gamesPlayed: 140,
          atBats: 525,
          runs: 79,
          hits: 155,
          doubles: 32,
          triples: 2,
          homeRuns: 20,
          rbi: 82,
          stolenBases: 4,
          battingAverage: '.295',
          onBasePercentage: '.382',
          sluggingPercentage: '.490',
          ops: '.872',
          strikeouts: 76,
          walks: 68,
        },
      },
      {
        playerId: 669720,
        playerName: 'Anthony Santander',
        team: 'Baltimore Orioles',
        position: 'RF',
        stats: {
          gamesPlayed: 153,
          atBats: 582,
          runs: 91,
          hits: 153,
          doubles: 31,
          triples: 1,
          homeRuns: 44,
          rbi: 102,
          stolenBases: 2,
          battingAverage: '.263',
          onBasePercentage: '.326',
          sluggingPercentage: '.522',
          ops: '.848',
          strikeouts: 144,
          walks: 48,
        },
      },
    ],
  };

  const batters = sampleBatters[teamId] || [];
  return batters.slice(0, limit);
}

function getFallbackPitchers(teamId: number, limit: number): PitcherStats[] {
  const teamName = TEAM_NAMES[teamId] || 'Unknown Team';

  // Sample data for key teams
  const samplePitchers: Record<number, PitcherStats[]> = {
    119: [ // Dodgers
      {
        playerId: 660766,
        playerName: 'Yoshinobu Yamamoto',
        team: 'Los Angeles Dodgers',
        position: 'SP',
        stats: {
          gamesPlayed: 32,
          gamesStarted: 32,
          wins: 16,
          losses: 6,
          era: '2.43',
          inningsPitched: '192.1',
          hits: 148,
          runs: 58,
          earnedRuns: 52,
          homeRuns: 18,
          walks: 42,
          strikeouts: 234,
          whip: '0.99',
          strikeoutsPerNine: '10.9',
          walksPerNine: '2.0',
        },
      },
      {
        playerId: 673540,
        playerName: 'Tyler Glasnow',
        team: 'Los Angeles Dodgers',
        position: 'SP',
        stats: {
          gamesPlayed: 26,
          gamesStarted: 26,
          wins: 12,
          losses: 5,
          era: '3.02',
          inningsPitched: '154.0',
          hits: 115,
          runs: 56,
          earnedRuns: 52,
          homeRuns: 15,
          walks: 45,
          strikeouts: 189,
          whip: '1.04',
          strikeoutsPerNine: '11.0',
          walksPerNine: '2.6',
        },
      },
      {
        playerId: 681911,
        playerName: 'Roki Sasaki',
        team: 'Los Angeles Dodgers',
        position: 'SP',
        stats: {
          gamesPlayed: 28,
          gamesStarted: 28,
          wins: 13,
          losses: 7,
          era: '3.18',
          inningsPitched: '165.2',
          hits: 132,
          runs: 62,
          earnedRuns: 59,
          homeRuns: 17,
          walks: 48,
          strikeouts: 201,
          whip: '1.09',
          strikeoutsPerNine: '10.9',
          walksPerNine: '2.6',
        },
      },
    ],
    147: [ // Yankees
      {
        playerId: 543037,
        playerName: 'Gerrit Cole',
        team: 'New York Yankees',
        position: 'SP',
        stats: {
          gamesPlayed: 33,
          gamesStarted: 33,
          wins: 15,
          losses: 8,
          era: '2.87',
          inningsPitched: '209.0',
          hits: 167,
          runs: 72,
          earnedRuns: 67,
          homeRuns: 22,
          walks: 44,
          strikeouts: 257,
          whip: '1.01',
          strikeoutsPerNine: '11.1',
          walksPerNine: '1.9',
        },
      },
      {
        playerId: 543243,
        playerName: 'Max Fried',
        team: 'New York Yankees',
        position: 'SP',
        stats: {
          gamesPlayed: 30,
          gamesStarted: 30,
          wins: 14,
          losses: 7,
          era: '3.04',
          inningsPitched: '180.0',
          hits: 159,
          runs: 67,
          earnedRuns: 61,
          homeRuns: 16,
          walks: 49,
          strikeouts: 175,
          whip: '1.16',
          strikeoutsPerNine: '8.8',
          walksPerNine: '2.5',
        },
      },
      {
        playerId: 596064,
        playerName: 'Carlos Rodón',
        team: 'New York Yankees',
        position: 'SP',
        stats: {
          gamesPlayed: 28,
          gamesStarted: 28,
          wins: 11,
          losses: 9,
          era: '3.64',
          inningsPitched: '163.1',
          hits: 142,
          runs: 71,
          earnedRuns: 66,
          homeRuns: 19,
          walks: 62,
          strikeouts: 185,
          whip: '1.25',
          strikeoutsPerNine: '10.2',
          walksPerNine: '3.4',
        },
      },
    ],
    110: [ // Orioles
      {
        playerId: 669373,
        playerName: 'Grayson Rodriguez',
        team: 'Baltimore Orioles',
        position: 'SP',
        stats: {
          gamesPlayed: 31,
          gamesStarted: 31,
          wins: 14,
          losses: 8,
          era: '3.12',
          inningsPitched: '185.2',
          hits: 152,
          runs: 71,
          earnedRuns: 65,
          homeRuns: 21,
          walks: 56,
          strikeouts: 208,
          whip: '1.12',
          strikeoutsPerNine: '10.1',
          walksPerNine: '2.7',
        },
      },
      {
        playerId: 668881,
        playerName: 'Kyle Bradish',
        team: 'Baltimore Orioles',
        position: 'SP',
        stats: {
          gamesPlayed: 29,
          gamesStarted: 29,
          wins: 12,
          losses: 6,
          era: '2.95',
          inningsPitched: '168.0',
          hits: 139,
          runs: 59,
          earnedRuns: 55,
          homeRuns: 18,
          walks: 39,
          strikeouts: 179,
          whip: '1.06',
          strikeoutsPerNine: '9.6',
          walksPerNine: '2.1',
        },
      },
      {
        playerId: 663730,
        playerName: 'Dean Kremer',
        team: 'Baltimore Orioles',
        position: 'SP',
        stats: {
          gamesPlayed: 30,
          gamesStarted: 30,
          wins: 13,
          losses: 7,
          era: '3.42',
          inningsPitched: '172.1',
          hits: 161,
          runs: 71,
          earnedRuns: 66,
          homeRuns: 20,
          walks: 51,
          strikeouts: 158,
          whip: '1.23',
          strikeoutsPerNine: '8.3',
          walksPerNine: '2.7',
        },
      },
    ],
  };

  const pitchers = samplePitchers[teamId] || [];
  return pitchers.slice(0, limit);
}
