// Had Gadya Game Engine
// Core game engine with common functionality

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Input handling
        this.keys = {};
        this.keysJustPressed = {};
        
        // Awakeness system
        this.awakeness = 100;
        this.awakenessDecayRate = 0.5; // Per second
        
        // Timer
        this.totalTime = 0;
        this.levelTime = 0;
        
        // Level data
        this.currentLevel = 1;
        this.levelData = {};
        this.levelProgress = this.loadProgress();
        
        // Setup input listeners
        this.setupInput();
        
        // Callbacks
        this.onUpdate = null;
        this.onRender = null;
        this.onGameOver = null;
        this.onLevelComplete = null;
        
        // Game over reason tracking
        this.gameOverReason = '';
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysJustPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            
            // Prevent scrolling with arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mobile touch controls
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        // Only show touch controls on actual touch devices (not desktop with touch screen)
        // Check for actual mobile devices - exclude desktops with touch screens
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isDesktopUA = /Windows NT|Macintosh|Linux x86/i.test(navigator.userAgent);
        
        // Only show on mobile devices - explicitly exclude desktop even with touch
        this.isMobile = isMobileUA && isTouchDevice && !isDesktopUA;
        
        const mobileControls = document.getElementById('mobile-controls');
        if (this.isMobile && mobileControls) {
            mobileControls.style.display = 'block';
        }
        
        // Touch button mappings
        const touchButtons = {
            'touch-up': 'ArrowUp',
            'touch-down': 'ArrowDown',
            'touch-left': 'ArrowLeft',
            'touch-right': 'ArrowRight',
            'touch-action': 'Space'
        };
        
        Object.entries(touchButtons).forEach(([id, key]) => {
            const btn = document.getElementById(id);
            if (btn) {
                // Touch start
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.keys[key] = true;
                    if (!this.keysJustPressed[key]) {
                        this.keysJustPressed[key] = true;
                    }
                    btn.classList.add('pressed');
                }, { passive: false });
                
                // Touch end
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.keys[key] = false;
                    btn.classList.remove('pressed');
                }, { passive: false });
                
                // Touch cancel
                btn.addEventListener('touchcancel', (e) => {
                    this.keys[key] = false;
                    btn.classList.remove('pressed');
                });
            }
        });
    }
    
    isKeyDown(key) {
        const keyMap = {
            'up': ['ArrowUp', 'KeyW'],
            'down': ['ArrowDown', 'KeyS'],
            'left': ['ArrowLeft', 'KeyA'],
            'right': ['ArrowRight', 'KeyD'],
            'action': ['Space', 'Enter', 'KeyZ'],
            'cancel': ['Escape', 'KeyX']
        };
        
        if (keyMap[key]) {
            return keyMap[key].some(k => this.keys[k]);
        }
        return this.keys[key];
    }
    
    isKeyJustPressed(key) {
        const keyMap = {
            'up': ['ArrowUp', 'KeyW'],
            'down': ['ArrowDown', 'KeyS'],
            'left': ['ArrowLeft', 'KeyA'],
            'right': ['ArrowRight', 'KeyD'],
            'action': ['Space', 'Enter', 'KeyZ'],
            'cancel': ['Escape', 'KeyX']
        };
        
        if (keyMap[key]) {
            return keyMap[key].some(k => this.keysJustPressed[k]);
        }
        return this.keysJustPressed[key];
    }
    
    clearJustPressed() {
        this.keysJustPressed = {};
    }
    
    // Awakeness system
    updateAwakeness(dt) {
        this.awakeness -= this.awakenessDecayRate * dt;
        this.awakeness = Math.max(0, Math.min(100, this.awakeness));
        
        // Update UI
        const fill = document.getElementById('awakeness-fill');
        const percent = document.getElementById('awakeness-percent');
        fill.style.width = this.awakeness + '%';
        percent.textContent = Math.round(this.awakeness) + '%';
        
        if (this.awakeness < 30) {
            fill.classList.add('low');
        } else {
            fill.classList.remove('low');
        }
        
        // Snoring sound when getting sleepy (below 40% awakeness)
        if (window.audioManager) {
            if (this.awakeness < 40) {
                // Volume increases as awakeness decreases (0 at 40%, max at 0%)
                const snoreVolume = (40 - this.awakeness) / 40;
                if (!window.audioManager.snoreInterval) {
                    window.audioManager.startSnoring(snoreVolume);
                } else {
                    window.audioManager.updateSnoreVolume(snoreVolume);
                }
            } else {
                // Stop snoring when awakeness is above 40%
                window.audioManager.stopSnoring();
            }
        }
        
        return this.awakeness > 0;
    }
    
    addAwakeness(amount) {
        this.awakeness = Math.min(100, this.awakeness + amount);
        // Play matzah pickup sound!
        if (window.audioManager) {
            window.audioManager.playSynthSound('matzah');
        }
    }
    
    // Take damage - reduce awakeness with sound
    takeDamage(amount) {
        this.awakeness = Math.max(0, this.awakeness - amount);
        if (window.audioManager) {
            window.audioManager.playSynthSound('damage');
        }
    }
    
    setGameOverReason(reason) {
        this.gameOverReason = reason;
    }
    
    triggerGameOver(reason) {
        this.gameOverReason = reason;
        if (this.onGameOver) {
            this.onGameOver();
        }
    }
    
    // Timer
    updateTimer(dt) {
        this.totalTime += dt;
        this.levelTime += dt;
        
        const totalDisplay = document.getElementById('time-display');
        const levelDisplay = document.getElementById('level-time-display');
        totalDisplay.textContent = this.formatTime(this.totalTime);
        if (levelDisplay) {
            levelDisplay.textContent = this.formatTime(this.levelTime);
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    
    // Game loop
    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    stop() {
        this.running = false;
    }
    
    gameLoop(currentTime) {
        if (!this.running) return;
        
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent huge jumps
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        // Keep audio context alive - browsers can suspend it
        if (window.audioManager && window.audioManager.synthContext) {
            const ctx = window.audioManager.synthContext;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }
        }
        
        if (!this.paused) {
            // Update awakeness
            if (!this.updateAwakeness(this.deltaTime)) {
                this.gameOverReason = '😴 Your awakeness reached zero! You fell asleep at the Seder table.';
                this.onGameOver();
                return;
            }
            
            // Update timer
            this.updateTimer(this.deltaTime);
            
            // Update music speed based on awakeness (speeds up as you get sleepy!)
            if (window.musicPlayer && window.musicPlayer.isPlaying) {
                // Speed up music as awakeness drops
                const speedMultiplier = 1 + (1 - this.awakeness / 100) * 1.2;
                window.musicPlayer.setSpeed(speedMultiplier);
            }
            
            // Level-specific update
            if (this.onUpdate) {
                this.onUpdate(this.deltaTime);
            }
        }
        
        // Render
        this.render();
        
        // Clear just pressed keys
        this.clearJustPressed();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    render() {
        // Draw retro grid background
        this.drawRetroBackground();
        
        // Level-specific render
        if (this.onRender) {
            this.onRender(this.ctx);
        }
        
        // Add CRT scanline effect overlay
        this.drawScanlines();
    }
    
    drawRetroBackground() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1a3a14');
        gradient.addColorStop(0.5, '#2d5a27');
        gradient.addColorStop(1, '#1a3a14');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw subtle grid
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
        this.ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
    
    drawScanlines() {
        // Subtle scanline effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        for (let y = 0; y < this.height; y += 4) {
            this.ctx.fillRect(0, y, this.width, 2);
        }
    }
    
    // Progress management
    loadProgress() {
        const saved = localStorage.getItem('hadGadyaProgress');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            unlockedLevel: 1,
            levels: {}
        };
    }
    
    saveProgress() {
        localStorage.setItem('hadGadyaProgress', JSON.stringify(this.levelProgress));
    }
    
    completeLevelWithStars(levelNum, time) {
        // Calculate stars based on time (these thresholds can be adjusted per level)
        const thresholds = this.getStarThresholds(levelNum);
        let stars = 1;
        if (time <= thresholds[0]) stars = 3;
        else if (time <= thresholds[1]) stars = 2;
        
        // Update progress
        if (!this.levelProgress.levels[levelNum] || this.levelProgress.levels[levelNum].stars < stars) {
            this.levelProgress.levels[levelNum] = {
                stars: stars,
                bestTime: time
            };
        } else if (this.levelProgress.levels[levelNum].bestTime > time) {
            this.levelProgress.levels[levelNum].bestTime = time;
        }
        
        // Unlock next level
        if (levelNum >= this.levelProgress.unlockedLevel && levelNum < 10) {
            this.levelProgress.unlockedLevel = levelNum + 1;
        }
        
        this.saveProgress();
        return stars;
    }
    
    getStarThresholds(levelNum) {
        // Time in seconds for 3 stars, 2 stars
        const thresholds = {
            1: [30, 60],
            2: [45, 90],
            3: [40, 80],
            4: [50, 100],
            5: [35, 70],
            6: [45, 90],
            7: [40, 80],
            8: [50, 100],
            9: [45, 90],
            10: [60, 120]
        };
        return thresholds[levelNum] || [60, 120];
    }
    
    getTotalStars() {
        let total = 0;
        for (let i = 1; i <= 10; i++) {
            if (this.levelProgress.levels[i]) {
                total += this.levelProgress.levels[i].stars;
            }
        }
        return total;
    }
    
    // Collision detection helpers
    rectCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    circleCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < a.radius + b.radius;
    }
    
    pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    }
    
    // Drawing helpers
    drawSprite(emoji, x, y, size) {
        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        // Add glow effect
        this.ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(emoji, x, y);
        this.ctx.shadowBlur = 0;
    }
    
    drawRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
    }
    
    // Retro pixel-style rectangle with border
    drawRetroRect(x, y, w, h, fillColor, borderColor = '#0ff') {
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, w, h);
        // Inner highlight
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    }
    
    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // Glowing circle for powerups
    drawGlowCircle(x, y, radius, color, glowColor) {
        this.ctx.shadowColor = glowColor || color;
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawText(text, x, y, color = 'white', size = 16, align = 'center') {
        this.ctx.font = `${size}px Arial`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
    }
    
    // Retro text with glow and shadow
    drawRetroText(text, x, y, color = '#0ff', size = 16, align = 'center') {
        this.ctx.font = `bold ${size}px "Press Start 2P", monospace`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'middle';
        // Shadow
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(text, x + 2, y + 2);
        // Glow
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
        this.ctx.shadowBlur = 0;
    }
    
    // Floating score popup
    drawFloatingText(text, x, y, color = '#ff0') {
        this.ctx.font = 'bold 20px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
        this.ctx.shadowBlur = 0;
    }
    
    // Screen effects
    screenShake() {
        document.getElementById('game-container').classList.add('shake');
        setTimeout(() => {
            document.getElementById('game-container').classList.remove('shake');
        }, 300);
    }
    
    flashScreen(color = 'rgba(255, 255, 255, 0.6)') {
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalAlpha = 1;
    }
    
    // Retro explosion effect
    drawExplosion(x, y, radius, progress) {
        const colors = ['#ff0', '#f80', '#f00', '#f0f'];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = radius * progress;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;
            const size = (1 - progress) * 15;
            this.ctx.fillStyle = colors[i % colors.length];
            this.ctx.shadowColor = colors[i % colors.length];
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(px, py, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;
    }
}

// Matzah powerup class (used across levels)
class MatzahPowerup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 24;
        this.collected = false;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.awakenessBoost = 15;
        this.pulseOffset = Math.random() * Math.PI * 2;
    }
    
    update(dt) {
        this.floatOffset += dt * 3;
        this.pulseOffset += dt * 5;
    }
    
    render(ctx) {
        if (this.collected) return;
        const floatY = Math.sin(this.floatOffset) * 5;
        const pulse = 1 + Math.sin(this.pulseOffset) * 0.15;
        
        // Draw glowing SQUARE behind (matzah is square!)
        const glowSize = this.size * pulse;
        ctx.shadowColor = '#0f0';
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(this.x - glowSize * 0.6, this.y + floatY - glowSize * 0.6, glowSize * 1.2, glowSize * 1.2);
        ctx.shadowBlur = 0;
        
        // Draw matzah emoji
        ctx.font = `${this.size * pulse}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 15;
        ctx.fillText('🫓', this.x, this.y + floatY);
        ctx.shadowBlur = 0;
    }
    
    checkCollision(playerX, playerY, playerSize) {
        if (this.collected) return false;
        const dx = this.x - playerX;
        const dy = this.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < (this.size + playerSize) / 2) {
            this.collected = true;
            return true;
        }
        return false;
    }
}

// Base Player class for top-down movement
class TopDownPlayer {
    constructor(x, y, emoji, speed = 150) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.speed = speed;
        this.size = 32;
        this.direction = 'down';
    }
    
    update(dt, engine) {
        let dx = 0, dy = 0;
        
        if (engine.isKeyDown('left')) dx -= 1;
        if (engine.isKeyDown('right')) dx += 1;
        if (engine.isKeyDown('up')) dy -= 1;
        if (engine.isKeyDown('down')) dy += 1;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        // Update direction
        if (dx < 0) this.direction = 'left';
        else if (dx > 0) this.direction = 'right';
        else if (dy < 0) this.direction = 'up';
        else if (dy > 0) this.direction = 'down';
        
        // Move
        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;
        
        // Keep in bounds
        this.x = Math.max(this.size/2, Math.min(engine.width - this.size/2, this.x));
        this.y = Math.max(this.size/2 + 50, Math.min(engine.height - this.size/2, this.y));
    }
    
    render(ctx) {
        // Draw player shadow (darker and more visible)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.ellipse(this.x + 4, this.y + this.size/2, this.size/2 + 8, this.size/4 + 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw VERY LARGE SOLID circle behind player for maximum visibility
        // Outer magenta glow ring - BIGGER
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size/2 + 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner solid yellow circle - HIGH CONTRAST
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size/2 + 10, 0, Math.PI * 2);
        ctx.fill();
        
        // White center for emoji visibility
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size/2 + 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player emoji LARGER
        ctx.font = `bold ${this.size + 8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Black outline for contrast
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5;
        ctx.strokeText(this.emoji, this.x, this.y);
        
        // The emoji itself
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.emoji, this.x, this.y);
    }
    
    getRect() {
        return {
            x: this.x - this.size/2,
            y: this.y - this.size/2,
            width: this.size,
            height: this.size
        };
    }
}

