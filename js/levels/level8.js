// Level 8: A Butcher (Shochet) comes and slaughters the Ox
// Bullfighting game - dodge the ox and hit it when it's tired

class Level8 {
    constructor(engine, difficulty = 'normal') {
        this.engine = engine;
        this.difficulty = difficulty;
        this.name = "The Bullfight";
        this.description = "You are the Shochet (Butcher)! Dodge the charging ox and strike when it's exhausted!";
        this.instructions = "Arrow keys to dodge. Press SPACE to strike when the ox is tired!";
        this.icon = "🔪";
        
        // Difficulty settings
        this.difficultySettings = {
            easy: { oxSpeed: 220, tiredTime: 3.0 },
            normal: { oxSpeed: 280, tiredTime: 2.5 },
            hard: { oxSpeed: 340, tiredTime: 2.0 },
            extreme: { oxSpeed: 400, tiredTime: 1.5 }
        };
        this.settings = this.difficultySettings[difficulty] || this.difficultySettings.normal;
        
        // Player (Butcher with knife)
        this.player = {
            x: 400,
            y: 450,
            width: 50,
            height: 50,
            speed: 200,
            emoji: '🧑', // Butcher
            knifeEmoji: '🔪',
            invincible: false,
            invincibleTimer: 0,
            canStrike: false,
            knifeSwing: 0,       // Knife swing animation timer
            knifeSwingAngle: 0   // Current swing angle
        };
        
        // MORTAL KOMBAT STYLE EFFECTS!
        this.slashTrails = [];      // Knife slash trails
        this.bloodSplatters = [];    // Blood splatter effects
        this.hitSparks = [];         // Impact sparks
        this.screenFlash = 0;        // Screen flash on hit
        this.slowMotion = 0;         // Slow motion effect
        this.hitFreezeTimer = 0;     // Hit freeze frame
        this.comboText = '';         // "FINISH HIM" style text
        this.comboTextTimer = 0;
        
        // Victory display
        this.showVictory = false;
        this.victoryTimer = 0;
        
        // Ox (enemy)
        this.ox = {
            x: 400,
            y: 150,
            width: 60,
            height: 60,
            speed: this.settings.oxSpeed,
            emoji: '🐂',
            state: 'idle', // idle, charging, tired, hit
            stateTimer: 0,
            chargeDirection: { x: 0, y: 0 },
            chargeTarget: { x: 0, y: 0 },
            hp: 100,
            maxHp: 100,
            tired: false,
            tiredTimer: 0,
            hits: 0,
            maxHits: 5 // Hits needed to win
        };
        
        // Arena boundaries
        this.arena = {
            x: 50,
            y: 80,
            width: 700,
            height: 470
        };
        
        // Dust clouds for effect
        this.dustClouds = [];
        
        // Matzah powerups
        this.matzahPowerups = [];
        
        // Level state
        this.complete = false;
        this.showMessage = false;
        this.messageText = '';
        this.messageTimer = 0;
        
        // Start with a message
        this.displayMessage('¡Olé! Dodge the ox!');
    }
    
