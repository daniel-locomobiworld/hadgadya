// Had Gadya - Main Game Controller
// Manages menus, level loading, and game flow

class HadGadyaGame {
    constructor() {
        this.engine = new GameEngine();
        this.currentLevel = null;
        this.currentLevelNum = 0;
        
        // New Game+ difficulty system
        this.difficultyLevel = 1;  // 1 = normal, 2+ = harder
        this.speedMultiplier = 1.0;  // Enemies move faster each playthrough
        
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
        // Main menu buttons
        document.getElementById('start-game-btn').onclick = () => this.startNewGame();
        document.getElementById('level-select-btn').onclick = () => this.showLevelSelect();
        document.getElementById('how-to-play-btn').onclick = () => this.showHowToPlay();
        
        // Level select
        document.getElementById('back-to-menu-btn').onclick = () => this.showMainMenu();
        
        // How to play
        document.getElementById('back-from-help-btn').onclick = () => this.showMainMenu();
        
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
    
    showVictory() {
        this.engine.stop();
        this.hideAllScreens();
        document.getElementById('victory').classList.remove('hidden');
        document.getElementById('victory-time').textContent = this.engine.formatTime(this.engine.totalTime);
        document.getElementById('victory-stars').textContent = this.engine.getTotalStars();
        
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
    
    startNewGame() {
        // Reset game state
        this.engine.totalTime = 0;
        this.engine.awakeness = 100;
        // Keep difficulty level for New Game+ (don't reset)
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
        
        // Show verse during gameplay
        const config = this.levelConfigs[this.currentLevelNum - 1];
        const verseDisplay = document.getElementById('gameplay-verse');
        verseDisplay.innerHTML = `📜 "${config.verse}"`;
        verseDisplay.style.display = 'block';
        
        // Update level display
        document.getElementById('current-level').textContent = this.currentLevelNum;
        
        // Create level instance with difficulty multiplier
        this.currentLevel = new config.class(this.engine);
        
        // Apply difficulty multiplier to the level
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
            
            // Stop the music
            if (window.musicPlayer) {
                window.musicPlayer.stop();
            }
            
            if (this.currentLevelNum >= 10) {
                // Game complete!
                this.showVictory();
            } else {
                this.showLevelComplete(time, stars);
            }
        };
        
        this.engine.onGameOver = () => {
            this.showGameOver();
        };
        
        // Engine will be started after verse finishes in startGameplay()
    }
    
    nextLevel() {
        if (this.currentLevelNum < 10) {
            this.currentLevelNum++;
            // Show VS splash with verse before level intro!
            this.selectLevel(this.currentLevelNum);
        }
    }
    
    replayLevel() {
        // Show VS splash again when replaying
        this.selectLevel(this.currentLevelNum);
    }
    
    replayLevelQuick() {
        // Quick replay without splash screen (for in-game reset)
        if (this.currentLevel) {
            this.currentLevel.reset();
        }
        this.engine.levelTime = 0;
        
        // If awakeness is too low, give some back
        if (this.engine.awakeness < 50) {
            this.engine.awakeness = 50;
        }
        
        this.startCurrentLevel();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    window.game = new HadGadyaGame();
});