// Battle System for Pokemon-style fights - CANVAS BASED with animations!
class BattleSystem {
    constructor(playerName, playerEmoji, enemyName, enemyEmoji, ctx) {
        this.playerName = playerName;
        this.playerEmoji = playerEmoji;
        this.enemyName = enemyName;
        this.enemyEmoji = enemyEmoji;
        this.ctx = ctx;
        
        // Pokemon-style stats
        this.playerHP = 150;
        this.playerMaxHP = 150;
        this.playerLevel = 15;
        this.enemyHP = 180;
        this.enemyMaxHP = 180;
        this.enemyLevel = 12;
        
        this.playerEffects = {};
        this.enemyEffects = {};
        
        this.isPlayerTurn = true;
        this.battleOver = false;
        this.message = '';
        this.waitingForAnimation = false;
        
        // Battle intro state
        this.introPhase = 'slide_in'; // slide_in, announce, ready
        this.introTimer = 0;
        this.introDuration = 2.5;
        
        // Animation state
        this.currentAnimation = null;
        this.animationTime = 0;
        this.animationDuration = 0;
        this.animationParticles = [];
        
        // Character positions (on canvas) - Pokemon style: player bottom-left, enemy top-right
        this.playerPos = { x: 150, y: 380 };
        this.enemyPos = { x: 620, y: 200 };
        this.playerShake = 0;
        this.enemyShake = 0;
        
        // Slide positions for intro
        this.playerSlideX = -200;
        this.enemySlideX = 1000;
        
        // Move button positions (in game area, bottom portion)
        this.moveButtons = [];
        this.hoveredButton = -1;
        
        this.moves = [
            // Original Jewish-themed moves with animation types
            { name: 'Cholent Throw', emoji: '🍲', effect: 'slow', damage: 15, description: 'Slows enemy 50%', anim: 'throw' },
            { name: 'Chicken Soup', emoji: '🍜', effect: 'heal', damage: 0, heal: 30, description: 'Heal yourself', anim: 'heal' },
            { name: 'Hora Dance', emoji: '💫', effect: 'confuse', damage: 20, description: 'Confuse enemy', anim: 'spin' },
            { name: 'Shofar Blast', emoji: '📯', effect: 'stun', damage: 25, description: 'Stun enemy', anim: 'blast' },
            { name: 'Gefilte Fish', emoji: '🐟', effect: 'poison', damage: 10, description: 'Poison over time', anim: 'throw' },
            { name: 'Latke Spin', emoji: '🥔', effect: 'multi', damage: 12, hits: 3, description: 'Multi-hit attack', anim: 'multi' },
            // The 9 Plagues of Egypt!
            { name: 'Blood', emoji: '🩸', effect: 'bleed', damage: 15, description: 'Bleeding damage', anim: 'splash' },
            { name: 'Frogs', emoji: '🐸', effect: 'confuse', damage: 18, description: 'Frog swarm!', anim: 'swarm' },
            { name: 'Lice', emoji: '🦟', effect: 'itch', damage: 8, description: 'Itchy! -accuracy', anim: 'swarm' },
            { name: 'Wild Beasts', emoji: '🦁', effect: 'multi', damage: 10, hits: 4, description: 'Beast attack!', anim: 'multi' },
            { name: 'Pestilence', emoji: '💀', effect: 'poison', damage: 20, description: 'Deadly plague', anim: 'cloud' },
            { name: 'Boils', emoji: '🔴', effect: 'burn', damage: 12, description: 'Painful sores!', anim: 'burst' },
            { name: 'Hail', emoji: '🌨️', effect: 'stun', damage: 22, description: 'Fire and ice!', anim: 'hail' },
            { name: 'Locusts', emoji: '🦗', effect: 'devour', damage: 15, description: 'Devour defenses', anim: 'swarm' },
            { name: 'Darkness', emoji: '🌑', effect: 'blind', damage: 10, description: 'Can\'t see!', anim: 'dark' },
            { name: 'Burning Bush', emoji: '🔥', effect: 'burn', damage: 25, description: 'Holy fire!', anim: 'fire' }
        ];
        
        this.selectedMoves = [];
        this.onBattleEnd = null;
        
        // Mouse tracking for button clicks
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseClicked = false;
    }
    
