# True Learning Loop Upgrade Plan
## Auto-Baseball-Scientist Self-Improvement Architecture

**Date:** January 4, 2026
**Version:** 3.0 Planning Document
**Objective:** Transform Claude into a truly learning research scientist that improves with each cycle

---

## 📊 Current Implementation Status

### ✅ What's Already Implemented (v2.1)

**1. Basic Reflection Loop** (`/lib/research-cycle.ts:60-94`)
```typescript
// Fetches last 10 experiments with:
- Experiment titles and summaries
- Hypotheses with validation status (✓/✗)
- Surprise levels (1-10 scale)
- Top 6 team probabilities per cycle
```

**2. System Prompt Instructions** (`/claude.code.md:27-34`)
```
### Reflection & Self-Improvement (Learning Loop)
- Review past validated/invalidated hypotheses
- Identify recurring biases
- Note probability shifts
- Adjust simulation assumptions
```

**3. Context Delivery**
- History formatted as user message
- Appended before current MLB data
- Claude sees full conversation history

### ❌ What's Missing (The Gaps)

1. **No Structured Reflection Output**
   - Claude reflects internally but doesn't document learnings
   - Can't track what biases were identified
   - No explicit "what I learned" artifacts

2. **No Pattern Recognition**
   - Doesn't identify recurring prediction errors
   - Can't detect systematic over/under-valuation
   - Missing trend analysis across cycles

3. **No Accuracy Tracking**
   - Hypotheses marked validated/invalidated but no mechanism to track actual outcomes
   - No comparison of predictions vs. reality
   - Can't measure improvement over time

4. **No Adaptive Parameters**
   - Surprise thresholds are static
   - Boldness level doesn't adjust
   - Simulation assumptions don't evolve

5. **Limited Context Summarization**
   - Raw concatenation of 10 cycles
   - No intelligent compression
   - Could exceed 200K token window with growth

---

## 🎯 True Learning Loop Architecture

### Vision Statement
> "Claude should become a better baseball analyst with each research cycle, learning from past mistakes, recognizing patterns, and adjusting its analytical framework based on empirical evidence."

### Core Principles

1. **Explicit Reflection**: Document learnings, not just think about them
2. **Empirical Validation**: Track predictions against reality
3. **Pattern Recognition**: Identify systematic biases
4. **Adaptive Intelligence**: Adjust parameters based on performance
5. **Memory Compression**: Scale gracefully to 100+ cycles

---

## 📐 Proposed Architecture

### Phase 1: Enhanced Reflection Output

**Goal:** Make Claude's learning explicit and trackable

**Implementation:**

1. **Add `<reflection>` section to output structure:**

```xml
<experiment>
  <reflection>
    <learned>Specific insight from reviewing past cycles</learned>
    <bias_identified>Pattern of over/under-estimation</bias_identified>
    <adjustment_made>How I'm changing my approach this cycle</adjustment_made>
    ... 2-4 reflection items
  </reflection>

  <title>...</title>
  <summary>...</summary>
  <!-- existing structure continues -->
</experiment>
```

2. **Store in new `reflections` table:**

```sql
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  learned TEXT NOT NULL,
  bias_identified TEXT,
  adjustment_made TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

3. **Update parser** (`/lib/parsers.ts`):
```typescript
const reflections = extractRepeatedTags(experimentContent, 'learned');
const biases = extractRepeatedTags(experimentContent, 'bias_identified');
const adjustments = extractRepeatedTags(experimentContent, 'adjustment_made');
```

**Benefits:**
- ✅ Trackable learning progression
- ✅ Can display "What Claude Learned" in UI
- ✅ Database of identified biases for future analysis

---

### Phase 2: Pattern Recognition Engine

**Goal:** Automatically detect recurring prediction patterns

**Implementation:**

1. **Create pattern analysis function:**

```typescript
// /lib/pattern-analyzer.ts
interface Pattern {
  type: 'overestimation' | 'underestimation' | 'volatility' | 'consistency';
  entity: string; // team name, pitcher type, etc.
  confidence: number;
  evidence: string[];
}

