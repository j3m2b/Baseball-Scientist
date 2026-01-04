# ⚾ Baseball Scientist - Autonomous AI Research with True Learning Loop

An autonomous AI research application that analyzes the 2026 MLB off-season using **Claude 4.5 Sonnet**, featuring a complete **True Learning Loop** where Claude makes predictions, validates them, learns from mistakes, and continuously improves without human intervention.

## 🧠 The True Learning Loop

This isn't just another AI app - it's a **self-improving research system**. Claude doesn't just make predictions; it validates its own predictions, tracks accuracy, detects biases, and adapts its parameters autonomously.

### How the Learning Loop Works:

```
┌─────────────────────────────────────────────────────────┐
│  1. Make Predictions                                    │
│     • Generate bold hypotheses about MLB teams          │
│     • Calculate World Series probabilities              │
│     • Run 10,000+ iteration Monte Carlo simulations     │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  2. Auto-Validate (Phase 6) ⭐ NEW                      │
│     • Claude examines past predictions (30+ days old)   │
│     • Determines if hypotheses came true                │
│     • Records team playoff/WS outcomes automatically    │
│     • No manual input needed                            │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  3. Track Accuracy (Phase 3)                            │
│     • Hypothesis validation accuracy                    │
│     • Probability calibration (Brier scores)            │
│     • Improvement trends over time                      │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  4. Detect Patterns (Phase 2)                           │
│     • Automatic bias detection                          │
│     • Identifies systematic errors                      │
│     • Spots overestimation/underestimation patterns     │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  5. Adapt Parameters (Phase 4)                          │
│     • Dynamic boldness adjustment                       │
│     • Confidence calibration                            │
│     • Surprise threshold tuning                         │
│     • Based on actual performance                       │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  6. Optimize Context (Phase 5)                          │
│     • Intelligent memory compression                    │
│     • Time-tiered detail levels                         │
│     • Scales to 100+ research cycles                    │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  7. Reflect & Learn (Phase 1)                           │
│     • Explicit learning documentation                   │
│     • Bias identification                               │
│     • Adjustment explanations                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 └──── Cycle Repeats ────┐
                                          │
                          Better predictions each time!
```

## 🌟 Key Features

### Autonomous Operation
- **Self-Validating**: Claude validates its own predictions without manual input
- **Self-Improving**: Automatically detects biases and adjusts approach
- **Self-Optimizing**: Adapts parameters based on performance
- **24/7 Research**: Automated scheduling via Vercel Cron

### True Learning Loop (All 6 Phases)
✅ **Phase 1: Explicit Reflection Output** - Documents learnings, biases, adjustments
✅ **Phase 2: Pattern Recognition** - Automated bias detection from past 20 cycles
✅ **Phase 3: Accuracy Tracking** - Validates predictions against reality
✅ **Phase 4: Adaptive Parameters** - Performance-based tuning (boldness, confidence)
✅ **Phase 5: Context Optimization** - Intelligent memory compression (scales to 100+ cycles)
✅ **Phase 6: Self-Validation** - Claude auto-validates own predictions ⭐ **NEW**

### Advanced AI Features
- **Real Monte Carlo Simulations**: 10,000+ iterations per prediction
- **Probability Calibration**: Brier score tracking for accuracy
- **Dynamic Boldness**: Automatically adjusts prediction style based on accuracy
- **Pattern Detection**: Identifies systematic biases (team-specific, category-specific)
- **Context Compression**: Time-tiered detail (recent: full, medium: summarized, old: compressed)

### Beautiful Interface
- **Live Feed**: Real-time research updates via Supabase Realtime
- **7 Interactive Tabs**: Latest, Hypotheses, Probabilities, Insights, Patterns, Accuracy, Adaptive Config
- **Dark Mode UI**: Modern glassmorphism design with gradient backgrounds
- **Interactive Charts**: Recharts visualizations for probabilities and trends
- **Accuracy Dashboard**: Track Claude's prediction accuracy over time

