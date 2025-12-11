// Level 8: A Butcher (Shochet) comes and slaughters the Ox
// Bullfighting game - dodge the ox and hit it when it's tired

class Level8 {
    constructor(engine) {
        this.engine = engine;
        this.name = "The Bullfight";
        this.description = "You are the Shochet (Butcher)! Dodge the charging ox and strike when it's exhausted!";
        this.instructions = "Arrow keys to dodge. Press SPACE to strike when the ox is tired!";
        this.icon = "🔪";
        
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
            canStrike: false
        };
        
        // Ox (enemy)
        this.ox = {
            x: 400,
            y: 150,
            width: 60,
            height: 60,
            speed: 280,
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
                this.displayMessage(`🔪 Strike! (${this.ox.hits}/${this.ox.maxHits})`);
                // Knife strike sound
                if (window.audioManager) {
                    window.audioManager.playSynthSound('hit');
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
                    this.displayMessage('🎉 The Shochet defeated the Ox!');
                    setTimeout(() => {
                        if (this.engine.onLevelComplete) {
                            this.engine.onLevelComplete();
                        }
                    }, 2000);
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
                    this.ox.tiredTimer = 2;
                    this.ox.stateTimer = 2;
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
        
        // Draw player (Butcher - bigger!)
        ctx.font = '50px Arial';
        
        // Flicker when invincible
        if (this.player.invincible) {
            ctx.globalAlpha = Math.sin(this.engine.totalTime * 20) > 0 ? 1 : 0.3;
        }
        
        ctx.fillText(this.player.emoji, this.player.x, this.player.y);
        
        // Draw knife always visible next to butcher
        ctx.font = '30px Arial';
        ctx.fillText(this.player.knifeEmoji, this.player.x + 30, this.player.y - 5);
        
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
        
        // Draw message
        if (this.showMessage) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(200, 520, 400, 50);
            ctx.font = '18px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(this.messageText, 400, 550);
        }
        
        // Hint
        if (!this.showMessage) {
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
            canStrike: false
        };
        this.ox = {
            x: 400,
            y: 150,
            width: 60,
            height: 60,
            speed: 280,
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
        this.complete = false;
        this.showMessage = false;
        this.displayMessage('¡Olé! Dodge the ox!');
    }
}

window.Level8 = Level8;