async function analyzePatterns(pastCycles: number = 20): Promise<Pattern[]> {
  // Query last 20 cycles
  // Identify teams consistently over/under-estimated
  // Detect hypothesis categories with low validation rates
  // Find probability volatility patterns
  // Return structured patterns
}
```

2. **Inject patterns into prompt:**

```typescript
const patterns = await analyzePatterns(20);
const patternContext = patterns.length > 0
  ? `### Identified Patterns:\n${patterns.map(p =>
      `- ${p.type}: ${p.entity} (${p.confidence}% confidence)`
    ).join('\n')}`
  : '';

const userPrompt = `${historyContext}\n\n${patternContext}\n\n### Current MLB Data:\n${currentMLBData}`;
```

3. **Update system prompt:**

```markdown
### Pattern-Based Learning
If "Identified Patterns" are provided:
- You've been systematically over/under-estimating certain entities
- Adjust your priors and simulation parameters accordingly
- Be especially cautious with identified bias areas
- Explain adjustments in your <reflection> section
```

**Benefits:**
- ✅ Data-driven bias detection
- ✅ Systematic error correction
- ✅ Quantified confidence in patterns

---

### Phase 3: Accuracy Tracking & Validation

**Goal:** Measure prediction accuracy against real outcomes

**Implementation:**

1. **Create outcomes tracking:**

```sql
CREATE TABLE prediction_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hypothesis_id UUID REFERENCES hypotheses(id),
  actual_outcome BOOLEAN, -- true if hypothesis came true
  outcome_date DATE,
  evidence TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE probability_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id),
  team_code VARCHAR(3),
  predicted_probability DECIMAL(5,2),
  actual_result VARCHAR(50), -- 'won_ws', 'made_playoffs', 'missed_playoffs'
  brier_score DECIMAL(5,4), -- accuracy metric
  created_at TIMESTAMPTZ DEFAULT now()
);
```

2. **Manual outcome input API:**

```typescript
// /app/api/outcomes/route.ts
POST /api/outcomes
{
  hypothesis_id: string,
  actual_outcome: boolean,
  evidence: string
}
```

3. **Calculate accuracy metrics:**

```typescript
interface AccuracyMetrics {
  overall_hypothesis_accuracy: number; // % validated correctly
  team_probability_brier_score: number; // closer to 0 = better
  surprise_calibration: number; // are high-surprise actually surprising?
  bias_correction_rate: number; // improving over time?
}

async function calculateAccuracy(cycles: number = 50): Promise<AccuracyMetrics>
```

4. **Include in reflection context:**

```typescript
const accuracy = await calculateAccuracy(50);
const accuracyContext = `
### Your Historical Accuracy:
- Hypothesis validation rate: ${accuracy.overall_hypothesis_accuracy}%
- Probability accuracy (Brier): ${accuracy.team_probability_brier_score}
- Surprise calibration: ${accuracy.surprise_calibration}%

Use this to calibrate confidence and boldness.
`;
```

**Benefits:**
- ✅ Objective performance measurement
- ✅ Closes the feedback loop
- ✅ Enables true improvement tracking

---

### Phase 4: Adaptive Parameters

**Goal:** Dynamically adjust analysis based on performance

**Implementation:**

1. **Configurable boldness:**

```typescript
interface AdaptiveConfig {
  boldness_level: number; // 0-100
  surprise_threshold_low: number; // 1-10
  surprise_threshold_high: number; // 1-10
  confidence_adjustment: number; // -0.5 to +0.5
}

async function calculateAdaptiveConfig(
  accuracy: AccuracyMetrics
): Promise<AdaptiveConfig> {
  // If accuracy high → increase boldness
  // If over-predicting surprises → raise threshold
  // If under-confident → boost confidence
}
```

2. **Inject into system prompt:**

```markdown
### Adaptive Parameters (Based on Your Performance):
- Boldness Level: ${config.boldness_level}/100
  ${config.boldness_level > 70 ? 'You are accurate - make bolder predictions!' : 'Exercise more caution'}
- Surprise Threshold: ${config.surprise_threshold_low}-${config.surprise_threshold_high}
  Only rate truly unexpected findings above ${config.surprise_threshold_high}
- Confidence Adjustment: ${config.confidence_adjustment > 0 ? '+' : ''}${config.confidence_adjustment}
  ${config.confidence_adjustment > 0 ? 'Trust your models more' : 'Be more skeptical'}