    start() {
        // Hide HTML battle UI (we use canvas now!)
        document.getElementById('battle-ui').classList.add('hidden');
        
        // Select 4 random moves for this battle
        const shuffled = [...this.moves].sort(() => Math.random() - 0.5);
        this.selectedMoves = shuffled.slice(0, 4);
        
        this.setupMoveButtons();
        this.message = `A wild ${this.enemyName} appeared!`;
    }
    
    setupMoveButtons() {
        // Create 4 move buttons at bottom of game area (2x2 grid)
        const buttonWidth = 180;
        const buttonHeight = 50;
        const startX = 50;
        const startY = 480;
        const gap = 10;
        
        this.moveButtons = this.selectedMoves.map((move, i) => ({
            x: startX + (i % 2) * (buttonWidth + gap),
            y: startY + Math.floor(i / 2) * (buttonHeight + gap),
            width: buttonWidth,
            height: buttonHeight,
            move: move,
            index: i
        }));
    }
    
    handleClick(mouseX, mouseY) {
        if (!this.isPlayerTurn || this.battleOver || this.waitingForAnimation) return;
        
        for (const btn of this.moveButtons) {
            if (mouseX >= btn.x && mouseX <= btn.x + btn.width &&
                mouseY >= btn.y && mouseY <= btn.y + btn.height) {
                this.playerAttack(btn.index);
                return;
            }
        }
    }
    