## 🚀 Tech Stack

### Frontend
- **Next.js 15** (App Router) - React 19, TypeScript
- **Tailwind CSS** + **shadcn/ui** - Modern component library
- **Recharts** - Interactive data visualizations

### AI & Backend
- **Claude 4.5 Sonnet** (claude-sonnet-4-5-20250929) - Latest frontier model
- **Anthropic API** - Streaming responses, function calling
- **Supabase** - PostgreSQL + Realtime + Row Level Security
- **Vercel** - Serverless deployment + Cron jobs

### Database Schema
- **experiments** - Research cycle metadata
- **hypotheses** - Predictions with validation status
- **team_probabilities** - World Series probability rankings
- **insights** - Broader observations
- **reflections** - Learnings and adjustments (Phase 1)
- **detected_patterns** - Automatic bias detection (Phase 2)
- **prediction_outcomes** - Hypothesis validation results (Phase 3)
- **probability_accuracy** - Team probability accuracy + Brier scores (Phase 3)
- **adaptive_config** - Dynamic parameter tuning (Phase 4)
- **config_history** - Parameter evolution tracking (Phase 4)

## 📸 What You Get

### 1. Latest Activity
Real-time feed of Claude's research cycles with:
- Experiment titles and summaries
- Timestamp and cycle numbers
- Live updates as new research completes

### 2. Bold Hypotheses
AI-generated predictions with:
- Validation status (Validated/Invalidated/Pending)
- Surprise level (1-10 scale)
- Detailed explanations and evidence
- Color-coded badges

### 3. World Series Probabilities
Interactive charts showing:
- Top 10 teams ranked by probability
- Probability changes from previous cycles
- Historical trend analysis

### 4. Reflections & Learning
Claude's documented learnings:
- What was learned from past cycles
- Biases identified in previous predictions
- Adjustments made to improve accuracy

### 5. Pattern Detection
Automatically identified biases:
- Team-specific patterns (overestimation/underestimation)
- Category patterns (pitching, hitting, defense)
- Statistical significance metrics
- Suggested corrections

### 6. Accuracy Tracking
Performance metrics:
- Hypothesis validation accuracy (%)
- Probability calibration (Brier scores)
- Improvement trends over time
- Detailed breakdown by category

### 7. Adaptive Configuration
Auto-tuned parameters:
- Boldness level (0-100)
- Surprise thresholds (calibrated)
- Confidence adjustments (+/- %)
- Target hypothesis count
- Rationale for each parameter

## 🎯 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier works!)
- Anthropic API key
- Vercel account (optional, for deployment)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/j3m2b/Baseball-Scientist.git
cd Baseball-Scientist
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run ALL migration files in order:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_research_loop.sql`
     - `supabase/migrations/003_reflections.sql`
     - `supabase/migrations/004_pattern_detection.sql`
     - `supabase/migrations/005_accuracy_tracking.sql`
     - `supabase/migrations/006_adaptive_config.sql`
   - Enable Realtime for all tables
   - Copy your project URL and API keys

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env`:
```env
ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_AUTH_TOKEN=your_anthropic_key  # Same as above
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=random_secret_string_for_cron
```

5. **Run the development server**
```bash
npm run dev
```

6. **Trigger your first research cycle**
```bash
curl "http://localhost:3000/api/research?secret=your_cron_secret"
```

