-- Migration 007: Clear All Polluted Data
-- Run this to reset the database and start fresh with correct timeline
-- This preserves the schema but deletes all experimental data

-- IMPORTANT: This will delete ALL research cycles and predictions
-- Only run this if you want to start completely fresh

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = 'replica';

-- Clear all data from tables (in correct order due to foreign keys)
-- Start with dependent tables first, then parent tables

-- Phase 6: Auto-validation outcomes
TRUNCATE TABLE prediction_outcomes CASCADE;
TRUNCATE TABLE probability_accuracy CASCADE;

-- Phase 4: Adaptive configuration
TRUNCATE TABLE config_history CASCADE;
TRUNCATE TABLE adaptive_config CASCADE;

-- Phase 2: Pattern detection
TRUNCATE TABLE detected_patterns CASCADE;

-- Phase 1: Reflections
TRUNCATE TABLE reflections CASCADE;

-- Core experiment data
TRUNCATE TABLE next_experiments CASCADE;
TRUNCATE TABLE insights CASCADE;
TRUNCATE TABLE team_probabilities CASCADE;
TRUNCATE TABLE hypotheses CASCADE;
TRUNCATE TABLE experiments CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Insert initial adaptive config (default settings)
INSERT INTO adaptive_config (
  boldness_level,
  surprise_threshold_low,
  surprise_threshold_high,
  confidence_adjustment,
  hypothesis_count_target,
  rationale,
  is_active
) VALUES (
  50.00,
  3.00,
  7.00,
  0.00,
  6,
  'Initial default configuration - will adapt based on accuracy metrics after first few cycles',
  true
);

-- Verification: Show table counts (should all be 0 or 1 for adaptive_config)
DO $$
BEGIN
  RAISE NOTICE 'Data cleared successfully. Table counts:';
  RAISE NOTICE 'experiments: %', (SELECT COUNT(*) FROM experiments);
  RAISE NOTICE 'hypotheses: %', (SELECT COUNT(*) FROM hypotheses);
  RAISE NOTICE 'team_probabilities: %', (SELECT COUNT(*) FROM team_probabilities);
  RAISE NOTICE 'insights: %', (SELECT COUNT(*) FROM insights);
  RAISE NOTICE 'next_experiments: %', (SELECT COUNT(*) FROM next_experiments);
  RAISE NOTICE 'reflections: %', (SELECT COUNT(*) FROM reflections);
  RAISE NOTICE 'detected_patterns: %', (SELECT COUNT(*) FROM detected_patterns);
  RAISE NOTICE 'prediction_outcomes: %', (SELECT COUNT(*) FROM prediction_outcomes);
  RAISE NOTICE 'probability_accuracy: %', (SELECT COUNT(*) FROM probability_accuracy);
  RAISE NOTICE 'adaptive_config: %', (SELECT COUNT(*) FROM adaptive_config);
  RAISE NOTICE 'config_history: %', (SELECT COUNT(*) FROM config_history);
  RAISE NOTICE '';
  RAISE NOTICE 'Database reset complete. Ready for fresh research cycles with correct timeline.';
END $$;
