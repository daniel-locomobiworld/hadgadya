// Level 5: A Fire comes and burns the Stick
// Missile Command style - Fire burns falling sticks

class Level5 {
    constructor(engine) {
        this.engine = engine;
        this.name = "Burn the Sticks";
        this.description = "You are the Fire! Shoot flames to burn the falling sticks before they reach the ground!";
        this.instructions = "← → to aim, SPACE to shoot fire!";
        this.icon = "🔥";
        
        // Fire turret
        this.turret = {
            x: 400,
            y: 550,
            angle: -Math.PI/2, // Pointing up
            rotSpeed: 2.5
        };
        
        // Cities/bases to protect
        this.bases = [
            { x: 100, y: 560, width: 80, height: 40, alive: true, emoji: '🏠' },
            { x: 300, y: 560, width: 80, height: 40, alive: true, emoji: '🏡' },
            { x: 500, y: 560, width: 80, height: 40, alive: true, emoji: '🏠' },
            { x: 700, y: 560, width: 80, height: 40, alive: true, emoji: '🏡' }
        ];
        
        // Falling sticks (missiles)
        this.sticks = [];
        this.spawnTimer = 0;
        this.spawnDelay = 1.5;
        this.stickSpeed = 80;
        
        // Fire projectiles
        this.flames = [];
        this.shootCooldown = 0;
        
        // Explosions
        this.explosions = [];
        
        // Wave system
        this.wave = 1;
        this.sticksPerWave = 10;
        this.sticksSpawned = 0;
        this.sticksDestroyed = 0;
        this.sticksNeeded = 30; // Total sticks to destroy to win
        
        // Matzah powerups
        this.matzahPowerups = [];
        
        // Level state
        this.complete = false;
        this.showMessage = false;
        this.messageText = '';
        this.messageTimer = 0;
        
        this.displayMessage(`Wave ${this.wave}!`);
    }
    
    update(dt) {
        if (this.complete) return;
        
        // Update turret
        this.updateTurret(dt);
        
        // Spawn sticks
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.sticksSpawned < this.sticksNeeded) {
            this.spawnStick();
            this.spawnTimer = this.spawnDelay / (1 + this.wave * 0.2);
        }
        
        // Update sticks
        this.updateSticks(dt);
        
        // Update flames
        this.updateFlames(dt);
        
        // Update explosions
        this.updateExplosions(dt);
        
        // Shooting
        this.shootCooldown -= dt;
        if (this.engine.isKeyJustPressed('action') && this.shootCooldown <= 0) {
            this.shootFlame();
            this.shootCooldown = 0.3;
        }
        
        // Update matzah powerups
        this.matzahPowerups = this.matzahPowerups.filter(matzah => {
            matzah.update(dt);
            matzah.y += 30 * dt;
            // Check if player is near (turret area)
            const dist = Math.sqrt(Math.pow(matzah.x - this.turret.x, 2) + Math.pow(matzah.y - this.turret.y, 2));
            if (dist < 50) {
                this.engine.addAwakeness(matzah.awakenessBoost);
                this.displayMessage('🫓 Matzah! +15 Awakeness!');
                return false;
            }
            return matzah.y < 600;
        });
        
        // Check win condition - Complete after wave 3 when all sticks are cleared
        if (this.wave >= 3 && this.sticksSpawned >= 30 && this.sticks.length === 0 && !this.complete) {
            this.complete = true;
            this.displayMessage('🎉 The Fire burned all the Sticks!');
            setTimeout(() => {
                if (this.engine.onLevelComplete) {
                    this.engine.onLevelComplete();
                }
            }, 2000);
        }
        
        // Check lose condition
        const basesAlive = this.bases.filter(b => b.alive).length;
        if (basesAlive === 0) {
            this.displayMessage('💀 All houses destroyed! Try Again!');
            setTimeout(() => this.reset(), 2000);
        }
        
