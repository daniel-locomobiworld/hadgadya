// Level 2: A Cat comes and eats the Goat
// Pokemon-style battle with Jewish-themed moves

class Level2 {
    constructor(engine, difficulty = 'normal') {
        this.engine = engine;
        this.difficulty = difficulty;
        this.name = "Cat vs Goat";
        this.description = "You are the Cat! Chase the Goat and battle using the 10 Plagues of Egypt!";
        this.instructions = "Chase the goat, then battle using plague-powered moves!";
        this.icon = "🐱";
        
        // Difficulty settings
        // Easy: slower goat, gets tired faster
        // Normal: current behavior
        // Hard: faster goat, less tired, more dodging
        // Extreme: very fast goat, almost never tired, constant dodging
        this.difficultySettings = {
            easy: { goatSpeed: 130, tireInterval: 5, tireRecovery: 3, dodgeCooldown: 1.2 },
            normal: { goatSpeed: 170, tireInterval: 10, tireRecovery: 1.5, dodgeCooldown: 0.6 },
            hard: { goatSpeed: 200, tireInterval: 15, tireRecovery: 1.2, dodgeCooldown: 0.4 },
            extreme: { goatSpeed: 230, tireInterval: 25, tireRecovery: 0.8, dodgeCooldown: 0.25 }
        };
        this.settings = this.difficultySettings[difficulty] || this.difficultySettings.normal;
        
        // Phase: 'chase' or 'battle'
        this.phase = 'chase';
        
        // Player (Cat)
        this.player = new TopDownPlayer(100, 500, '🐱', 160);
        
        // Goat (NPC to chase) - speed based on difficulty
        this.goat = {
            x: 600,
            y: 150,
            speed: this.settings.goatSpeed,
            emoji: '🐐',
            size: 32,
            fleeing: true,
            fleeTimer: 0,
            fleeDirection: { x: 0, y: 0 },
            staminaTimer: 0,  // Gets tired
            tired: false,
            dodgeTimer: 0,    // Sudden direction changes
            panicMode: false, // Extra speed burst when cornered
            inGrass: false    // Track if goat is hidden in grass
        };
        
        // Battle system
        this.battle = null;
        
        // Tall grass patches (Pokemon style - hides the goat!)
        this.tallGrassPatches = [];
        this.generateTallGrass();
        
        // Matzah powerups
        this.matzahPowerups = [
            new MatzahPowerup(200, 300),
            new MatzahPowerup(600, 400),
            new MatzahPowerup(400, 200)
        ];
        
        // Obstacles (funny Passover themed)
        this.obstacles = [
            { x: 200, y: 200, width: 60, height: 60, emoji: '🪑', name: "Elijah's Chair" },
            { x: 500, y: 300, width: 50, height: 50, emoji: '🍷', name: 'Spilled Wine' },
            { x: 350, y: 150, width: 70, height: 40, emoji: '📚', name: 'Haggadah Stack' },
            { x: 150, y: 400, width: 60, height: 60, emoji: '🛋️', name: 'Reclining Pillow' },
            { x: 600, y: 500, width: 50, height: 50, emoji: '🫓', name: 'Matzah Tower' }
        ];
        
        // Level state
        this.complete = false;
        this.showMessage = false;
        this.messageText = '';
        this.messageTimer = 0;
    }
    
