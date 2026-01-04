// MLB Stats API - Official free MLB data source
// https://github.com/StatsBeta/mlb-statsapi

export interface MLBTransaction {
  id: string;
  type: string; // 'Sign', 'Trade', 'Claim', 'Designation', etc.
  date: string;
  team: {
    id: number;
    name: string;
    abbreviation: string;
  };
  player?: {
    id: number;
    name: string;
    position?: string;
  };
  details?: string;
}

export interface MLBTeam {
  id: number;
  name: string;
  abbreviation: string;
  locationName: string;
}

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

// Fetch recent transactions across all teams
async function fetchRecentTransactions(daysBack = 30): Promise<MLBTransaction[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const transactions: MLBTransaction[] = [];

  // Fetch from all 30 teams
  const teamIds = Array.from({ length: 30 }, (_, i) => i + 133); // MLB team IDs start at 133

  for (const teamId of teamIds) {
    try {
      const response = await fetch(`${MLB_API_BASE}/teams/${teamId}/transactions`);
      const data = await response.json();

      if (data && data.transactions) {
        for (const tx of data.transactions) {
          const txDate = new Date(tx.transactionDate);
          if (txDate >= cutoffDate) {
            transactions.push({
              id: tx.id || `${teamId}-${txDate.getTime()}`,
              type: tx.typeCode?.description || tx.typeCode || 'Transaction',
              date: tx.transactionDate,
              team: {
                id: teamId,
                name: tx.team?.name || 'Unknown',
                abbreviation: tx.team?.abbreviation || '???'
              },
              player: tx.player ? {
                id: tx.player.id,
                name: tx.player.fullName,
                position: tx.player.primaryPosition?.abbreviation
              } : undefined,
              details: tx.description || tx.typeCode?.description || ''
            });
          }
        }
      }
    } catch (error) {
      console.error(`Failed to fetch transactions for team ${teamId}:`, error);
    }
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Get all teams
async function fetchTeams(): Promise<MLBTeam[]> {
  try {
    const response = await fetch(`${MLB_API_BASE}/teams?sportId=1`);
    const data = await response.json();
    return data.teams || [];
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return [];
  }
}

// Format transactions for the research prompt
function formatTransactionsForPrompt(transactions: MLBTransaction[]): string {
  if (transactions.length === 0) {
    return 'No recent transactions found in the specified period.';
  }

  // Group by type
  const signings = transactions.filter(t => t.type.toLowerCase().includes('sign'));
  const trades = transactions.filter(t => t.type.toLowerCase().includes('trade'));
  const claims = transactions.filter(t => t.type.toLowerCase().includes('claim'));
  const designations = transactions.filter(t => t.type.toLowerCase().includes('designation') || t.type.toLowerCase().includes('waiver'));
  const other = transactions.filter(t => !signings.includes(t) && !trades.includes(t) && !claims.includes(t) && !designations.includes(t));

  let output = `#### Recent MLB Transactions (Last 30 Days):\n\n`;

  if (signings.length > 0) {
    output += `**Free Agent Signings:**\n`;
    for (const tx of signings.slice(0, 20)) {
      output += `- ${tx.team.name} signed ${tx.player?.name || 'Player'} (${tx.player?.position || 'N/A'})${tx.details ? ` - ${tx.details}` : ''}\n`;
    }
    output += `\n`;
  }

  if (trades.length > 0) {
    output += `**Trades:**\n`;
    for (const tx of trades.slice(0, 15)) {
      output += `- ${tx.team.name}: ${tx.details || `${tx.player?.name || 'Player'} trade`}\n`;
    }
    output += `\n`;
  }

  if (claims.length > 0) {
    output += `**Waiver Claims:**\n`;
    for (const tx of claims.slice(0, 10)) {
      output += `- ${tx.team.name} claimed ${tx.player?.name || 'Player'}\n`;
    }
    output += `\n`;
  }

  if (designations.length > 0) {
    output += `**Roster Moves (Designations/Assignments):**\n`;
    for (const tx of designations.slice(0, 10)) {
      output += `- ${tx.team.name}: ${tx.details || tx.type}\n`;
    }
    output += `\n`;
  }

  return output;
}

// Main function to get current MLB data for research
export async function getCurrentMLBData(): Promise<string> {
  const transactions = await fetchRecentTransactions(30);
  const teams = await fetchTeams();

  let data = `### 2025-2026 MLB Offseason Data\n`;
  data += `**Data fetched: ${new Date().toISOString().split('T')[0]}**\n\n`;

  data += formatTransactionsForPrompt(transactions);

  // Add team count
  data += `\n**Note:** Analysis based on ${transactions.length} recent transactions across ${teams.length} MLB teams.\n`;

  return data;
}
