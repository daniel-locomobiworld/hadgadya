# Deployment Guide for Had Gadya

This guide explains how to deploy Had Gadya to Netlify with Supabase for logging and high scores.

## Prerequisites

- A [Netlify](https://netlify.com) account (free tier works)
- A [Supabase](https://supabase.com) account (free tier works)
- Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Set Up Supabase

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com) and sign in
   - Click "New Project"
   - Choose a name and region
   - Set a database password (save this!)
   - Wait for the project to be created

2. **Create the database tables:**
   - In your Supabase dashboard, go to **SQL Editor**
   - Click "New Query"
   - Copy and paste the contents of `supabase-schema.sql` from this repo
   - Click "Run" to execute the SQL
   - This creates the `game_events` and `high_scores` tables

3. **Get your API credentials:**
   - Go to **Settings** → **API**
   - Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
   - Copy the **anon/public** key (this is safe to use in frontend code)
   - Save these for the next step

## Step 2: Deploy to Netlify

### Option A: Deploy via Git (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Connect to Netlify:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select your Git provider and repository
   - Leave build settings as-is (no build command needed for static site)
   - Click "Deploy site"

3. **Set environment variables:**
   - Go to **Site settings** → **Environment variables**
   - Add two new variables:
     - `SUPABASE_URL` = Your Supabase Project URL
     - `SUPABASE_ANON_KEY` = Your Supabase anon/public key
   - Click "Save"

4. **Trigger a redeploy:**
   - Go to **Deploys** → Click "Trigger deploy" → "Deploy site"

### Option B: Deploy via CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login and deploy:**
   ```bash
   netlify login
   netlify init
   netlify deploy --prod
   ```

3. **Set environment variables:**
   ```bash
   netlify env:set SUPABASE_URL "https://your-project.supabase.co"
   netlify env:set SUPABASE_ANON_KEY "your-anon-key"
   ```

## Step 3: Verify Deployment

1. Visit your Netlify URL (e.g., `https://your-site.netlify.app`)
2. Open browser DevTools → Console
3. You should NOT see "Supabase not configured" message
4. Play a game and check:
   - In Supabase dashboard → **Table Editor** → `game_events`
   - You should see new rows for game events
5. Complete the game to test high score submission

## Local Development

For local testing without Supabase:
- The game works offline - logging just won't save
- High scores will show "offline mode"

For local testing WITH Supabase:
1. Create a file `js/config.js`:
   ```javascript
   window.SUPABASE_URL = 'https://your-project.supabase.co';
   window.SUPABASE_ANON_KEY = 'your-anon-key';
   ```
2. Add `<script src="js/config.js"></script>` before `supabase.js` in `index.html`
3. Add `js/config.js` to `.gitignore` to keep keys private

## Troubleshooting

### "High scores not available (offline mode)"
- Check that environment variables are set in Netlify
- Verify the edge function is enabled (check Netlify Functions tab)
- Check browser console for errors

### Data not appearing in Supabase
- Check that RLS policies are correctly set up
- Verify the anon key has proper permissions
- Look for errors in browser console

### Edge function errors
- Edge functions require Netlify to serve the site (won't work with `netlify dev` always)
- Check Netlify Functions logs in dashboard

## Security Notes

- The `anon` key is safe to expose in frontend code
- Row Level Security (RLS) protects the database
- Users can only insert events, not read/modify others' data (except high scores which are public)
- Consider rate limiting if you experience abuse

## Features

### Gameplay Logging
Every game session logs:
- Game start (with difficulty setting)
- Level starts (with awakeness level)
- Level completions (with time, stars, awakeness)
- Game overs (with reason and stats)
- Victories (with total time and stars)

### High Scores
- Top 10 leaderboard per difficulty level
- Players can enter their name on victory
- Scores sorted by fastest completion time
- Cached for 1 minute to reduce API calls

## Analytics Queries

Run these in Supabase SQL Editor to get insights:

```sql
-- Total games started by difficulty
SELECT difficulty, COUNT(*) as games_started
FROM game_events
WHERE event_type = 'game_start'
GROUP BY difficulty
ORDER BY games_started DESC;

-- Win rate by difficulty
SELECT 
    difficulty,
    COUNT(*) FILTER (WHERE event_type = 'victory') as wins,
    COUNT(*) FILTER (WHERE event_type = 'game_over') as losses,
    ROUND(COUNT(*) FILTER (WHERE event_type = 'victory')::decimal / 
          NULLIF(COUNT(*) FILTER (WHERE event_type IN ('victory', 'game_over')), 0) * 100, 1) as win_rate
FROM game_events
WHERE event_type IN ('victory', 'game_over')
GROUP BY difficulty;

-- Most common game over reasons
SELECT game_over_reason, COUNT(*) as count
FROM game_events
WHERE event_type = 'game_over'
GROUP BY game_over_reason
ORDER BY count DESC
LIMIT 10;

-- Average completion time by level and difficulty
SELECT 
    level_num,
    difficulty,
    ROUND(AVG(completion_time)::decimal, 2) as avg_time,
    COUNT(*) as completions
FROM game_events
WHERE event_type = 'level_complete'
GROUP BY level_num, difficulty
ORDER BY level_num, difficulty;
```
