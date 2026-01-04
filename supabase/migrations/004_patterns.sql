-- Migration 004: Pattern Recognition - Detected Patterns Table
-- Stores automatically detected patterns and biases in Claude's predictions

-- Detected patterns table
CREATE TABLE IF NOT EXISTS detected_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('overestimation', 'underestimation', 'volatility', 'consistency', 'category_bias')),
  entity VARCHAR(100) NOT NULL, -- team name, player type, etc.
  confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  evidence JSONB NOT NULL,
  cycle_count INT NOT NULL DEFAULT 1, -- how many cycles this pattern has appeared
  first_detected_at TIMESTAMPTZ DEFAULT now(),
  last_updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_patterns_type ON detected_patterns(pattern_type);
CREATE INDEX idx_patterns_entity ON detected_patterns(entity);
CREATE INDEX idx_patterns_confidence ON detected_patterns(confidence DESC);
CREATE INDEX idx_patterns_updated ON detected_patterns(last_updated_at DESC);

-- Enable Row Level Security
ALTER TABLE detected_patterns ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Patterns are publicly readable"
  ON detected_patterns
  FOR SELECT
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE detected_patterns;

-- Comments
COMMENT ON TABLE detected_patterns IS 'Automatically detected patterns and biases in Claude predictions';
COMMENT ON COLUMN detected_patterns.pattern_type IS 'Type of pattern: overestimation, underestimation, volatility, consistency, category_bias';
COMMENT ON COLUMN detected_patterns.entity IS 'The subject of the pattern (team name, category, etc.)';
COMMENT ON COLUMN detected_patterns.confidence IS 'Confidence level 0-100 based on evidence strength';
COMMENT ON COLUMN detected_patterns.evidence IS 'JSON array of supporting data points';
COMMENT ON COLUMN detected_patterns.cycle_count IS 'Number of cycles this pattern has persisted';