    updateHover(mouseX, mouseY) {
        this.hoveredButton = -1;
        for (const btn of this.moveButtons) {
            if (mouseX >= btn.x && mouseX <= btn.x + btn.width &&
                mouseY >= btn.y && mouseY <= btn.y + btn.height) {
                this.hoveredButton = btn.index;
                return;
            }
        }
    }
    
    // Animation system
    startAnimation(type, emoji, targetEnemy = true) {
        this.currentAnimation = type;
        this.animationTime = 0;
        this.animationEmoji = emoji;
        this.animationTargetEnemy = targetEnemy;
        this.animationParticles = [];
        
        const targetPos = targetEnemy ? this.enemyPos : this.playerPos;
        const sourcePos = targetEnemy ? this.playerPos : this.enemyPos;
        
        switch(type) {
            case 'throw':
                this.animationDuration = 0.5;
                this.animationParticles.push({
                    x: sourcePos.x, y: sourcePos.y,
                    targetX: targetPos.x, targetY: targetPos.y,
                    emoji: emoji, size: 40, rotation: 0
                });
                break;
            case 'heal':
                this.animationDuration = 1.0;
                for (let i = 0; i < 8; i++) {
                    this.animationParticles.push({
                        x: sourcePos.x + (Math.random() - 0.5) * 60,
                        y: sourcePos.y + 30,
                        vy: -100 - Math.random() * 50,
                        emoji: ['✨', '💚', '💖', '🌟'][Math.floor(Math.random() * 4)],
                        size: 20 + Math.random() * 15,
                        alpha: 1
                    });
                }
                break;
            case 'blast':
                this.animationDuration = 0.8;
                this.animationParticles.push({
                    x: sourcePos.x, y: sourcePos.y,
                    targetX: targetPos.x, targetY: targetPos.y,
                    emoji: emoji, size: 50, 
                    trail: []
                });
                break;
            case 'spin':
                this.animationDuration = 1.0;
                for (let i = 0; i < 6; i++) {
                    this.animationParticles.push({
                        x: targetPos.x, y: targetPos.y,
                        angle: (i / 6) * Math.PI * 2,
                        radius: 0,
                        emoji: ['💫', '⭐', '✨'][i % 3],
                        size: 25
                    });
                }
                break;
            case 'multi':
                this.animationDuration = 0.8;
                for (let i = 0; i < 4; i++) {
                    this.animationParticles.push({
                        x: sourcePos.x, y: sourcePos.y,
                        targetX: targetPos.x + (Math.random() - 0.5) * 40,
                        targetY: targetPos.y + (Math.random() - 0.5) * 40,
                        emoji: emoji, size: 30,
                        delay: i * 0.15,
                        active: false
                    });
                }
                break;
            case 'swarm':
                this.animationDuration = 1.2;
                for (let i = 0; i < 12; i++) {
                    this.animationParticles.push({
                        x: sourcePos.x + (Math.random() - 0.5) * 100,
                        y: sourcePos.y + (Math.random() - 0.5) * 100,
                        targetX: targetPos.x + (Math.random() - 0.5) * 60,
                        targetY: targetPos.y + (Math.random() - 0.5) * 60,
                        emoji: emoji, size: 20 + Math.random() * 10,
                        delay: Math.random() * 0.3,
                        wiggle: Math.random() * Math.PI * 2
                    });
                }
                break;
            case 'splash':
                this.animationDuration = 0.7;
                for (let i = 0; i < 15; i++) {
                    const angle = (i / 15) * Math.PI * 2;
                    this.animationParticles.push({
                        x: targetPos.x, y: targetPos.y,
                        vx: Math.cos(angle) * (80 + Math.random() * 40),
                        vy: Math.sin(angle) * (80 + Math.random() * 40),
                        emoji: emoji, size: 15 + Math.random() * 10,
                        alpha: 1
                    });
                }
                break;
            case 'fire':
                this.animationDuration = 1.0;
                for (let i = 0; i < 20; i++) {
                    this.animationParticles.push({
                        x: targetPos.x + (Math.random() - 0.5) * 60,
                        y: targetPos.y + 30,
                        vy: -80 - Math.random() * 60,
                        vx: (Math.random() - 0.5) * 30,
                        emoji: ['🔥', '🔥', '💥', '✨'][Math.floor(Math.random() * 4)],
                        size: 20 + Math.random() * 20,
                        alpha: 1
                    });
                }
                break;
            case 'hail':
                this.animationDuration = 1.0;
                for (let i = 0; i < 15; i++) {
                    this.animationParticles.push({
                        x: targetPos.x - 100 + Math.random() * 200,
                        y: 50 + Math.random() * 50,
                        vy: 200 + Math.random() * 100,
                        emoji: ['🌨️', '❄️', '🔥'][Math.floor(Math.random() * 3)],
                        size: 20 + Math.random() * 15,
                        delay: Math.random() * 0.5
                    });
                }
                break;
            case 'dark':
                this.animationDuration = 1.2;
                this.animationParticles.push({
                    x: 400, y: 300, radius: 0, maxRadius: 500
                });
                break;
            case 'cloud':
                this.animationDuration = 1.0;
                for (let i = 0; i < 8; i++) {
                    this.animationParticles.push({
                        x: targetPos.x + (Math.random() - 0.5) * 80,
                        y: targetPos.y + (Math.random() - 0.5) * 80,
                        size: 0, maxSize: 40 + Math.random() * 30,
                        emoji: ['💀', '☠️', '💨'][Math.floor(Math.random() * 3)],
                        alpha: 0
                    });
                }
                break;
            case 'burst':
                this.animationDuration = 0.6;
                for (let i = 0; i < 10; i++) {
                    const angle = (i / 10) * Math.PI * 2;
                    this.animationParticles.push({
                        x: targetPos.x, y: targetPos.y,
                        vx: Math.cos(angle) * 120,
                        vy: Math.sin(angle) * 120,
                        emoji: emoji, size: 25,
                        alpha: 1
                    });
                }
                break;
        }
    }
    
