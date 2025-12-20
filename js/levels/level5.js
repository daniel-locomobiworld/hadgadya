// Level 5: A Fire comes and burns the Stick
// Missile Command style - Fire burns falling sticks

class Level5 {
    constructor(engine, difficulty = 'normal') {
        this.engine = engine;
        this.difficulty = difficulty;
        this.name = "Burn the Sticks";
        this.description = "You are the Fire! Shoot flames to burn the falling sticks before they reach the ground!";
        this.instructions = "← → to aim, SPACE to shoot fire!";
        this.icon = "🔥";
        
        // Difficulty settings
        this.difficultySettings = {
            easy: { spawnDelay: 2.0, stickSpeed: 60 },
            normal: { spawnDelay: 1.5, stickSpeed: 80 },
            hard: { spawnDelay: 1.0, stickSpeed: 100 },
            extreme: { spawnDelay: 0.7, stickSpeed: 130 }
        };
        this.settings = this.difficultySettings[difficulty] || this.difficultySettings.normal;
        
        // Fire turret
        this.turret = {
            x: 400,
            y: 550,
            angle: -Math.PI/2, // Pointing up
            rotSpeed: 2.5
        };
        
        // Cities/bases to protect - now tracks hit status AND burning status
        this.bases = [
            { x: 100, y: 560, width: 80, height: 40, alive: true, burning: false, burnTimer: 0, emoji: '🏠' },
            { x: 300, y: 560, width: 80, height: 40, alive: true, burning: false, burnTimer: 0, emoji: '🏡' },
            { x: 500, y: 560, width: 80, height: 40, alive: true, burning: false, burnTimer: 0, emoji: '🏠' },
            { x: 700, y: 560, width: 80, height: 40, alive: true, burning: false, burnTimer: 0, emoji: '🏡' }
        ];
        this.housesHit = 0;
        
        // Falling sticks (missiles)
        this.sticks = [];
        this.spawnTimer = 0;
        this.spawnDelay = this.settings.spawnDelay;
        this.stickSpeed = this.settings.stickSpeed;
        
        // Fire projectiles
        this.flames = [];
        this.shootCooldown = 0;
        
        // Explosions
        this.explosions = [];
        
        // Wave system - 3 waves with increasing sticks and speed
        this.wave = 1;
        this.waveStickCounts = [10, 15, 20]; // Wave 1: 10, Wave 2: 15, Wave 3: 20
        this.waveSpeedMultiplier = [1.0, 1.3, 1.6]; // Each wave is faster
        this.sticksSpawnedThisWave = 0;
        this.sticksDestroyed = 0;
        this.sticksNeeded = 45; // Total: 10 + 15 + 20 = 45
        this.waveTransition = false;
        this.waveTransitionTimer = 0;
        
        // Elijah the Prophet - visits houses and puts out fires!
        this.elijah = null;
        this.elijahSpawned = false;
        this.elijahAnnouncementPlayed = false;
        this.elijahPenaltyTimer = 0; // 30 second penalty if Elijah is hit
        this.elijahHit = false;
        
        // Matzah powerups
        this.matzahPowerups = [];
        
        // Level state
        this.complete = false;
        this.showMessage = false;
        this.messageText = '';
        this.messageTimer = 0;
        
        // Instructions overlay
        this.showInstructions = true;
        this.instructionsTimer = 4;
        this.controlsText = [
            '🎮 CONTROLS',
            '⬅️➡️ - Aim turret',
            'SPACE - Shoot fire',
            '',
            '🎯 GOAL: Burn falling sticks!',
            '⚠️ Don\'t hit Elijah!'
        ];
        
        this.displayMessage(`Wave ${this.wave} of 3!`);
    }
    
