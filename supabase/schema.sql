-- Auto-Baseball-Scientist Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Experiments table: stores each research cycle run
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(experiment_number)
);

-- Hypotheses table: stores generated hypotheses and their validation status
CREATE TABLE hypotheses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  hypothesis TEXT NOT NULL,
  is_validated BOOLEAN NOT NULL,
  evidence TEXT NOT NULL,
  surprise_level TEXT NOT NULL CHECK (surprise_level IN ('Low', 'Medium', 'High')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insights table: broader observations and patterns
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  insight TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team probabilities table: World Series win probability snapshots
CREATE TABLE team_probabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  team_code TEXT NOT NULL,
  team_name TEXT NOT NULL,
  probability DECIMAL(5, 2) NOT NULL,
  rank INTEGER NOT NULL,
  change_from_previous DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Next experiments table: planned future research
CREATE TABLE next_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_experiments_created_at ON experiments(created_at DESC);
CREATE INDEX idx_hypotheses_experiment_id ON hypotheses(experiment_id);
CREATE INDEX idx_insights_experiment_id ON insights(experiment_id);
CREATE INDEX idx_team_probabilities_experiment_id ON team_probabilities(experiment_id);
CREATE INDEX idx_team_probabilities_rank ON team_probabilities(rank);
CREATE INDEX idx_next_experiments_experiment_id ON next_experiments(experiment_id);

-- Enable Row Level Security
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_probabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_experiments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Enable read access for all users" ON experiments FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON hypotheses FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON insights FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON team_probabilities FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON next_experiments FOR SELECT USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE experiments;
ALTER PUBLICATION supabase_realtime ADD TABLE hypotheses;
ALTER PUBLICATION supabase_realtime ADD TABLE insights;
ALTER PUBLICATION supabase_realtime ADD TABLE team_probabilities;
ALTER PUBLICATION supabase_realtime ADD TABLE next_experiments;

-- Function to get latest experiment with all related data
CREATE OR REPLACE FUNCTION get_latest_experiment()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'experiment', row_to_json(e.*),
    'hypotheses', (
      SELECT json_agg(row_to_json(h.*))
      FROM hypotheses h
      WHERE h.experiment_id = e.id
    ),
    'insights', (
      SELECT json_agg(row_to_json(i.*))
      FROM insights i
      WHERE i.experiment_id = e.id
    ),
    'team_probabilities', (
      SELECT json_agg(row_to_json(t.*))
      FROM team_probabilities t
      WHERE t.experiment_id = e.id
      ORDER BY t.rank
    ),
    'next_experiments', (
      SELECT json_agg(row_to_json(n.*))
      FROM next_experiments n
      WHERE n.experiment_id = e.id
    )
  ) INTO result
  FROM experiments e
  ORDER BY e.created_at DESC
  LIMIT 1;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
