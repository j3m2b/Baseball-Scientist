/**
 * Test script to verify player stats loading
 * Run with: npx tsx scripts/test-player-stats.ts
 */

import { fetchPlayerStatsForTeams, formatBatterStats, formatPitcherStats } from '../lib/player-stats-loader';

async function testPlayerStats() {
  console.log('🏾 Testing Player Stats Loader...\n');

  // Test with just a few teams
  const testTeams = [
    119, // Dodgers
    147, // Yankees
    110, // Orioles
  ];

  console.log(`Loading stats for ${testTeams.length} teams...\n`);

  try {
    const { batters, pitchers } = await fetchPlayerStatsForTeams(testTeams, 3, 3);

    console.log('\n✅ Successfully loaded player stats!\n');
    console.log(`📊 Batters loaded: ${batters.length}`);
    console.log(`⚾ Pitchers loaded: ${pitchers.length}`);
    console.log('\n' + '='.repeat(60) + '\n');

    // Display batter stats
    console.log(formatBatterStats(batters));
    console.log('='.repeat(60) + '\n');

    // Display pitcher stats
    console.log(formatPitcherStats(pitchers));

    // Check for missing names
    const missingBatters = batters.filter(b => !b.playerName || b.playerName === 'Unknown');
    const missingPitchers = pitchers.filter(p => !p.playerName || p.playerName === 'Unknown');

    if (missingBatters.length > 0 || missingPitchers.length > 0) {
      console.log('\n⚠️  Warning: Found players with missing names:');
      if (missingBatters.length > 0) {
        console.log(`  - ${missingBatters.length} batters with missing names`);
      }
      if (missingPitchers.length > 0) {
        console.log(`  - ${missingPitchers.length} pitchers with missing names`);
      }
    } else {
      console.log('\n✅ All player names loaded successfully!');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary:');
    console.log(`  Teams processed: ${testTeams.length}`);
    console.log(`  Total players: ${batters.length + pitchers.length}`);
    console.log(`  Batters: ${batters.length}`);
    console.log(`  Pitchers: ${pitchers.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error testing player stats:', error);
    process.exit(1);
  }
}

testPlayerStats();