```

3. **Store parameter history:**

```sql
CREATE TABLE adaptive_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id),
  boldness_level INT,
  surprise_threshold_low INT,
  surprise_threshold_high INT,
  confidence_adjustment DECIMAL(3,2),
  rationale TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Benefits:**
- ✅ Self-tuning system
- ✅ Learns optimal parameter ranges
- ✅ Trackable evolution of analysis style

---

### Phase 5: Context Window Optimization

**Goal:** Scale to 100+ cycles within 200K token limit

**Implementation:**

1. **Intelligent summarization:**

```typescript
interface CycleSummary {
  cycle_number: number;
  date: string;
  key_hypotheses: string[]; // Top 3 most important
  major_shifts: string[]; // Probability changes > 5%
  notable_learnings: string[]; // From reflection table
  compressed_size: number; // tokens
}

async function compressHistory(
  cycles: number = 100,
  maxTokens: number = 50000
): Promise<string> {
  // Recent 10 cycles: Full detail (last 2 weeks)
  // Cycles 11-30: Medium detail (last 2 months)
  // Cycles 31+: Summary only (historical context)

  const recent = await getFullCycles(10);
  const medium = await getSummarizedCycles(11, 30);
  const historical = await getCompressedCycles(31, cycles);

  return formatTimeTieredHistory(recent, medium, historical);
}
```

2. **Token budget allocation:**

```
Total context: 200K tokens
- System prompt: ~2K
- Current MLB data: ~3K
- Recent 10 cycles (full): ~15K
- Cycles 11-30 (medium): ~10K
- Cycles 31-100 (compressed): ~5K
- Patterns & accuracy: ~5K
- Response buffer: ~10K
---------------------------------
Total used: ~50K tokens
Remaining: 150K (ample headroom)
```

3. **Implement compression:**

```typescript
function compressCycle(cycle: Experiment): string {
  return `Cycle ${cycle.number}: ${cycle.title}. ` +
    `Validated: ${cycle.validated_count}/${cycle.total_hypotheses}. ` +
    `Top team: ${cycle.top_team} (${cycle.top_probability}%). ` +
    `Key learning: ${cycle.top_reflection}`;
}
```

**Benefits:**
- ✅ Scalable to 100+ cycles
- ✅ Preserves important context
- ✅ Efficient token usage

---

## 🗂️ Database Schema Additions

### New Tables

```sql
-- Explicit reflections
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  learned TEXT NOT NULL,
  bias_identified TEXT,
  adjustment_made TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prediction outcomes (manual input)
CREATE TABLE prediction_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hypothesis_id UUID REFERENCES hypotheses(id),
  actual_outcome BOOLEAN,
  outcome_date DATE,
  evidence TEXT,
  verified_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Probability accuracy tracking
CREATE TABLE probability_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id),
  team_code VARCHAR(3),
  predicted_probability DECIMAL(5,2),
  actual_result VARCHAR(50),
  brier_score DECIMAL(5,4),
  season_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Adaptive parameter history
CREATE TABLE adaptive_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id),
  boldness_level INT CHECK (boldness_level BETWEEN 0 AND 100),
  surprise_threshold_low INT CHECK (surprise_threshold_low BETWEEN 1 AND 10),
  surprise_threshold_high INT CHECK (surprise_threshold_high BETWEEN 1 AND 10),
  confidence_adjustment DECIMAL(3,2),
  rationale TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Detected patterns
CREATE TABLE detected_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(50),
  entity VARCHAR(100),
  confidence DECIMAL(5,2),
  evidence JSONB,
  first_detected_at TIMESTAMPTZ DEFAULT now(),
  last_updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_reflections_experiment ON reflections(experiment_id);
CREATE INDEX idx_outcomes_hypothesis ON prediction_outcomes(hypothesis_id);
CREATE INDEX idx_accuracy_experiment ON probability_accuracy(experiment_id);
CREATE INDEX idx_patterns_type ON detected_patterns(pattern_type, entity);
```

---

## 🛠️ Implementation Roadmap

### Sprint 1: Foundation (Week 1)
**Goal:** Add explicit reflection output

- [ ] Update `claude.code.md` with `<reflection>` structure
- [ ] Create `reflections` table in Supabase
- [ ] Update parser to extract reflection items
- [ ] Update `research-cycle.ts` to save reflections
- [ ] Add "What Claude Learned" tab to UI
- [ ] Test with 3-5 research cycles

