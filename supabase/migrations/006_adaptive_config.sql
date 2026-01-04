-- Phase 4: Adaptive Parameters
-- Stores dynamically adjusted analysis parameters based on performance

-- Table: adaptive_config
-- Stores the current adaptive configuration that adjusts based on accuracy
CREATE TABLE IF NOT EXISTS adaptive_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boldness_level DECIMAL(5,2) NOT NULL DEFAULT 50.00 CHECK (boldness_level >= 0 AND boldness_level <= 100),
  surprise_threshold_low DECIMAL(5,2) NOT NULL DEFAULT 3.00 CHECK (surprise_threshold_low >= 1 AND surprise_threshold_low <= 10),
  surprise_threshold_high DECIMAL(5,2) NOT NULL DEFAULT 7.00 CHECK (surprise_threshold_high >= 1 AND surprise_threshold_high <= 10),
  confidence_adjustment DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (confidence_adjustment >= -1.0 AND confidence_adjustment <= 1.0),
  hypothesis_count_target INT NOT NULL DEFAULT 6 CHECK (hypothesis_count_target >= 3 AND hypothesis_count_target <= 12),

  -- Reasons for current configuration
  rationale TEXT,
  based_on_accuracy DECIMAL(5,2), -- The accuracy that triggered this config
  based_on_trend VARCHAR(20), -- 'improving', 'stable', 'declining'
  based_on_cycles INT, -- Number of cycles analyzed when config was set

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,

  -- Only one active config at a time
  CONSTRAINT only_one_active CHECK (is_active = true)
);

-- Table: config_history
-- Tracks historical configurations to see how parameters evolved
CREATE TABLE IF NOT EXISTS config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boldness_level DECIMAL(5,2) NOT NULL,
  surprise_threshold_low DECIMAL(5,2) NOT NULL,
  surprise_threshold_high DECIMAL(5,2) NOT NULL,
  confidence_adjustment DECIMAL(5,2) NOT NULL,
  hypothesis_count_target INT NOT NULL,
  rationale TEXT,
  accuracy_at_time DECIMAL(5,2),
  trend_at_time VARCHAR(20),
  cycles_analyzed INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_adaptive_config_active ON adaptive_config(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_config_history_created ON config_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE adaptive_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all on adaptive_config" ON adaptive_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on config_history" ON config_history FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE adaptive_config;
ALTER PUBLICATION supabase_realtime ADD TABLE config_history;

-- Function to ensure only one active config exists
CREATE OR REPLACE FUNCTION ensure_single_active_config()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Deactivate all other configs
    UPDATE adaptive_config
    SET is_active = false
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single active config
DROP TRIGGER IF EXISTS trigger_single_active_config ON adaptive_config;
CREATE TRIGGER trigger_single_active_config
  BEFORE INSERT OR UPDATE ON adaptive_config
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION ensure_single_active_config();

-- Function to log config changes to history
CREATE OR REPLACE FUNCTION log_config_to_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (
    OLD.boldness_level != NEW.boldness_level OR
    OLD.surprise_threshold_low != NEW.surprise_threshold_low OR
    OLD.surprise_threshold_high != NEW.surprise_threshold_high OR
    OLD.confidence_adjustment != NEW.confidence_adjustment OR
    OLD.hypothesis_count_target != NEW.hypothesis_count_target
  )) THEN
    INSERT INTO config_history (
      boldness_level,
      surprise_threshold_low,
      surprise_threshold_high,
      confidence_adjustment,
      hypothesis_count_target,
      rationale,
      accuracy_at_time,
      trend_at_time,
      cycles_analyzed
    ) VALUES (
      NEW.boldness_level,
      NEW.surprise_threshold_low,
      NEW.surprise_threshold_high,
      NEW.confidence_adjustment,
      NEW.hypothesis_count_target,
      NEW.rationale,
      NEW.based_on_accuracy,
      NEW.based_on_trend,
      NEW.based_on_cycles
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log config changes
DROP TRIGGER IF EXISTS trigger_log_config_history ON adaptive_config;
CREATE TRIGGER trigger_log_config_history
  AFTER INSERT OR UPDATE ON adaptive_config
  FOR EACH ROW
  EXECUTE FUNCTION log_config_to_history();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_adaptive_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_adaptive_config_updated_at ON adaptive_config;
CREATE TRIGGER trigger_adaptive_config_updated_at
  BEFORE UPDATE ON adaptive_config
  FOR EACH ROW
  EXECUTE FUNCTION update_adaptive_config_timestamp();

-- Insert default configuration
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
  'Initial default configuration - baseline settings before any performance data',
  true
) ON CONFLICT DO NOTHING;