    spawnElijah() {
        // Elijah visits homes to drink wine and puts out fires
        const burningBases = this.bases.filter(b => b.burning && b.alive);
        if (burningBases.length === 0) return;
        
        // Pick a random burning house to visit
        const targetBase = burningBases[Math.floor(Math.random() * burningBases.length)];
        
        this.elijah = {
            x: -50,
            y: 520,
            targetX: targetBase.x + targetBase.width/2,
            targetBase: targetBase,
            speed: 80,
            state: 'walking', // walking, drinking, leaving
            drinkTimer: 0,
            emoji: '🧔'
        };
        
        // Announce Elijah if not already done
        if (!this.elijahAnnouncementPlayed) {
            this.elijahAnnouncementPlayed = true;
            this.displayMessage("🧔 Don't hit Elijah the Prophet as he visits homes to drink his wine!");
            // Play voice announcement
            if (window.audioManager) {
                window.audioManager.speakWithBrowserTTS("Don't hit Elijah the Prophet as he visits homes to drink his wine!");
            }
        }
    }
    
    updateElijah(dt) {
        if (!this.elijah) return;
        
        const e = this.elijah;
        
        if (e.state === 'walking') {
            // Walk toward target house
            if (e.x < e.targetX - 10) {
                e.x += e.speed * dt;
            } else {
                e.state = 'drinking';
                e.drinkTimer = 3; // Drink wine for 3 seconds
            }
        } else if (e.state === 'drinking') {
            e.drinkTimer -= dt;
            
            // Put out the fire while drinking!
            if (e.targetBase.burning) {
                e.targetBase.burnTimer -= dt * 2; // Put out fire faster
                if (e.targetBase.burnTimer <= 0) {
                    e.targetBase.burning = false;
                    e.targetBase.burnTimer = 0;
                    this.housesHit--;
                    this.displayMessage('🧔 Elijah put out the fire! 🍷');
                }
            }
            
            if (e.drinkTimer <= 0) {
                e.state = 'leaving';
            }
        } else if (e.state === 'leaving') {
            e.x += e.speed * dt;
            if (e.x > 850) {
                this.elijah = null;
            }
        }
    }
    
    update(dt) {
        if (this.complete) return;
        
        // Instructions timer
        if (this.showInstructions) {
            this.instructionsTimer -= dt;
            if (this.instructionsTimer <= 0) {
                this.showInstructions = false;
            }
        }
        
        // Wave transition pause
        if (this.waveTransition) {
            this.waveTransitionTimer -= dt;
            if (this.waveTransitionTimer <= 0) {
                this.waveTransition = false;
            }
            return;
        }
        
        // Update Elijah penalty timer
        if (this.elijahPenaltyTimer > 0) {
            this.elijahPenaltyTimer -= dt;
            if (this.elijahPenaltyTimer <= 0) {
                this.elijahHit = false;
                this.displayMessage('🧔 Elijah has forgiven you!');
            }
        }
        
        // Update turret
        this.updateTurret(dt);
        
        // Calculate sticks for current wave
        const sticksForCurrentWave = this.waveStickCounts[this.wave - 1] || 10;
        
        // Spawn sticks based on wave
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.sticksSpawnedThisWave < sticksForCurrentWave) {
            this.spawnStick();
            // Faster spawn rate in later waves
            const waveSpawnMultiplier = this.waveSpeedMultiplier[this.wave - 1] || 1.0;
            this.spawnTimer = this.spawnDelay / waveSpawnMultiplier;
        }
        
        // Update sticks
        this.updateSticks(dt);
        
        // Update flames
        this.updateFlames(dt);
        
        // Update explosions
        this.updateExplosions(dt);
        
        // Update Elijah
        this.updateElijah(dt);
        
        // Spawn Elijah when houses are burning
        const burningHouses = this.bases.filter(b => b.burning && b.alive).length;
        if (burningHouses > 0 && !this.elijah && Math.random() < 0.003) {
            this.spawnElijah();
        }
        
        // Shooting - penalized if Elijah was hit
        this.shootCooldown -= dt;
        const shootDelay = this.elijahHit ? 1.0 : 0.3; // Much slower if Elijah was hit
        if (this.engine.isKeyJustPressed('action') && this.shootCooldown <= 0) {
            this.shootFlame();
            this.shootCooldown = shootDelay;
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
        
        // Update burning houses timers
        this.bases.forEach(base => {
            if (base.burning && base.alive) {
                base.burnTimer += dt;
                // House is destroyed after burning for 10 seconds
                if (base.burnTimer > 10) {
                    base.alive = false;
                    base.burning = false;
                    this.createExplosion(base.x + base.width/2, base.y, 60, '#ff0000');
                    this.displayMessage('💀 A house burned down!');
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('death');
                    }
                }
            }
        });
        
