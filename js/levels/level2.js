// Level 2: A Cat comes and eats the Goat
// Pokemon-style battle with Jewish-themed moves

class Level2 {
    constructor(engine) {
        this.engine = engine;
        this.name = "Cat vs Goat";
        this.description = "You are the Cat! Chase the Goat and battle using the 10 Plagues of Egypt!";
        this.instructions = "Chase the goat, then battle using plague-powered moves!";
        this.icon = "🐱";
        
        // Phase: 'chase' or 'battle'
        this.phase = 'chase';
        
        // Player (Cat)
        this.player = new TopDownPlayer(100, 500, '🐱', 160);
        
        // Goat (NPC to chase) - fast and tricky!
        this.goat = {
            x: 600,
            y: 150,
            speed: 140,  // Almost as fast as player (160)
            emoji: '🐐',
            size: 32,
            fleeing: true,
            fleeTimer: 0,
            fleeDirection: { x: 0, y: 0 },
            staminaTimer: 0,  // Gets tired
            tired: false,
            dodgeTimer: 0,    // Sudden direction changes
            panicMode: false  // Extra speed burst when cornered
        };
        
        // Battle system
        this.battle = null;
        
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
        if (this.goat.staminaTimer > 8) {  // Every 8 seconds, goat gets tired
            this.goat.tired = true;
        }
        if (this.goat.staminaTimer > 10) {  // Recovers after 2 seconds
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
            this.goat.dodgeTimer = 0.8 + Math.random() * 0.5;
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
        
        if (this.phase === 'chase') {
            // Draw goat with shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(this.goat.x, this.goat.y + 15, 20, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Goat with glow when tired
            if (this.goat.tired) {
                ctx.shadowColor = '#ff6b6b';
                ctx.shadowBlur = 15;
            }
            ctx.font = `${this.goat.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.goat.emoji, this.goat.x, this.goat.y);
            ctx.shadowBlur = 0;
            
            // Tired indicator
            if (this.goat.tired) {
                ctx.font = '16px Arial';
                ctx.fillText('😓', this.goat.x + 20, this.goat.y - 20);
            }
            
            // Draw exclamation if close
            const dx = this.player.x - this.goat.x;
            const dy = this.player.y - this.goat.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 150) {
                ctx.font = '24px Arial';
                ctx.fillText('❗', this.goat.x, this.goat.y - 35);
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
        
        // Draw hint
        if (this.phase === 'chase') {
            ctx.font = '14px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.textAlign = 'center';
            ctx.fillText('🐱 Chase and catch the goat! The goat gets tired sometimes... 😓', 400, 580);
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
            fleeDirection: { x: 0, y: 0 }
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
