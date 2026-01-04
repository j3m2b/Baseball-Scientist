#!/usr/bin/env node
/**
 * Wipe Script - Clears all experiment data from the database
 *
 * WARNING: This will DELETE ALL data including:
 * - All experiments
 * - All hypotheses
 * - All team probabilities
 * - All insights
 * - All next experiments
 *
 * Only run this if you want to start completely fresh!
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const { supabaseServer } = await import('../lib/supabase/server.js');
  const supabase = supabaseServer;

  console.log('⚠️  WARNING: This will DELETE ALL experiment data!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Check current state
  const { data: experiments } = await supabase
    .from('experiments')
    .select('id');
  console.log(`Found ${experiments?.length ?? 0} experiments to delete...`);

  // Delete in correct order due to foreign key constraints
  // Get all IDs first, then delete each one
  console.log('🗑️  Fetching all records to delete...');

  const { data: allExperiments } = await supabase.from('experiments').select('id');
  const exps = allExperiments as any[] | null;

  if (exps && exps.length > 0) {
    console.log(`Found ${exps.length} experiments, deleting related records...`);

    // Delete child records for each experiment
    for (const exp of exps) {
      await supabase.from('hypotheses').delete().eq('experiment_id', exp.id);
      await supabase.from('team_probabilities').delete().eq('experiment_id', exp.id);
      await supabase.from('insights').delete().eq('experiment_id', exp.id);
      await supabase.from('next_experiments').delete().eq('experiment_id', exp.id);
    }

    console.log('🗑️  Deleting experiments...');
    const { error } = await supabase.from('experiments').delete().in('id', exps.map(e => e.id));

    if (error) {
      console.error('  Error:', error.message);
    } else {
      console.log(`  Deleted: ${exps.length} experiments`);
    }
  }

  // Verify deletion
  const { count: remaining } = await supabase
    .from('experiments')
    .select('*', { count: 'exact', head: true });

  if (remaining === 0) {
    console.log('\n✅ All data wiped! Database is now clean.');
  } else {
    console.log(`\n⚠️  Warning: ${remaining} experiments remain. There might be RLS policies preventing deletion.`);
  }
  console.log('Run the backfill script to populate with historical data:\n');
  console.log('  npx tsx scripts/backfill.ts\n');
}

main().catch(console.error);
