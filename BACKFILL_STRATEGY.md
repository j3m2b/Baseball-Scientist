# Historical Backfill Strategy
## "Time Travel Training" for Baseball Scientist

### Objective
Generate synthetic research cycles for the entire 2025 MLB season using historical data to create a rich learning dataset for the True Learning Loop.

---

## Timeline: 10 Research Cycles (April 2025 - January 2026)

### Cycle 1: April 1, 2025 - "Opening Day Predictions"
**Context:**
- Spring training just ended
- Opening Day rosters set
- No games played yet
- Offseason moves completed (Ohtani, Yamamoto, Soto all signed)

**Predictions Claude Would Make:**
- World Series probabilities based on rosters
- Division winner predictions
- Breakout player candidates
- Bold hypotheses about new signings

**Known Outcomes (To Validate Against):**
- Actual division winners
- Actual WS winner
- Player performance data

---

### Cycle 2: May 1, 2025 - "First Month Surprises"
**Context:**
- ~25 games played per team
- Early surprises emerging
- Injury updates
- Hot/cold starts

**Predictions:**
- Adjust WS probabilities based on April performance
- Identify regression candidates
- Predict sustainability of hot starts

---

### Cycle 3: June 1, 2025 - "Trade Deadline Preview"
**Context:**
- ~50 games played
- Trade deadline approaching
- Buyers/sellers emerging
- First half performance

**Predictions:**
- Trade deadline predictions
- Which teams will buy/sell
- Impact of potential trades

---

### Cycle 4: July 1, 2025 - "All-Star Break Analysis"
**Context:**
- ~85 games played
- All-Star Game
- Trade deadline imminent
- Second half outlook

**Predictions:**
- Playoff probability updates
- Trade impact predictions
- Second half breakouts

---

### Cycle 5: August 1, 2025 - "Playoff Race Heats Up"
**Context:**
- Post-trade deadline
- ~105 games played
- Playoff picture forming
- September push begins

**Predictions:**
- Division winner predictions
- Wild card race analysis
- Postseason rotation predictions

---

### Cycle 6: September 1, 2025 - "Final Push"
**Context:**
- ~135 games played
- Playoff races decided/tight
- Injury concerns
- Roster decisions

**Predictions:**
- Final standings predictions
- Playoff matchup analysis
- Award predictions (MVP, Cy Young)

---

### Cycle 7: October 1, 2025 - "Postseason Begins"
**Context:**
- Regular season complete
- Playoff bracket set
- Postseason rosters
- Matchup analysis

**Predictions:**
- World Series predictions
- Series predictions (ALDS, NLDS, etc.)
- Postseason performer predictions

---

### Cycle 8: November 1, 2025 - "World Series Analysis"
**Context:**
- World Series complete
- Champions crowned
- Offseason begins
- Award winners announced

**Predictions:**
- Offseason moves predictions
- Team needs analysis
- Free agent market predictions

---

### Cycle 9: December 1, 2025 - "Offseason Heats Up"
**Context:**
- Winter Meetings
- Major free agents signing
- Trade rumors
- 2026 outlook

**Predictions:**
- Remaining free agent predictions
- 2026 division winners
- Early WS probabilities

---

### Cycle 10: January 4, 2026 - "Current State" ← WE ARE HERE
**Context:**
- Most free agents signed
- Trade market active
- Spring training approaching
- Full learning loop operational

**Predictions:**
- 2026 season predictions with full historical context
- All phases of learning loop active
- Adaptive parameters tuned from 9 previous cycles

---

## Data Requirements

### For Each Cycle, We Need:

1. **MLB Data Snapshot** (as of that date):
   - Team records
   - Player stats
   - Injury reports
   - Recent trades/signings
   - Standings

2. **Validation Data** (what actually happened):
   - Final standings
   - Playoff results
   - Award winners
   - Player performance

3. **Timeline Context**:
   - Date
   - Games played
   - Key events since last cycle

---

## Implementation Approach

### Option 1: Manual Historical Data Entry
- Manually curate MLB data for each time period
- Create 10 separate data snapshots
- Feed to Claude with "pretend it's April 2025" prompts
- Validate against known outcomes

**Pros:** Most accurate historical data
**Cons:** Time-consuming, manual work

---

### Option 2: MLB Stats API Historical Data
- Use MLB Stats API to fetch historical data
- Query for specific dates (April 1, May 1, etc.)
- Automatically generate snapshots
- Run research cycles programmatically

**Pros:** Automated, accurate
**Cons:** Requires API integration

---

### Option 3: Simplified Synthetic Data
- Create simplified versions of key events
- Focus on major storylines (Ohtani's year, Soto's impact, etc.)
- Don't need perfect accuracy, just realistic learning data
- Faster to implement

**Pros:** Quick to implement
**Cons:** Less realistic

---

## Recommended: Hybrid Approach

### Phase 1: Create 3-5 Key Cycles (Quick)
Start with the most important cycles:
1. **April 2025** - Opening Day predictions
2. **July 2025** - All-Star break
3. **October 2025** - Postseason predictions
4. **December 2025** - Offseason predictions
5. **January 2026** - Current state

**Why:** 5 cycles is enough for:
- Pattern detection (needs 5+ cycles)
- Accuracy tracking (needs 3+ validated)
- Adaptive parameters (needs 5+ cycles)

### Phase 2: Add More Cycles Later (If Needed)
Once the learning loop is working with 5 cycles, add more for richer data.

---

## Expected Outcomes

After running historical backfill:

### Pattern Detection Would Show:
- "You overestimate new big-money signings by avg 8%"
- "You underestimate young teams by avg 5%"
- "High volatility in Dodgers predictions (±12% swing)"

### Accuracy Tracking Would Show:
- Hypothesis accuracy: ~60-70% (realistic)
- Brier score: ~0.15-0.25 (decent calibration)
- Improvement trend: Getting better over time

### Adaptive Config Would Tune:
- Boldness: 65 → 55 (learned to be more conservative)
- Surprise thresholds: 3/7 → 4/8 (recalibrated)
- Confidence adjustment: -5% (learned to reduce probabilities slightly)

### System Would "Know":
- Dodgers lived up to hype (Ohtani, Yamamoto performed)
- Orioles young core exceeded expectations
- Yankees underperformed despite roster
- Mets with Soto were competitive

---

## File Structure for Implementation

```
/scripts/
  historical-backfill/
    data/
      april-2025.ts          # MLB data snapshot
      may-2025.ts
      june-2025.ts
      ...
    generate-cycle.ts         # Script to run historical cycle
    validate-outcomes.ts      # Script to validate predictions
    run-backfill.ts          # Main orchestrator
```

---

## Next Steps

1. **Decide on approach** (manual, API, or hybrid)
2. **Create historical data snapshots** for key dates
3. **Build backfill script** to run research cycles
4. **Validate outcomes** against known results
5. **Populate database** with historical cycles
6. **Verify learning loop** works with real data

---

## Benefits Summary

✅ **Instant Training Data** - Don't start from zero
✅ **Realistic Learning** - Learn from actual MLB events
✅ **Pattern Detection** - Real biases to detect
✅ **Accuracy Tuning** - Real performance to tune against
✅ **Rich Context** - System "remembers" 2025 season
✅ **Better Predictions** - 2026 predictions informed by 2025 learnings

This would transform the Baseball Scientist from a blank slate into a system with a full season of "experience."
