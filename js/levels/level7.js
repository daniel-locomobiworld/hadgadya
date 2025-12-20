// Level 7: An Ox comes and drinks the Water
// Drink 75% of the water! Dodge kids running around!

class Level7 {
    constructor(engine, difficulty = 'normal') {
        this.engine = engine;
        this.difficulty = difficulty;
        this.name = "Drink the Water";
        this.description = "You are the Ox! Drink 75% of the water while dodging the hyperactive kids!";
        this.instructions = "Arrow keys/WASD to move. Collect 💧 water drops. Avoid the kids!";
        this.icon = "🐂";
        
        // Difficulty settings - harder overall
        this.difficultySettings = {
            easy: { kidSpeed: 120, puddleSpawnInterval: 12, kidSpawnInterval: 50, initialKids: 4 },
            normal: { kidSpeed: 160, puddleSpawnInterval: 8, kidSpawnInterval: 25, initialKids: 5 },
            hard: { kidSpeed: 190, puddleSpawnInterval: 6, kidSpawnInterval: 18, initialKids: 6 },
            extreme: { kidSpeed: 220, puddleSpawnInterval: 4, kidSpawnInterval: 12, initialKids: 7 }
        };
        this.settings = this.difficultySettings[difficulty] || this.difficultySettings.normal;
        
        // Player (Ox) - bigger and more visible
        this.player = {
            x: 400,
            y: 300,
            size: 60,  // Bigger like other level icons!
            speed: 170,
            emoji: '🐂',
            invincible: false,
            invincibleTimer: 0
        };
        
        // Water meter (goal is 75%)
        this.waterMeter = 0;
        this.waterNeeded = 75;
        
        // Water drops to collect
        this.waterDrops = [];
        this.waterCollected = 0;
        this.spawnTimer = 0;
        
        // Kids running around blocking you
        this.kids = [];
        this.initKids();
        
        // Puddles (static water sources)
        this.puddles = [];
        this.generatePuddles();
        
        // Obstacles
        this.obstacles = [
            { x: 150, y: 150, width: 60, height: 60, emoji: '🪨', name: 'Rock' },
            { x: 600, y: 200, width: 60, height: 60, emoji: '🌳', name: 'Tree' },
            { x: 300, y: 400, width: 60, height: 60, emoji: '🪵', name: 'Log' },
            { x: 550, y: 450, width: 60, height: 60, emoji: '🏠', name: 'Shed' }
        ];
        
        // Matzah powerups
        this.matzahPowerups = [];
        this.matzahSpawnTimer = 10;
        
        // Difficulty timers - spawn new puddles and kids over time
        this.puddleSpawnTimer = this.settings.puddleSpawnInterval;
        this.kidSpawnTimer = this.settings.kidSpawnInterval;
        this.levelTime = 0;          // Track total time in level
        
        // Visual effects
        this.effects = [];
        this.splashes = [];
        
        // Screen flash
        this.screenFlash = 0;
        
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
            '⬆️⬇️⬅️➡️ or WASD - Move',
            '',
            '🎯 GOAL: Drink 75% of water!',
            '⚠️ Avoid the kids!'
        ];
        
        // Spawn initial water
        for (let i = 0; i < 5; i++) {
            this.spawnWaterDrop();
        }
        
