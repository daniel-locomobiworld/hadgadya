// Had Gadya - Supabase Integration
// Handles play logging and high score tracking

class SupabaseClient {
    constructor() {
        // These will be set via environment variables in Netlify
        // For local development, you can set them directly
        this.supabaseUrl = window.SUPABASE_URL || '';
        this.supabaseKey = window.SUPABASE_ANON_KEY || '';
        this.enabled = !!(this.supabaseUrl && this.supabaseKey);
        
        if (!this.enabled) {
            console.log('Supabase not configured - running in offline mode');
        }
        
        // Cache for high scores
        this.highScoresCache = null;
        this.highScoresCacheTime = 0;
        this.cacheDuration = 60000; // 1 minute cache
        
        // Session tracking
        this.sessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();
    }
    
    generateSessionId() {
        return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async fetch(endpoint, options = {}) {
        if (!this.enabled) return null;
        
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/${endpoint}`, {
                ...options,
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': options.prefer || 'return=representation',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                console.error('Supabase error:', response.status, await response.text());
                return null;
            }
            
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        } catch (error) {
            console.error('Supabase fetch error:', error);
            return null;
        }
    }
    
    // Log when a game session starts
    async logGameStart(difficulty) {
        const data = {
            session_id: this.sessionId,
            event_type: 'game_start',
            difficulty: difficulty,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            screen_width: window.innerWidth,
            screen_height: window.innerHeight
        };
        
        return this.fetch('game_events', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    // Log when a level starts
    async logLevelStart(levelNum, difficulty, currentAwakeness) {
        const data = {
            session_id: this.sessionId,
            event_type: 'level_start',
            level_num: levelNum,
            difficulty: difficulty,
            awakeness: Math.round(currentAwakeness),
            timestamp: new Date().toISOString()
        };
        
        return this.fetch('game_events', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    // Log when a level is completed
    async logLevelComplete(levelNum, difficulty, time, stars, awakeness) {
        const data = {
            session_id: this.sessionId,
            event_type: 'level_complete',
            level_num: levelNum,
            difficulty: difficulty,
            completion_time: time,
            stars: stars,
            awakeness: Math.round(awakeness),
            timestamp: new Date().toISOString()
        };
        
        return this.fetch('game_events', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    // Log game over
    async logGameOver(levelNum, difficulty, reason, totalTime, awakeness) {
        const data = {
            session_id: this.sessionId,
            event_type: 'game_over',
            level_num: levelNum,
            difficulty: difficulty,
            game_over_reason: reason,
            total_time: totalTime,
            awakeness: Math.round(awakeness),
            timestamp: new Date().toISOString()
        };
        
        return this.fetch('game_events', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    // Log full game victory
    async logVictory(difficulty, totalTime, totalStars) {
        const data = {
            session_id: this.sessionId,
            event_type: 'victory',
            difficulty: difficulty,
            total_time: totalTime,
            total_stars: totalStars,
            timestamp: new Date().toISOString()
        };
        
        // Also submit as potential high score
        await this.submitHighScore(difficulty, totalTime, totalStars);
        
        return this.fetch('game_events', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    // Submit a high score
    async submitHighScore(difficulty, totalTime, totalStars, playerName = 'Anonymous') {
        const data = {
            player_name: playerName,
            difficulty: difficulty,
            total_time: totalTime,
            total_stars: totalStars,
            session_id: this.sessionId,
            submitted_at: new Date().toISOString()
        };
        
        const result = await this.fetch('high_scores', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        // Invalidate cache
        this.highScoresCache = null;
        
        return result;
    }
    
    // Get high scores (with caching)
    async getHighScores(difficulty = null, limit = 10) {
        // Check cache
        if (this.highScoresCache && Date.now() - this.highScoresCacheTime < this.cacheDuration) {
            return this.filterHighScores(this.highScoresCache, difficulty, limit);
        }
        
        // Fetch all high scores (we'll filter client-side)
        let endpoint = 'high_scores?order=total_time.asc&limit=100';
        
        const result = await this.fetch(endpoint, { method: 'GET' });
        
        if (result) {
            this.highScoresCache = result;
            this.highScoresCacheTime = Date.now();
            return this.filterHighScores(result, difficulty, limit);
        }
        
        return [];
    }
    
    filterHighScores(scores, difficulty, limit) {
        let filtered = scores;
        if (difficulty) {
            filtered = scores.filter(s => s.difficulty === difficulty);
        }
        return filtered.slice(0, limit);
    }
    
    // Check if a time would be a new high score
    async isNewHighScore(difficulty, totalTime) {
        const scores = await this.getHighScores(difficulty, 10);
        if (scores.length < 10) return true;
        return totalTime < scores[scores.length - 1].total_time;
    }
    
    // Format time for display
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
}

// Initialize global instance
window.supabaseClient = new SupabaseClient();
