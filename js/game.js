// Had Gadya - Main Game Controller
// Manages menus, level loading, and game flow

class HadGadyaGame {
    constructor() {
        this.engine = new GameEngine();
        this.currentLevel = null;
        this.currentLevelNum = 0;
        this.isBonusLevel = false;  // Track if playing bonus level
        
        // New Game+ difficulty system
        this.difficultyLevel = 1;  // 1 = normal, 2+ = harder
        this.speedMultiplier = 1.0;  // Enemies move faster each playthrough
        
        // Selected difficulty: 'easy', 'normal', 'hard', 'extreme'
        this.selectedDifficulty = 'normal';
        
        // Level configurations with verses
        this.levelConfigs = [
            { num: 1, class: Level1, icon: '🐐', title: 'Buy the Goat', hebrew: 'חד גדיא',
              verse: 'One little goat, one little goat: Which my father bought for two zuzim. One little goat, one little goat.' },
            { num: 2, class: Level2, icon: '🐱', title: 'Cat vs Goat', hebrew: 'ואתא שונרא',
              verse: 'Then came a cat and ate the goat, which my father bought for two zuzim. One little goat, one little goat.' },
            { num: 3, class: Level3, icon: '🐕', title: 'Dog Shmup', hebrew: 'ואתא כלבא',
              verse: 'Then came a dog and bit the cat, that ate the goat, which my father bought for two zuzim. One little goat, one little goat.' },
            { num: 4, class: Level4, icon: '🪵', title: 'Tank Battle', hebrew: 'ואתא חוטרא',
              verse: 'Then came a stick and beat the dog, that bit the cat, that ate the goat, which my father bought for two zuzim. One little goat, one little goat.' },
            { num: 5, class: Level5, icon: '🔥', title: 'Burn the Sticks', hebrew: 'ואתא נורא',
              verse: 'Then came fire and burnt the stick, that beat the dog, that bit the cat, that ate the goat, which my father bought for two zuzim. One little goat, one little goat.' },
            { num: 6, class: Level6, icon: '💧', title: 'Chase the Fire', hebrew: 'ואתא מיא',
              verse: 'Then came water and quenched the fire, that burnt the stick, that beat the dog, that bit the cat, that ate the goat, which my father bought for two zuzim. One little goat, one little goat.' },
            { num: 7, class: Level7, icon: '🐂', title: 'Drink the Puddles', hebrew: 'ואתא תורא',
              verse: 'Then came an ox and drank the water, that quenched the fire, that burnt the stick, that beat the dog, that bit the cat, that ate the goat, which my father bought for two zuzim. One little goat, one little goat.' },
            { num: 8, class: Level8, icon: '🔪', title: 'The Bullfight', hebrew: 'ואתא השוחט',
              verse: 'Then came a slaughterer and slaughtered the ox, that drank the water, that quenched the fire, that burnt the stick, that beat the dog, that bit the cat, that ate the goat, which my father bought for two zuzim. One little goat, one little goat.' },
            { num: 9, class: Level9, icon: '💀', title: 'Death Race', hebrew: 'ואתא מלאך המות',
              verse: 'Then came the Angel of Death and killed the slaughterer, that slaughtered the ox, that drank the water, that quenched the fire, that burnt the stick, that beat the dog, that bit the cat, that ate the goat, which my father bought for two zuzim. One little goat, one little goat.' },
            { num: 10, class: Level10, icon: '✡️', title: 'Final Battle', hebrew: 'ואתא הקדוש ברוך הוא',
              verse: 'Then came the Holy One, Blessed be He, and destroyed the Angel of Death, that killed the slaughterer, that slaughtered the ox, that drank the water, that quenched the fire, that burnt the stick, that beat the dog, that bit the cat, that ate the goat, which my father bought for two zuzim. One little goat, one little goat.' }
        ];
        
        // Bind UI events
        this.setupUI();
        
        // Show epic title screen first, then main menu
        this.showTitleSplash();
    }
    
