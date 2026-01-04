-- Phase 3: Accuracy Tracking & Validation
-- Tracks actual outcomes against predictions to measure Claude's accuracy over time

-- Table: prediction_outcomes
-- Stores actual outcomes for hypotheses to measure validation accuracy
CREATE TABLE IF NOT EXISTS prediction_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hypothesis_id UUID NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
  actual_outcome BOOLEAN NOT NULL, -- true if hypothesis came true, false if invalidated
  outcome_date DATE NOT NULL, -- when the outcome was determined
  evidence TEXT, -- explanation of why/how the outcome was determined
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: probability_accuracy
-- Tracks team World Series probability predictions vs actual results
CREATE TABLE IF NOT EXISTS probability_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  team_code VARCHAR(3) NOT NULL,
  team_name VARCHAR(100) NOT NULL,
  predicted_probability DECIMAL(5,2) NOT NULL CHECK (predicted_probability >= 0 AND predicted_probability <= 100),
  actual_result VARCHAR(50) NOT NULL CHECK (actual_result IN ('won_ws', 'made_ws', 'made_playoffs', 'missed_playoffs', 'tbd')),
  result_date DATE, -- when the actual result occurred (null if tbd)
  brier_score DECIMAL(5,4), -- probabilistic accuracy metric (0 = perfect, 1 = worst)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(experiment_id, team_code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_hypothesis ON prediction_outcomes(hypothesis_id);
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_date ON prediction_outcomes(outcome_date DESC);
CREATE INDEX IF NOT EXISTS idx_probability_accuracy_experiment ON probability_accuracy(experiment_id);
CREATE INDEX IF NOT EXISTS idx_probability_accuracy_team ON probability_accuracy(team_code);
CREATE INDEX IF NOT EXISTS idx_probability_accuracy_result ON probability_accuracy(actual_result);

-- Enable Row Level Security
ALTER TABLE prediction_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE probability_accuracy ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all operations (adjust based on auth requirements)
CREATE POLICY "Allow all on prediction_outcomes" ON prediction_outcomes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on probability_accuracy" ON probability_accuracy FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE prediction_outcomes;
ALTER PUBLICATION supabase_realtime ADD TABLE probability_accuracy;

-- Function to automatically calculate Brier score when result is set
-- Brier Score = (predicted_prob/100 - actual_outcome)^2
-- actual_outcome: 1 for won_ws, 0.5 for made_ws, 0.25 for made_playoffs, 0 for missed_playoffs
CREATE OR REPLACE FUNCTION calculate_brier_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual_result != 'tbd' AND NEW.result_date IS NOT NULL THEN
    NEW.brier_score := POWER(
      (NEW.predicted_probability / 100.0) -
      CASE NEW.actual_result
        WHEN 'won_ws' THEN 1.0
        WHEN 'made_ws' THEN 0.5
        WHEN 'made_playoffs' THEN 0.25
        WHEN 'missed_playoffs' THEN 0.0
        ELSE NULL
      END,
      2
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate Brier score on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_brier_score ON probability_accuracy;
CREATE TRIGGER trigger_calculate_brier_score
  BEFORE INSERT OR UPDATE ON probability_accuracy
  FOR EACH ROW
  EXECUTE FUNCTION calculate_brier_score();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_prediction_outcomes_updated_at ON prediction_outcomes;
CREATE TRIGGER trigger_prediction_outcomes_updated_at
  BEFORE UPDATE ON prediction_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_probability_accuracy_updated_at ON probability_accuracy;
CREATE TRIGGER trigger_probability_accuracy_updated_at
  BEFORE UPDATE ON probability_accuracy
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
