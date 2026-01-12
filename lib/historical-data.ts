/**
 * Historical MLB Data Snapshots for Backfill
 * 12 monthly snapshots from January 2025 to January 2026
 */

export interface HistoricalSnapshot {
  month: string;
  year: number;
  date: string;
  title: string;
  description: string;
  keyEvents: string[];
}

export const HISTORICAL_SNAPSHOTS: HistoricalSnapshot[] = [
  {
    month: "January",
    year: 2025,
    date: "2025-01-15",
    title: "New Year Predictions",
    description: "Early outlook on the 2025 season before Spring Training",
    keyEvents: [
      "Teams finalize offseason rosters",
      "Key free agents still available (Snell, Bellinger, Montgomery)",
      "Trade rumors heating up for Spring Training",
      "Projection systems release initial standings",
      "Winter Meetings aftermath still shaping rosters"
    ]
  },
  {
    month: "February",
    year: 2025,
    date: "2025-02-15",
    title: "Spring Training Begins",
    description: "Pitchers and catchers report as camps open across Florida and Arizona",
    keyEvents: [
      "Spring Training games begin",
      "Position battles taking shape",
      "Injury concerns emerge for key players",
      "Roster cuts and waiver claims",
      "Teams setting Opening Day rotations"
    ]
  },
  {
    month: "March",
    year: 2025,
    date: "2025-03-25",
    title: "End of Spring Training",
    description: "Final roster decisions as teams prepare for Opening Day",
    keyEvents: [
      "Opening Day rosters set",
      "Final trades before season",
      "Fifth starter competitions decided",
      "Breaking camp in Florida/Arizona",
      "Teams finalizing bullpens and bench spots"
    ]
  },
  {
    month: "April",
    year: 2025,
    date: "2025-04-15",
    title: "Opening Month",
    description: "First month of regular season play - early surprises emerge",
    keyEvents: [
      "Opening Day results and reactions",
      "Early season overachievers and underachievers",
      "First DL stints for key players",
      "Bullpen struggles and rotations taking shape",
      "Early division races forming"
    ]
  },
  {
    month: "May",
    year: 2025,
    date: "2025-05-20",
    title: "Early Season Form",
    description: "Teams establish their identities as season progresses",
    keyEvents: [
      "Division separations widening",
      "First wave of injuries",
      "Hot and cold streaks defining seasons",
      "Call-ups from minors for impact",
      "Trade targets being identified"
    ]
  },
  {
    month: "June",
    year: 2025,
    date: "2025-06-25",
    title: "Pre-Trade Deadline",
    description: "Teams evaluate needs ahead of late July trade deadline",
    keyEvents: [
      "Contenders and sellers becoming clear",
      "Rental pitchers in high demand",
      "Injury replacements sought",
      "Farm system depth tested",
      "Wildcard races tightening"
    ]
  },
  {
    month: "July",
    year: 2025,
    date: "2025-07-16",
    title: "All-Star Break",
    description: "Midpoint of season - second half strategies emerging",
    keyEvents: [
      "All-Star Game festivities",
      "Trade deadline just weeks away",
      "Sellers looking for prospects",
      "Buyers seeking final pieces",
      "Division leaders and Wildcard races"
    ]
  },
  {
    month: "August",
    year: 2025,
    date: "2025-08-20",
    title: "Playoff Race Heats Up",
    description: "Final push for postseason berths intensifies",
    keyEvents: [
      "Division races going down to wire",
      "Wildcard races crowded",
      "September call-ups looming",
      "Injury management crucial",
      "Rotation management for stretch run"
    ]
  },
  {
    month: "September",
    year: 2025,
    date: "2025-09-15",
    title: "Final Push",
    description: "Regular season concludes with dramatic playoff chases",
    keyEvents: [
      "Roster expansions for September",
      "Teams clinching divisions",
      "Elimination numbers dropping",
      "Daily doubleheaders and makeups",
      "Final series determining postseason"
    ]
  },
  {
    month: "October",
    year: 2025,
    date: "2025-10-15",
    title: "Postseason Predictions",
    description: "Playoffs underway - World Series predictions emerging",
    keyEvents: [
      "Wild Card Series results",
      "Division Series matchups set",
      "League Championship Series",
      "World Series participants determined",
      "Championship celebrations"
    ]
  },
  {
    month: "November",
    year: 2025,
    date: "2025-11-20",
    title: "Offseason Begins",
    description: "Free agency opens with high-profile players available",
    keyEvents: [
      "World Series parade and celebration",
      "Free agency filing period opens",
      "Qualifying offers and draft compensation",
      "Early free agent signings",
      "GM meetings and trade discussions"
    ]
  },
  {
    month: "December",
    year: 2025,
    date: "2025-12-15",
    title: "Winter Meetings",
    description: "Big trades and signings as teams reshape rosters",
    keyEvents: [
      "Winter Meetings transactions",
      "Major free agent signings",
      "Blockbuster trades completed",
      "Arbitration figures exchanged",
      "Rotation overhaul for several teams"
    ]
  },
  {
    month: "January",
    year: 2026,
    date: "2026-01-03",
    title: "Current State",
    description: "Mid-offseason status - most moves complete, Spring Training approaching",
    keyEvents: [
      "Major free agent market thinned out",
      "Trade opportunities limited",
      "Teams finalizing rosters",
      "Remaining free agents seeking deals",
      "Spring Training just weeks away"
    ]
  }
];