    showTitleSplash() {
        // Hide everything first
        this.hideAllScreens();
        
        // Show the epic Mortal Kombat style title screen
        if (window.vsSplash) {
            window.vsSplash.showTitleScreen(() => {
                // Small delay to prevent click-through to menu buttons
                setTimeout(() => {
                    this.showMainMenu();
                }, 100);
            });
        } else {
            this.showMainMenu();
        }
    }
    
    setupUI() {
        // Add sound to all menu buttons
        const playBlip = () => {
            if (window.audioManager) window.audioManager.playSynthSound('blip');
        };
        const playSelect = () => {
            if (window.audioManager) window.audioManager.playSynthSound('select');
        };
        
        // Main menu buttons
        document.getElementById('start-game-btn').onclick = () => { playSelect(); this.startNewGame(); };
        document.getElementById('level-select-btn').onclick = () => { playBlip(); this.showLevelSelect(); };
        document.getElementById('high-scores-btn').onclick = () => { playBlip(); this.showHighScores(); };
        document.getElementById('how-to-play-btn').onclick = () => { playBlip(); this.showHowToPlay(); };
        
        // Start game dialog buttons
        document.getElementById('start-game-go-btn').onclick = () => { playSelect(); this.actuallyStartGame(); };
        document.getElementById('start-game-back-btn').onclick = () => { playBlip(); this.showMainMenu(); };
        
        // Start game dialog difficulty buttons
        document.querySelectorAll('.start-diff-btn').forEach(btn => {
            btn.onclick = () => { 
                playBlip(); 
                this.setDifficulty(btn.dataset.difficulty);
                // Update the active state for start dialog buttons
                document.querySelectorAll('.start-diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });
        
        // Level select
        document.getElementById('back-to-menu-btn').onclick = () => { playBlip(); this.showMainMenu(); };
        
        // Difficulty buttons (for level select/practice)
        document.querySelectorAll('.difficulty-btn:not(.start-diff-btn)').forEach(btn => {
            btn.onclick = () => { playBlip(); this.setDifficulty(btn.dataset.difficulty); };
        });
        
        // How to play
        document.getElementById('back-from-help-btn').onclick = () => this.showMainMenu();
        
        // High scores
        document.getElementById('back-from-scores-btn').onclick = () => this.showMainMenu();
        document.querySelectorAll('[data-hs-difficulty]').forEach(btn => {
            btn.onclick = () => this.filterHighScores(btn.dataset.hsDifficulty);
        });
        
        // Submit score button
        document.getElementById('submit-score-btn').onclick = () => this.submitScore();
        
        // Level intro
        document.getElementById('start-level-btn').onclick = () => this.startCurrentLevel();
        
        // Level complete
        document.getElementById('next-level-btn').onclick = () => this.nextLevel();
        document.getElementById('replay-level-btn').onclick = () => this.replayLevel();
        document.getElementById('complete-to-menu-btn').onclick = () => this.showMainMenu();
        
        // Game over
        document.getElementById('retry-btn').onclick = () => this.replayLevel();
        document.getElementById('game-over-menu-btn').onclick = () => this.showMainMenu();
        
        // Victory
        document.getElementById('victory-menu-btn').onclick = () => this.showMainMenu();
        
        // Pause, Reset, and Home
        document.getElementById('pause-btn').onclick = () => this.togglePause();
        document.getElementById('reset-btn').onclick = () => this.resetCurrentLevel();
        document.getElementById('home-btn').onclick = () => this.goHome();
    }
    
    goHome() {
        this.engine.paused = false;
        this.engine.running = false;
        this.currentLevel = null;
        document.getElementById('game-controls').classList.add('hidden');
        document.getElementById('pause-btn').textContent = '⏸️ Pause';
        this.showMainMenu();
    }
    
    setDifficulty(difficulty) {
        this.selectedDifficulty = difficulty;
        
        // Update UI
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('active');
            }
        });
    }
    
    togglePause() {
        this.engine.paused = !this.engine.paused;
        const pauseBtn = document.getElementById('pause-btn');
        if (this.engine.paused) {
            pauseBtn.textContent = '▶️ Resume';
        } else {
            pauseBtn.textContent = '⏸️ Pause';
        }
    }
    
    resetCurrentLevel() {
        if (this.currentLevel) {
            this.currentLevel.reset();
            this.engine.levelTime = 0;
            if (this.engine.awakeness < 50) {
                this.engine.awakeness = 50;
            }
            this.engine.paused = false;
            document.getElementById('pause-btn').textContent = '⏸️ Pause';
        }
    }
    
    hideAllScreens() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('level-select').classList.add('hidden');
        document.getElementById('how-to-play').classList.add('hidden');
        document.getElementById('level-intro').classList.add('hidden');
        document.getElementById('level-complete').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('victory').classList.add('hidden');
        document.getElementById('high-scores').classList.add('hidden');
        document.getElementById('start-game-dialog').classList.add('hidden');
        document.getElementById('battle-ui').classList.add('hidden');
        document.getElementById('hud').style.display = 'none';
        document.getElementById('game-controls').classList.add('hidden');
        document.getElementById('gameplay-verse').style.display = 'none';
        this.engine.paused = false;
        document.getElementById('pause-btn').textContent = '⏸️ Pause';
    }
    