        // Update message timer
        if (this.showMessage) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                this.showMessage = false;
            }
        }
        
        // Wave progression - Ends at wave 3
        if (this.sticksSpawned >= this.wave * this.sticksPerWave && this.sticks.length === 0 && !this.complete) {
            if (this.wave < 3) {
                this.wave++;
                this.displayMessage(`Wave ${this.wave}!`);
            }
        }
    }
    
    updateTurret(dt) {
        if (this.engine.isKeyDown('left')) {
            this.turret.angle -= this.turret.rotSpeed * dt;
        }
        if (this.engine.isKeyDown('right')) {
            this.turret.angle += this.turret.rotSpeed * dt;
        }
        
        // Clamp angle to upper hemisphere
        this.turret.angle = Math.max(-Math.PI + 0.2, Math.min(-0.2, this.turret.angle));
    }
    
    spawnStick() {
        const targetBase = this.bases.filter(b => b.alive)[Math.floor(Math.random() * this.bases.filter(b => b.alive).length)];
        if (!targetBase) return;
        
        const startX = Math.random() * 700 + 50;
        const startY = -20;
        
        // Calculate trajectory
        const dx = targetBase.x + targetBase.width/2 - startX;
        const dy = targetBase.y - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        this.sticks.push({
            x: startX,
            y: startY,
            vx: (dx / dist) * this.stickSpeed * (0.8 + Math.random() * 0.4),
            vy: (dy / dist) * this.stickSpeed * (0.8 + Math.random() * 0.4),
            rotation: Math.random() * Math.PI * 2
        });
        
        this.sticksSpawned++;
    }
    
    updateSticks(dt) {
        this.sticks = this.sticks.filter(stick => {
            stick.x += stick.vx * dt;
            stick.y += stick.vy * dt;
            stick.rotation += dt * 3;
            
            // Check if hit ground/base
            if (stick.y >= 550) {
                // Check which base was hit
                for (let base of this.bases) {
                    if (base.alive && stick.x >= base.x && stick.x <= base.x + base.width) {
                        base.alive = false;
                        this.engine.screenShake();
                        this.createExplosion(base.x + base.width/2, base.y, 50, '#ff4444');
                    }
                }
                return false;
            }
            
            return true;
        });
    }
    
    shootFlame() {
        this.flames.push({
            x: this.turret.x,
            y: this.turret.y,
            vx: Math.cos(this.turret.angle) * 350,
            vy: Math.sin(this.turret.angle) * 350,
            life: 2
        });
        // Whoosh sound when shooting flame
        if (window.audioManager) {
            window.audioManager.playSynthSound('fire');
        }
    }
    
    updateFlames(dt) {
        this.flames = this.flames.filter(flame => {
            flame.x += flame.vx * dt;
            flame.y += flame.vy * dt;
            flame.life -= dt;
            
            // Check collision with sticks
            for (let i = this.sticks.length - 1; i >= 0; i--) {
                const stick = this.sticks[i];
                const dist = Math.sqrt(Math.pow(flame.x - stick.x, 2) + Math.pow(flame.y - stick.y, 2));
                if (dist < 30) {
                    this.sticks.splice(i, 1);
                    this.sticksDestroyed++;
                    this.createExplosion(stick.x, stick.y, 40, '#ff8800');
                    // Fire burning sound
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('fire');
                    }
                    
                    // Give awakeness for each stick destroyed!
                    this.engine.addAwakeness(5);
                    this.displayMessage('🔥 +5 Awakeness!');
                    
                    // Maybe spawn matzah (bonus awakeness)
                    if (Math.random() < 0.15) {
                        this.matzahPowerups.push(new MatzahPowerup(stick.x, stick.y));
                    }
                    
                    return false;
                }
            }
            
            // Check collision with matzah powerups - shoot them to collect!
            for (let i = this.matzahPowerups.length - 1; i >= 0; i--) {
                const matzah = this.matzahPowerups[i];
                const dist = Math.sqrt(Math.pow(flame.x - matzah.x, 2) + Math.pow(flame.y - matzah.y, 2));
                if (dist < 30) {
                    this.matzahPowerups.splice(i, 1);
                    this.engine.addAwakeness(matzah.awakenessBoost);
                    this.displayMessage('🫓 Matzah! +' + matzah.awakenessBoost + ' Awakeness!');
                    this.createExplosion(matzah.x, matzah.y, 30, '#ffcc00');
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('powerup');
                    }
                    // Don't consume the flame - let it continue
                }
            }
            
            // Out of bounds or expired
            return flame.y > 0 && flame.x > 0 && flame.x < 800 && flame.life > 0;
        });
    }
    
    createExplosion(x, y, size, color) {
        this.explosions.push({
            x, y,
            size: 0,
            maxSize: size,
            color,
            life: 0.5
        });
    }
    
    updateExplosions(dt) {
        this.explosions = this.explosions.filter(exp => {
            exp.life -= dt;
            exp.size = exp.maxSize * (1 - exp.life / 0.5);
            return exp.life > 0;
        });
    }
    
    displayMessage(text) {
        this.messageText = text;
        this.showMessage = true;
        this.messageTimer = 2;
    }
    
    render(ctx) {
        // Night sky background
        ctx.fillStyle = '#0a0a30';
        ctx.fillRect(0, 0, 800, 600);
        
        // Stars
        ctx.fillStyle = 'white';
        for (let i = 0; i < 80; i++) {
            const x = (i * 137 + Math.sin(i) * 50) % 800;
            const y = (i * 67) % 500;
            const twinkle = Math.sin(this.engine.totalTime * 5 + i) > 0.7 ? 3 : 2;
            ctx.fillRect(x, y, twinkle, twinkle);
        }
        
        // Ground
        ctx.fillStyle = '#2d5a27';
        ctx.fillRect(0, 560, 800, 40);
        
        // Draw bases
        this.bases.forEach(base => {
            if (base.alive) {
                ctx.font = '40px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(base.emoji, base.x + base.width/2, base.y + 20);
            } else {
                ctx.font = '40px Arial';
                ctx.textAlign = 'center';
                ctx.globalAlpha = 0.5;
                ctx.fillText('🔥', base.x + base.width/2, base.y + 20);
                ctx.globalAlpha = 1;
            }
        });
        
        // Draw sticks (falling missiles)
        ctx.font = '30px Arial';
        this.sticks.forEach(stick => {
            ctx.save();
            ctx.translate(stick.x, stick.y);
            ctx.rotate(stick.rotation);
            ctx.textAlign = 'center';
            ctx.fillText('🪵', 0, 0);
            ctx.restore();
        });
        
        // Draw flames
        this.flames.forEach(flame => {
            ctx.font = '25px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔥', flame.x, flame.y);
        });
        
        // Draw explosions
        this.explosions.forEach(exp => {
            ctx.fillStyle = exp.color;
            ctx.globalAlpha = exp.life * 2;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        
        // Draw matzah powerups
        this.matzahPowerups.forEach(matzah => matzah.render(ctx));
        
        // Draw turret
        ctx.save();
        ctx.translate(this.turret.x, this.turret.y);
        
        // Turret base
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Turret barrel
        ctx.rotate(this.turret.angle);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -8, 50, 16);
        
        // Fire at tip
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔥', 55, 0);
        
        ctx.restore();
        
        // UI - Progress
        ctx.font = '16px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText(`Sticks Burned: ${this.sticksDestroyed}/${this.sticksNeeded}`, 20, 75);
        ctx.fillText(`Wave: ${this.wave}/3`, 20, 95);
        
        // Draw message
        if (this.showMessage) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(200, 280, 400, 50);
            ctx.font = '18px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(this.messageText, 400, 310);
        }
        
        // Controls hint
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.fillText('← → to aim, SPACE to shoot fire', 400, 595);
    }
    
    reset() {
        this.turret = {
            x: 400,
            y: 550,
            angle: -Math.PI/2,
            rotSpeed: 2.5
        };
        this.bases = [
            { x: 100, y: 560, width: 80, height: 40, alive: true, emoji: '🏠' },
            { x: 300, y: 560, width: 80, height: 40, alive: true, emoji: '🏡' },
            { x: 500, y: 560, width: 80, height: 40, alive: true, emoji: '🏠' },
            { x: 700, y: 560, width: 80, height: 40, alive: true, emoji: '🏡' }
        ];
        this.sticks = [];
        this.flames = [];
        this.explosions = [];
        this.wave = 1;
        this.sticksSpawned = 0;
        this.sticksDestroyed = 0;
        this.spawnTimer = 0;
        this.matzahPowerups = [];
        this.complete = false;
        this.showMessage = false;
        this.displayMessage(`Wave ${this.wave}!`);
    }
}

window.Level5 = Level5;