Visit [http://localhost:3000](http://localhost:3000) to watch Claude work!

## 🤖 How It Works

### Research Cycle Flow

1. **Data Collection**
   - Fetches current MLB transactions, signings, trades
   - Loads injury updates and roster changes
   - Gathers 2025 season performance context

2. **Context Preparation** (Phase 5)
   - Compresses past 100 cycles with time-tiered detail
   - Recent 10 cycles: Full detail (~150 tokens/cycle)
   - Cycles 11-30: Medium detail (~80 tokens/cycle)
   - Cycles 31+: Compressed batches (~30 tokens/cycle)

3. **Auto-Validation** (Phase 6) ⭐ NEW
   - Examines hypotheses 30+ days old
   - Validates team outcomes from past seasons
   - Records results automatically
   - Feeds into accuracy metrics

4. **Pattern Detection** (Phase 2)
   - Analyzes past 20 cycles for systematic biases
   - Identifies overestimation/underestimation patterns
   - Detects volatility and category biases
   - Provides correction suggestions

5. **Accuracy Calculation** (Phase 3)
   - Computes hypothesis validation accuracy
   - Calculates Brier scores for probabilities
   - Tracks improvement trends
   - Identifies performance issues

6. **Parameter Adaptation** (Phase 4)
   - Adjusts boldness based on accuracy
   - Calibrates surprise thresholds
   - Tunes confidence adjustments
   - Optimizes hypothesis count

7. **Claude Analysis**
   - Receives compressed history + patterns + accuracy + config
   - Reflects on past performance (Phase 1)
   - Generates new predictions with adjusted parameters
   - Documents learnings and adjustments

8. **Result Storage**
   - Saves experiment, hypotheses, probabilities
   - Records reflections and insights
   - Logs detected patterns
   - Archives configuration changes

9. **Real-time Update**
   - Supabase Realtime pushes to all connected clients
   - UI updates instantly with new data
   - Charts re-render with latest probabilities

### Data Flow Architecture

```
Vercel Cron (Daily 8am UTC)
        │
        ▼
  /api/research
        │
        ├─► Fetch MLB Data (mlb-data-fetcher.ts)
        │
        ├─► Auto-Validate Past Predictions (hypothesis-validator.ts, team-outcomes-validator.ts)
        │
        ├─► Compress History (context-optimizer.ts)
        │
        ├─► Detect Patterns (pattern-analyzer.ts)
        │
        ├─► Calculate Accuracy (accuracy-calculator.ts)
        │
        ├─► Adapt Parameters (adaptive-config-calculator.ts)
        │
        ├─► Call Claude API
        │       │
        │       ▼
        │   Parse Response (parsers.ts)
        │
        ├─► Save to Supabase
        │       │
        │       ▼
        │   Database Triggers
        │   (Brier scores, config logging)
        │
        ▼
  Supabase Realtime
        │
        ▼
  Frontend UI Updates
```

## 🔧 API Endpoints

### Research & Data
- `POST /api/research` - Trigger research cycle (requires CRON_SECRET)
- `GET /api/research?secret=SECRET` - Manual trigger for testing
- `POST /api/trigger` - Alternative trigger endpoint

### Accuracy & Validation
- `POST /api/outcomes` - Record hypothesis outcome (auto-validation uses this internally)
- `GET /api/outcomes` - Fetch all prediction outcomes
- `POST /api/team-outcomes` - Record team result (auto-validation uses this internally)
- `GET /api/team-outcomes` - Fetch all team outcomes

### Adaptive Configuration
- `GET /api/adaptive-config` - Fetch current adaptive parameters
- `POST /api/adaptive-config` - Update configuration (auto-calculated each cycle)

### Context & Stats
- `GET /api/context-stats` - Fetch compression statistics

## 📊 Database Schema Highlights

### Core Tables
- **experiments** - Each research cycle (title, summary, timestamp)
- **hypotheses** - Predictions (text, validation, surprise level, evidence)
- **team_probabilities** - WS probabilities (team, %, rank, change)

### Learning Loop Tables (Phases 1-6)
- **reflections** - Learnings, biases, adjustments
- **detected_patterns** - Auto-identified biases (type, entity, avg_deviation, occurrences)
- **prediction_outcomes** - Hypothesis validation (actual_outcome, evidence, date)
- **probability_accuracy** - Team results (actual_result, brier_score)
- **adaptive_config** - Dynamic parameters (boldness, thresholds, confidence_adj)
- **config_history** - Parameter evolution tracking

### Database Triggers
- `calculate_brier_score()` - Auto-calculates probability accuracy
- `ensure_single_active_config()` - Maintains one active configuration
- `log_config_change()` - Archives parameter changes
- `update_updated_at_column()` - Timestamp management

## 🎨 Customization

### Adjust Research Focus
Edit `claude.code.md` to customize:
- Team or division focus
- Player-specific predictions
- Award race analysis (MVP, Cy Young)
- Playoff scenario modeling

### Change Auto-Validation Settings
In `lib/research-cycle.ts`:
```typescript
// Validate up to 5 hypotheses per cycle
const hypothesisValidations = await autoValidateHypotheses(5);

// Validate up to 3 experiments per cycle
const teamValidations = await autoValidateTeamOutcomes(3);
```

### Tune Adaptive Parameters
Adjust thresholds in `lib/adaptive-config-calculator.ts`:
```typescript
// Current: 75% accuracy → boldness 75
// Current: 65% accuracy → boldness 65
// Customize these thresholds as needed
```

### Configure Context Compression
Modify compression tiers in `lib/context-optimizer.ts`:
```typescript
const RECENT_CYCLES = 10;    // Full detail
const MEDIUM_CYCLES = 20;    // Medium detail
const COMPRESSED_CYCLES = 70; // Compressed
```

### Update Cron Schedule
Edit `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/research",
    "schedule": "0 8 * * *"     // Daily at 8am UTC
    // "0 */6 * * *"            // Every 6 hours
    // "0 0,12 * * *"           // Twice daily
    // "0 0 * * 0"              // Weekly (Sundays)
  }]
}
```

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/j3m2b/Baseball-Scientist)