    showMainMenu() {
        this.engine.stop();
        this.hideAllScreens();
        document.getElementById('main-menu').classList.remove('hidden');
        
        // Stop music when returning to menu
        if (window.musicPlayer) {
            window.musicPlayer.stop();
        }
    }
    
    showLevelSelect() {
        this.hideAllScreens();
        document.getElementById('level-select').classList.remove('hidden');
        
        // Build level grid
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';
        
        this.levelConfigs.forEach(config => {
            const card = document.createElement('div');
            card.className = 'level-card';
            
            const isUnlocked = config.num <= this.engine.levelProgress.unlockedLevel;
            const levelData = this.engine.levelProgress.levels[config.num];
            
            if (!isUnlocked) {
                card.classList.add('locked');
            }
            
            card.innerHTML = `
                <div class="level-icon">${isUnlocked ? config.icon : '🔒'}</div>
                <div class="level-num">${config.num}</div>
                <div class="level-stars">${levelData ? '⭐'.repeat(levelData.stars) : ''}</div>
            `;
            
            if (isUnlocked) {
                card.onclick = () => this.selectLevel(config.num);
            }
            
            grid.appendChild(card);
        });
    }
    
    showHowToPlay() {
        this.hideAllScreens();
        document.getElementById('how-to-play').classList.remove('hidden');
    }
    
    showLevelIntro(levelNum) {
        this.hideAllScreens();
        document.getElementById('level-intro').classList.remove('hidden');
        
        const config = this.levelConfigs[levelNum - 1];
        
        // Show difficulty level if in New Game+
        const difficultyText = this.difficultyLevel > 1 ? ` (NG+${this.difficultyLevel - 1})` : '';
        document.getElementById('level-title').textContent = `Level ${levelNum}: ${config.icon} ${config.title}${difficultyText}`;
        
        // Create temporary instance to get description
        const tempLevel = new config.class(this.engine);
        document.getElementById('level-description').textContent = tempLevel.description;
        document.getElementById('level-instructions').textContent = tempLevel.instructions;
        
        // Add verse
        document.getElementById('level-verse').innerHTML = `<strong>"${config.verse}"</strong>`;
        
        // Verse will be spoken when level actually starts (after clicking Start Level button)
    }
    
    showLevelComplete(time, stars) {
        this.engine.stop();
        this.hideAllScreens();
        document.getElementById('level-complete').classList.remove('hidden');
        
        document.getElementById('complete-time').textContent = this.engine.formatTime(time);
        document.getElementById('complete-stars').textContent = '⭐'.repeat(stars);
        
        // Play level complete fanfare!
        if (window.audioManager) {
            window.audioManager.playSynthSound('levelComplete');
        }
        
        // Play victory announcement with sergeant voice!
        if (window.audioManager) {
            window.audioManager.announceVictory(this.currentLevelNum);
        }
        
        // Hide next level button if this was the last level
        if (this.currentLevelNum >= 10) {
            document.getElementById('next-level-btn').style.display = 'none';
        } else {
            document.getElementById('next-level-btn').style.display = 'block';
        }
    }
    