**Deliverables:**
- Reflection storage working
- UI displays learnings
- Documentation updated

---

### Sprint 2: Pattern Recognition (Week 2)
**Goal:** Detect systematic biases

- [ ] Create `/lib/pattern-analyzer.ts`
- [ ] Create `detected_patterns` table
- [ ] Implement pattern detection algorithms:
  - Overestimation patterns (team consistently rated too high)
  - Underestimation patterns (team consistently rated too low)
  - Volatility patterns (probabilities swing wildly)
  - Hypothesis category accuracy (pitcher moves vs. position players)
- [ ] Inject patterns into prompt context
- [ ] Add patterns display to UI
- [ ] Test pattern detection with 20+ cycles

**Deliverables:**
- Pattern detection working
- Patterns influence next cycle
- UI shows detected biases

---

### Sprint 3: Accuracy Tracking (Week 3)
**Goal:** Close the feedback loop

- [ ] Create outcome tracking tables
- [ ] Create `/app/api/outcomes/route.ts` for manual input
- [ ] Build admin UI for marking hypothesis outcomes
- [ ] Implement accuracy calculation functions
- [ ] Create Brier score calculator for probabilities
- [ ] Include accuracy metrics in prompt
- [ ] Add accuracy dashboard to UI

**Deliverables:**
- Can record actual outcomes
- Accuracy metrics calculated
- Performance dashboard live

---

### Sprint 4: Adaptive Parameters (Week 4)
**Goal:** Self-tuning system

- [ ] Create `adaptive_parameters` table
- [ ] Implement adaptive config calculator
- [ ] Inject parameters into system prompt
- [ ] Test parameter adjustments:
  - High accuracy → increase boldness
  - Low accuracy → increase caution
  - Over-surprising → raise thresholds
- [ ] Track parameter evolution over time
- [ ] Add parameters view to UI

**Deliverables:**
- System self-adjusts based on performance
- Parameter history tracked
- Observable improvement over cycles

---

### Sprint 5: Context Optimization (Week 5)
**Goal:** Scale to 100+ cycles

- [ ] Implement time-tiered history compression
- [ ] Create cycle summarization functions
- [ ] Build token counter/budget manager
- [ ] Test with simulated 100 cycles
- [ ] Optimize compression ratios
- [ ] Add context usage metrics to logs

**Deliverables:**
- Handles 100+ cycles efficiently
- Token usage under 50K
- No loss of critical context

---

## 📊 Success Metrics

### Quantitative
- **Hypothesis Accuracy**: >70% validated correctly
- **Brier Score**: <0.2 (0 = perfect, 0.25 = random)
- **Pattern Detection Rate**: Identifies biases within 5-10 cycles
- **Adaptation Speed**: Parameters converge within 15 cycles
- **Context Efficiency**: <30% of 200K token budget used

### Qualitative
- Reflections show genuine learning insights
- Predictions become more nuanced over time
- Identified biases actually corrected in subsequent cycles
- System demonstrates "wisdom" from accumulated experience

---

## 🎯 Key Implementation Files

```
/lib/research-cycle.ts           # Main cycle orchestrator [MODIFY]
/lib/pattern-analyzer.ts         # Pattern detection [NEW]
/lib/accuracy-calculator.ts      # Metrics calculation [NEW]
/lib/context-compressor.ts       # History compression [NEW]
/lib/adaptive-config.ts          # Parameter adjustment [NEW]
/lib/parsers.ts                  # Add reflection parsing [MODIFY]

/claude.code.md                  # Enhanced system prompt [MODIFY]

/app/api/outcomes/route.ts       # Outcome tracking API [NEW]
/app/api/patterns/route.ts       # Pattern viewing API [NEW]
/app/api/accuracy/route.ts       # Metrics API [NEW]

/components/learnings-tab.tsx    # UI for reflections [NEW]
/components/patterns-view.tsx    # UI for patterns [NEW]
/components/accuracy-dashboard.tsx # Performance metrics [NEW]

/supabase/migrations/003_learning_loop.sql # New tables [NEW]
```

---

## 💡 Advanced Features (Future)

