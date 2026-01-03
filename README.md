# ⚾ Auto-Baseball-Scientist

An autonomous AI research application that analyzes the 2026 MLB off-season using Claude 4.5, generating bold hypotheses, running Monte Carlo simulations, and delivering real-time insights through a beautiful web interface.

## 🌟 Features

- **Autonomous Research Cycles**: Claude 4.5 runs daily experiments analyzing teams, trades, and World Series probabilities
- **Bold Hypothesis Generation**: AI-powered predictions validated through simulations
- **Live Monte Carlo Simulations**: 10,000+ iteration simulations adjusting for off-season moves
- **Real-time Updates**: Supabase-powered live feed that updates instantly
- **Beautiful Dark UI**: Modern interface with tabs, charts, and visual analytics
- **Automated Scheduling**: Vercel Cron runs research cycles 24/7

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **AI**: Claude 4.5 Sonnet (Anthropic API)
- **Database**: Supabase (Postgres + Realtime)
- **Charts**: Recharts
- **Deployment**: Vercel
- **Automation**: Vercel Cron / GitHub Actions

## 📸 What It Looks Like

The app features three main views:

1. **Latest Activity**: Real-time experiment feed with summaries
2. **Research Findings**: Validated hypotheses with surprise levels
3. **Progress Visuals**: Interactive charts showing World Series probabilities

## 🏗️ Project Structure

```
Baseball-Scientist/
├── app/
│   ├── api/
│   │   ├── research/route.ts    # Claude research cycle endpoint
│   │   └── data/route.ts        # Data fetching endpoint
│   ├── layout.tsx               # Root layout with dark mode
│   ├── page.tsx                 # Main page
│   └── globals.css              # Tailwind styles
├── components/
│   ├── ui/
│   │   ├── tabs.tsx             # Radix UI tabs component
│   │   └── card.tsx             # Card component
│   ├── research-feed.tsx        # Main feed component with realtime
│   └── probability-chart.tsx    # Recharts visualization
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Client-side Supabase
│   │   ├── server.ts            # Server-side Supabase
│   │   └── types.ts             # Database types
│   └── utils.ts                 # Utility functions
├── supabase/
│   └── schema.sql               # Complete database schema
├── claude.code.md               # System prompt for Claude 4.5
├── vercel.json                  # Cron configuration
└── SETUP.md                     # Detailed setup guide

```

## 🎯 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
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
   - Run the SQL from `supabase/schema.sql` in the SQL Editor
   - Enable realtime for all tables
   - Copy your project URL and API keys

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your keys:
```env
ANTHROPIC_API_KEY=your_anthropic_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
CRON_SECRET=random_secret_string
```

5. **Run the development server**
```bash
npm run dev
```

6. **Trigger your first research cycle**
```bash
curl "http://localhost:3000/api/research?secret=your_cron_secret"
```

Visit [http://localhost:3000](http://localhost:3000) to see the results!

## 📖 Complete Setup Guide

For detailed setup instructions, troubleshooting, and deployment guides, see **[SETUP.md](./SETUP.md)**.

## 🤖 How It Works

### 1. System Prompt
The `claude.code.md` file contains the complete system prompt that transforms Claude 4.5 into an autonomous baseball researcher.

### 2. Research Cycle
Every 6 hours (configurable), the `/api/research` endpoint:
- Loads current MLB odds and recent moves
- Sends them to Claude with the system prompt
- Parses Claude's structured research output
- Stores experiments, hypotheses, insights, and probabilities in Supabase

### 3. Real-time UI
The frontend:
- Fetches latest data on load
- Subscribes to Supabase realtime changes
- Updates instantly when new research completes
- Displays interactive charts and insights

### 4. Data Flow
```
Vercel Cron → /api/research → Claude 4.5 → Parse Response
                                              ↓
                                          Supabase
                                              ↓
                                    Realtime Subscription
                                              ↓
                                        Frontend UI
```

## 🎨 Customization

### Change Research Focus
Edit `claude.code.md` to focus on:
- Specific teams or divisions
- Individual player predictions
- Award races (MVP, Cy Young)
- Playoff scenarios

### Update MLB Data
Edit `CURRENT_MLB_DATA` in `/app/api/research/route.ts` to include:
- Latest odds from sportsbooks
- Recent trades and signings
- Injury updates
- Expert predictions

### Adjust Schedule
Edit `vercel.json` to change cron frequency:
```json
{
  "crons": [{
    "path": "/api/research",
    "schedule": "0 */6 * * *"  // Every 6 hours
  }]
}
```

### Customize UI
All components use Tailwind and are easily themeable:
- Colors in `app/globals.css`
- Components in `components/ui/`
- Charts in `components/probability-chart.tsx`

## 🔧 API Endpoints

### POST /api/research
Triggers a research cycle (requires `CRON_SECRET` in Authorization header)

### GET /api/research?secret=YOUR_SECRET
Manual trigger for testing

### GET /api/data
Fetches latest experiment data with all related records

## 📊 Database Schema

- **experiments**: Each research cycle run
- **hypotheses**: Generated predictions with validation status
- **insights**: Broader observations and patterns
- **team_probabilities**: World Series win probabilities
- **next_experiments**: Planned future research

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/j3m2b/Baseball-Scientist)

Or manually:
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

See [SETUP.md](./SETUP.md) for detailed deployment instructions.

## 💰 Costs

Running on free tiers:
- Supabase: Free (500MB database)
- Vercel: Free (100GB bandwidth)
- Claude API: ~$1.80/month (4 cycles/day)

**Total: ~$2/month** for a fully autonomous research system!

## 🤝 Contributing

Contributions welcome! Ideas:
- Integrate live odds APIs
- Add player-level predictions
- Build historical analysis
- Create admin dashboard
- Add team logos and branding

## 📝 License

MIT License - feel free to use for your own projects!

## 🙏 Acknowledgments

Inspired by EchoHive's Auto-Scientist approach to autonomous AI research.

Built with Claude 4.5 Sonnet - the AI that powers the research cycles and helped build this app.

---

**Built by the future of baseball analytics** ⚾🤖 