    showGameOver() {
        this.engine.stop();
        this.hideAllScreens();
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('game-over-time').textContent = this.engine.formatTime(this.engine.totalTime);
        
        // Play death sound!
        if (window.audioManager) {
            window.audioManager.playSynthSound('death');
        }
        
        // Show the reason for game over
        const reasonElement = document.getElementById('game-over-reason');
        if (reasonElement) {
            reasonElement.textContent = this.engine.gameOverReason || '😴 You fell asleep during the Seder!';
        }
        
        // Stop music on game over
        if (window.musicPlayer) {
            window.musicPlayer.stop();
        }
        
        // Play game over sound with reason
        if (window.audioManager) {
            window.audioManager.playGameOver(this.engine.gameOverReason);
        }
    }
    
    async showVictory() {
        this.engine.stop();
        this.hideAllScreens();
        document.getElementById('victory').classList.remove('hidden');
        document.getElementById('victory-time').textContent = this.engine.formatTime(this.engine.totalTime);
        document.getElementById('victory-stars').textContent = this.engine.getTotalStars();
        
        // Log victory and check for high score
        const totalTime = this.engine.totalTime;
        const totalStars = this.engine.getTotalStars();
        
        if (window.supabaseClient) {
            window.supabaseClient.logVictory(this.selectedDifficulty, totalTime, totalStars);
            
            // Check if this is a new high score
            const isNewHS = await window.supabaseClient.isNewHighScore(this.selectedDifficulty, totalTime);
            if (isNewHS) {
                document.getElementById('new-high-score-msg').classList.remove('hidden');
                document.getElementById('name-input-container').classList.remove('hidden');
                this.pendingHighScore = { difficulty: this.selectedDifficulty, time: totalTime, stars: totalStars };
            }
        }
        
        // Play final victory announcement
        if (window.audioManager) {
            window.audioManager.announceVictory(10);
        }
        
        // After 3 seconds, offer New Game+
        setTimeout(() => {
            this.difficultyLevel++;
            this.speedMultiplier = 1 + (this.difficultyLevel - 1) * 0.25;  // 25% faster each playthrough
        }, 3000);
    }
    
    async submitScore() {
        if (!this.pendingHighScore) return;
        
        const nameInput = document.getElementById('player-name-input');
        const playerName = nameInput.value.trim() || 'Anonymous';
        
        if (window.supabaseClient) {
            await window.supabaseClient.submitHighScore(
                this.pendingHighScore.difficulty,
                this.pendingHighScore.time,
                this.pendingHighScore.stars,
                playerName
            );
        }
        
        // Hide the input form and show confirmation
        document.getElementById('name-input-container').classList.add('hidden');
        document.getElementById('new-high-score-msg').textContent = '✅ Score submitted!';
        this.pendingHighScore = null;
    }
    
    async showHighScores() {
        this.hideAllScreens();
        document.getElementById('high-scores').classList.remove('hidden');
        this.loadHighScores('normal');
    }
    