    update(dt) {
        if (this.complete) return;
        
        // Update player
        this.updatePlayer(dt);
        
        // Update ox AI
        this.updateOx(dt);
        
        // Update invincibility
        if (this.player.invincible) {
            this.player.invincibleTimer -= dt;
            if (this.player.invincibleTimer <= 0) {
                this.player.invincible = false;
            }
        }
        
        // Update dust clouds
        this.dustClouds = this.dustClouds.filter(dust => {
            dust.life -= dt;
            dust.x += dust.vx * dt;
            dust.y += dust.vy * dt;
            dust.size *= 0.95;
            return dust.life > 0;
        });
        
        // Update MORTAL KOMBAT style effects!
        // Slash trails
        this.slashTrails = this.slashTrails.filter(slash => {
            slash.life -= dt;
            slash.opacity = slash.life / slash.maxLife;
            return slash.life > 0;
        });
        
        // Blood splatters
        this.bloodSplatters = this.bloodSplatters.filter(blood => {
            blood.life -= dt;
            blood.x += blood.vx * dt;
            blood.y += blood.vy * dt;
            blood.vy += 300 * dt; // Gravity
            blood.size *= 0.98;
            return blood.life > 0;
        });
        
        // Hit sparks
        this.hitSparks = this.hitSparks.filter(spark => {
            spark.life -= dt;
            spark.x += spark.vx * dt;
            spark.y += spark.vy * dt;
            return spark.life > 0;
        });
        
        // Screen flash
        if (this.screenFlash > 0) {
            this.screenFlash -= dt * 5;
        }
        
        // Slow motion effect
        if (this.slowMotion > 0) {
            this.slowMotion -= dt;
        }
        
        // Hit freeze
        if (this.hitFreezeTimer > 0) {
            this.hitFreezeTimer -= dt;
            return; // Freeze everything!
        }
        
        // Combo text timer
        if (this.comboTextTimer > 0) {
            this.comboTextTimer -= dt;
        }
        
        // Update knife swing animation
        if (this.player.knifeSwing > 0) {
            this.player.knifeSwing -= dt;
            // Swing from -90 degrees to +90 degrees
            const progress = 1 - (this.player.knifeSwing / 0.4);
            this.player.knifeSwingAngle = -Math.PI / 2 + progress * Math.PI;
        }
        
        // Update victory timer
        if (this.showVictory) {
            this.victoryTimer -= dt;
        }
        
        // Update matzah powerups
        this.matzahPowerups = this.matzahPowerups.filter(matzah => {
            matzah.update(dt);
            const dx = this.player.x - matzah.x;
            const dy = this.player.y - matzah.y;
            if (Math.sqrt(dx*dx + dy*dy) < 40) {
                this.engine.addAwakeness(matzah.awakenessBoost);
                this.displayMessage('🫓 Matzah! +15 Awakeness!');
                return false;
            }
            return true;
        });
        
        // Check player-ox collision during charge
        if (this.ox.state === 'charging' && !this.player.invincible) {
            const dx = this.player.x - this.ox.x;
            const dy = this.player.y - this.ox.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 50) {
                this.player.invincible = true;
                this.player.invincibleTimer = 1.5;
                this.engine.screenShake();
                this.displayMessage('💥 Hit! Be careful!');
                // Hurt sound
                if (window.audioManager) {
                    window.audioManager.playSynthSound('hit');
                }
                
                // Knock player back
                const knockback = 100;
                this.player.x += (dx / distance) * knockback;
                this.player.y += (dy / distance) * knockback;
                
                // Keep in arena
                this.player.x = Math.max(this.arena.x + 20, Math.min(this.arena.x + this.arena.width - 20, this.player.x));
                this.player.y = Math.max(this.arena.y + 20, Math.min(this.arena.y + this.arena.height - 20, this.player.y));
            }
        }
        
        // Strike the ox when tired
        if (this.engine.isKeyJustPressed('action') && this.ox.tired) {
            const dx = this.player.x - this.ox.x;
            const dy = this.player.y - this.ox.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 80) {
                this.ox.hits++;
                this.ox.hp = Math.max(0, this.ox.hp - 20);
                this.ox.state = 'hit';
                this.ox.stateTimer = 0.5;
                this.ox.tired = false;
                this.engine.screenShake();
                
                // Start knife swing animation - LONGER AND MORE DRAMATIC!
                this.player.knifeSwing = 0.6;  // 0.6 second swing
                this.player.knifeSwingAngle = -Math.PI / 2;  // Start angle
                
                // ===== MORTAL KOMBAT STYLE EFFECTS! =====
                
                // Screen flash!
                this.screenFlash = 1.0;
                
                // Hit freeze for impact!
                this.hitFreezeTimer = 0.08;
                
                // Slow motion!
                this.slowMotion = 0.3;
                
                // Create SLASH TRAILS!
                for (let i = 0; i < 5; i++) {
                    this.slashTrails.push({
                        x: this.ox.x + (Math.random() - 0.5) * 40,
                        y: this.ox.y + (Math.random() - 0.5) * 40,
                        angle: Math.random() * Math.PI * 2,
                        length: 50 + Math.random() * 30,
                        life: 0.4,
                        maxLife: 0.4,
                        opacity: 1,
                        color: i % 2 === 0 ? '#ffffff' : '#ffff00'
                    });
                }
                
                // Create BLOOD SPLATTERS!
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 100 + Math.random() * 200;
                    this.bloodSplatters.push({
                        x: this.ox.x,
                        y: this.ox.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 100,
                        size: 4 + Math.random() * 8,
                        life: 0.8 + Math.random() * 0.4,
                        color: Math.random() > 0.5 ? '#ff0000' : '#cc0000'
                    });
                }
                