**Manual Deployment:**

1. Push to GitHub
2. Import repository in Vercel
3. Add environment variables:
   - `ANTHROPIC_API_KEY`
   - `ANTHROPIC_AUTH_TOKEN`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
4. Deploy!

**Important:** Ensure all 6 migration files are run in Supabase before deployment.

## 💰 Cost Breakdown

### Free Tiers
- **Supabase**: Free tier (500MB database, 2GB bandwidth)
- **Vercel**: Hobby plan (100GB bandwidth, 100 hours compute)

### API Costs
- **Claude 4.5 Sonnet**: ~$3.00/1M input tokens, ~$15.00/1M output tokens
- **Research Cycle**: ~50K input + 5K output tokens = ~$0.23/cycle
- **Auto-Validation**: ~10K tokens/cycle = ~$0.03/cycle
- **Daily (1 cycle)**: ~$0.26/day = **$7.80/month**
- **4x daily**: ~$1.04/day = **$31.20/month**

**Total Cost (1 cycle/day)**: ~$8/month for a fully autonomous, self-improving AI research system!

## 🧪 Testing the Learning Loop

### Watch Claude Learn:

1. **Run Multiple Cycles**
   ```bash
   # Trigger 5 cycles manually
   for i in {1..5}; do
     curl "http://localhost:3000/api/research?secret=YOUR_SECRET"
     sleep 60
   done
   ```

2. **Check Pattern Detection**
   - Go to "Patterns" tab after 5+ cycles
   - Watch Claude identify its own biases

3. **Monitor Adaptive Parameters**
   - Go to "Adaptive Config" tab
   - See parameters adjust based on accuracy

4. **Track Accuracy Over Time**
   - Go to "Accuracy" tab
   - Watch accuracy improve as Claude learns

5. **Observe Auto-Validation**
   - Wait 30+ days after initial predictions
   - Watch Claude validate its own hypotheses
   - Check console logs for validation activity

## 📚 Project Structure

