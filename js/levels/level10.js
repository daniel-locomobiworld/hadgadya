// Level 10: The Holy One comes and destroys the Angel of Death
// 1v1 Fighting Game - Final Boss Battle!

class Level10 {
    constructor(engine, difficulty = 'normal') {
        this.engine = engine;
        this.difficulty = difficulty;
        this.name = "Final Battle";
        this.description = "You are The Holy One! Defeat the Angel of Death in an epic 1v1 fighting battle! Reduce their HP to 0 to win!";
        this.instructions = "← → Move | ↑ Jump | Z Punch | X Special Attack | C Block. Build combos for bonus damage!";
        this.icon = "✡️";
        
        // Difficulty settings
        this.difficultySettings = {
            easy: { enemyHP: 100, enemySpeed: 120, aiCooldown: 0.8 },
            normal: { enemyHP: 150, enemySpeed: 150, aiCooldown: 0.5 },
            hard: { enemyHP: 200, enemySpeed: 180, aiCooldown: 0.35 },
            extreme: { enemyHP: 250, enemySpeed: 220, aiCooldown: 0.25 }
        };
        this.settings = this.difficultySettings[difficulty] || this.difficultySettings.normal;
        
        // Ground level
        this.groundY = 500;
        
        // Player (Holy One)
        this.player = {
            x: 200,
            y: this.groundY,
            width: 50,
            height: 80,
            vx: 0,
            vy: 0,
            speed: 200,
            jumpPower: 400,
            grounded: true,
            facing: 1, // 1 = right, -1 = left
            emoji: '✡️',
            hp: 100,
            maxHp: 100,
            special: 100,
            maxSpecial: 100,
            state: 'idle', // idle, attacking, blocking, hurt, special
            stateTimer: 0,
            combo: 0
        };
        
        // Enemy (Angel of Death)
        this.enemy = {
            x: 600,
            y: this.groundY,
            width: 50,
            height: 80,
            vx: 0,
            vy: 0,
            speed: this.settings.enemySpeed,
            grounded: true,
            facing: -1,
            emoji: '💀',
            hp: this.settings.enemyHP,
            maxHp: this.settings.enemyHP,
            state: 'idle',
            stateTimer: 0,
            aiTimer: 0,
            aiAction: null
        };
        
        // Attacks
        this.playerAttack = null;
        this.enemyAttack = null;
        
        // Effects
        this.effects = [];
        
        // Matzah (spawns occasionally)
        this.matzahPowerups = [];
        this.matzahSpawnTimer = 10;
        
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
            '⬅️➡️ - Move',
            '⬆️ - Jump',
            'Z - Punch | X - Special | C - Block',
            '',
            '🎯 GOAL: Defeat the Angel of Death!'
        ];
        
        // DRAMATIC INTRO SEQUENCE!
        this.introPhase = 0;        // 0=fade in, 1=VS, 2=fighters, 3=FIGHT!, 4=playing
        this.introTimer = 0;
        this.introFlash = 0;
        this.introCameraShake = 0;
        
        // Don't show regular message during intro
        // this.displayMessage('⚔️ FINAL BATTLE! ⚔️');
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
        
        // ===== DRAMATIC INTRO SEQUENCE! =====
        if (this.introPhase < 4) {
            this.introTimer += dt;
            this.introCameraShake = Math.max(0, this.introCameraShake - dt * 5);
            
            // Phase transitions
            if (this.introPhase === 0 && this.introTimer > 1.0) {
                // Phase 1: Show "FINAL MATCH"
                this.introPhase = 1;
                this.introTimer = 0;
                this.introFlash = 1;
                if (window.audioManager) window.audioManager.playSynthSound('explosion');
            } else if (this.introPhase === 1 && this.introTimer > 1.5) {
                // Phase 2: Show fighters
                this.introPhase = 2;
                this.introTimer = 0;
                this.introCameraShake = 1;
                if (window.audioManager) window.audioManager.playSynthSound('hit');
            } else if (this.introPhase === 2 && this.introTimer > 2.0) {
                // Phase 3: FIGHT!
                this.introPhase = 3;
                this.introTimer = 0;
                this.introFlash = 1;
                this.introCameraShake = 1;
                if (window.audioManager) {
                    window.audioManager.playSynthSound('explosion');
                    window.audioManager.playSynthSound('powerup');
                }
            } else if (this.introPhase === 3 && this.introTimer > 1.5) {
                // Phase 4: Start playing!
                this.introPhase = 4;
            }
            
            // Decay flash
            this.introFlash = Math.max(0, this.introFlash - dt * 3);
            return; // Don't update gameplay during intro
        }
        