    generateTallGrass() {
        // Create Pokemon-style tall grass patches - DENSER for chase phase!
        const grassAreas = [
            { x: 80, y: 100, width: 150, height: 100 },
            { x: 500, y: 80, width: 160, height: 80 },
            { x: 300, y: 220, width: 100, height: 100 },
            { x: 620, y: 280, width: 120, height: 100 },
            { x: 100, y: 280, width: 80, height: 80 },
            { x: 420, y: 380, width: 140, height: 80 }
        ];
        
        grassAreas.forEach(area => {
            // Each area contains multiple grass tufts - DENSER now
            const tuftsPerRow = Math.floor(area.width / 22);
            const rows = Math.floor(area.height / 18);
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < tuftsPerRow; col++) {
                    this.tallGrassPatches.push({
                        x: area.x + col * 22 + (Math.random() - 0.5) * 8,
                        y: area.y + row * 18 + (Math.random() - 0.5) * 6,
                        size: 16 + Math.random() * 8, // Slightly bigger: 16-24
                        sway: Math.random() * Math.PI * 2,
                        areaX: area.x,
                        areaY: area.y,
                        areaWidth: area.width,
                        areaHeight: area.height
                    });
                }
            }
        });
    }
    
    isInTallGrass(x, y) {
        // Check if a position is inside any tall grass area
        const grassAreas = [
            { x: 80, y: 100, width: 150, height: 100 },
            { x: 500, y: 80, width: 160, height: 80 },
            { x: 300, y: 220, width: 100, height: 100 },
            { x: 620, y: 280, width: 120, height: 100 },
            { x: 100, y: 280, width: 80, height: 80 },
            { x: 420, y: 380, width: 140, height: 80 }
        ];
        
        for (const area of grassAreas) {
            if (x >= area.x && x <= area.x + area.width &&
                y >= area.y && y <= area.y + area.height) {
                return true;
            }
        }
        return false;
    }
    
    update(dt) {
        if (this.complete) return;
        
        if (this.phase === 'chase') {
            this.updateChase(dt);
        } else if (this.phase === 'battle' && this.battle) {
            // Update battle animations
            this.battle.update(dt);
        } else if (this.phase === 'eating') {
            this.updateEating(dt);
        }
        
        // Update tall grass sway
        this.tallGrassPatches.forEach(grass => {
            grass.sway += dt * 2;
        });
        
        // Check if goat is in tall grass
        this.goat.inGrass = this.isInTallGrass(this.goat.x, this.goat.y);
        
        // Update message timer
        if (this.showMessage) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                this.showMessage = false;
            }
        }
    }
    
    updateEating(dt) {
        const ep = this.eatingPhase;
        ep.timer += dt;
        
        if (ep.stage === 'walking') {
            // Cat walks toward the goat
            const speed = 100;
            const dx = ep.goatX - ep.catX;
            if (Math.abs(dx) > 30) {
                ep.catX += speed * dt;
            } else {
                ep.stage = 'eating';
                ep.timer = 0;
                this.displayMessage('🐱 NOM NOM NOM! 😋');
                // Cat eating sound
                if (window.audioManager) {
                    window.audioManager.playSynthSound('slurp');
                }
            }
        } else if (ep.stage === 'eating') {
            // Eating animation - cat gets bigger, goat shrinks
            if (ep.timer < 2) {
                ep.catSize = 80 + Math.sin(ep.timer * 10) * 10; // Wobble while eating
                ep.goatSize = 70 * (1 - ep.timer / 2); // Shrink
            } else {
                ep.stage = 'done';
                ep.timer = 0;
                this.displayMessage('🎉 The Cat ate the Goat! 😸');
            }
        } else if (ep.stage === 'done') {
            // Show victory
            if (ep.timer > 1.5) {
                this.complete = true;
                if (this.engine.onLevelComplete) {
                    this.engine.onLevelComplete();
                }
            }
        }
    }
    
    updateChase(dt) {
        // Update player
        const oldX = this.player.x;
        const oldY = this.player.y;
        this.player.update(dt, this.engine);
        
        // Check collision with obstacles
        for (let obs of this.obstacles) {
            if (this.engine.rectCollision(this.player.getRect(), obs)) {
                this.player.x = oldX;
                this.player.y = oldY;
                break;
            }
        }
        
        // Update goat AI
        this.updateGoatAI(dt);
        
        // Update matzah powerups
        this.matzahPowerups.forEach(matzah => {
            matzah.update(dt);
            if (matzah.checkCollision(this.player.x, this.player.y, this.player.size)) {
                this.engine.addAwakeness(matzah.awakenessBoost);
                this.displayMessage('🫓 Matzah! +15 Awakeness!');
            }
        });
        
        // Check if caught the goat
        const dx = this.player.x - this.goat.x;
        const dy = this.player.y - this.goat.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 40) {
            // Cat meows when catching goat
            if (window.audioManager) {
                window.audioManager.playSynthSound('meow');
            }
            this.startBattle();
        }
    }
    
    updateGoatAI(dt) {
        // Flee from player
        const dx = this.goat.x - this.player.x;
        const dy = this.goat.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Stamina system - goat gets tired and slows down
        this.goat.staminaTimer += dt;
        if (this.goat.staminaTimer > this.settings.tireInterval) {  // Difficulty-based tire interval
            this.goat.tired = true;
        }
        if (this.goat.staminaTimer > this.settings.tireInterval + this.settings.tireRecovery) {  // Recovers after difficulty-based time
            this.goat.tired = false;
            this.goat.staminaTimer = 0;
        }
        
        // Dodge timer - sudden direction changes to evade
        this.goat.dodgeTimer -= dt;
        if (distance < 80 && this.goat.dodgeTimer <= 0) {
            // Sudden dodge! Pick a perpendicular direction
            const perpX = -dy / distance;
            const perpY = dx / distance;
            const dodgeDir = Math.random() > 0.5 ? 1 : -1;
            this.goat.fleeDirection.x = perpX * dodgeDir + (dx / distance) * 0.5;
            this.goat.fleeDirection.y = perpY * dodgeDir + (dy / distance) * 0.5;
            this.goat.dodgeTimer = this.settings.dodgeCooldown + Math.random() * 0.3;
            this.goat.panicMode = true;
            // Goat bleats when dodging
            if (window.audioManager && Math.random() < 0.3) {
                window.audioManager.playAnimalSound('goat');
            }
        }
        
        // Panic mode when player is very close
        if (distance < 60) {
            this.goat.panicMode = true;
        } else if (distance > 120) {
            this.goat.panicMode = false;
        }
        
        // Current speed based on tiredness and panic
        let currentSpeed = this.goat.tired ? 50 : this.goat.speed;
        if (this.goat.panicMode && !this.goat.tired) {
            currentSpeed = this.goat.speed * 1.3;  // 30% speed boost when panicking!
        }
        
        this.goat.fleeTimer -= dt;
        
        // Only flee when player is close, otherwise wander randomly
        if (distance < 200) {
            // Calculate flee direction (away from player)
            if (distance > 0 && this.goat.dodgeTimer <= 0) {
                this.goat.fleeDirection.x = dx / distance;
                this.goat.fleeDirection.y = dy / distance;
            }
            this.goat.fleeTimer = 0.2;
        } else if (this.goat.fleeTimer <= 0) {
            // Random wandering when player is far
            this.goat.fleeDirection.x = (Math.random() - 0.5) * 2;
            this.goat.fleeDirection.y = (Math.random() - 0.5) * 2;
            this.goat.fleeTimer = 1 + Math.random();
        }
        
        // Move goat
        let newX = this.goat.x + this.goat.fleeDirection.x * currentSpeed * dt;
        let newY = this.goat.y + this.goat.fleeDirection.y * currentSpeed * dt;
        
        // Keep in bounds
        newX = Math.max(30, Math.min(770, newX));
        newY = Math.max(80, Math.min(570, newY));
        
        // CORNER DETECTION - if near multiple walls, escape smarter!
        const nearLeftWall = newX <= 50;
        const nearRightWall = newX >= 750;
        const nearTopWall = newY <= 100;
        const nearBottomWall = newY >= 550;
        const inCorner = (nearLeftWall || nearRightWall) && (nearTopWall || nearBottomWall);
        
        if (inCorner) {
            // Escape toward center with some randomness!
            const centerX = 400;
            const centerY = 300;
            const toCenter = {
                x: centerX - this.goat.x,
                y: centerY - this.goat.y
            };
            const dist = Math.sqrt(toCenter.x * toCenter.x + toCenter.y * toCenter.y);
            
            // Flee toward center with random perpendicular offset
            const perpX = -toCenter.y / dist;
            const perpY = toCenter.x / dist;
            const offset = (Math.random() - 0.5) * 0.6;
            
            this.goat.fleeDirection.x = (toCenter.x / dist) + perpX * offset;
            this.goat.fleeDirection.y = (toCenter.y / dist) + perpY * offset;
            this.goat.fleeTimer = 0.5; // Keep this direction for a bit
            
            // Speed boost to escape corner!
            newX = this.goat.x + this.goat.fleeDirection.x * currentSpeed * 1.5 * dt;
            newY = this.goat.y + this.goat.fleeDirection.y * currentSpeed * 1.5 * dt;
            newX = Math.max(30, Math.min(770, newX));
            newY = Math.max(80, Math.min(570, newY));
        }
        
        // Check obstacle collision
        const goatRect = {
            x: newX - this.goat.size/2,
            y: newY - this.goat.size/2,
            width: this.goat.size,
            height: this.goat.size
        };
        
        let blocked = false;
        for (let obs of this.obstacles) {
            if (this.engine.rectCollision(goatRect, obs)) {
                blocked = true;
                // Bounce off
                this.goat.fleeDirection.x = -this.goat.fleeDirection.x;
                this.goat.fleeDirection.y = -this.goat.fleeDirection.y;
                break;
            }
        }
        
        if (!blocked) {
            this.goat.x = newX;
            this.goat.y = newY;
        }
        
        // Boundary bounce
        if (this.goat.x <= 30 || this.goat.x >= 770) {
            this.goat.fleeDirection.x = -this.goat.fleeDirection.x;
        }
        if (this.goat.y <= 80 || this.goat.y >= 570) {
            this.goat.fleeDirection.y = -this.goat.fleeDirection.y;
        }
    }
    
    startBattle() {
        this.phase = 'battle';
        this.displayMessage('⚔️ Battle Start! ⚔️');
        
        // Create canvas-based battle system with ctx reference
        this.battle = new BattleSystem('Cat', '🐱', 'Goat', '🐐', this.engine.ctx);
        this.battle.onBattleEnd = (playerWon) => {
            if (playerWon) {
                // Start the eating phase - cat walks over to eat the goat!
                this.phase = 'eating';
                this.eatingPhase = {
                    catX: 200,
                    catY: 300,
                    goatX: 600,
                    goatY: 300,
                    catSize: 80,
                    goatSize: 70,
                    timer: 0,
                    stage: 'walking' // walking, eating, done
                };
                this.displayMessage('🐱 Time for dinner!');
                this.cleanupBattleInput();
            } else {
                // Player lost - restart chase
                this.phase = 'chase';
                this.goat.x = 600;
                this.goat.y = 150;
                this.player.x = 100;
                this.player.y = 500;
                this.displayMessage('🐐 The goat escaped! The cat lost the battle - chase it again!');
                this.cleanupBattleInput();
            }
        };
        
        this.battle.start();
        
        // Set up mouse click handler for battle
        this.setupBattleInput();
        
        // Play cat hissing sound when battle starts!
        if (window.audioManager) {
            window.audioManager.playAnimalSound('cat');
        }
    }
    
    setupBattleInput() {
        const canvas = this.engine.canvas;
        
        // Click handler
        this.battleClickHandler = (e) => {
            if (this.phase !== 'battle' || !this.battle) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            this.battle.handleClick(x, y);
        };
        
        // Hover handler
        this.battleMoveHandler = (e) => {
            if (this.phase !== 'battle' || !this.battle) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            this.battle.updateHover(x, y);
        };
        
        canvas.addEventListener('click', this.battleClickHandler);
        canvas.addEventListener('mousemove', this.battleMoveHandler);
    }
    
    cleanupBattleInput() {
        const canvas = this.engine.canvas;
        if (this.battleClickHandler) {
            canvas.removeEventListener('click', this.battleClickHandler);
        }
        if (this.battleMoveHandler) {
            canvas.removeEventListener('mousemove', this.battleMoveHandler);
        }
    }
    
    displayMessage(text) {
        this.messageText = text;
        this.showMessage = true;
        this.messageTimer = 2;
    }
    
    render(ctx) {
        // Draw background (Egyptian palace setting for plagues theme!)
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#2a1a0a');
        gradient.addColorStop(0.5, '#4a2a1a');
        gradient.addColorStop(1, '#3a2010');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // Egyptian columns
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(20, 80, 40, 520);
        ctx.fillRect(740, 80, 40, 520);
        ctx.fillRect(370, 80, 60, 100);
        
        // Hieroglyphic decorations
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ffd700';
        const hieroglyphs = ['𓀀', '𓂀', '𓃭', '𓆣', '𓇳', '𓊃'];
        for (let i = 0; i < 6; i++) {
            ctx.fillText(hieroglyphs[i % hieroglyphs.length], 30, 120 + i * 70);
            ctx.fillText(hieroglyphs[(i + 3) % hieroglyphs.length], 750, 120 + i * 70);
        }
        
        // Floor pattern - Egyptian tiles
        for (let x = 60; x < 740; x += 60) {
            for (let y = 200; y < 600; y += 60) {
                ctx.fillStyle = (x + y) % 120 === 0 ? '#5a3a2a' : '#4a2a1a';
                ctx.fillRect(x, y, 60, 60);
            }
        }
        
        // Floating plague particles in background
        ctx.globalAlpha = 0.3;
        const plagueEmojis = ['🐸', '🦟', '🦗', '🩸', '🔥', '🌑'];
        for (let i = 0; i < 15; i++) {
            const x = ((i * 137 + this.engine.totalTime * 30) % 700) + 50;
            const y = ((i * 89 + this.engine.totalTime * 20) % 400) + 100;
            ctx.font = '15px Arial';
            ctx.fillText(plagueEmojis[i % plagueEmojis.length], x, y);
        }
        ctx.globalAlpha = 1;
        
        // Draw obstacles
        this.obstacles.forEach(obs => {
            ctx.font = `${Math.min(obs.width, obs.height)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obs.emoji, obs.x + obs.width/2, obs.y + obs.height/2);
        });
        
        // Draw matzah powerups
        this.matzahPowerups.forEach(matzah => matzah.render(ctx));
        
        // Draw tall grass patches (behind goat and player)
        this.renderTallGrass(ctx, 'behind');
        
        if (this.phase === 'chase') {
            // Only draw goat if NOT hidden in grass
            if (!this.goat.inGrass) {
                // Draw goat with shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.ellipse(this.goat.x, this.goat.y + 15, 20, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Goat - ALWAYS FULLY VISIBLE with glow!
                ctx.save();
                ctx.globalAlpha = 1; // NEVER transparent!
                
                // Pulsing glow effect for visibility
                const pulse = Math.sin(this.engine.totalTime * 3) * 5;
                const bobY = Math.sin(this.engine.totalTime * 4) * 2;
                
                // Main glow - white/cream for goat
                ctx.shadowColor = this.goat.tired ? '#ff6b6b' : '#ffffff';
                ctx.shadowBlur = this.goat.tired ? 25 : 20 + pulse;
                
                ctx.font = '40px Arial'; // Bigger goat!
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.goat.emoji, this.goat.x, this.goat.y + bobY);
                
                // Second glow layer for extra visibility
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 12;
                ctx.fillText(this.goat.emoji, this.goat.x, this.goat.y + bobY);
                
                ctx.shadowBlur = 0;
                ctx.restore();
                
                // Tired indicator
                if (this.goat.tired) {
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('😓', this.goat.x + 25, this.goat.y - 25);
                    ctx.fillText('💤', this.goat.x - 25, this.goat.y - 20);
                }
                
                // Draw exclamation if close
                const dx = this.player.x - this.goat.x;
                const dy = this.player.y - this.goat.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 150) {
                    ctx.font = '28px Arial';
                    ctx.fillText('❗', this.goat.x, this.goat.y - 40);
                }
            } else {
                // Goat is hidden in grass - show rustling indicator sometimes
                if (Math.sin(this.engine.totalTime * 5) > 0.7) {
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.fillText('🌿', this.goat.x, this.goat.y - 20);
                }
            }
        } else if (this.phase === 'battle' && this.battle) {
            // Canvas-based battle system with animations!
            
            // Lightning effect background (occasional)
            if (Math.random() < 0.01) {
                ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
                ctx.fillRect(0, 0, 800, 600);
            }
            
            // Battle arena floor
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(400, 380, 320, 100, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Plague effects floating around (ambiance)
            ctx.font = '25px Arial';
            ctx.textAlign = 'center';
            const t = this.engine.totalTime;
            ctx.globalAlpha = 0.6;
            ctx.fillText('🐸', 80 + Math.sin(t * 2) * 40, 130 + Math.cos(t * 1.5) * 25);
            ctx.fillText('🦟', 720 + Math.sin(t * 1.8) * 40, 160 + Math.cos(t * 2) * 25);
            ctx.fillText('🔥', 120 + Math.sin(t * 2.2) * 25, 420 + Math.cos(t * 1.7) * 15);
            ctx.fillText('🌨️', 680 + Math.sin(t * 1.5) * 30, 400 + Math.cos(t * 2.1) * 20);
            ctx.globalAlpha = 1;
            
            // Render the full battle system (characters, HP, moves, animations)
            this.battle.render(ctx);
        } else if (this.phase === 'eating') {
            // Cat eating the goat animation!
            const ep = this.eatingPhase;
            
            // Spotlight effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, 800, 600);
            
            // Spotlight on the action
            const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 250);
            gradient.addColorStop(0, 'rgba(255, 220, 100, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 600);
            
            // Draw the goat (if still visible)
            if (ep.stage !== 'done') {
                const goatSize = ep.goatSize || 70;
                if (goatSize > 5) {
                    ctx.font = `${goatSize}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // Goat looks scared!
                    if (ep.stage === 'walking') {
                        ctx.fillText('🐐', ep.goatX, ep.goatY);
                        ctx.font = '30px Arial';
                        ctx.fillText('😰', ep.goatX + 40, ep.goatY - 30);
                    } else {
                        ctx.fillText('🐐', ep.goatX, ep.goatY);
                    }
                }
            }
            
            // Draw the cat
            ctx.font = `${ep.catSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (ep.stage === 'walking') {
                // Walking animation - cat bounces
                const bounce = Math.sin(ep.timer * 10) * 5;
                ctx.fillText('🐱', ep.catX, ep.goatY + bounce);
            } else if (ep.stage === 'eating') {
                // Eating animation - wobble and nom nom particles
                const wobble = Math.sin(ep.timer * 15) * 8;
                ctx.fillText('😸', ep.catX, ep.goatY + wobble);
                
                // Food particles flying
                ctx.font = '20px Arial';
                for (let i = 0; i < 3; i++) {
                    const px = ep.catX + Math.sin(ep.timer * 5 + i * 2) * 50;
                    const py = ep.goatY - 40 - Math.abs(Math.sin(ep.timer * 8 + i)) * 30;
                    ctx.fillText(['💫', '✨', '🍖'][i], px, py);
                }
            } else if (ep.stage === 'done') {
                // Satisfied cat with full belly
                ctx.font = '100px Arial';
                ctx.fillText('😺', 400, 300);
                ctx.font = '40px Arial';
                ctx.fillText('😋', 400, 380);
                
                // Sparkles
                ctx.font = '30px Arial';
                const st = ep.timer;
                ctx.fillText('⭐', 300 + Math.sin(st * 3) * 30, 250);
                ctx.fillText('✨', 500 + Math.cos(st * 4) * 25, 270);
                ctx.fillText('🎉', 350 + Math.sin(st * 2.5) * 20, 200);
                ctx.fillText('🎉', 450 + Math.cos(st * 3.5) * 25, 220);
            }
        }
        
        // Draw player (in chase phase)
        if (this.phase === 'chase') {
            this.player.render(ctx);
        }
        
        // Draw tall grass in front ONLY during chase phase (not during battle)
        if (this.phase === 'chase') {
            this.renderTallGrass(ctx, 'front');
        }
        
        // Draw hint
        if (this.phase === 'chase') {
            ctx.font = '14px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.textAlign = 'center';
            ctx.fillText('🐱 Chase the goat! It hides in the tall grass! 🌿', 400, 580);
        }
        
        // Draw message
        if (this.showMessage) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(180, 510, 440, 60);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(180, 510, 440, 60);
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(this.messageText, 400, 548);
        }
    }
    
    renderTallGrass(ctx, layer) {
        // Draw Pokemon-style tall grass patches
        ctx.save();
        
        this.tallGrassPatches.forEach((grass, index) => {
            const sway = Math.sin(grass.sway + index * 0.1) * 3;
            
            if (layer === 'behind') {
                // Draw the base/roots of grass (darker, behind characters)
                ctx.fillStyle = '#1a5a1a';
                ctx.beginPath();
                ctx.moveTo(grass.x - 5, grass.y + 6);
                ctx.lineTo(grass.x + sway - 1, grass.y - 4);
                ctx.lineTo(grass.x + 2, grass.y + 6);
                ctx.fill();
            } else {
                // Draw the tall grass blades (in front, covering characters)
                // Main blade
                ctx.fillStyle = '#2a8a2a';
                ctx.beginPath();
                ctx.moveTo(grass.x - 4, grass.y + 8);
                ctx.lineTo(grass.x + sway, grass.y - grass.size);
                ctx.lineTo(grass.x + 3, grass.y + 8);
                ctx.fill();
                
                // Second blade
                ctx.fillStyle = '#3aaa3a';
                ctx.beginPath();
                ctx.moveTo(grass.x + 2, grass.y + 6);
                ctx.lineTo(grass.x + sway * 0.8 + 6, grass.y - grass.size * 0.75);
                ctx.lineTo(grass.x + 6, grass.y + 6);
                ctx.fill();
                
                // Third blade (shorter)
                ctx.fillStyle = '#4aba4a';
                ctx.beginPath();
                ctx.moveTo(grass.x - 7, grass.y + 5);
                ctx.lineTo(grass.x + sway * 0.6 - 4, grass.y - grass.size * 0.55);
                ctx.lineTo(grass.x - 3, grass.y + 5);
                ctx.fill();
            }
        });
        
        ctx.restore();
    }
    
    reset() {
        this.phase = 'chase';
        this.player = new TopDownPlayer(100, 500, '🐱', 160);
        this.goat = {
            x: 600,
            y: 150,
            speed: 100,
            emoji: '🐐',
            size: 32,
            fleeing: true,
            fleeTimer: 0,
            fleeDirection: { x: 0, y: 0 },
            inGrass: false
        };
        this.battle = null;
        this.matzahPowerups = [
            new MatzahPowerup(200, 300),
            new MatzahPowerup(600, 400),
            new MatzahPowerup(400, 200)
        ];
        this.complete = false;
        this.showMessage = false;
        
        // Hide battle UI if visible
        document.getElementById('battle-ui').classList.add('hidden');
    }
}

window.Level2 = Level2;