                // Create HIT SPARKS!
                for (let i = 0; i < 12; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 200 + Math.random() * 300;
                    this.hitSparks.push({
                        x: this.ox.x,
                        y: this.ox.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 0.3 + Math.random() * 0.2,
                        color: ['#ffffff', '#ffff00', '#ff8800'][Math.floor(Math.random() * 3)]
                    });
                }
                
                // COMBO TEXT based on hits!
                const comboTexts = ['BRUTAL!', 'SAVAGE!', 'VICIOUS!', 'FATALITY!', 'FINISH HIM!'];
                this.comboText = comboTexts[Math.min(this.ox.hits - 1, 4)];
                this.comboTextTimer = 1.5;
                
                this.displayMessage(`🔪 ${this.comboText} (${this.ox.hits}/${this.ox.maxHits})`);
                
                // DRAMATIC SOUNDS!
                if (window.audioManager) {
                    window.audioManager.playSynthSound('explosion'); // Big impact
                    window.audioManager.playSynthSound('hit'); // Knife hit
                    setTimeout(() => {
                        if (window.audioManager) window.audioManager.playSynthSound('splash'); // Blood
                    }, 100);
                }
                
                // Spawn matzah sometimes
                if (Math.random() < 0.4) {
                    this.matzahPowerups.push(new MatzahPowerup(
                        this.arena.x + Math.random() * this.arena.width,
                        this.arena.y + Math.random() * this.arena.height
                    ));
                }
                