        // Update player
        this.updatePlayer(dt);
        
        // Update enemy AI
        this.updateEnemyAI(dt);
        
        // Physics for both
        this.applyPhysics(this.player, dt);
        this.applyPhysics(this.enemy, dt);
        
        // Check for head stomp attacks
        this.checkStompAttacks(dt);
        
        // Update attacks
        this.updateAttacks(dt);
        
        // Update effects
        this.effects = this.effects.filter(effect => {
            effect.life -= dt;
            effect.x += effect.vx * dt;
            effect.y += effect.vy * dt;
            return effect.life > 0;
        });
        
        // Matzah spawning
        this.matzahSpawnTimer -= dt;
        if (this.matzahSpawnTimer <= 0) {
            this.matzahPowerups.push(new MatzahPowerup(100 + Math.random() * 600, 200 + Math.random() * 200));
            this.matzahSpawnTimer = 8 + Math.random() * 5;
        }
        
        // Update matzah
        this.matzahPowerups = this.matzahPowerups.filter(matzah => {
            matzah.update(dt);
            const dx = this.player.x - matzah.x;
            const dy = this.player.y - matzah.y;
            if (Math.sqrt(dx*dx + dy*dy) < 50) {
                this.engine.addAwakeness(matzah.awakenessBoost);
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 10);
                this.displayMessage('🫓 Matzah! Healed!');
                return false;
            }
            return true;
        });
        
        // Regenerate special
        if (this.player.special < this.player.maxSpecial) {
            this.player.special += 10 * dt;
        }
        
        // Check win/lose
        if (this.enemy.hp <= 0) {
            this.complete = true;
            this.displayMessage('🎉 The Holy One destroyed the Angel of Death!');
            // Death defeated sound
            if (window.audioManager) {
                window.audioManager.playSynthSound('death');
            }
            setTimeout(() => {
                if (this.engine.onLevelComplete) {
                    this.engine.onLevelComplete();
                }
            }, 3000);
        }
        
        if (this.player.hp <= 0) {
            this.displayMessage('💀 Defeated! Try Again!');
            // Player death sound
            if (window.audioManager) {
                window.audioManager.playSynthSound('death');
            }
            setTimeout(() => this.reset(), 2000);
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
        // Update state timer
        if (this.player.stateTimer > 0) {
            this.player.stateTimer -= dt;
            if (this.player.stateTimer <= 0) {
                this.player.state = 'idle';
            }
        }
        
        // Can't act while in certain states
        if (this.player.state === 'hurt') return;
        
        // Movement (only if not attacking)
        if (this.player.state === 'idle' || this.player.state === 'blocking') {
            if (this.engine.isKeyDown('left')) {
                this.player.vx = -this.player.speed;
                this.player.facing = -1;
            } else if (this.engine.isKeyDown('right')) {
                this.player.vx = this.player.speed;
                this.player.facing = 1;
            } else {
                this.player.vx = 0;
            }
            
            // Jump
            if (this.engine.isKeyJustPressed('up') && this.player.grounded) {
                this.player.vy = -this.player.jumpPower;
                this.player.grounded = false;
            }
            
            // Block
            if (this.engine.isKeyDown('KeyC')) {
                this.player.state = 'blocking';
            } else if (this.player.state === 'blocking') {
                this.player.state = 'idle';
            }
        }
        
        // Attacks
        if (this.player.state === 'idle') {
            // Punch (Z)
            if (this.engine.isKeyJustPressed('KeyZ')) {
                this.player.state = 'attacking';
                this.player.stateTimer = 0.3;
                this.playerAttack = {
                    x: this.player.x + this.player.facing * 50,
                    y: this.player.y - 40,
                    width: 60,
                    height: 40,
                    damage: 10,
                    active: true,
                    timer: 0.15,
                    type: 'punch'
                };
                this.player.combo++;
                // Punch whoosh sound
                if (window.audioManager) {
                    window.audioManager.playSynthSound('throw');
                }
                
                // Third hit in combo does more damage
                if (this.player.combo >= 3) {
                    this.playerAttack.damage = 20;
                    this.player.combo = 0;
                }
            }
            
            // Special (X)
            if (this.engine.isKeyJustPressed('KeyX') && this.player.special >= 50) {
                this.player.state = 'special';
                this.player.stateTimer = 0.6;
                this.player.special -= 50;
                
                this.playerAttack = {
                    x: this.player.x + this.player.facing * 80,
                    y: this.player.y - 40,
                    width: 120,
                    height: 80,
                    damage: 30,
                    active: true,
                    timer: 0.4,
                    type: 'special'
                };
                // Special attack divine sound
                if (window.audioManager) {
                    window.audioManager.playSynthSound('laser');
                }
                
                // Big effect
                for (let i = 0; i < 10; i++) {
                    this.effects.push({
                        x: this.player.x + this.player.facing * 50,
                        y: this.player.y - 40,
                        vx: this.player.facing * (100 + Math.random() * 100),
                        vy: (Math.random() - 0.5) * 100,
                        emoji: ['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)],
                        life: 0.5
                    });
                }
            }
        }
        
        // Reset combo if not attacking for a while
        if (this.player.state === 'idle' && this.player.stateTimer <= 0) {
            this.player.combo = 0;
        }
    }
    
    updateEnemyAI(dt) {
        // Update state timer
        if (this.enemy.stateTimer > 0) {
            this.enemy.stateTimer -= dt;
            if (this.enemy.stateTimer <= 0) {
                this.enemy.state = 'idle';
            }
        }
        
        if (this.enemy.state === 'hurt') return;
        
        // Face player
        this.enemy.facing = this.player.x < this.enemy.x ? -1 : 1;
        
        // AI timer
        this.enemy.aiTimer -= dt;
        if (this.enemy.aiTimer <= 0) {
            // Choose action based on distance
            const dist = Math.abs(this.player.x - this.enemy.x);
            
            if (dist < 80) {
                // Close - attack or retreat
                if (Math.random() < 0.6) {
                    this.enemy.aiAction = 'attack';
                } else {
                    this.enemy.aiAction = 'retreat';
                }
            } else if (dist < 200) {
                // Medium - approach or attack
                if (Math.random() < 0.4) {
                    this.enemy.aiAction = 'attack';
                } else {
                    this.enemy.aiAction = 'approach';
                }
            } else {
                // Far - approach
                this.enemy.aiAction = 'approach';
            }
            
            this.enemy.aiTimer = this.settings.aiCooldown + Math.random() * this.settings.aiCooldown;
        }
        
        // Execute action
        if (this.enemy.state === 'idle') {
            switch (this.enemy.aiAction) {
                case 'approach':
                    this.enemy.vx = this.enemy.facing * this.enemy.speed;
                    break;
                    
                case 'retreat':
                    this.enemy.vx = -this.enemy.facing * this.enemy.speed;
                    // Jump sometimes
                    if (Math.random() < 0.3 && this.enemy.grounded) {
                        this.enemy.vy = -350;
                        this.enemy.grounded = false;
                    }
                    break;
                    
                case 'attack':
                    this.enemy.vx = 0;
                    if (Math.abs(this.player.x - this.enemy.x) < 100) {
                        this.enemy.state = 'attacking';
                        this.enemy.stateTimer = 0.4;
                        this.enemyAttack = {
                            x: this.enemy.x + this.enemy.facing * 50,
                            y: this.enemy.y - 40,
                            width: 60,
                            height: 50,
                            damage: 15,
                            active: true,
                            timer: 0.2,
                            type: 'slash'
                        };
                    }
                    break;
                    
                default:
                    this.enemy.vx = 0;
            }
        }
    }
    
    applyPhysics(entity, dt) {
        // Gravity
        if (!entity.grounded) {
            entity.vy += 800 * dt;
        }
        
        // Apply velocity
        entity.x += entity.vx * dt;
        entity.y += entity.vy * dt;
        
        // Ground collision
        if (entity.y >= this.groundY) {
            entity.y = this.groundY;
            entity.vy = 0;
            entity.grounded = true;
        }
        
        // Wall boundaries
        entity.x = Math.max(50, Math.min(750, entity.x));
    }
    
    checkStompAttacks(dt) {
        const stompDamage = 15;
        const headHeight = 30; // Height of head hitbox
        const bounceVelocity = -300; // Bounce up after stomping
        
        // Check if player is stomping enemy
        if (this.player.vy > 0 && !this.player.grounded) {
            const playerBottom = this.player.y;
            const enemyTop = this.enemy.y - this.enemy.height;
            const horizontalOverlap = Math.abs(this.player.x - this.enemy.x) < (this.player.width/2 + this.enemy.width/2);
            
            if (horizontalOverlap && playerBottom >= enemyTop && playerBottom <= enemyTop + headHeight + this.player.vy * dt) {
                // Player stomped on enemy's head!
                this.enemy.hp -= stompDamage;
                this.enemy.state = 'hurt';
                this.enemy.stateTimer = 0.4;
                this.player.vy = bounceVelocity; // Bounce up
                this.player.grounded = false;
                this.engine.screenShake();
                
                if (window.audioManager) {
                    window.audioManager.playSynthSound('hit');
                }
                
                this.effects.push({
                    x: this.enemy.x,
                    y: this.enemy.y - this.enemy.height,
                    vx: 0,
                    vy: -50,
                    emoji: '👟💥',
                    life: 0.4
                });
                
                this.displayMessage('🦶 STOMP!');
            }
        }
        
        // Check if enemy is stomping player
        if (this.enemy.vy > 0 && !this.enemy.grounded) {
            const enemyBottom = this.enemy.y;
            const playerTop = this.player.y - this.player.height;
            const horizontalOverlap = Math.abs(this.player.x - this.enemy.x) < (this.player.width/2 + this.enemy.width/2);
            
            if (horizontalOverlap && enemyBottom >= playerTop && enemyBottom <= playerTop + headHeight + this.enemy.vy * dt) {
                // Enemy stomped on player's head!
                if (this.player.state !== 'blocking') {
                    this.player.hp -= stompDamage;
                    this.player.state = 'hurt';
                    this.player.stateTimer = 0.4;
                    this.enemy.vy = bounceVelocity; // Bounce up
                    this.enemy.grounded = false;
                    this.engine.screenShake();
                    
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('hit');
                    }
                    
                    this.effects.push({
                        x: this.player.x,
                        y: this.player.y - this.player.height,
                        vx: 0,
                        vy: -50,
                        emoji: '💀👟',
                        life: 0.4
                    });
                } else {
                    // Blocked the stomp!
                    this.enemy.vy = bounceVelocity * 1.5; // Bounce away higher
                    this.enemy.grounded = false;
                    
                    this.effects.push({
                        x: this.player.x,
                        y: this.player.y - this.player.height,
                        vx: 0,
                        vy: 0,
                        emoji: '🛡️',
                        life: 0.3
                    });
                    
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('vaseBreak');
                    }
                }
            }
        }
    }
    
    updateAttacks(dt) {
        // Player attack
        if (this.playerAttack && this.playerAttack.active) {
            this.playerAttack.timer -= dt;
            this.playerAttack.x = this.player.x + this.player.facing * 50;
            
            // Check hit
            if (this.checkAttackHit(this.playerAttack, this.enemy)) {
                this.enemy.hp -= this.playerAttack.damage;
                this.enemy.state = 'hurt';
                this.enemy.stateTimer = 0.3;
                this.enemy.vx = this.player.facing * 100;
                this.playerAttack.active = false;
                this.engine.screenShake();
                // Hit impact sound
                if (window.audioManager) {
                    window.audioManager.playSynthSound('hit');
                }
                
                // Hit effect
                this.effects.push({
                    x: this.enemy.x,
                    y: this.enemy.y - 40,
                    vx: 0,
                    vy: 0,
                    emoji: '💥',
                    life: 0.3
                });
            }
            
            if (this.playerAttack.timer <= 0) {
                this.playerAttack.active = false;
            }
        }
        
        // Enemy attack
        if (this.enemyAttack && this.enemyAttack.active) {
            this.enemyAttack.timer -= dt;
            this.enemyAttack.x = this.enemy.x + this.enemy.facing * 50;
            
            // Check hit
            if (this.checkAttackHit(this.enemyAttack, this.player)) {
                if (this.player.state === 'blocking') {
                    // Blocked!
                    this.effects.push({
                        x: this.player.x,
                        y: this.player.y - 40,
                        vx: 0,
                        vy: 0,
                        emoji: '🛡️',
                        life: 0.3
                    });
                    this.player.vx = -this.enemy.facing * 50;
                    // Block sound
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('vaseBreak');
                    }
                } else {
                    this.player.hp -= this.enemyAttack.damage;
                    this.player.state = 'hurt';
                    this.player.stateTimer = 0.3;
                    this.player.vx = this.enemy.facing * 100;
                    this.engine.screenShake();
                    // Player hurt sound
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('hit');
                    }
                    
                    this.effects.push({
                        x: this.player.x,
                        y: this.player.y - 40,
                        vx: 0,
                        vy: 0,
                        emoji: '💥',
                        life: 0.3
                    });
                }
                this.enemyAttack.active = false;
            }
            
            if (this.enemyAttack.timer <= 0) {
                this.enemyAttack.active = false;
            }
        }
    }
    
    checkAttackHit(attack, target) {
        return attack.x - attack.width/2 < target.x + target.width/2 &&
               attack.x + attack.width/2 > target.x - target.width/2 &&
               attack.y - attack.height/2 < target.y &&
               attack.y + attack.height/2 > target.y - target.height;
    }
    
    displayMessage(text) {
        this.messageText = text;
        this.showMessage = true;
        this.messageTimer = 2;
    }
    
    render(ctx) {
        // Camera shake during intro
        if (this.introCameraShake > 0) {
            ctx.save();
            const shake = this.introCameraShake * 10;
            ctx.translate(
                (Math.random() - 0.5) * shake,
                (Math.random() - 0.5) * shake
            );
        }
        
        // Epic background
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#1a0a2e');
        gradient.addColorStop(0.5, '#2d1b4e');
        gradient.addColorStop(1, '#0a0a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // ===== DRAMATIC INTRO SEQUENCE RENDERING =====
        if (this.introPhase < 4) {
            // Darker overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, 800, 600);
            
            // Lightning bolts in background
            if (Math.random() < 0.1) {
                ctx.strokeStyle = 'rgba(255, 255, 100, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                let x = Math.random() * 800;
                ctx.moveTo(x, 0);
                for (let y = 0; y < 600; y += 30) {
                    x += (Math.random() - 0.5) * 50;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Phase 0: Fade in - show title
            if (this.introPhase >= 0) {
                const alpha = this.introPhase === 0 ? Math.min(1, this.introTimer) : 1;
                
                // "FINAL MATCH" text with epic styling
                ctx.save();
                const scale = this.introPhase === 1 ? 1 + Math.sin(this.introTimer * 10) * 0.05 : 1;
                ctx.translate(400, 150);
                ctx.scale(scale, scale);
                
                // Glow layers
                ctx.globalAlpha = alpha * 0.5;
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 50;
                ctx.font = 'bold 80px Impact, Arial';
                ctx.fillStyle = '#ff0000';
                ctx.fillText('FINAL MATCH', 0, 0);
                
                // Main text
                ctx.globalAlpha = alpha;
                ctx.shadowBlur = 20;
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 6;
                ctx.strokeText('FINAL MATCH', 0, 0);
                ctx.fillStyle = '#ffd700';
                ctx.fillText('FINAL MATCH', 0, 0);
                
                ctx.restore();
            }
            
            // Phase 1+: Show VS
            if (this.introPhase >= 1) {
                const vsAlpha = this.introPhase === 1 ? Math.min(1, this.introTimer * 2) : 1;
                ctx.globalAlpha = vsAlpha;
                
                // VS text
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 30;
                ctx.font = 'bold 100px Impact, Arial';
                ctx.fillStyle = '#ff4444';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 5;
                ctx.strokeText('VS', 400, 320);
                ctx.fillText('VS', 400, 320);
            }
            
            // Phase 2+: Show fighters
            if (this.introPhase >= 2) {
                const fighterAlpha = this.introPhase === 2 ? Math.min(1, this.introTimer) : 1;
                ctx.globalAlpha = fighterAlpha;
                
                // Player side (left) - slides in from left
                const playerX = this.introPhase === 2 ? -100 + this.introTimer * 150 : 200;
                ctx.save();
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 40;
                ctx.font = '120px Arial';
                ctx.fillText('✡️', playerX, 420);
                ctx.font = 'bold 24px Impact';
                ctx.fillStyle = '#ffd700';
                ctx.shadowBlur = 10;
                ctx.fillText('THE HOLY ONE', playerX, 510);
                ctx.restore();
                
                // Enemy side (right) - slides in from right
                const enemyX = this.introPhase === 2 ? 900 - this.introTimer * 150 : 600;
                ctx.save();
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 40;
                ctx.font = '120px Arial';
                ctx.fillText('💀', enemyX, 420);
                ctx.font = 'bold 24px Impact';
                ctx.fillStyle = '#ff4444';
                ctx.shadowBlur = 10;
                ctx.fillText('ANGEL OF DEATH', enemyX, 510);
                ctx.restore();
            }
            
            // Phase 3: FIGHT!
            if (this.introPhase === 3) {
                ctx.globalAlpha = 1;
                const scale = 1 + (1 - Math.min(1, this.introTimer * 2)) * 2; // Starts big, shrinks
                const shake = Math.sin(this.introTimer * 40) * 5;
                
                ctx.save();
                ctx.translate(400 + shake, 300);
                ctx.scale(scale, scale);
                
                // FIGHT text
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 50;
                ctx.font = 'bold 100px Impact, Arial';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 8;
                ctx.strokeText('FIGHT!', 0, 0);
                ctx.fillStyle = '#00ff00';
                ctx.fillText('FIGHT!', 0, 0);
                
                ctx.restore();
            }
            
            // Flash effect
            if (this.introFlash > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${this.introFlash * 0.7})`;
                ctx.fillRect(0, 0, 800, 600);
            }
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            
            // Restore from camera shake
            if (this.introCameraShake > 0) {
                ctx.restore();
            }
            return; // Don't render gameplay during intro
        }
        
        // Dramatic clouds
        ctx.fillStyle = 'rgba(100, 50, 150, 0.3)';
        for (let i = 0; i < 5; i++) {
            const x = (i * 200 + this.engine.totalTime * 20) % 900 - 50;
            ctx.beginPath();
            ctx.ellipse(x, 100 + i * 20, 100, 30, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Ground
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(0, this.groundY, 800, 100);
        
        // Ground pattern
        ctx.strokeStyle = '#3a3a6a';
        ctx.lineWidth = 2;
        for (let x = 0; x < 800; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, this.groundY);
            ctx.lineTo(x, 600);
            ctx.stroke();
        }
        
        // Draw matzah
        this.matzahPowerups.forEach(matzah => matzah.render(ctx));
        
        // Draw effects
        this.effects.forEach(effect => {
            ctx.globalAlpha = effect.life * 2;
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(effect.emoji, effect.x, effect.y);
        });
        ctx.globalAlpha = 1;
        
        // Draw attack effects
        if (this.playerAttack && this.playerAttack.active) {
            ctx.fillStyle = this.playerAttack.type === 'special' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(this.playerAttack.x, this.playerAttack.y, this.playerAttack.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (this.enemyAttack && this.enemyAttack.active) {
            ctx.fillStyle = 'rgba(100, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(this.enemyAttack.x, this.enemyAttack.y, this.enemyAttack.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw enemy
        this.renderFighter(ctx, this.enemy, '💀', '#660000');
        
        // Draw player
        this.renderFighter(ctx, this.player, '✡️', '#ffd700');
        
        // Draw "VS" in center
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'center';
        ctx.fillText('VS', 400, 300);
        
        // HP Bars
        // Player HP
        ctx.fillStyle = '#222';
        ctx.fillRect(20, 60, 250, 25);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(22, 62, 246, 21);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(22, 62, 246 * (this.player.hp / this.player.maxHp), 21);
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText('THE HOLY ONE', 25, 78);
        
        // Player Special bar
        ctx.fillStyle = '#222';
        ctx.fillRect(20, 90, 150, 12);
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(22, 92, 146 * (this.player.special / this.player.maxSpecial), 8);
        ctx.font = '10px Arial';
        ctx.fillText('SPECIAL', 25, 99);
        
        // Enemy HP
        ctx.fillStyle = '#222';
        ctx.fillRect(530, 60, 250, 25);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(532, 62, 246, 21);
        ctx.fillStyle = '#00ff00';
        const enemyHPWidth = 246 * (this.enemy.hp / this.enemy.maxHp);
        ctx.fillRect(532 + (246 - enemyHPWidth), 62, enemyHPWidth, 21);
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('ANGEL OF DEATH', 775, 78);
        
        // Combo indicator
        if (this.player.combo > 0) {
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'left';
            ctx.fillText(`${this.player.combo} HIT!`, 20, 130);
        }
        
        // Draw message
        if (this.showMessage) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(200, 250, 400, 60);
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(this.messageText, 400, 290);
        }
        
        // Controls and instructions - positioned below the HP bars but above the fighters
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(150, 115, 500, 45);
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.textAlign = 'center';
        ctx.fillText('🎮 ← → Move | ↑ Jump | Z Punch | X Special | C Block', 400, 132);
        
        // Win condition hint
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.fillText('⚔️ Reduce Angel of Death HP to 0 to win! Use combos for bonus damage!', 400, 152);
        
        // Instructions overlay (at start)
        this.renderInstructionsOverlay(ctx);
    }
    
    renderFighter(ctx, fighter, emoji, glowColor) {
        ctx.save();
        
        // Flash when hurt
        if (fighter.state === 'hurt') {
            ctx.globalAlpha = Math.sin(this.engine.totalTime * 30) > 0 ? 1 : 0.3;
        }
        
        // Glow effect
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;
        
        // Body
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Flip based on facing
        if (fighter.facing === -1) {
            ctx.save();
            ctx.translate(fighter.x, fighter.y);
            ctx.scale(-1, 1);
            ctx.fillText(emoji, 0, 0);
            ctx.restore();
        } else {
            ctx.fillText(emoji, fighter.x, fighter.y);
        }
        
        // State indicators
        if (fighter.state === 'blocking') {
            ctx.font = '30px Arial';
            ctx.fillText('🛡️', fighter.x, fighter.y - 50);
        }
        
        if (fighter.state === 'attacking' || fighter.state === 'special') {
            ctx.font = '20px Arial';
            ctx.fillText('💨', fighter.x + fighter.facing * 30, fighter.y - 30);
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    
    renderInstructionsOverlay(ctx) {
        // INSTRUCTIONS OVERLAY
        if (this.showInstructions && this.instructionsTimer > 0) {
            const alpha = Math.min(1, this.instructionsTimer / 0.5);
            ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * alpha})`;
            ctx.fillRect(200, 150, 400, 210);
            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.strokeRect(200, 150, 400, 210);
            
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
        this.player = {
            x: 200,
            y: this.groundY,
            width: 50,
            height: 80,
            vx: 0,
            vy: 0,
            speed: 200,
            jumpPower: 400,
            grounded: true,
            facing: 1,
            emoji: '✡️',
            hp: 100,
            maxHp: 100,
            special: 100,
            maxSpecial: 100,
            state: 'idle',
            stateTimer: 0,
            combo: 0
        };
        this.enemy = {
            x: 600,
            y: this.groundY,
            width: 50,
            height: 80,
            vx: 0,
            vy: 0,
            speed: this.settings.enemySpeed,
            grounded: true,
            facing: -1,
            emoji: '💀',
            hp: this.settings.enemyHP,
            maxHp: this.settings.enemyHP,
            state: 'idle',
            stateTimer: 0,
            aiTimer: 0,
            aiAction: null
        };
        this.playerAttack = null;
        this.enemyAttack = null;
        this.effects = [];
        this.matzahPowerups = [];
        this.matzahSpawnTimer = 10;
        this.complete = false;
        this.showMessage = false;
        // Reset intro sequence
        this.introPhase = 0;
        this.introTimer = 0;
        this.introFlash = 0;
        this.introCameraShake = 0;
    }
}

window.Level10 = Level10;
