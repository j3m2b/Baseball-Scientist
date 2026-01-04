// XML parsing utilities for Claude responses

// Team code mapping for MLB teams
export const TEAM_CODES: Record<string, string> = {
  'Diamondbacks': 'ARI',
  'Braves': 'ATL',
  'Orioles': 'BAL',
  'Red Sox': 'BOS',
  'Cubs': 'CHC',
  'White Sox': 'CWS',
  'Reds': 'CIN',
  'Guardians': 'CLE',
  'Rockies': 'COL',
  'Tigers': 'DET',
  'Astros': 'HOU',
  'Royals': 'KCR',
  'Angels': 'LAA',
  'Dodgers': 'LAD',
  'Marlins': 'MIA',
  'Brewers': 'MIL',
  'Twins': 'MIN',
  'Mets': 'NYM',
  'Yankees': 'NYY',
  'Athletics': 'OAK',
  'Phillies': 'PHI',
  'Pirates': 'PIT',
  'Padres': 'SD',
  'Giants': 'SF',
  'Mariners': 'SEA',
  'Cardinals': 'STL',
  'Rays': 'TBR',
  'Rangers': 'TEX',
  'Blue Jays': 'TOR',
  'Nationals': 'WSN'
};

// Simple XML parser - extracts content between tags
function extractTagContent(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

// Extract all occurrences of a tag
function extractRepeatedTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

// Parse surprise level (1-10) to category
function parseSurpriseLevel(level: number): 'Low' | 'Medium' | 'High' {
  if (level <= 3) return 'Low';
  if (level <= 7) return 'Medium';
  return 'High';
}

// Parse Claude's XML response into structured data
export function parseClaudeResponse(text: string) {
  const experimentContent = extractTagContent(text, 'experiment');

  // Parse experiment metadata
  const title = extractTagContent(experimentContent, 'title');
  const summary = extractTagContent(experimentContent, 'summary');

  // Parse hypotheses
  const hypothesisBlocks = extractRepeatedTags(experimentContent, 'hypothesis');
  const hypotheses = hypothesisBlocks.map(block => ({
    text: extractTagContent(block, 'text'),
    isValidated: extractTagContent(block, 'isValidated').toLowerCase() === 'true',
    surpriseLevel: parseSurpriseLevel(parseInt(extractTagContent(block, 'surpriseLevel')) || 5),
    explanation: extractTagContent(block, 'explanation')
  }));

  // Parse team probabilities
  const teamBlocks = extractRepeatedTags(experimentContent, 'team');
  const teamProbabilities = teamBlocks.map(block => ({
    name: extractTagContent(block, 'name'),
    probability: parseFloat(extractTagContent(block, 'probability')),
    change: parseFloat(extractTagContent(block, 'change') || '0')
  }));

  // Parse insights
  const insights = extractRepeatedTags(experimentContent, 'insight');

  return { title, summary, hypotheses, teamProbabilities, insights };
}