        this.displayMessage('🐂 Drink 75% of the water! 💧');
    }
    
    initKids() {
        const kidEmojis = ['👦', '👧', '🧒', '👶', '👦', '👧'];
        const kidNames = ['Shmuel', 'Rivka', 'Moshe', 'Baby Eli', 'David', 'Sarah'];
        
        for (let i = 0; i < this.settings.initialKids; i++) {
            this.kids.push({
                x: 100 + Math.random() * 600,
                y: 100 + Math.random() * 400,
                vx: (Math.random() - 0.5) * this.settings.kidSpeed * 1.3,
                vy: (Math.random() - 0.5) * this.settings.kidSpeed * 1.3,
                size: 32,
                emoji: kidEmojis[i % kidEmojis.length],
                name: kidNames[i % kidNames.length],
                bounceTimer: 0,
                hyperTimer: Math.random() * 4,
                isHyper: false
            });
        }
    }
    
    generatePuddles() {
        const positions = [
            { x: 100, y: 120 }, { x: 350, y: 180 }, { x: 650, y: 130 },
            { x: 200, y: 350 }, { x: 500, y: 320 }, { x: 700, y: 400 },
            { x: 120, y: 500 }, { x: 400, y: 480 }, { x: 650, y: 520 }
        ];
        
        positions.forEach(pos => {
            this.puddles.push({
                x: pos.x,
                y: pos.y,
                size: 35 + Math.random() * 20,
                water: 100,
                wobble: Math.random() * Math.PI * 2,
                waterValue: 5  // Each puddle gives 5% water
            });
        });
    }
    
    spawnNewPuddle() {
        // Spawn a new puddle at a random valid location
        let x, y, valid;
        let attempts = 0;
        do {
            x = 80 + Math.random() * 640;
            y = 100 + Math.random() * 420;
            valid = true;
            // Check not too close to obstacles
            for (let obs of this.obstacles) {
                if (x > obs.x - 50 && x < obs.x + obs.width + 50 &&
                    y > obs.y - 50 && y < obs.y + obs.height + 50) {
                    valid = false;
                }
            }
            // Check not too close to existing puddles
            for (let puddle of this.puddles) {
                const dx = x - puddle.x;
                const dy = y - puddle.y;
                if (Math.sqrt(dx * dx + dy * dy) < 80) {
                    valid = false;
                }
            }
            attempts++;
        } while (!valid && attempts < 30);
        
        if (valid) {
            this.puddles.push({
                x: x,
                y: y,
                size: 30 + Math.random() * 25,
                water: 100,
                wobble: Math.random() * Math.PI * 2,
                waterValue: 5,
                isNew: true  // Mark as new for visual effect
            });
            this.displayMessage('💧 A new puddle appeared!');
            
            // Splash effect at spawn location
            for (let i = 0; i < 8; i++) {
                this.effects.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 150,
                    vy: (Math.random() - 0.5) * 150,
                    life: 0.8,
                    emoji: '💧',
                    size: 16
                });
            }
        }
    }
    
    spawnExtraKid() {
        const kidEmojis = ['👦', '👧', '🧒', '👶', '🧒', '👦'];
        const kidNames = ['Yosef', 'Sarah', 'David', 'Little Leah', 'Benny', 'Avi'];
        const kidIndex = this.kids.length % kidEmojis.length;
        
        // Spawn at edge of screen
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        switch (edge) {
            case 0: x = 50; y = 100 + Math.random() * 400; break;  // Left
            case 1: x = 750; y = 100 + Math.random() * 400; break; // Right
            case 2: x = 100 + Math.random() * 600; y = 90; break;  // Top
            case 3: x = 100 + Math.random() * 600; y = 550; break; // Bottom
        }
        
        this.kids.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            size: 32,
            emoji: kidEmojis[kidIndex],
            name: kidNames[kidIndex],
            bounceTimer: 0,
            hyperTimer: Math.random() * 2,
            isHyper: true  // New kids start hyper!
        });
        
        this.displayMessage(`🧒 ${kidNames[kidIndex]} joined the chaos!`);
        
        // Play kid sound
        if (window.audioManager) {
            window.audioManager.playRandomKidSound();
        }
    }
    
    spawnWaterDrop() {
        let x, y, valid;
        let attempts = 0;
        do {
            x = 80 + Math.random() * 640;
            y = 100 + Math.random() * 420;
            valid = true;
            for (let obs of this.obstacles) {
                if (x > obs.x - 30 && x < obs.x + obs.width + 30 &&
                    y > obs.y - 30 && y < obs.y + obs.height + 30) {
                    valid = false;
                }
            }
            attempts++;
        } while (!valid && attempts < 20);
        
        this.waterDrops.push({
            x: x,
            y: y,
            size: 25,
            bobPhase: Math.random() * Math.PI * 2,
            sparkle: 0,
            waterValue: 3  // Each drop gives 3% water
        });
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
        
        // Update slurp cooldown
        if (this.slurpCooldown > 0) {
            this.slurpCooldown -= dt;
        }
        
        // Update player
        this.updatePlayer(dt);
        
        // Update kids
        this.updateKids(dt);
        
        // Update puddles
        this.updatePuddles(dt);
        
        // Update water drops
        this.updateWaterDrops(dt);
        
        // Spawn more water drops
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.waterDrops.length < 8) {
            this.spawnWaterDrop();
            this.spawnTimer = 2 + Math.random() * 2;
        }
        
        // Update effects
        this.updateEffects(dt);
        
        // Matzah spawning
        this.matzahSpawnTimer -= dt;
        if (this.matzahSpawnTimer <= 0) {
            this.matzahPowerups.push(new MatzahPowerup(100 + Math.random() * 600, 100 + Math.random() * 400));
            this.matzahSpawnTimer = 12 + Math.random() * 5;
        }
        
        // Track level time
        this.levelTime += dt;
        
        // Spawn new puddles over time to make it harder
        this.puddleSpawnTimer -= dt;
        if (this.puddleSpawnTimer <= 0) {
            this.spawnNewPuddle();
            this.puddleSpawnTimer = 10 + Math.random() * 5;  // Next puddle in 10-15 seconds
        }
        
        // Spawn extra kids based on difficulty
        this.kidSpawnTimer -= dt;
        if (this.kidSpawnTimer <= 0) {
            this.spawnExtraKid();
            this.kidSpawnTimer = this.settings.kidSpawnInterval;  // Next kid based on difficulty
        }
        
        this.matzahPowerups = this.matzahPowerups.filter(matzah => {
            matzah.update(dt);
            const dx = this.player.x - matzah.x;
            const dy = this.player.y - matzah.y;
            if (Math.sqrt(dx * dx + dy * dy) < 40) {
                this.engine.addAwakeness(matzah.awakenessBoost);
                this.displayMessage('🫓 Matzah! +15 Awakeness!');
                return false;
            }
            return true;
        });
        
        // Screen flash decay
        this.screenFlash = Math.max(0, this.screenFlash - dt * 3);
        
        // Invincibility timer
        if (this.player.invincible) {
            this.player.invincibleTimer -= dt;
            if (this.player.invincibleTimer <= 0) {
                this.player.invincible = false;
            }
        }
        
        // Check win condition - only trigger once
        if (this.waterMeter >= this.waterNeeded && !this.complete) {
            this.complete = true;
            this.celebrationEffect();
            this.displayMessage('🎉 The Ox drank all the Water!');
            setTimeout(() => {
                if (this.engine.onLevelComplete) {
                    this.engine.onLevelComplete();
                }
            }, 2500);
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
        
        // Normalize diagonal
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        const newX = this.player.x + dx * this.player.speed * dt;
        const newY = this.player.y + dy * this.player.speed * dt;
        
        // Check obstacle collision
        let blocked = false;
        for (let obs of this.obstacles) {
            if (newX > obs.x - 25 && newX < obs.x + obs.width + 25 &&
                newY > obs.y - 25 && newY < obs.y + obs.height + 25) {
                blocked = true;
                break;
            }
        }
        
        if (!blocked) {
            this.player.x = Math.max(35, Math.min(765, newX));
            this.player.y = Math.max(85, Math.min(565, newY));
        }
    }
    
    updateKids(dt) {
        for (let kid of this.kids) {
            // Hyper mode
            kid.hyperTimer -= dt;
            if (kid.hyperTimer <= 0) {
                kid.isHyper = !kid.isHyper;
                kid.hyperTimer = kid.isHyper ? 2 + Math.random() * 2 : 3 + Math.random() * 3;
                if (kid.isHyper) {
                    kid.vx = (Math.random() - 0.5) * 350;
                    kid.vy = (Math.random() - 0.5) * 350;
                }
            }
            
            const speedMult = kid.isHyper ? 1.8 : 1;
            
            kid.x += kid.vx * speedMult * dt;
            kid.y += kid.vy * speedMult * dt;
            
            // Bounce off walls
            if (kid.x < 40 || kid.x > 760) {
                kid.vx *= -1;
                kid.x = Math.max(40, Math.min(760, kid.x));
                kid.bounceTimer = 0.2;
            }
            if (kid.y < 90 || kid.y > 560) {
                kid.vy *= -1;
                kid.y = Math.max(90, Math.min(560, kid.y));
                kid.bounceTimer = 0.2;
            }
            
            kid.bounceTimer = Math.max(0, kid.bounceTimer - dt);
            
            // Random direction changes
            if (Math.random() < 0.02) {
                kid.vx += (Math.random() - 0.5) * 80;
                kid.vy += (Math.random() - 0.5) * 80;
                const speed = Math.sqrt(kid.vx ** 2 + kid.vy ** 2);
                if (speed > 180) {
                    kid.vx = (kid.vx / speed) * 180;
                    kid.vy = (kid.vy / speed) * 180;
                }
            }
            
            // Collision with player
            if (!this.player.invincible) {
                const pdx = this.player.x - kid.x;
                const pdy = this.player.y - kid.y;
                const dist = Math.sqrt(pdx * pdx + pdy * pdy);
                
                if (dist < 38) {
                    // Lose more water!
                    this.waterMeter = Math.max(0, this.waterMeter - 12);
                    this.screenFlash = 1;
                    this.player.invincible = true;
                    this.player.invincibleTimer = 1.0;  // Shorter invincibility
                    
                    this.displayMessage(`🧒 ${kid.name} spilled your water! -12%`);
                    this.engine.screenShake();
                    
                    // Play kid phrase sound effect!
                    if (window.audioManager) {
                        window.audioManager.playRandomKidPhrase();
                    }
                    
                    // Splash effect
                    for (let i = 0; i < 8; i++) {
                        this.splashes.push({
                            x: this.player.x,
                            y: this.player.y,
                            vx: (Math.random() - 0.5) * 150,
                            vy: (Math.random() - 0.5) * 150 - 50,
                            life: 0.6,
                            size: 15 + Math.random() * 10
                        });
                    }
                    
                    // Push kid away
                    kid.vx = -pdx * 2;
                    kid.vy = -pdy * 2;
                }
            }
        }
    }
    
    updatePuddles(dt) {
        for (let puddle of this.puddles) {
            puddle.wobble += dt * 2;
            
            if (puddle.water > 0) {
                const dx = this.player.x - puddle.x;
                const dy = this.player.y - puddle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < puddle.size + 20) {
                    // Drink from puddle
                    const drinkAmount = Math.min(puddle.water, 60 * dt);
                    puddle.water -= drinkAmount;
                    this.waterMeter = Math.min(100, this.waterMeter + drinkAmount * 0.1);
                    
                    // Slurping sound periodically while drinking
                    if (!this.slurpCooldown || this.slurpCooldown <= 0) {
                        if (window.audioManager) {
                            window.audioManager.playSynthSound('slurp');
                        }
                        this.slurpCooldown = 0.4;  // Play slurp every 0.4 seconds
                    }
                    
                    if (puddle.water <= 0) {
                        this.waterCollected++;
                        // Celebration
                        for (let i = 0; i < 5; i++) {
                            this.effects.push({
                                x: puddle.x,
                                y: puddle.y,
                                vx: (Math.random() - 0.5) * 100,
                                vy: -50 - Math.random() * 50,
                                emoji: '💧',
                                life: 0.8
                            });
                        }
                    }
                }
            }
        }
    }
    
    updateWaterDrops(dt) {
        this.waterDrops = this.waterDrops.filter(drop => {
            drop.bobPhase += dt * 4;
            drop.sparkle += dt;
            
            const dx = this.player.x - drop.x;
            const dy = this.player.y - drop.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 35) {
                this.waterMeter = Math.min(100, this.waterMeter + drop.waterValue);
                
                // Effect
                for (let i = 0; i < 6; i++) {
                    this.effects.push({
                        x: drop.x,
                        y: drop.y,
                        vx: (Math.random() - 0.5) * 80,
                        vy: (Math.random() - 0.5) * 80,
                        emoji: ['💧', '✨', '💦'][Math.floor(Math.random() * 3)],
                        life: 0.5
                    });
                }
                
                return false;
            }
            return true;
        });
    }
    
    updateEffects(dt) {
        this.effects = this.effects.filter(e => {
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            e.vy += 100 * dt;
            e.life -= dt;
            return e.life > 0;
        });
        
        this.splashes = this.splashes.filter(s => {
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.vy += 200 * dt;
            s.life -= dt;
            return s.life > 0;
        });
    }
    
    celebrationEffect() {
        for (let i = 0; i < 30; i++) {
            this.effects.push({
                x: 400,
                y: 300,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                emoji: ['💧', '🐂', '✨', '🎉', '💦'][Math.floor(Math.random() * 5)],
                life: 1.5
            });
        }
    }
    
    displayMessage(text) {
        this.messageText = text;
        this.showMessage = true;
        this.messageTimer = 2;
    }
    
    render(ctx) {
        // Reset canvas state at start of render
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);  // Reset any transforms
        
        // Grassy field
        const gradient = ctx.createRadialGradient(400, 300, 50, 400, 300, 500);
        gradient.addColorStop(0, '#5a9c4b');
        gradient.addColorStop(1, '#3d7a2f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // Grass pattern
        ctx.fillStyle = 'rgba(0, 50, 0, 0.2)';
        for (let x = 0; x < 800; x += 25) {
            for (let y = 50; y < 600; y += 25) {
                if ((x + y) % 50 === 0) {
                    ctx.fillRect(x, y, 25, 25);
                }
            }
        }
        
        // Screen flash
        if (this.screenFlash > 0) {
            ctx.fillStyle = `rgba(100, 180, 255, ${this.screenFlash * 0.3})`;
            ctx.fillRect(0, 0, 800, 600);
        }
        
        // Draw puddles
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        for (let puddle of this.puddles) {
            if (puddle.water > 0) {
                const wobble = Math.sin(puddle.wobble) * 2;
                const size = Math.max(1, puddle.size * (puddle.water / 100));
                
                ctx.fillStyle = 'rgba(0, 0, 100, 0.2)';
                ctx.beginPath();
                ctx.ellipse(puddle.x + 3, puddle.y + 3, Math.max(1, size + wobble), Math.max(1, size * 0.5), 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = `rgba(100, 180, 255, ${0.4 + puddle.water / 250})`;
                ctx.beginPath();
                ctx.ellipse(puddle.x, puddle.y, Math.max(1, size + wobble), Math.max(1, size * 0.5), 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.ellipse(puddle.x - size * 0.3, puddle.y - size * 0.15, Math.max(0.5, size * 0.25), Math.max(0.5, size * 0.1), -0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw water drops
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        for (let drop of this.waterDrops) {
            const bobY = Math.sin(drop.bobPhase) * 4;
            
            ctx.shadowColor = '#00aaff';
            ctx.shadowBlur = 12;
            ctx.font = `${drop.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💧', drop.x, drop.y + bobY);
            ctx.shadowBlur = 0;
            
            if (drop.sparkle % 0.4 < 0.2) {
                ctx.font = '12px Arial';
                ctx.fillText('✨', drop.x + 12, drop.y - 10 + bobY);
            }
        }
        
        // Draw obstacles
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        for (let obs of this.obstacles) {
            ctx.save();
            ctx.font = `${Math.min(obs.width, obs.height)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Add shadow for visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(obs.emoji, obs.x + obs.width / 2, obs.y + obs.height / 2);
            ctx.restore();
        }
        
        // Draw kids
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        for (let kid of this.kids) {
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#ffffff';
            const scale = kid.bounceTimer > 0 ? 1.15 : 1;
            ctx.translate(kid.x, kid.y);
            ctx.scale(scale, scale);
            
            if (kid.isHyper) {
                ctx.shadowColor = '#ff6b6b';
                ctx.shadowBlur = 12;
            }
            
            ctx.font = `${kid.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(kid.emoji, 0, 0);
            
            if (kid.isHyper) {
                ctx.font = '10px Arial';
                ctx.fillText('💨', 12, -12);
            }
            
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        
        // Draw matzah
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        this.matzahPowerups.forEach(m => m.render(ctx));
        
        // Draw player (Ox) - bigger with glow like water drop!
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.save();
        if (this.player.invincible) {
            ctx.globalAlpha = Math.sin(this.engine.totalTime * 18) > 0 ? 1 : 0.5;
        } else {
            ctx.globalAlpha = 1;
        }
        
        // Pulsing glow effect like the water drop
        const pulse = Math.sin(this.engine.totalTime * 3) * 5;
        const bobY = Math.sin(this.engine.totalTime * 2) * 3;
        
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#8B4513';  // Brown glow for ox
        ctx.shadowBlur = 25 + pulse;
        ctx.font = `${this.player.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.player.emoji, this.player.x, this.player.y + bobY);
        
        // Second layer glow
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.fillText(this.player.emoji, this.player.x, this.player.y + bobY);
        
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // Draw effects
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.shadowBlur = 0;
        for (let e of this.effects) {
            ctx.globalAlpha = e.life || 0;
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(e.emoji, e.x, e.y);
        }
        ctx.globalAlpha = 1;
        
        // Draw splashes
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#6bcbff';
        for (let s of this.splashes) {
            ctx.globalAlpha = s.life || 0;
            ctx.beginPath();
            ctx.arc(s.x, s.y, Math.max(0, (s.size || 0) * (s.life || 0)), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // ========== WATER METER ==========
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        const meterX = 280;
        const meterY = 55;
        const meterWidth = 240;
        const meterHeight = 28;
        
        // Calculate progress towards goal (75% water = 100% on meter)
        const progressPercent = Math.min(100, (this.waterMeter / this.waterNeeded) * 100);
        
        ctx.fillStyle = '#222';
        ctx.fillRect(meterX - 2, meterY - 2, meterWidth + 4, meterHeight + 4);
        
        ctx.fillStyle = '#1a3a5c';
        ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
        
        // Water fill - bar fills to 100% when goal is reached
        const waterGrad = ctx.createLinearGradient(meterX, meterY, meterX + meterWidth, meterY);
        waterGrad.addColorStop(0, '#2196F3');
        waterGrad.addColorStop(0.5, '#64B5F6');
        waterGrad.addColorStop(1, '#1976D2');
        ctx.fillStyle = waterGrad;
        ctx.fillRect(meterX, meterY, meterWidth * (progressPercent / 100), meterHeight);
        
        // Border
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
        
        // Text - show progress percentage
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(`💧 ${Math.floor(progressPercent)}%`, meterX + meterWidth / 2, meterY + 19);
        
        // Kid warning
        const hyperKids = this.kids.filter(k => k.isHyper).length;
        if (hyperKids > 0) {
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#ff6b6b';
            ctx.textAlign = 'right';
            ctx.fillText(`⚠️ ${hyperKids} hyper kid${hyperKids > 1 ? 's' : ''}!`, 780, 70);
        }
        
        // Draw message
        if (this.showMessage) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(200, 280, 400, 50);
            ctx.strokeStyle = '#4fc3f7';
            ctx.lineWidth = 2;
            ctx.strokeRect(200, 280, 400, 50);
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(this.messageText, 400, 312);
        }
        
        // Instructions
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('Arrow keys to move • Collect 💧 and drink from puddles • Avoid the kids!', 400, 590);
        
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
            x: 400,
            y: 300,
            size: 45,
            speed: 170,
            emoji: '🐂',
            invincible: false,
            invincibleTimer: 0
        };
        
        this.waterMeter = 0;
        this.waterDrops = [];
        this.waterCollected = 0;
        this.spawnTimer = 0;
        
        this.kids = [];
        this.initKids();
        
        this.puddles = [];
        this.generatePuddles();
        
        this.matzahPowerups = [];
        this.matzahSpawnTimer = 10;
        
        this.effects = [];
        this.splashes = [];
        this.screenFlash = 0;
        
        this.complete = false;
        this.showMessage = false;
        
        for (let i = 0; i < 5; i++) {
            this.spawnWaterDrop();
        }
        
        this.displayMessage('🐂 Drink 75% of the water! 💧');
    }
}

window.Level7 = Level7;
