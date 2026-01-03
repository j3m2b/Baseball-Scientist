# Auto-Baseball-Scientist Setup Guide

Complete setup instructions for deploying your autonomous MLB research application.

## Prerequisites

- Node.js 18+ installed
- A [Supabase](https://supabase.com) account (free tier works)
- An [Anthropic API key](https://console.anthropic.com) with Claude 4.5 access
- A [Vercel](https://vercel.com) account (free tier works)

## Step 1: Supabase Setup

### 1.1 Create a New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Set project name: `baseball-scientist`
5. Generate a strong database password (save it!)
6. Select a region close to you
7. Click "Create new project"

### 1.2 Run Database Schema

1. Wait for your project to finish setting up (~2 minutes)
2. In your project dashboard, click "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy the entire contents of `supabase/schema.sql`
5. Paste into the SQL editor
6. Click "Run" or press Cmd/Ctrl + Enter
7. You should see "Success. No rows returned"

### 1.3 Enable Realtime

1. Click "Database" in the left sidebar
2. Click "Replication" tab
3. Scroll to "Tables" section
4. Enable replication for these tables:
   - `experiments`
   - `hypotheses`
   - `insights`
   - `team_probabilities`
   - `next_experiments`

### 1.4 Get Your API Keys

1. Click "Settings" (gear icon) in the left sidebar
2. Click "API" under "Project Settings"
3. Copy these values (you'll need them later):
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)
   - **service_role key** (click "Reveal" first, also starts with `eyJ...`)

## Step 2: Anthropic API Key

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign in or create an account
3. Click "API Keys" in the navigation
4. Click "Create Key"
5. Name it `baseball-scientist`
6. Copy the key (starts with `sk-ant-...`)
7. Save it securely (you can't see it again!)

## Step 3: Local Development Setup

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and fill in your values:

```env
# From Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here

# From Supabase (Step 1.4)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key

# Generate a random secret for cron security
CRON_SECRET=your-random-secret-string-here
```

**Generate CRON_SECRET:**
```bash
# On Mac/Linux
openssl rand -base64 32

# Or use any random string generator
```

### 3.3 Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) - you should see the app (with no data yet).

### 3.4 Test the Research Cycle Manually

Trigger a research cycle manually to populate the database:

```bash
curl "http://localhost:3000/api/research?secret=your-cron-secret-here"
```

Replace `your-cron-secret-here` with your actual `CRON_SECRET` value.

After ~10-15 seconds, refresh your browser and you should see research data!

## Step 4: Deploy to Vercel

### 4.1 Connect GitHub Repository

1. Push your code to GitHub:

```bash
git add .
git commit -m "Initial Auto-Baseball-Scientist setup"
git push origin main
```

2. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Click "Import"

### 4.2 Configure Environment Variables

In the Vercel project settings:

1. Go to "Settings" → "Environment Variables"
2. Add all four variables from your `.env` file:
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
3. Set environment to "Production" for each
4. Click "Save"

### 4.3 Deploy

1. Click "Deploy"
2. Wait for build to complete (~2 minutes)
3. Visit your deployment URL
4. You should see your research data!

### 4.4 Enable Vercel Cron

The `vercel.json` file is already configured to run the research cycle every 6 hours.

**Cron Schedule:**
- Runs at: 12am, 6am, 12pm, 6pm UTC daily
- Endpoint: `/api/research`
- Authentication: Uses `CRON_SECRET` via Authorization header

**To customize the schedule**, edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/research",
      "schedule": "0 */6 * * *"  // Change this
    }
  ]
}
```

**Schedule examples:**
- Every 6 hours: `0 */6 * * *`
- Every 12 hours: `0 */12 * * *`
- Daily at 9am UTC: `0 9 * * *`
- Every hour: `0 * * * *`

**Note:** Vercel Hobby plan allows cron jobs on Pro+ plans only. For free tier, you can:
1. Use [cron-job.org](https://cron-job.org) to hit your endpoint
2. Use GitHub Actions
3. Manually trigger via the GET endpoint

## Step 5: Manual Triggering (Alternative to Cron)

If you don't have Vercel Pro, trigger research cycles manually:

### Option A: Browser

Visit: `https://your-app.vercel.app/api/research?secret=YOUR_CRON_SECRET`

### Option B: cron-job.org

1. Go to [https://cron-job.org](https://cron-job.org)
2. Create free account
3. Create new cron job:
   - URL: `https://your-app.vercel.app/api/research?secret=YOUR_CRON_SECRET`
   - Schedule: Every 6 hours
   - Enable job

### Option C: GitHub Actions

Create `.github/workflows/research-cron.yml`:

```yaml
name: Trigger Research Cycle
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Allow manual trigger

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Research API
        run: |
          curl -X POST "https://your-app.vercel.app/api/research" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` to GitHub repository secrets.

## Step 6: Update MLB Data

The research cycle uses hardcoded data in `/app/api/research/route.ts`.

**To update with current odds and moves:**

1. Edit the `CURRENT_MLB_DATA` constant
2. Update odds from sportsbooks (DraftKings, FanDuel, etc.)
3. Add recent trades/signings
4. Deploy changes

**For automatic updates**, integrate with:
- [The Odds API](https://the-odds-api.com) for live odds
- [MLB API](https://statsapi.mlb.com/docs/) for transactions
- [ESPN API](http://www.espn.com/apis/devcenter/docs/) for news

## Troubleshooting

### "No Research Yet" on first load

**Solution:** Trigger a research cycle manually (see Step 3.4)

### Research cycle returns 401 Unauthorized

**Solution:** Check that `CRON_SECRET` matches in:
- `.env` file
- Vercel environment variables
- Your manual trigger URL

### Supabase connection errors

**Solution:**
1. Verify all three Supabase env vars are correct
2. Check Supabase project is running (not paused)
3. Verify RLS policies are set correctly

### Claude API errors

**Solution:**
1. Verify `ANTHROPIC_API_KEY` is correct
2. Check you have API credits remaining
3. Ensure you're using Claude 4.5 (sonnet or opus)

### Realtime updates not working

**Solution:**
1. Check Realtime is enabled in Supabase (Step 1.3)
2. Verify table replication is turned on
3. Check browser console for WebSocket errors

## Next Steps

### Customize the System Prompt

Edit `claude.code.md` to:
- Add new hypothesis types
- Adjust simulation logic
- Change output format
- Focus on specific teams/players

### Enhance the UI

- Add team logos
- Create historical charts
- Add experiment history page
- Build admin dashboard

### Add More Data Sources

Integrate real-time data:
- Live odds from sportsbooks
- Transaction wire feeds
- Social media sentiment
- Expert predictions aggregation

### Scale the Analysis

- Add player-level predictions
- Simulate division races
- Project individual awards
- Analyze playoff matchups

## Cost Estimates

**Free Tier Limits:**
- Supabase: 500MB database, 2GB bandwidth/month
- Vercel: 100GB bandwidth, 6,000 build minutes/month
- Anthropic: Pay per use (~$0.015 per research cycle)

**Monthly costs for 4 cycles/day:**
- ~120 research cycles/month
- ~$1.80/month in Claude API costs
- Everything else free (within limits)

## Support

For issues or questions:
1. Check logs in Vercel dashboard
2. Check Supabase logs in project dashboard
3. Review this guide's troubleshooting section
4. Check Claude Code documentation

---

**You're all set!** Your Auto-Baseball-Scientist is now running autonomously, analyzing the 2026 MLB off-season 24/7.