    updateAnimation(dt) {
        if (!this.currentAnimation) return;
        
        this.animationTime += dt;
        const progress = Math.min(1, this.animationTime / this.animationDuration);
        
        const targetPos = this.animationTargetEnemy ? this.enemyPos : this.playerPos;
        const sourcePos = this.animationTargetEnemy ? this.playerPos : this.enemyPos;
        
        switch(this.currentAnimation) {
            case 'throw':
            case 'blast':
                for (const p of this.animationParticles) {
                    const t = this.easeOutQuad(progress);
                    p.x = p.x + (p.targetX - sourcePos.x) * t * 0.1;
                    p.y = p.y + (p.targetY - sourcePos.y) * t * 0.1;
                    p.rotation = (p.rotation || 0) + dt * 10;
                    if (progress > 0.8) {
                        if (this.animationTargetEnemy) this.enemyShake = 5;
                        else this.playerShake = 5;
                    }
                }
                break;
            case 'heal':
                for (const p of this.animationParticles) {
                    p.y += p.vy * dt;
                    p.alpha = 1 - progress;
                }
                break;
            case 'spin':
                for (const p of this.animationParticles) {
                    p.angle += dt * 8;
                    p.radius = 30 + progress * 50;
                }
                if (progress > 0.5) {
                    if (this.animationTargetEnemy) this.enemyShake = 3;
                    else this.playerShake = 3;
                }
                break;
            case 'multi':
                for (const p of this.animationParticles) {
                    if (this.animationTime > p.delay && !p.active) {
                        p.active = true;
                        p.startX = sourcePos.x;
                        p.startY = sourcePos.y;
                    }
                    if (p.active) {
                        const localProgress = Math.min(1, (this.animationTime - p.delay) / 0.2);
                        p.x = p.startX + (p.targetX - p.startX) * this.easeOutQuad(localProgress);
                        p.y = p.startY + (p.targetY - p.startY) * this.easeOutQuad(localProgress);
                        if (localProgress > 0.8) {
                            if (this.animationTargetEnemy) this.enemyShake = 4;
                            else this.playerShake = 4;
                        }
                    }
                }
                break;
            case 'swarm':
                for (const p of this.animationParticles) {
                    if (this.animationTime > p.delay) {
                        const localProgress = Math.min(1, (this.animationTime - p.delay) / 0.8);
                        const startX = sourcePos.x + (Math.random() - 0.5) * 20;
                        const startY = sourcePos.y + (Math.random() - 0.5) * 20;
                        p.x += (p.targetX - p.x) * 0.05;
                        p.y += (p.targetY - p.y) * 0.05;
                        p.wiggle += dt * 15;
                        p.x += Math.sin(p.wiggle) * 2;
                    }
                }
                if (progress > 0.5) {
                    if (this.animationTargetEnemy) this.enemyShake = 2;
                }
                break;
            case 'splash':
            case 'burst':
                for (const p of this.animationParticles) {
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.alpha = 1 - progress;
                }
                if (progress < 0.3) {
                    if (this.animationTargetEnemy) this.enemyShake = 6;
                    else this.playerShake = 6;
                }
                break;
            case 'fire':
                for (const p of this.animationParticles) {
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vy -= 50 * dt; // Float up
                    p.alpha = 1 - progress * 0.8;
                    p.size *= 0.99;
                }
                if (progress > 0.2) {
                    if (this.animationTargetEnemy) this.enemyShake = 4;
                }
                break;
            case 'hail':
                for (const p of this.animationParticles) {
                    if (this.animationTime > p.delay) {
                        p.y += p.vy * dt;
                        if (p.y > targetPos.y) {
                            if (this.animationTargetEnemy) this.enemyShake = 3;
                            else this.playerShake = 3;
                        }
                    }
                }
                break;
            case 'dark':
                for (const p of this.animationParticles) {
                    if (progress < 0.5) {
                        p.radius = p.maxRadius * (progress * 2);
                    } else {
                        p.radius = p.maxRadius * (1 - (progress - 0.5) * 2);
                    }
                }
                if (progress > 0.3 && progress < 0.7) {
                    if (this.animationTargetEnemy) this.enemyShake = 2;
                }
                break;
            case 'cloud':
                for (const p of this.animationParticles) {
                    if (progress < 0.5) {
                        p.size = p.maxSize * (progress * 2);
                        p.alpha = progress * 2;
                    } else {
                        p.alpha = 1 - (progress - 0.5) * 2;
                    }
                }
                if (progress > 0.3) {
                    if (this.animationTargetEnemy) this.enemyShake = 2;
                }
                break;
        }
        
        // Decay shake
        this.playerShake *= 0.9;
        this.enemyShake *= 0.9;
        
        if (progress >= 1) {
            this.currentAnimation = null;
            this.animationParticles = [];
        }
    }
    
