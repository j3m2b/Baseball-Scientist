#!/usr/bin/env tsx
/**
 * Historical Backfill Orchestrator
 * "Time Travel Training" for Baseball Scientist
 *
 * Runs 8 historical research cycles from 2025 season to populate database with training data
 */

import { april2025Snapshot } from './data/april-2025';
import { may2025Snapshot } from './data/may-2025';
import { june2025Snapshot } from './data/june-2025';
import { july2025Snapshot } from './data/july-2025';
import { september2025Snapshot } from './data/september-2025';
import { october2025Snapshot } from './data/october-2025';
import { december2025Snapshot } from './data/december-2025';
import { january2026Snapshot } from './data/january-2026';
import type { MLBDataSnapshot, BackfillCycleResult } from './types';

// Import research cycle runner (will create this)
import { runHistoricalCycle } from './run-historical-cycle';

const snapshots: MLBDataSnapshot[] = [
  april2025Snapshot,
  may2025Snapshot,
  june2025Snapshot,
  july2025Snapshot,
  september2025Snapshot,
  october2025Snapshot,
  december2025Snapshot,
  january2026Snapshot,
];

async function main() {
  console.log('='.repeat(80));
  console.log('HISTORICAL BACKFILL: Time Travel Training for Baseball Scientist');
  console.log('='.repeat(80));
  console.log();
  console.log('This will run 8 historical research cycles from the 2025 MLB season');
  console.log('Each cycle will generate predictions and store them in the database');
  console.log('Later cycles will validate earlier predictions for accuracy tracking');
  console.log();
  console.log(`Total Cycles: ${snapshots.length}`);
  console.log(`Date Range: ${snapshots[0].date} → ${snapshots[snapshots.length - 1].date}`);
  console.log();

  const results: BackfillCycleResult[] = [];

  for (const snapshot of snapshots) {
    console.log('-'.repeat(80));
    console.log(`CYCLE ${snapshot.cycleNumber}: ${snapshot.description}`);
    console.log(`Date: ${snapshot.date} (${snapshot.gamesPlayed} games played)`);
    console.log('-'.repeat(80));
    console.log();

    try {
      const result = await runHistoricalCycle(snapshot);
      results.push(result);

      if (result.success) {
        console.log(`✅ CYCLE ${snapshot.cycleNumber} COMPLETE`);
        console.log(`   Hypotheses Generated: ${result.hypothesesGenerated}`);
        console.log(`   Team Probabilities: ${result.teamProbabilitiesGenerated}`);
        console.log(`   Experiment ID: ${result.experimentId}`);
      } else {
        console.error(`❌ CYCLE ${snapshot.cycleNumber} FAILED`);
        console.error(`   Error: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ CYCLE ${snapshot.cycleNumber} CRASHED`);
      console.error(`   Error:`, error);
      results.push({
        cycleNumber: snapshot.cycleNumber,
        date: snapshot.date,
        hypothesesGenerated: 0,
        teamProbabilitiesGenerated: 0,
        experimentId: '',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    console.log();
  }

  // Summary
  console.log('='.repeat(80));
  console.log('BACKFILL COMPLETE - SUMMARY');
  console.log('='.repeat(80));
  console.log();

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`Total Cycles Run: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log();

  if (successful.length > 0) {
    const totalHypotheses = successful.reduce((sum, r) => sum + r.hypothesesGenerated, 0);
    const totalProbabilities = successful.reduce(
      (sum, r) => sum + r.teamProbabilitiesGenerated,
      0
    );

    console.log(`Total Hypotheses Generated: ${totalHypotheses}`);
    console.log(`Total Team Probabilities: ${totalProbabilities}`);
    console.log();
    console.log('✅ Database populated with historical training data!');
    console.log('✅ Learning loop now has full 2025 season "experience"');
    console.log('✅ Pattern detection ready to analyze biases');
    console.log('✅ Accuracy metrics ready for validation');
  }

  if (failed.length > 0) {
    console.log();
    console.log('❌ FAILED CYCLES:');
    failed.forEach((r) => {
      console.log(`   Cycle ${r.cycleNumber} (${r.date}): ${r.error}`);
    });
  }

  console.log();
  console.log('='.repeat(80));

  // Exit with error code if any failed
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