                // Check win
                if (this.ox.hits >= this.ox.maxHits) {
                    this.complete = true;
                    this.showVictory = true;
                    this.victoryTimer = 2.5;
                    this.comboText = 'FATALITY!';
                    this.comboTextTimer = 3;
                    this.displayMessage('🍔 The Shochet made hamburgers!');
                    setTimeout(() => {
                        if (this.engine.onLevelComplete) {
                            this.engine.onLevelComplete();
                        }
                    }, 2500);
                }
            }
        }
        
        // Update message timer
        if (this.showMessage) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                this.showMessage = false;
            }
        }
    }
    
    updatePlayer(dt) {
        let dx = 0, dy = 0;
        
        if (this.engine.isKeyDown('left')) dx -= 1;
        if (this.engine.isKeyDown('right')) dx += 1;
        if (this.engine.isKeyDown('up')) dy -= 1;
        if (this.engine.isKeyDown('down')) dy += 1;
        
        // Normalize
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        this.player.x += dx * this.player.speed * dt;
        this.player.y += dy * this.player.speed * dt;
        
        // Keep in arena
        this.player.x = Math.max(this.arena.x + 20, Math.min(this.arena.x + this.arena.width - 20, this.player.x));
        this.player.y = Math.max(this.arena.y + 20, Math.min(this.arena.y + this.arena.height - 20, this.player.y));
    }
    
    updateOx(dt) {
        this.ox.stateTimer -= dt;
        
        switch (this.ox.state) {
            case 'idle':
                if (this.ox.stateTimer <= 0) {
                    // Start charging at player
                    this.ox.state = 'charging';
                    this.ox.chargeTarget = { x: this.player.x, y: this.player.y };
                    const dx = this.ox.chargeTarget.x - this.ox.x;
                    const dy = this.ox.chargeTarget.y - this.ox.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    this.ox.chargeDirection = { x: dx / dist, y: dy / dist };
                    this.ox.stateTimer = 2; // Max charge time
                    this.displayMessage('🐂 Charging!');
                }
                break;
                
            case 'charging':
                // Move towards target
                this.ox.x += this.ox.chargeDirection.x * this.ox.speed * dt;
                this.ox.y += this.ox.chargeDirection.y * this.ox.speed * dt;
                
                // Create dust
                if (Math.random() < 0.3) {
                    this.dustClouds.push({
                        x: this.ox.x,
                        y: this.ox.y + 20,
                        vx: (Math.random() - 0.5) * 50,
                        vy: (Math.random() - 0.5) * 20,
                        size: 15 + Math.random() * 10,
                        life: 0.5
                    });
                }
                
                // Check if hit wall
                if (this.ox.x <= this.arena.x + 30 || this.ox.x >= this.arena.x + this.arena.width - 30 ||
                    this.ox.y <= this.arena.y + 30 || this.ox.y >= this.arena.y + this.arena.height - 30) {
                    
                    // Hit wall - become tired!
                    this.ox.x = Math.max(this.arena.x + 40, Math.min(this.arena.x + this.arena.width - 40, this.ox.x));
                    this.ox.y = Math.max(this.arena.y + 40, Math.min(this.arena.y + this.arena.height - 40, this.ox.y));
                    
                    this.ox.state = 'tired';
                    this.ox.tired = true;
                    this.ox.tiredTimer = this.settings.tiredTime;
                    this.ox.stateTimer = this.settings.tiredTime;
                    this.engine.screenShake();
                    this.displayMessage('💫 The ox is tired! Strike now!');
                }
                
                // Timeout - stop charging
                if (this.ox.stateTimer <= 0) {
                    this.ox.state = 'idle';
                    this.ox.stateTimer = 1;
                }
                break;
                
            case 'tired':
                // Can be struck
                this.ox.tiredTimer -= dt;
                if (this.ox.tiredTimer <= 0 || this.ox.stateTimer <= 0) {
                    this.ox.state = 'idle';
                    this.ox.tired = false;
                    this.ox.stateTimer = 0.5;
                }
                break;
                
            case 'hit':
                // Recoil from hit
                if (this.ox.stateTimer <= 0) {
                    this.ox.state = 'idle';
                    this.ox.stateTimer = 1;
                }
                break;
        }
    }
    
    displayMessage(text) {
        this.messageText = text;
        this.showMessage = true;
        this.messageTimer = 1.5;
    }
    
    render(ctx) {
        // SCREEN FLASH effect!
        if (this.screenFlash > 0) {
            ctx.save();
        }
        
        // Arena background (sandy bullring)
        ctx.fillStyle = '#d4a56a';
        ctx.fillRect(0, 0, 800, 600);
        
        // Arena ring
        ctx.fillStyle = '#c4954a';
        ctx.beginPath();
        ctx.ellipse(400, 320, 350, 250, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.ellipse(400, 320, 350, 250, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(400, 320, 300, 200, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw dust clouds
        this.dustClouds.forEach(dust => {
            ctx.fillStyle = `rgba(180, 150, 100, ${dust.life * 2})`;
            ctx.beginPath();
            ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw matzah powerups
        this.matzahPowerups.forEach(matzah => matzah.render(ctx));
        
        // Draw ox
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Flash when hit
        if (this.ox.state === 'hit') {
            ctx.globalAlpha = Math.sin(this.engine.totalTime * 30) > 0 ? 1 : 0.3;
        }
        
        // Tired effect
        if (this.ox.tired) {
            ctx.fillText('💫', this.ox.x, this.ox.y - 40);
        }
        
        ctx.fillText(this.ox.emoji, this.ox.x, this.ox.y);
        ctx.globalAlpha = 1;
        
        // Charge indicator
        if (this.ox.state === 'charging') {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.ox.x, this.ox.y);
            ctx.lineTo(this.ox.x + this.ox.chargeDirection.x * 50, this.ox.y + this.ox.chargeDirection.y * 50);
            ctx.stroke();
        }
        
        // Draw player (Butcher) - ALWAYS FULLY VISIBLE with glow!
        ctx.save();
        
        // Pulsing glow for visibility
        const pulse = Math.sin(this.engine.totalTime * 3) * 5;
        const bobY = Math.sin(this.engine.totalTime * 2) * 2;
        
        // Only flicker alpha when invincible, otherwise FULLY OPAQUE
        if (this.player.invincible) {
            ctx.globalAlpha = Math.sin(this.engine.totalTime * 20) > 0 ? 1 : 0.7;
        } else {
            ctx.globalAlpha = 1; // NEVER transparent!
        }
        
        // GLOW EFFECT - make player stand out!
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 25 + pulse;
        ctx.font = '55px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.player.emoji, this.player.x, this.player.y + bobY);
        
        // Second glow layer
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.fillText(this.player.emoji, this.player.x, this.player.y + bobY);
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // Draw knife with DRAMATIC swing animation!
        ctx.save();
        ctx.translate(this.player.x + 25, this.player.y - 10);
        
        if (this.player.knifeSwing > 0) {
            // DRAMATIC swinging knife animation!
            ctx.rotate(this.player.knifeSwingAngle);
            
            // Knife glow
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20;
            ctx.font = '45px Arial';
            ctx.fillText(this.player.knifeEmoji, 0, -20);
            
            // Multiple slash arc effects!
            for (let i = 0; i < 3; i++) {
                const alpha = 1 - (i * 0.3);
                const offset = i * 0.2;
                ctx.strokeStyle = `rgba(255, ${255 - i * 80}, ${255 - i * 120}, ${alpha})`;
                ctx.lineWidth = 6 - i * 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, 45 + i * 10, this.player.knifeSwingAngle - 0.8 - offset, this.player.knifeSwingAngle + 0.5);
                ctx.stroke();
            }
            
            // Speed lines!
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const angle = this.player.knifeSwingAngle - 0.3 - i * 0.15;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
                ctx.lineTo(Math.cos(angle) * 70, Math.sin(angle) * 70);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        } else {
            // Normal knife position with subtle glow
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 10;
            ctx.font = '32px Arial';
            ctx.fillText(this.player.knifeEmoji, 5, 5);
            ctx.shadowBlur = 0;
        }
        ctx.restore();
        
        // Draw cape/cloth (smaller shield)
        ctx.font = '18px Arial';
        ctx.fillText('🟥', this.player.x + 35, this.player.y + 15);
        ctx.globalAlpha = 1;
        
        // Draw knife when can strike
        if (this.ox.tired) {
            const dx = this.player.x - this.ox.x;
            const dy = this.player.y - this.ox.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 80) {
                ctx.font = '25px Arial';
                ctx.fillText('🔪', this.player.x, this.player.y - 30);
                ctx.font = '14px Arial';
                ctx.fillStyle = '#00ff00';
                ctx.fillText('Press SPACE!', this.player.x, this.player.y - 50);
            }
        }
        
        // Ox HP bar
        ctx.fillStyle = '#333';
        ctx.fillRect(300, 60, 200, 15);
        ctx.fillStyle = 'red';
        ctx.fillRect(302, 62, 196, 11);
        ctx.fillStyle = 'lime';
        ctx.fillRect(302, 62, 196 * (this.ox.hp / this.ox.maxHp), 11);
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('OX', 400, 71);
        
        // Progress
        ctx.font = '16px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 3;
        ctx.fillText(`Hits: ${this.ox.hits}/${this.ox.maxHits}`, 20, 75);
        ctx.shadowBlur = 0;
        
        // Victory hamburger display!
        if (this.showVictory) {
            // Dark overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, 800, 600);
            
            // Plate of hamburgers!
            ctx.font = '80px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🍔', 320, 300);
            ctx.fillText('🍔', 400, 280);
            ctx.fillText('🍔', 480, 300);
            ctx.fillText('🍔', 360, 350);
            ctx.fillText('🍔', 440, 350);
            
            // Plate
            ctx.font = '120px Arial';
            ctx.fillText('🍽️', 400, 420);
            
            // Victory text
            ctx.font = 'bold 36px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 5;
            ctx.fillText('🎉 Delicious Hamburgers! 🎉', 400, 500);
            ctx.shadowBlur = 0;
        }
        
        // ===== MORTAL KOMBAT STYLE EFFECTS! =====
        
        // Draw BLOOD SPLATTERS!
        this.bloodSplatters.forEach(blood => {
            ctx.fillStyle = blood.color;
            ctx.globalAlpha = blood.life;
            ctx.beginPath();
            ctx.arc(blood.x, blood.y, blood.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // Draw SLASH TRAILS!
        this.slashTrails.forEach(slash => {
            ctx.save();
            ctx.translate(slash.x, slash.y);
            ctx.rotate(slash.angle);
            
            // Gradient slash
            const gradient = ctx.createLinearGradient(0, 0, slash.length, 0);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.3, slash.color);
            gradient.addColorStop(0.7, slash.color);
            gradient.addColorStop(1, 'transparent');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 8 * slash.opacity;
            ctx.globalAlpha = slash.opacity;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(slash.length, 0);
            ctx.stroke();
            
            ctx.restore();
        });
        ctx.globalAlpha = 1;
        
        // Draw HIT SPARKS!
        this.hitSparks.forEach(spark => {
            ctx.fillStyle = spark.color;
            ctx.globalAlpha = spark.life * 2;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Spark trail
            ctx.strokeStyle = spark.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(spark.x, spark.y);
            ctx.lineTo(spark.x - spark.vx * 0.05, spark.y - spark.vy * 0.05);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;
        
        // Draw COMBO TEXT! ("BRUTAL!", "FATALITY!" etc)
        if (this.comboTextTimer > 0 && this.comboText) {
            ctx.save();
            const scale = Math.min(1, (1.5 - this.comboTextTimer) * 3);
            const shake = Math.sin(this.engine.totalTime * 30) * (this.comboTextTimer > 1 ? 3 : 0);
            
            ctx.translate(400 + shake, 200);
            ctx.scale(scale, scale);
            
            // Text with dramatic outline
            ctx.font = 'bold 60px Impact, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Red glow
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#ff0000';
            ctx.fillText(this.comboText, 0, 0);
            
            // White inner text
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeText(this.comboText, 0, 0);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.comboText, 0, 0);
            
            ctx.restore();
        }
        
        // SCREEN FLASH overlay!
        if (this.screenFlash > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${this.screenFlash * 0.5})`;
            ctx.fillRect(0, 0, 800, 600);
            ctx.restore();
        }
        
        // Draw message
        if (this.showMessage && !this.showVictory) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(200, 520, 400, 50);
            ctx.font = '18px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(this.messageText, 400, 550);
        }
        
        // Hint
        if (!this.showMessage && !this.showVictory) {
            ctx.font = '12px Arial';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('Dodge charges! Strike when the ox hits the wall and gets tired!', 400, 590);
        }
    }
    
    reset() {
        this.player = {
            x: 400,
            y: 450,
            width: 50,
            height: 50,
            speed: 200,
            emoji: '🧑',
            knifeEmoji: '🔪',
            invincible: false,
            invincibleTimer: 0,
            canStrike: false,
            knifeSwing: 0,
            knifeSwingAngle: 0
        };
        this.ox = {
            x: 400,
            y: 150,
            width: 60,
            height: 60,
            speed: this.settings.oxSpeed,
            emoji: '🐂',
            state: 'idle',
            stateTimer: 1,
            chargeDirection: { x: 0, y: 0 },
            chargeTarget: { x: 0, y: 0 },
            hp: 100,
            maxHp: 100,
            tired: false,
            tiredTimer: 0,
            hits: 0,
            maxHits: 5
        };
        this.dustClouds = [];
        this.matzahPowerups = [];
        // Reset Mortal Kombat effects
        this.slashTrails = [];
        this.bloodSplatters = [];
        this.hitSparks = [];
        this.screenFlash = 0;
        this.slowMotion = 0;
        this.hitFreezeTimer = 0;
        this.comboText = '';
        this.comboTextTimer = 0;
        this.showVictory = false;
        this.victoryTimer = 0;
        this.complete = false;
        this.showMessage = false;
        this.displayMessage('¡Olé! Dodge the ox!');
    }
}

window.Level8 = Level8;