### Phase 6: Cross-Season Learning
- Track predictions from 2026 season into 2027
- Multi-year pattern recognition
- Identify evergreen biases vs. year-specific

### Phase 7: Ensemble Learning
- Run multiple Claude cycles with different parameters
- Aggregate predictions
- Learn which parameter sets work best

### Phase 8: External Validation
- Integrate with actual game results APIs
- Automatically validate predictions
- Real-time accuracy updates

### Phase 9: Explainable AI
- Generate "confidence intervals" for predictions
- Explain reasoning chains
- Uncertainty quantification

---

## 🚀 Quick Start: Minimal Viable Learning Loop

If you want to implement the absolute minimum first:

### Step 1: Add Reflection to Output (1 hour)

Update `claude.code.md`:
```xml
<experiment>
  <reflection>
    <learned>What I learned from reviewing past cycles</learned>
  </reflection>
  <!-- rest of structure -->
</experiment>
```

### Step 2: Store Reflections (1 hour)

Create table and update parser/saver.

### Step 3: Display in UI (1 hour)

Add new tab showing chronological learnings.

**Result:** You now have explicit, visible learning happening!

---

## 📝 Context Window Analysis

### Current Usage Estimate

```
System Prompt (claude.code.md): ~2,000 tokens
MLB Data (curated): ~3,000 tokens
Past 10 Cycles (current format): ~15,000 tokens
Response (with all tags): ~2,000 tokens
--------------------------------------------------
Total Current: ~22,000 tokens (11% of 200K)
```

### With All Enhancements

```
System Prompt (enhanced): ~3,000 tokens
MLB Data: ~3,000 tokens
Recent 10 Cycles (full detail): ~15,000 tokens
Cycles 11-30 (summarized): ~10,000 tokens
Cycles 31-100 (compressed): ~5,000 tokens
Patterns & Biases: ~3,000 tokens
Accuracy Metrics: ~2,000 tokens
Adaptive Parameters: ~1,000 tokens
Response Buffer: ~10,000 tokens
--------------------------------------------------
Total Enhanced: ~52,000 tokens (26% of 200K)
```

**Conclusion:** Plenty of headroom! Can easily fit 100+ cycles.

---

## ✅ Verification Checklist

Before declaring "True Learning Loop" complete:

- [ ] Claude generates explicit `<reflection>` outputs
- [ ] Reflections stored in database and viewable in UI
- [ ] Pattern detection identifies at least 3 types of biases
- [ ] Patterns influence subsequent cycle predictions
- [ ] Can manually record prediction outcomes
- [ ] Accuracy metrics calculated and displayed
- [ ] Adaptive parameters adjust based on performance
- [ ] System handles 50+ cycles without context issues
- [ ] Demonstrable improvement in accuracy over 20+ cycles
- [ ] Documentation complete for all new features

---

## 🎓 Expected Outcomes

After implementing the True Learning Loop:

**Week 1-2:**
- Claude starts documenting specific learnings
- UI shows "What I Learned This Cycle"
- Researchers can track Claude's evolution

**Week 3-4:**
- Pattern detection identifies recurring biases
- Claude adjusts approach based on patterns
- More sophisticated, less naive predictions

**Week 5-10:**
- Accuracy metrics show improvement trend
- Adaptive parameters find optimal ranges
- System demonstrates genuine baseball analysis wisdom

**Long-term (Months):**
- Becomes trusted source for MLB offseason analysis
- Predictions compete with expert analysts
- Learning artifacts form knowledge base
- Can explain reasoning and uncertainty

---

## 📚 References & Prior Art

**Similar Systems:**
- AlphaGo self-play learning loop
- GPT-4 Constitutional AI (learning from preferences)
- Forecasting platforms (Metaculus, PredictIt)

**Relevant Papers:**
- "Reflection and Learning in Language Models" (Anthropic, 2024)
- "Self-Improving AI Systems" (OpenAI, 2023)
- "Calibrated Probability Forecasting" (Various)

**MLB Analytics:**
- FanGraphs projection methodologies
- Baseball Prospectus PECOTA system
- Bayesian updating in sports forecasting

---

**Status:** Planning Complete
**Next Step:** Review plan → Approve → Begin Sprint 1
**Owner:** Development Team
**Timeline:** 5 weeks for full implementation