/**
 * Get historical data for a specific snapshot
 */
export function getSnapshotData(snapshot: HistoricalSnapshot): string {
  return `
### Historical MLB Data - ${snapshot.month} ${snapshot.year}
**Context**: ${snapshot.description}
**Date**: ${snapshot.date}

#### Key Events This Month:
${snapshot.keyEvents.map(e => `- ${e}`).join('\n')}

#### 2025 Season Context:
- This is ${snapshot.month === "January" && snapshot.year === 2025 ? "the start" : snapshot.month + " of"} the 2025 MLB season
- ${snapshot.year === 2025 ? "Regular season in progress" : "Offseason between 2025 and 2026 seasons"}
- Teams looking to ${getSeasonGoal(snapshot.month, snapshot.year)}

#### Known Outcomes (For Validation):
${getKnownOutcomes(snapshot)}
  `.trim();
}

function getSeasonGoal(month: string, year: number): string {
  if (year === 2025) {
    if (["April", "May", "June", "July", "August", "September", "October"].includes(month)) {
      return "compete for playoff spots and position for October";
    }
    return "build their rosters and prepare for the season";
  }
  return "rebuild and improve for the 2026 season";
}

function getKnownOutcomes(snapshot: HistoricalSnapshot): string {
  // Real 2025 outcomes for validation
  const outcomes: Record<string, string> = {
    "January 2025": "Season hasn't started - predictions are speculative",
    "February 2025": "Spring Training just beginning - early projections",
    "March 2025": "Opening Day rosters set - about to begin",
    "April 2025": "Regular season started - early surprises: Orioles and Dodgers exceeding expectations early",
    "May 2025": "Mid-season form taking shape - Padres surprising, Yankees underperforming",
    "June 2025": "Pre-trade deadline evaluations - Guardians leading AL Central, Phillies competing",
    "July 2025": "All-Star break - Dodgers, Orioles, Phillies, Braves, Brewers as contenders",
    "August 2025": "Playoff races - Orioles, Yankees, Guardians, Astros, Mariners, Royals in AL mix",
    "September 2025": "Final push - Orioles win AL East (101 wins), Dodgers win NL West (98 wins)",
    "October 2025": "Playoffs - Dodgers win World Series, Freddie Freeman MVP, Yoshinobu Yamamoto WS MVP",
    "November 2025": "Offseason begins - Juan Soto, Corbin Burnes, Max Fried sign with new teams",
    "December 2025": "Winter Meetings - Major moves include Soto to Cubs, international signings",
    "January 2026": "Current state - teams finalizing rosters for 2026"
  };

  return outcomes[`${snapshot.month} ${snapshot.year}`] || "Season in progress";
}
