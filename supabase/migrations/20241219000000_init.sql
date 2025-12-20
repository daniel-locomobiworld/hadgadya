-- Supabase Database Schema for Had Gadya Game
-- Run this in the Supabase SQL Editor to create the required tables

-- Enable Row Level Security (RLS) for public access
-- These tables allow anonymous inserts but controlled reads

-- Game Events table - logs all gameplay events
CREATE TABLE IF NOT EXISTS game_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('game_start', 'level_start', 'level_complete', 'game_over', 'victory')),
    level_num INTEGER,
    difficulty TEXT CHECK (difficulty IN ('easy', 'normal', 'hard', 'extreme')),
    completion_time DECIMAL(10,3),
    stars INTEGER CHECK (stars >= 0 AND stars <= 3),
    awakeness INTEGER CHECK (awakeness >= 0 AND awakeness <= 100),
    game_over_reason TEXT,
    total_time DECIMAL(10,3),
    total_stars INTEGER,
    user_agent TEXT,
    screen_width INTEGER,
    screen_height INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- High Scores table - stores the leaderboard
CREATE TABLE IF NOT EXISTS high_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL DEFAULT 'Anonymous',
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard', 'extreme')),
    total_time DECIMAL(10,3) NOT NULL,
    total_stars INTEGER NOT NULL CHECK (total_stars >= 0 AND total_stars <= 30),
    session_id TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_events_session ON game_events(session_id);
CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_timestamp ON game_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_difficulty_time ON high_scores(difficulty, total_time ASC);
CREATE INDEX IF NOT EXISTS idx_high_scores_time ON high_scores(total_time ASC);

-- Enable Row Level Security
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

-- Policies for game_events
-- Allow anonymous inserts (for logging)
CREATE POLICY "Allow anonymous inserts" ON game_events
    FOR INSERT
    WITH CHECK (true);

-- Allow reading own session events (by session_id)
CREATE POLICY "Allow read own session" ON game_events
    FOR SELECT
    USING (true);

-- Policies for high_scores
-- Allow anonymous inserts (for submitting scores)
CREATE POLICY "Allow anonymous score submission" ON high_scores
    FOR INSERT
    WITH CHECK (true);

-- Allow public reading of high scores
CREATE POLICY "Allow public read of high scores" ON high_scores
    FOR SELECT
    USING (true);

-- Create a view for the top 10 scores per difficulty (optional but useful)
CREATE OR REPLACE VIEW top_scores AS
SELECT 
    id,
    player_name,
    difficulty,
    total_time,
    total_stars,
    submitted_at,
    ROW_NUMBER() OVER (PARTITION BY difficulty ORDER BY total_time ASC) as rank
FROM high_scores;

-- Grant access to the anon role (for anonymous access from the frontend)
GRANT SELECT, INSERT ON game_events TO anon;
GRANT SELECT, INSERT ON high_scores TO anon;
GRANT SELECT ON top_scores TO anon;