    renderAnimation(ctx) {
        if (!this.currentAnimation) return;
        
        ctx.save();
        
        switch(this.currentAnimation) {
            case 'dark':
                for (const p of this.animationParticles) {
                    ctx.fillStyle = `rgba(0, 0, 0, 0.8)`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            default:
                for (const p of this.animationParticles) {
                    if (p.delay && this.animationTime < p.delay) continue;
                    if (p.active === false) continue;
                    
                    ctx.globalAlpha = p.alpha !== undefined ? p.alpha : 1;
                    ctx.font = `${p.size}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    let x = p.x, y = p.y;
                    if (p.angle !== undefined && p.radius !== undefined) {
                        const targetPos = this.animationTargetEnemy ? this.enemyPos : this.playerPos;
                        x = targetPos.x + Math.cos(p.angle) * p.radius;
                        y = targetPos.y + Math.sin(p.angle) * p.radius;
                    }
                    
                    if (p.rotation) {
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(p.rotation);
                        ctx.fillText(p.emoji, 0, 0);
                        ctx.restore();
                    } else {
                        ctx.fillText(p.emoji, x, y);
                    }
                }
                break;
        }
        
        ctx.restore();
    }
    
    easeOutQuad(t) {
        return t * (2 - t);
    }
    
    update(dt) {
        // Update intro animation
        if (this.introPhase !== 'ready') {
            this.introTimer += dt;
            if (this.introPhase === 'slide_in') {
                // Slide characters in
                this.playerSlideX = -200 + (this.playerPos.x + 200) * Math.min(1, this.introTimer / 0.8);
                this.enemySlideX = 1000 - (1000 - this.enemyPos.x) * Math.min(1, this.introTimer / 0.8);
                
                if (this.introTimer > 1.0) {
                    this.introPhase = 'announce';
                    this.introTimer = 0;
                    // Play battle start sound
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('versus');
                    }
                }
            } else if (this.introPhase === 'announce') {
                if (this.introTimer > 1.5) {
                    this.introPhase = 'ready';
                    this.message = 'What will ' + this.playerName + ' do?';
                }
            }
        }
        
        this.updateAnimation(dt);
    }
    
    render(ctx) {
        // Draw Pokemon-style battle background
        this.drawBattleBackground(ctx);
        
        // Draw platforms/shadows under characters
        this.drawPlatforms(ctx);
        
        // Get character positions (use slide position during intro)
        const playerX = this.introPhase === 'ready' ? this.playerPos.x : this.playerSlideX;
        const enemyX = this.introPhase === 'ready' ? this.enemyPos.x : this.enemySlideX;
        
        // Draw player (left side, bottom) - LARGER like Pokemon
        const playerShakeX = (Math.random() - 0.5) * this.playerShake;
        const playerShakeY = (Math.random() - 0.5) * this.playerShake;
        ctx.font = '100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.playerEmoji, playerX + playerShakeX, this.playerPos.y + playerShakeY);
        
        // Draw enemy (right side, top) - slightly smaller (further away perspective)
        const enemyShakeX = (Math.random() - 0.5) * this.enemyShake;
        const enemyShakeY = (Math.random() - 0.5) * this.enemyShake;
        ctx.font = '80px Arial';
        ctx.fillText(this.enemyEmoji, enemyX + enemyShakeX, this.enemyPos.y + enemyShakeY);
        
        // Draw Pokemon-style HP bars
        if (this.introPhase === 'ready' || this.introPhase === 'announce') {
            this.drawPokemonHPBar(ctx, 450, 80, this.enemyName, this.enemyLevel, this.enemyHP, this.enemyMaxHP, false);
            this.drawPokemonHPBar(ctx, 30, 420, this.playerName, this.playerLevel, this.playerHP, this.playerMaxHP, true);
        }
        
        // Draw animations
        this.renderAnimation(ctx);
        
        // Draw message box (Pokemon style - bottom)
        this.drawMessageBox(ctx);
        
        // Draw move buttons during player turn
        if (this.introPhase === 'ready' && this.isPlayerTurn && !this.waitingForAnimation && !this.battleOver) {
            this.renderMoveButtons(ctx);
        }
        
        // Draw intro text
        if (this.introPhase === 'announce') {
            ctx.save();
            ctx.font = 'bold 28px "Press Start 2P", monospace';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 5;
            ctx.fillText(`A wild ${this.enemyName} appeared!`, 400, 300);
            ctx.restore();
        }
    }
    
    drawBattleBackground(ctx) {
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
        skyGrad.addColorStop(0, '#87CEEB');
        skyGrad.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 800, 300);
        
        // Ground/grass area
        const groundGrad = ctx.createLinearGradient(0, 250, 0, 600);
        groundGrad.addColorStop(0, '#7CBA5F');
        groundGrad.addColorStop(0.3, '#5A9A3F');
        groundGrad.addColorStop(1, '#4A8A2F');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 250, 800, 350);
        
        // Draw grass tufts
        ctx.fillStyle = '#4A7A2F';
        for (let i = 0; i < 30; i++) {
            const x = (i * 27 + 10) % 800;
            const y = 260 + (i * 17) % 200;
            ctx.beginPath();
            ctx.moveTo(x, y + 10);
            ctx.lineTo(x - 3, y);
            ctx.lineTo(x, y + 3);
            ctx.lineTo(x + 3, y);
            ctx.closePath();
            ctx.fill();
        }
        
        // Battle arena line
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(0, 450);
        ctx.lineTo(800, 450);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    drawPlatforms(ctx) {
        // Enemy platform (ellipse, top right) - perspective: smaller/higher
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.enemyPos.x, this.enemyPos.y + 50, 70, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw grass on enemy platform
        ctx.fillStyle = '#6AAA4F';
        ctx.beginPath();
        ctx.ellipse(this.enemyPos.x, this.enemyPos.y + 48, 65, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Player platform (ellipse, bottom left) - perspective: larger/lower
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.playerPos.x, this.playerPos.y + 60, 90, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw grass on player platform
        ctx.fillStyle = '#6AAA4F';
        ctx.beginPath();
        ctx.ellipse(this.playerPos.x, this.playerPos.y + 57, 85, 23, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawPokemonHPBar(ctx, x, y, name, level, hp, maxHP, isPlayer) {
        // Pokemon-style HP bar panel
        const width = 280;
        const height = 70;
        
        // Panel background with gradient
        ctx.save();
        const panelGrad = ctx.createLinearGradient(x, y, x, y + height);
        panelGrad.addColorStop(0, '#F8F8F8');
        panelGrad.addColorStop(1, '#D8D8D8');
        ctx.fillStyle = panelGrad;
        
        // Rounded rectangle for panel
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Name
        ctx.font = 'bold 16px "Press Start 2P", Arial, sans-serif';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.fillText(name.toUpperCase(), x + 15, y + 22);
        
        // Level
        ctx.font = 'bold 12px "Press Start 2P", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Lv${level}`, x + width - 15, y + 22);
        
        // HP label
        ctx.font = 'bold 10px "Press Start 2P", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#F8B800';
        ctx.fillText('HP', x + 15, y + 42);
        
        // HP bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 45, y + 35, width - 60, 14);
        
        // HP bar fill
        const hpPercent = Math.max(0, hp / maxHP);
        let hpColor;
        if (hpPercent > 0.5) hpColor = '#48D848'; // Green
        else if (hpPercent > 0.2) hpColor = '#F8C030'; // Yellow
        else hpColor = '#F85848'; // Red
        
        ctx.fillStyle = hpColor;
        ctx.fillRect(x + 47, y + 37, (width - 64) * hpPercent, 10);
        
        // HP numbers (only for player)
        if (isPlayer) {
            ctx.font = 'bold 11px "Press Start 2P", Arial, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#333';
            ctx.fillText(`${Math.max(0, Math.floor(hp))}/${maxHP}`, x + width - 15, y + 60);
        }
        
        ctx.restore();
    }
    
    drawMessageBox(ctx) {
        // Pokemon-style message box at bottom
        ctx.save();
        
        // Box background
        const boxGrad = ctx.createLinearGradient(0, 520, 0, 600);
        boxGrad.addColorStop(0, '#F8F8F8');
        boxGrad.addColorStop(1, '#E0E0E0');
        ctx.fillStyle = boxGrad;
        ctx.fillRect(10, 520, 380, 70);
        
        // Border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 520, 380, 70);
        
        // Inner border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, 525, 370, 60);
        
        // Message text
        ctx.font = '16px "Press Start 2P", Arial, sans-serif';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        
        // Word wrap if needed
        const words = this.message.split(' ');
        let line = '';
        let lineY = 550;
        for (const word of words) {
            const testLine = line + word + ' ';
            if (ctx.measureText(testLine).width > 350) {
                ctx.fillText(line, 25, lineY);
                line = word + ' ';
                lineY += 22;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 25, lineY);
        
        ctx.restore();
    }
    
    renderMoveButtons(ctx) {
        // Pokemon-style "Fight" menu on the right side
        ctx.save();
        
        // Move selection box (right side, matches message box height)
        const boxX = 400;
        const boxY = 520;
        const boxW = 390;
        const boxH = 70;
        
        // Box background
        const boxGrad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
        boxGrad.addColorStop(0, '#F8F8F8');
        boxGrad.addColorStop(1, '#E0E0E0');
        ctx.fillStyle = boxGrad;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        
        // Border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        
        // Draw 4 moves in 2x2 grid
        const moveW = 185;
        const moveH = 28;
        const startX = boxX + 10;
        const startY = boxY + 8;
        
        for (let i = 0; i < this.moveButtons.length; i++) {
            const btn = this.moveButtons[i];
            const col = i % 2;
            const row = Math.floor(i / 2);
            const mx = startX + col * moveW;
            const my = startY + row * (moveH + 4);
            
            // Update button positions for click detection
            btn.x = mx;
            btn.y = my;
            btn.width = moveW - 10;
            btn.height = moveH;
            
            const isHovered = this.hoveredButton === i;
            
            // Selection arrow for hovered
            if (isHovered) {
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#333';
                ctx.textAlign = 'left';
                ctx.fillText('▶', mx - 2, my + 18);
            }
            
            // Move name with type color
            ctx.font = isHovered ? 'bold 13px Arial' : '13px Arial';
            ctx.fillStyle = isHovered ? '#E83030' : '#333';
            ctx.textAlign = 'left';
            ctx.fillText(`${btn.move.emoji} ${btn.move.name}`, mx + 12, my + 18);
        }
        
        ctx.restore();
    }
    
    async playerAttack(moveIndex) {
        if (!this.isPlayerTurn || this.battleOver || this.waitingForAnimation) return;
        
        const move = this.selectedMoves[moveIndex];
        this.waitingForAnimation = true;
        
        this.message = `${this.playerName} used ${move.name}!`;
        
        // Announce the move name!
        if (window.audioManager) {
            window.audioManager.announceMove(move.name);
        }
        
        // Play animation!
        this.startAnimation(move.anim, move.emoji, true);
        
        await this.delay(this.animationDuration * 1000 + 300);
        
        // Type effectiveness (random for fun)
        const effectiveness = Math.random();
        let damageMultiplier = 1;
        let effectivenessMessage = '';
        
        if (effectiveness > 0.85) {
            damageMultiplier = 2;
            effectivenessMessage = "It's super effective!";
            if (window.audioManager) window.audioManager.playSynthSound('powerup');
        } else if (effectiveness < 0.15) {
            damageMultiplier = 0.5;
            effectivenessMessage = "It's not very effective...";
        }
        
        // Critical hit chance
        let criticalHit = Math.random() > 0.9;
        if (criticalHit) {
            damageMultiplier *= 1.5;
            effectivenessMessage = 'A critical hit!';
            if (window.audioManager) window.audioManager.playSynthSound('powerup');
        }
        
        // Apply move effects
        if (move.effect === 'heal') {
            this.playerHP = Math.min(this.playerMaxHP, this.playerHP + move.heal);
            // Also restore Awakeness!
            if (this.engine && this.engine.addAwakeness) {
                this.engine.addAwakeness(15);
            }
            this.message = `${this.playerName} restored ${move.heal} HP and Awakeness!`;
            if (window.audioManager) {
                window.audioManager.playBattleSound('heal');
            }
        } else if (move.effect === 'shield') {
            this.playerEffects.shield = true;
            this.message = `${this.playerName} raised the Staff of Moses! 🪄`;
        } else if (move.effect === 'multi') {
            let totalDamage = 0;
            for (let i = 0; i < move.hits; i++) {
                totalDamage += Math.floor(move.damage * damageMultiplier);
            }
            this.enemyHP -= totalDamage;
            this.message = `Hit ${move.hits} times! ${totalDamage} damage!`;
            if (window.audioManager) {
                window.audioManager.playBattlePain();
            }
        } else {
            const finalDamage = Math.floor(move.damage * damageMultiplier);
            this.enemyHP -= finalDamage;
            this.message = effectivenessMessage || `${this.enemyName} took ${finalDamage} damage!`;
            if (window.audioManager) {
                window.audioManager.playBattlePain();
            }
            
            if (move.effect === 'slow') this.enemyEffects.slow = 2;
            if (move.effect === 'sleep') this.enemyEffects.sleep = 1;
            if (move.effect === 'confuse') this.enemyEffects.confuse = 2;
            if (move.effect === 'stun') this.enemyEffects.stun = 1;
            if (move.effect === 'poison') this.enemyEffects.poison = 3;
            if (move.effect === 'bleed') this.enemyEffects.bleed = 3;
            if (move.effect === 'burn') this.enemyEffects.burn = 2;
            if (move.effect === 'blind') this.enemyEffects.blind = 2;
            if (move.effect === 'itch') this.enemyEffects.itch = 2;
            if (move.effect === 'devour') {
                this.enemyEffects.devour = true;
                this.message += ' Defenses lowered!';
            }
        }
        
        await this.delay(1000);
        
        // Check if enemy defeated
        if (this.enemyHP <= 0) {
            this.enemyHP = 0;
            this.message = `${this.enemyName} fainted!`;
            this.battleOver = true;
            // Victory sound
            if (window.audioManager) {
                window.audioManager.playSynthSound('levelComplete');
            }
            await this.delay(1500);
            this.message = `${this.playerName} gained EXP. Points!`;
            await this.delay(1500);
            this.endBattle(true);
            return;
        }
        
        // Enemy turn
        this.isPlayerTurn = false;
        await this.enemyTurn();
    }
    
    async enemyTurn() {
        await this.delay(400);
        
        // Check status effects - reduced chance to skip enemy turn
        if (this.enemyEffects.sleep > 0) {
            // 60% chance to wake up early
            if (Math.random() < 0.6) {
                this.message = `${this.enemyName} woke up!`;
                this.enemyEffects.sleep = 0;
                await this.delay(800);
            } else {
                this.message = `${this.enemyName} is fast asleep! Zzz...`;
                this.enemyEffects.sleep--;
                await this.delay(1200);
                this.endTurn();
                return;
            }
        }
        
        if (this.enemyEffects.stun > 0) {
            // 50% chance to break free
            if (Math.random() < 0.5) {
                this.message = `${this.enemyName} broke through paralysis!`;
                this.enemyEffects.stun = 0;
                await this.delay(800);
            } else {
                this.message = `${this.enemyName} is fully paralyzed!`;
                this.enemyEffects.stun--;
                await this.delay(1200);
                this.endTurn();
                return;
            }
        }
        
        // Apply damage over time effects
        if (this.enemyEffects.poison > 0) {
            this.enemyHP -= 8;
            this.message = `${this.enemyName} is hurt by poison!`;
            this.enemyEffects.poison--;
            this.enemyShake = 4;
            await this.delay(1000);
            
            if (this.enemyHP <= 0) {
                this.enemyHP = 0;
                this.message = `${this.enemyName} fainted!`;
                this.battleOver = true;
                if (window.audioManager) window.audioManager.playSynthSound('levelComplete');
                await this.delay(1500);
                this.message = `${this.playerName} gained EXP. Points!`;
                await this.delay(1500);
                this.endBattle(true);
                return;
            }
        }
        
        if (this.enemyEffects.bleed > 0) {
            this.enemyHP -= 6;
            this.message = `${this.enemyName} is losing blood!`;
            this.enemyEffects.bleed--;
            this.enemyShake = 3;
            await this.delay(1000);
            
            if (this.enemyHP <= 0) {
                this.enemyHP = 0;
                this.message = `${this.enemyName} fainted!`;
                this.battleOver = true;
                if (window.audioManager) window.audioManager.playSynthSound('levelComplete');
                await this.delay(1500);
                this.endBattle(true);
                return;
            }
        }
        
        if (this.enemyEffects.burn > 0) {
            this.enemyHP -= 10;
            this.message = `${this.enemyName} is hurt by the burn!`;
            this.enemyEffects.burn--;
            this.enemyShake = 4;
            await this.delay(1000);
            
            if (this.enemyHP <= 0) {
                this.enemyHP = 0;
                this.message = `${this.enemyName} fainted!`;
                this.battleOver = true;
                if (window.audioManager) window.audioManager.playSynthSound('levelComplete');
                await this.delay(1500);
                this.endBattle(true);
                return;
            }
        }
        
        // Enemy moves (Pokemon-style names) - Goat fights back harder!
        const enemyMoves = [
            { name: 'Ram Attack', emoji: '💢', power: 22 },
            { name: 'Headbutt', emoji: '💥', power: 25 },
            { name: 'Horn Slash', emoji: '🌟', power: 28 },
            { name: 'Hoof Stomp', emoji: '🐾', power: 20 },
            { name: 'Wild Charge', emoji: '⚡', power: 30 }
        ];
        const enemyMove = enemyMoves[Math.floor(Math.random() * enemyMoves.length)];
        let damage = enemyMove.power + Math.floor(Math.random() * 12);
        
        if (this.enemyEffects.devour) damage = Math.floor(damage * 0.6);
        if (this.enemyEffects.slow > 0) {
            damage = Math.floor(damage * 0.5);
            this.enemyEffects.slow--;
        }
        
        // Check blind/itch effects
        if (this.enemyEffects.blind > 0) {
            if (Math.random() < 0.5) {
                this.message = `${this.enemyName}'s attack missed!`;
                this.enemyEffects.blind--;
                await this.delay(1200);
                this.endTurn();
                return;
            }
            this.enemyEffects.blind--;
        }
        
        if (this.enemyEffects.itch > 0) {
            if (Math.random() < 0.4) {
                this.message = `${this.enemyName} is flinching!`;
                this.enemyHP -= 3;
                this.enemyEffects.itch--;
                await this.delay(1200);
                this.endTurn();
                return;
            }
            this.enemyEffects.itch--;
        }
        
        if (this.enemyEffects.confuse > 0) {
            this.message = `${this.enemyName} is confused!`;
            await this.delay(800);
            if (Math.random() < 0.5) {
                this.message = `It hurt itself in confusion!`;
                this.enemyHP -= 12;
                this.enemyShake = 5;
                this.enemyEffects.confuse--;
                await this.delay(1200);
                this.endTurn();
                return;
            }
            this.enemyEffects.confuse--;
        }
        
        this.message = `${this.enemyName} used ${enemyMove.name}!`;
        
        // Enemy attack animation
        this.startAnimation('throw', enemyMove.emoji, false);
        await this.delay(700);
        
        // Check shield
        if (this.playerEffects.shield) {
            this.message = `${this.playerName} protected itself!`;
            this.playerEffects.shield = false;
            if (window.audioManager) {
                window.audioManager.playBattleSound('block');
            }
        } else {
            this.playerHP -= damage;
            this.playerShake = 6;
            if (window.audioManager) {
                window.audioManager.playBattlePain();
            }
            await this.delay(300);
            this.message = `${this.playerName} took ${damage} damage!`;
        }
        
        await this.delay(1200);
        
        // Check if player defeated
        if (this.playerHP <= 0) {
            this.playerHP = 0;
            this.message = `${this.playerName} fainted!`;
            this.battleOver = true;
            if (window.audioManager) window.audioManager.playSynthSound('death');
            await this.delay(1500);
            this.endBattle(false);
            return;
        }
        
        this.endTurn();
    }
    
    endTurn() {
        this.isPlayerTurn = true;
        this.waitingForAnimation = false;
        
        // Reshuffle moves each turn!
        const shuffled = [...this.moves].sort(() => Math.random() - 0.5);
        this.selectedMoves = shuffled.slice(0, 4);
        this.setupMoveButtons();
        
        this.message = `What will ${this.playerName} do?`;
    }
    
    endBattle(playerWon) {
        if (this.onBattleEnd) {
            this.onBattleEnd(playerWon);
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export engine
window.GameEngine = GameEngine;
window.MatzahPowerup = MatzahPowerup;
window.TopDownPlayer = TopDownPlayer;
window.BattleSystem = BattleSystem;