    async filterHighScores(difficulty) {
        // Update button states
        document.querySelectorAll('[data-hs-difficulty]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.hsDifficulty === difficulty) {
                btn.classList.add('active');
            }
        });
        this.loadHighScores(difficulty);
    }
    
    async loadHighScores(difficulty) {
        const listEl = document.getElementById('high-scores-list');
        listEl.innerHTML = '<p style="text-align: center; color: #888;">Loading...</p>';
        
        if (!window.supabaseClient || !window.supabaseClient.enabled) {
            listEl.innerHTML = '<p style="text-align: center; color: #888;">High scores not available (offline mode)</p>';
            return;
        }
        
        const scores = await window.supabaseClient.getHighScores(difficulty, 10);
        
        if (!scores || scores.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; color: #888;">No high scores yet. Be the first!</p>';
            return;
        }
        
        let html = '<table style="width: 100%; border-collapse: collapse; color: white;">';
        html += '<tr style="border-bottom: 2px solid gold;"><th>#</th><th>Player</th><th>Time</th><th>Stars</th></tr>';
        
        scores.forEach((score, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
            html += `<tr style="border-bottom: 1px solid #444;">
                <td style="padding: 8px; text-align: center;">${medal}</td>
                <td style="padding: 8px;">${this.escapeHtml(score.player_name)}</td>
                <td style="padding: 8px; text-align: center;">${window.supabaseClient.formatTime(score.total_time)}</td>
                <td style="padding: 8px; text-align: center;">${'⭐'.repeat(score.total_stars)}</td>
            </tr>`;
        });
        
        html += '</table>';
        listEl.innerHTML = html;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    startNewGame() {
        // Reset game state
        this.engine.totalTime = 0;
        this.engine.awakeness = 100;
        this.isBonusLevel = false;  // Reset bonus level flag
        // Keep difficulty level for New Game+ (don't reset)
        
        // Show difficulty selection dialog
        this.showStartGameDialog();
    }
    
    showStartGameDialog() {
        this.hideAllScreens();
        document.getElementById('start-game-dialog').classList.remove('hidden');
    }
    
    actuallyStartGame() {
        // Play epic Mortal Kombat style FIGHT sound!
        if (window.audioManager) {
            window.audioManager.playSynthSound('fightStart');
        }
        
        // Log game start
        if (window.supabaseClient) {
            window.supabaseClient.logGameStart(this.selectedDifficulty);
        }
        
        // Start from level 1
        this.currentLevelNum = 1;
        this.selectLevel(1);
    }
    
    // Get current difficulty multiplier for levels to use
    getDifficultyMultiplier() {
        return this.speedMultiplier;
    }
    
    selectLevel(levelNum) {
        this.currentLevelNum = levelNum;
        
        // Show epic VS splash screen with verse, then go directly to gameplay!
        if (window.vsSplash) {
            this.hideAllScreens();
            window.vsSplash.show(levelNum, () => {
                // Go directly to gameplay after splash - no extra intro screen needed
                this.startCurrentLevel();
            });
        } else {
            // Fallback: show intro if no splash
            this.showLevelIntro(levelNum);
        }
    }
    
    startCurrentLevel() {
        this.hideAllScreens();
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('game-controls').classList.remove('hidden');
        
        // Play level start sound!
        if (window.audioManager) {
            window.audioManager.playSynthSound('levelStart');
        }
        
        // Log level start
        if (window.supabaseClient) {
            window.supabaseClient.logLevelStart(this.currentLevelNum, this.selectedDifficulty, this.engine.awakeness);
        }
        
        // Show verse during gameplay
        const config = this.levelConfigs[this.currentLevelNum - 1];
        const verseDisplay = document.getElementById('gameplay-verse');
        verseDisplay.innerHTML = `📜 "${config.verse}"`;
        verseDisplay.style.display = 'block';
        
        // Update level display
        document.getElementById('current-level').textContent = this.currentLevelNum;
        
        // Create level instance with difficulty multiplier
        this.currentLevel = new config.class(this.engine, this.selectedDifficulty);
        
        // Apply difficulty multiplier to the level (for New Game+)
        if (this.currentLevel.applyDifficulty) {
            this.currentLevel.applyDifficulty(this.speedMultiplier);
        }
        
        // Reset level timer
        this.engine.levelTime = 0;
        
        // Play verse narration first, then start the game
        const startGameplay = () => {
            // Start the Chad Gadya music!
            if (window.musicPlayer) {
                window.musicPlayer.setSpeed(1.0);  // Reset speed
                window.musicPlayer.play();
            }
            
            // Set up callbacks
            this.engine.onUpdate = (dt) => {
                if (this.currentLevel) {
                    this.currentLevel.update(dt);
                }
            };
            
            this.engine.onRender = (ctx) => {
                if (this.currentLevel) {
                    this.currentLevel.render(ctx);
                }
            };
            
            this.engine.start();
        };
        
        // Verse is now played during the VS splash screen, so start gameplay immediately
        startGameplay();
        
        this.engine.onLevelComplete = () => {
            const time = this.engine.levelTime;
            const stars = this.engine.completeLevelWithStars(this.currentLevelNum, time);
            
            // Log level completion
            if (window.supabaseClient) {
                window.supabaseClient.logLevelComplete(
                    this.currentLevelNum, 
                    this.selectedDifficulty, 
                    time, 
                    stars, 
                    this.engine.awakeness
                );
            }
            
            // Stop the music
            if (window.musicPlayer) {
                window.musicPlayer.stop();
            }
            
            if (this.currentLevelNum >= 10 && !this.isBonusLevel) {
                // Completed all 10 levels - show bonus level!
                this.showBonusLevelIntro();
            } else if (this.isBonusLevel) {
                // Completed bonus level - now show victory!
                this.showVictory();
            } else {
                this.showLevelComplete(time, stars);
            }
        };
        
        this.engine.onGameOver = () => {
            // Log game over
            if (window.supabaseClient) {
                window.supabaseClient.logGameOver(
                    this.currentLevelNum,
                    this.selectedDifficulty,
                    this.engine.gameOverReason,
                    this.engine.totalTime,
                    this.engine.awakeness
                );
            }
            this.showGameOver();
        };
        
        // Engine will be started after verse finishes in startGameplay()
    }
    
    showBonusLevelIntro() {
        this.engine.stop();
        this.hideAllScreens();
        
        // Play celebration sound
        if (window.audioManager) {
            window.audioManager.playSynthSound('levelComplete');
        }
        
        // Show the level complete screen with bonus level button
        document.getElementById('level-complete').classList.remove('hidden');
        document.getElementById('complete-time').textContent = this.engine.formatTime(this.engine.levelTime);
        document.getElementById('complete-stars').textContent = '⭐⭐⭐';
        
        // Change next level button to bonus level
        const nextBtn = document.getElementById('next-level-btn');
        nextBtn.textContent = '🫓 BONUS ROUND!';
        nextBtn.style.display = 'block';
        nextBtn.onclick = () => { this.startBonusLevel(); };
    }
    
    startBonusLevel() {
        this.isBonusLevel = true;
        this.currentLevelNum = 11;  // Track as level 11 for stats
        
        // Hide screens and show HUD
        this.hideAllScreens();
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('game-controls').classList.remove('hidden');
        
        // Update level display for bonus
        document.getElementById('current-level').textContent = 'BONUS';
        
        // Show verse during gameplay
        const verseDisplay = document.getElementById('gameplay-verse');
        verseDisplay.innerHTML = '📜 "Find the Afikoman before the Seder can end!"';
        verseDisplay.style.display = 'block';
        
        // Create bonus level instance
        this.currentLevel = new BonusLevel(this.engine, this.selectedDifficulty);
        
        // Reset level timer
        this.engine.levelTime = 0;
        
        // Start gameplay
        if (window.musicPlayer) {
            window.musicPlayer.setSpeed(1.2);  // Faster music for bonus!
            window.musicPlayer.play();
        }
        
        this.engine.onUpdate = (dt) => {
            if (this.currentLevel) {
                this.currentLevel.update(dt);
            }
        };
        
        this.engine.onRender = (ctx) => {
            if (this.currentLevel) {
                this.currentLevel.render(ctx);
            }
        };
        
        this.engine.start();
    }
    
    nextLevel() {
        if (this.currentLevelNum < 10) {
            this.currentLevelNum++;
            // Show VS splash with verse before level intro!
            this.selectLevel(this.currentLevelNum);
        }
    }
    
    replayLevel() {
        // Reset awakeness to full when retrying
        this.engine.awakeness = 100;
        // Reset bonus level flag if replaying from menu
        if (!this.isBonusLevel) {
            this.selectLevel(this.currentLevelNum);
        } else {
            this.startBonusLevel();
        }
    }
    
    replayLevelQuick() {
        // Quick replay without splash screen (for in-game reset)
        if (this.currentLevel) {
            this.currentLevel.reset();
        }
        this.engine.levelTime = 0;
        
        // Reset awakeness to full on quick replay too
        this.engine.awakeness = 100;
        
        this.startCurrentLevel();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    window.game = new HadGadyaGame();
});