```
Baseball-Scientist/
├── app/
│   ├── api/
│   │   ├── research/route.ts           # Main research cycle
│   │   ├── trigger/route.ts            # Alternative trigger
│   │   ├── outcomes/route.ts           # Hypothesis validation API
│   │   ├── team-outcomes/route.ts      # Team result API
│   │   ├── adaptive-config/route.ts    # Config management API
│   │   └── context-stats/route.ts      # Compression stats API
│   ├── layout.tsx                       # Root layout
│   ├── page.tsx                         # Main page
│   └── globals.css                      # Tailwind styles
├── components/
│   ├── ui/                              # shadcn/ui components
│   ├── research-feed-v2.tsx             # Main feed (7 tabs)
│   ├── probability-chart.tsx            # Recharts visualization
│   ├── pattern-display.tsx              # Pattern detection UI
│   ├── accuracy-display.tsx             # Accuracy metrics UI
│   └── adaptive-config-display.tsx      # Config parameters UI
├── lib/
│   ├── supabase/                        # Supabase client/server
│   ├── research-cycle.ts                # Shared research logic
│   ├── mlb-data-fetcher.ts              # MLB data integration
│   ├── parsers.ts                       # XML parsing
│   ├── pattern-analyzer.ts              # Phase 2: Pattern detection
│   ├── accuracy-calculator.ts           # Phase 3: Accuracy tracking
│   ├── adaptive-config-calculator.ts    # Phase 4: Parameter tuning
│   ├── context-optimizer.ts             # Phase 5: Compression
│   ├── hypothesis-validator.ts          # Phase 6: Auto-validation
│   └── team-outcomes-validator.ts       # Phase 6: Team validation
├── supabase/
│   └── migrations/                      # All 6 migration files
│       ├── 001_initial_schema.sql
│       ├── 002_research_loop.sql
│       ├── 003_reflections.sql
│       ├── 004_pattern_detection.sql
│       ├── 005_accuracy_tracking.sql
│       └── 006_adaptive_config.sql
├── claude.code.md                       # System prompt (learning loop instructions)
├── vercel.json                          # Cron configuration
└── README.md                            # This file
```

## 🤝 Contributing

Contributions welcome! Here are some ideas:

### Feature Ideas
- **Historical Analysis**: Compare predictions to actual season outcomes
- **Player-Level Predictions**: Individual player performance forecasting
- **Trade Analyzer**: Evaluate trade impact on team probabilities
- **Admin Dashboard**: Manage research cycles, view detailed logs
- **API Integration**: Connect to live odds, MLB Stats API, etc.
- **Export/Import**: Download research data, import historical results

### Technical Improvements
- GraphQL API for more flexible data fetching
- WebSocket support for real-time collaboration
- Mobile app (React Native)
- Email/SMS alerts for high-surprise predictions
- A/B testing framework for prompt variations

## 📖 Documentation

- **SETUP.md** - Detailed setup guide (coming soon)
- **LEARNING_LOOP_PLAN.md** - Architecture and design decisions
- **claude.code.md** - Complete system prompt with learning loop instructions

## 📝 License

MIT License - feel free to use for your own projects!

## 🙏 Acknowledgments

- **Inspired by**: EchoHive's Auto-Scientist approach to autonomous AI research
- **Powered by**: Claude 4.5 Sonnet - the AI that runs the research AND helped build this app
- **Built with**: Next.js, Supabase, Anthropic API, and the amazing open-source community

## 🔗 Links

- **Live Demo**: [Coming soon]
- **GitHub**: https://github.com/j3m2b/Baseball-Scientist
- **Issues**: https://github.com/j3m2b/Baseball-Scientist/issues
- **Anthropic**: https://www.anthropic.com
- **Supabase**: https://supabase.com

---

**⚾ Built by the future of baseball analytics - where AI doesn't just predict, it learns.**

*This is more than an app - it's a demonstration of true AI autonomy. Claude makes predictions, validates them, learns from mistakes, and continuously improves. No human in the loop. Just pure autonomous learning.*

🤖 **Powered by Claude 4.5 Sonnet** | 🚀 **Built with Next.js 15** | 💾 **Data by Supabase**