        // Check win condition - Complete after wave 3 when all sticks in wave are cleared
        const totalSticksToSpawn = this.waveStickCounts[0] + this.waveStickCounts[1] + this.waveStickCounts[2];
        if (this.wave >= 3 && this.sticksSpawnedThisWave >= this.waveStickCounts[2] && this.sticks.length === 0 && !this.complete) {
            this.complete = true;
            this.displayMessage('🎉 The Fire burned all the Sticks!');
            setTimeout(() => {
                if (this.engine.onLevelComplete) {
                    this.engine.onLevelComplete();
                }
            }, 2000);
        }
        
        // Check lose condition - all 4 houses burning at once OR all destroyed
        const basesBurning = this.bases.filter(b => b.burning && b.alive).length;
        const basesAlive = this.bases.filter(b => b.alive).length;
        
        if (basesBurning === 4) {
            this.displayMessage('💀 All 4 houses are on fire! Try Again!');
            setTimeout(() => this.reset(), 2000);
            return;
        }
        
        if (basesAlive === 0) {
            this.displayMessage('💀 All houses destroyed! Try Again!');
            setTimeout(() => this.reset(), 2000);
            return;
        }
        
        // Update message timer
        if (this.showMessage) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                this.showMessage = false;
            }
        }
        
        // Wave progression
        if (this.sticksSpawnedThisWave >= sticksForCurrentWave && this.sticks.length === 0 && !this.complete) {
            if (this.wave < 3) {
                this.wave++;
                this.sticksSpawnedThisWave = 0;
                this.waveTransition = true;
                this.waveTransitionTimer = 2;
                this.displayMessage(`Wave ${this.wave} of 3!`);
                if (window.audioManager) {
                    window.audioManager.playSynthSound('powerup');
                }
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
        // Only target alive, non-burning houses
        const targetableBases = this.bases.filter(b => b.alive);
        const targetBase = targetableBases[Math.floor(Math.random() * targetableBases.length)];
        if (!targetBase) return;
        
        const startX = Math.random() * 700 + 50;
        const startY = -20;
        
        // Calculate trajectory with wave speed multiplier
        const dx = targetBase.x + targetBase.width/2 - startX;
        const dy = targetBase.y - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Sticks get faster each wave!
        const waveMultiplier = this.waveSpeedMultiplier[this.wave - 1] || 1.0;
        const currentSpeed = this.stickSpeed * waveMultiplier;
        
        // Wave 3 has some large sticks that require 3 hits!
        const isLargeStick = this.wave === 3 && Math.random() < 0.4; // 40% chance in wave 3
        
        this.sticks.push({
            x: startX,
            y: startY,
            vx: (dx / dist) * currentSpeed * (0.8 + Math.random() * 0.4) * (isLargeStick ? 0.7 : 1), // Large sticks move slower
            vy: (dy / dist) * currentSpeed * (0.8 + Math.random() * 0.4) * (isLargeStick ? 0.7 : 1),
            rotation: Math.random() * Math.PI * 2,
            hp: isLargeStick ? 3 : 1,
            isLarge: isLargeStick,
            size: isLargeStick ? 50 : 30
        });
        
        this.sticksSpawnedThisWave++;
        this.sticksDestroyed; // Track total for display
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
                        // House starts burning instead of immediately dying
                        if (!base.burning) {
                            base.burning = true;
                            base.burnTimer = 0;
                            this.housesHit++;
                            this.displayMessage(`🔥 House hit! ${this.housesHit} of 4 houses burning!`);
                            // Boom sound when house hit
                            if (window.audioManager) {
                                window.audioManager.playSynthSound('explosion');
                            }
                        }
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
            
            // Check collision with Elijah - big penalty!
            if (this.elijah && !this.elijahHit) {
                const elijahDist = Math.sqrt(Math.pow(flame.x - this.elijah.x, 2) + Math.pow(flame.y - this.elijah.y, 2));
                if (elijahDist < 40) {
                    this.elijahHit = true;
                    this.elijahPenaltyTimer = 30; // 30 second penalty
                    this.displayMessage('🧔 You hit Elijah! 30 second slow-fire penalty!');
                    if (window.audioManager) {
                        window.audioManager.speakWithBrowserTTS("Oy vey! You hit Elijah!");
                        window.audioManager.playSynthSound('death');
                    }
                    this.elijah = null; // Elijah disappears
                    return false;
                }
            }
            
            // Check collision with sticks
            for (let i = this.sticks.length - 1; i >= 0; i--) {
                const stick = this.sticks[i];
                const hitRadius = stick.isLarge ? 45 : 30;
                const dist = Math.sqrt(Math.pow(flame.x - stick.x, 2) + Math.pow(flame.y - stick.y, 2));
                if (dist < hitRadius) {
                    // Reduce HP
                    stick.hp = (stick.hp || 1) - 1;
                    
                    if (stick.hp <= 0) {
                        // Stick destroyed
                        this.sticks.splice(i, 1);
                        this.sticksDestroyed++;
                        const explosionSize = stick.isLarge ? 60 : 40;
                        this.createExplosion(stick.x, stick.y, explosionSize, '#ff8800');
                        
                        // Give awakeness - more for large sticks!
                        const awakenessBonus = stick.isLarge ? 15 : 5;
                        this.engine.addAwakeness(awakenessBonus);
                        this.displayMessage(stick.isLarge ? '🔥 Big Stick! +15 Awakeness!' : '🔥 +5 Awakeness!');
                        
                        // Maybe spawn matzah (bonus awakeness)
                        if (Math.random() < 0.15) {
                            this.matzahPowerups.push(new MatzahPowerup(stick.x, stick.y));
                        }
                    } else {
                        // Stick hit but not destroyed - show damage
                        this.createExplosion(stick.x, stick.y, 25, '#ffaa00');
                        this.displayMessage(`🪵 ${stick.hp} hits left!`);
                    }
                    
                    // Fire burning sound
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('fire');
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
        
        // Draw bases - with burning animation
        this.bases.forEach(base => {
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            
            if (!base.alive) {
                // Destroyed house - just embers
                ctx.globalAlpha = 0.3;
                ctx.fillText('🏚️', base.x + base.width/2, base.y + 20);
                ctx.globalAlpha = 1;
            } else if (base.burning) {
                // House is on fire but still alive
                ctx.fillText(base.emoji, base.x + base.width/2, base.y + 20);
                // Animated fire on top
                const fireOffset = Math.sin(this.engine.totalTime * 10) * 3;
                ctx.font = '30px Arial';
                ctx.fillText('🔥', base.x + base.width/2, base.y - 10 + fireOffset);
                // Fire intensity grows with burn timer
                if (base.burnTimer > 3) {
                    ctx.fillText('🔥', base.x + base.width/2 - 20, base.y + fireOffset);
                }
                if (base.burnTimer > 6) {
                    ctx.fillText('🔥', base.x + base.width/2 + 20, base.y + 5 + fireOffset);
                }
            } else {
                // Normal house
                ctx.fillText(base.emoji, base.x + base.width/2, base.y + 20);
            }
        });
        
        // Draw Elijah the Prophet
        if (this.elijah) {
            const e = this.elijah;
            ctx.font = '45px Arial';
            ctx.textAlign = 'center';
            
            // Walking animation
            const bobY = Math.sin(this.engine.totalTime * 8) * 3;
            ctx.fillText(e.emoji, e.x, e.y + bobY);
            
            // Wine cup when drinking
            if (e.state === 'drinking') {
                ctx.font = '25px Arial';
                ctx.fillText('🍷', e.x + 25, e.y - 15);
                // Sparkles while putting out fire
                ctx.font = '20px Arial';
                const sparkle = Math.floor(this.engine.totalTime * 5) % 2 === 0 ? '✨' : '💫';
                ctx.fillText(sparkle, e.x - 30, e.y - 25);
            }
            
            // Label
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.fillText('Elijah', e.x, e.y - 35);
        }
        
        // Draw sticks (falling missiles)
        this.sticks.forEach(stick => {
            ctx.save();
            ctx.translate(stick.x, stick.y);
            ctx.rotate(stick.rotation);
            ctx.textAlign = 'center';
            
            if (stick.isLarge) {
                // Large sticks are bigger and have a glow
                ctx.shadowColor = '#ff6600';
                ctx.shadowBlur = 15;
                ctx.font = `${stick.size}px Arial`;
                ctx.fillText('🪵', 0, 0);
                
                // Show HP indicator
                ctx.shadowBlur = 0;
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#ffff00';
                ctx.fillText(`${stick.hp}`, 0, -25);
            } else {
                ctx.font = '30px Arial';
                ctx.fillText('🪵', 0, 0);
            }
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
        ctx.fillText(`Sticks Burned: ${this.sticksDestroyed}`, 20, 75);
        ctx.fillText(`Wave: ${this.wave} of 3`, 20, 95);
        
        // Houses hit counter
        const burningCount = this.bases.filter(b => b.burning && b.alive).length;
        if (burningCount > 0) {
            ctx.fillStyle = burningCount >= 3 ? '#ff4444' : '#ffaa00';
            ctx.fillText(`🔥 ${burningCount} of 4 houses burning!`, 20, 115);
        } else {
            ctx.fillStyle = '#44ff44';
            ctx.fillText(`Houses safe: 4`, 20, 115);
        }
        
        // Elijah penalty timer
        if (this.elijahPenaltyTimer > 0) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`⚠️ Elijah penalty: ${Math.ceil(this.elijahPenaltyTimer)}s`, 20, 135);
        }
        
        // Wave transition message
        if (this.waveTransition) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(250, 250, 300, 100);
            ctx.font = 'bold 28px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'center';
            ctx.fillText(`WAVE ${this.wave}`, 400, 290);
            ctx.font = '18px Arial';
            ctx.fillStyle = 'white';
            const stickCount = this.waveStickCounts[this.wave - 1];
            ctx.fillText(`${stickCount} sticks incoming!`, 400, 325);
        }
        
        // Draw message
        if (this.showMessage && !this.waveTransition) {
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
        
        // INSTRUCTIONS OVERLAY
        if (this.showInstructions && this.instructionsTimer > 0) {
            const alpha = Math.min(1, this.instructionsTimer / 0.5);
            ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * alpha})`;
            ctx.fillRect(200, 150, 400, 230);
            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.strokeRect(200, 150, 400, 230);
            
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            let y = 190;
            for (let line of this.controlsText) {
                ctx.font = line.includes('CONTROLS') ? 'bold 24px Arial' : '18px Arial';
                ctx.fillText(line, 400, y);
                y += 32;
            }
        }
    }
    
    reset() {
        this.turret = {
            x: 400,
            y: 550,
            angle: -Math.PI/2,
            rotSpeed: 2.5
        };
        this.bases = [
            { x: 100, y: 560, width: 80, height: 40, alive: true, burning: false, burnTimer: 0, emoji: '🏠' },
            { x: 300, y: 560, width: 80, height: 40, alive: true, burning: false, burnTimer: 0, emoji: '🏡' },
            { x: 500, y: 560, width: 80, height: 40, alive: true, burning: false, burnTimer: 0, emoji: '🏠' },
            { x: 700, y: 560, width: 80, height: 40, alive: true, burning: false, burnTimer: 0, emoji: '🏡' }
        ];
        this.housesHit = 0;
        this.sticks = [];
        this.flames = [];
        this.explosions = [];
        this.wave = 1;
        this.sticksSpawnedThisWave = 0;
        this.sticksDestroyed = 0;
        this.spawnTimer = 0;
        this.waveTransition = false;
        this.waveTransitionTimer = 0;
        this.elijah = null;
        this.elijahSpawned = false;
        this.elijahPenaltyTimer = 0;
        this.elijahHit = false;
        this.matzahPowerups = [];
        this.complete = false;
        this.showMessage = false;
        this.displayMessage(`Wave ${this.wave} of 3!`);
    }
}

window.Level5 = Level5;
