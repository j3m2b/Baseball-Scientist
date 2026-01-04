/**
 * Historical Backfill Types
 * "Time Travel Training" for Baseball Scientist
 */

export interface MLBDataSnapshot {
  date: string; // ISO date (e.g., "2025-04-01")
  cycleNumber: number; // 1-8
  description: string; // "Opening Day Predictions"
  gamesPlayed: number; // Games per team at this point
  keyEvents: string[]; // Major storylines since last cycle
  mlbData: string; // Full MLB data as it existed on this date
}

export interface ValidationOutcome {
  // What actually happened (to validate against)
  divisionWinners: {
    alEast: string;
    alCentral: string;
    alWest: string;
    nlEast: string;
    nlCentral: string;
    nlWest: string;
  };
  wildCardTeams: {
    al: string[];
    nl: string[];
  };
  playoffResults: {
    aldsWinners: string[];
    nldsWinners: string[];
    alcsWinner: string;
    nlcsWinner: string;
    worldSeriesWinner: string;
  };
  awards: {
    alMVP: string;
    nlMVP: string;
    alCyYoung: string;
    nlCyYoung: string;
    alRoy: string;
    nlRoy: string;
  };
  notablePlayerPerformance?: {
    player: string;
    team: string;
    stats: string;
    notable: string; // Why notable
  }[];
}

export interface BackfillCycleResult {
  cycleNumber: number;
  date: string;
  hypothesesGenerated: number;
  teamProbabilitiesGenerated: number;
  experimentId: string;
  success: boolean;
  error?: string;
}

export interface BackfillValidationResult {
  cycleNumber: number;
  hypothesesValidated: number;
  teamProbabilitiesValidated: number;
  accuracyRate: number;
  success: boolean;
  error?: string;
}
