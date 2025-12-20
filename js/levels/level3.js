// Level 3: A Dog comes and bites the Cat
// Top-Down Shoot 'Em Up (Shmup) - Dog fires teeth at cat spaceships

class Level3 {
    constructor(engine, difficulty = 'normal') {
        this.engine = engine;
        this.difficulty = difficulty;
        this.name = "Dog vs Cat Ships";
        this.description = "The Dog must defeat the Cat! Shoot teeth at the cat's spaceships before they destroy you!";
        this.instructions = "Arrow keys to move, SPACE to shoot teeth!";
        this.icon = "🐕";
        
        // Difficulty settings
        // Easy: slower cats, fewer spawns, weaker
        // Normal: current behavior
        // Hard: faster cats, more spawns, stronger
        // Extreme: very fast cats, many spawns, much stronger
        this.difficultySettings = {
            easy: { catSpeed: 60, catHP: 35, spawnDelay: 2.0, maxCats: 3, bulletSpeed: 150 },
            normal: { catSpeed: 80, catHP: 50, spawnDelay: 1.5, maxCats: 5, bulletSpeed: 200 },
            hard: { catSpeed: 110, catHP: 65, spawnDelay: 1.0, maxCats: 6, bulletSpeed: 260 },
            extreme: { catSpeed: 140, catHP: 80, spawnDelay: 0.7, maxCats: 8, bulletSpeed: 320 }
        };
        this.settings = this.difficultySettings[difficulty] || this.difficultySettings.normal;
        
        // Player (Dog) at bottom
        this.player = {
            x: 400,
            y: 530,
            width: 50,
            height: 50,
            speed: 250,
            emoji: '🐕'
        };
        
        // Player health
        this.playerHP = 100;
        this.maxHP = 100;
        
        // Teeth bullets (player shoots)
        this.teeth = [];
        this.shootCooldown = 0;
        this.shootDelay = 0.2;
        
        // Cat spaceships (enemies)
        this.catShips = [];
        this.catBullets = [];
        this.spawnTimer = 0;
        this.spawnDelay = this.settings.spawnDelay;
        
        // Boss cat (final enemy)
        this.boss = null;
        this.bossSpawned = false;
        this.catsDefeated = 0;
        this.catsNeeded = 10;
        
        // Matzah powerups
        this.matzahPowerups = [];
        
        // Level state
        this.complete = false;
        this.showMessage = false;
        this.messageText = '';
        this.messageTimer = 0;
        
        // Biting phase (when dog wins)
        this.phase = 'fight'; // 'fight' or 'biting'
        this.bitingPhase = null;
        
        // Spawn initial enemies
        this.spawnCatShip();
    }
    
    update(dt) {
        if (this.complete) return;
        
        // Handle biting phase
        if (this.phase === 'biting') {
            this.updateBiting(dt);
            return;
        }
        
        // Update player
        this.updatePlayer(dt);
        
        // Update shooting
        this.shootCooldown -= dt;
        if (this.engine.isKeyDown('action') && this.shootCooldown <= 0) {
            this.shootTooth();
            this.shootCooldown = this.shootDelay;
        }
        
        // Update teeth
        this.updateTeeth(dt);
        
        // Update cat ships
        this.updateCatShips(dt);
        
        // Update cat bullets
        this.updateCatBullets(dt);
        
        // Update boss
        if (this.boss) {
            this.updateBoss(dt);
        }
        
        // Spawn new enemies
        if (!this.bossSpawned && this.catsDefeated < this.catsNeeded) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0 && this.catShips.length < this.settings.maxCats) {
                this.spawnCatShip();
                this.spawnTimer = this.spawnDelay;
            }
        }
        
        // Spawn boss when enough cats defeated
        if (this.catsDefeated >= this.catsNeeded && !this.bossSpawned) {
            this.spawnBoss();
        }
        
        // Update matzah powerups
        this.matzahPowerups = this.matzahPowerups.filter(matzah => {
            matzah.update(dt);
            matzah.y += 50 * dt; // Fall down
            if (matzah.checkCollision(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 30)) {
                this.engine.addAwakeness(matzah.awakenessBoost);
                this.displayMessage('🫓 Matzah! +15 Awakeness!');
                // Collect powerup sound!
                if (window.audioManager) {
                    window.audioManager.playSynthSound('slurp');
                }
                return false;
            }
            return matzah.y < 600;
        });
        
        // Check game over
        if (this.playerHP <= 0) {
            this.displayMessage('🐱 The cats shot you down! Your dog HP reached zero - try again!');
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
        if (this.engine.isKeyDown('left')) {
            this.player.x -= this.player.speed * dt;
        }
        if (this.engine.isKeyDown('right')) {
            this.player.x += this.player.speed * dt;
        }
        
        // Keep in bounds
        this.player.x = Math.max(0, Math.min(800 - this.player.width, this.player.x));
    }
    
    shootTooth() {
        // Shoot a chomping mouth that looks like it's biting!
        this.teeth.push({
            x: this.player.x + this.player.width/2,
            y: this.player.y,
            width: 25,
            height: 25,
            speed: 400,
            chompTimer: 0,  // Animation timer
            chompOpen: true // Toggle open/closed mouth
        });
        
        // Bark sound!
        if (window.audioManager) {
            window.audioManager.playSynthSound('bark');
        }
    }
    
    updateTeeth(dt) {
        this.teeth = this.teeth.filter(tooth => {
            tooth.y -= tooth.speed * dt;
            
            // Animate the chomping!
            tooth.chompTimer += dt;
            if (tooth.chompTimer > 0.08) { // Fast chomping
                tooth.chompTimer = 0;
                tooth.chompOpen = !tooth.chompOpen;
            }
            
            // Check collision with cat ships
            for (let i = this.catShips.length - 1; i >= 0; i--) {
                const cat = this.catShips[i];
                if (this.engine.rectCollision(tooth, cat)) {
                    cat.hp -= 25;
                    // Meow when hit!
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('meow');
                    }
                    if (cat.hp <= 0) {
                        this.catShips.splice(i, 1);
                        this.catsDefeated++;
                        
                        // Cat destroyed explosion sound!
                        if (window.audioManager) {
                            window.audioManager.playSynthSound('explosion');
                        }
                        
                        // Maybe spawn matzah
                        if (Math.random() < 0.3) {
                            this.matzahPowerups.push(new MatzahPowerup(cat.x + cat.width/2, cat.y));
                            // Powerup spawn sound
                            if (window.audioManager) {
                                window.audioManager.playSynthSound('powerup');
                            }
                        }
                    }
                    return false;
                }
            }
            
            // Check collision with boss
            if (this.boss) {
                if (this.engine.rectCollision(tooth, this.boss)) {
                    this.boss.hp -= 10;
                    this.engine.screenShake();
                    
                    // Boss damage sound!
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('hit');
                        // Extra meow when hurt
                        if (Math.random() < 0.4) {
                            window.audioManager.playSynthSound('meow');
                        }
                    }
                    
                    if (this.boss.hp <= 0) {
                        // Start the biting phase - dog runs up to bite the cat!
                        this.startBitingPhase();
                    }
                    return false;
                }
            }
            
            return tooth.y > -20;
        });
    }
    
    spawnCatShip() {
        this.catShips.push({
            x: Math.random() * 700 + 50,
            y: -50,
            width: 40,
            height: 40,
            hp: this.settings.catHP,
            speed: this.settings.catSpeed + Math.random() * 20,
            shootTimer: Math.random() * 2,
            moveDir: Math.random() > 0.5 ? 1 : -1
        });
        
        // Hiss sound when cat appears!
        if (window.audioManager && Math.random() < 0.5) {
            window.audioManager.playSynthSound('meow');
        }
    }
    
    updateCatShips(dt) {
        this.catShips.forEach(cat => {
            // Move down and side to side
            cat.y += cat.speed * dt * 0.3;
            cat.x += cat.moveDir * cat.speed * dt;
            
            // Bounce off walls
            if (cat.x <= 0 || cat.x >= 760) {
                cat.moveDir = -cat.moveDir;
            }
            
            // Shoot at player
            cat.shootTimer -= dt;
            if (cat.shootTimer <= 0 && cat.y > 50) {
                this.catBullets.push({
                    x: cat.x + cat.width/2,
                    y: cat.y + cat.height,
                    width: 10,
                    height: 15,
                    speed: this.settings.bulletSpeed
                });
                cat.shootTimer = 1 + Math.random() * 2;
                
                // Cat attack sound
                if (window.audioManager && Math.random() < 0.3) {
                    window.audioManager.playSynthSound('throw');
                }
            }
        });
        
        // Remove cats that went off screen
        this.catShips = this.catShips.filter(cat => cat.y < 550);
    }
    
    updateCatBullets(dt) {
        this.catBullets = this.catBullets.filter(bullet => {
            bullet.y += bullet.speed * dt;
            
            // Check collision with player
            const playerRect = {
                x: this.player.x,
                y: this.player.y,
                width: this.player.width,
                height: this.player.height
            };
            
            if (this.engine.rectCollision(bullet, playerRect)) {
                this.playerHP -= 15;
                this.engine.screenShake();
                // Play hit sound
                if (window.audioManager) {
                    window.audioManager.playSynthSound('hit');
                }
                return false;
            }
            
            return bullet.y < 620;
        });
    }
    
    spawnBoss() {
        this.bossSpawned = true;
        this.displayMessage('🚨 BOSS CAT APPROACHING! 🚨');
        
        // Dramatic boss entrance sounds!
        if (window.audioManager) {
            window.audioManager.playSynthSound('explosion');
            setTimeout(() => {
                if (window.audioManager) window.audioManager.playSynthSound('meow');
            }, 300);
        }
        
        this.boss = {
            x: 350,
            y: -100,
            width: 100,
            height: 80,
            hp: 200,
            maxHp: 200,
            phase: 'enter',
            shootTimer: 0,
            moveDir: 1,
            moveDirY: 0,
            speed: 120,
            directionChangeTimer: 0,
            directionChangeCooldown: 1.5 + Math.random() * 1.5,
            targetY: 80,
            bobTimer: 0
        };
    }
    
    updateBoss(dt) {
        if (this.boss.phase === 'enter') {
            this.boss.y += 100 * dt;
            if (this.boss.y >= 80) {
                this.boss.y = 80;
                this.boss.phase = 'fight';
            }
            return;
        }
        
        // Direction change timer - boss changes direction more frequently
        this.boss.directionChangeTimer -= dt;
        if (this.boss.directionChangeTimer <= 0) {
            // Randomly decide new movement pattern
            const pattern = Math.random();
            if (pattern < 0.3) {
                // Reverse X direction
                this.boss.moveDir = -this.boss.moveDir;
            } else if (pattern < 0.5) {
                // Move toward player on Y axis
                if (this.player.x < this.boss.x) {
                    this.boss.moveDir = -1;
                } else {
                    this.boss.moveDir = 1;
                }
            } else if (pattern < 0.7) {
                // Change Y target - bob up or down
                this.boss.targetY = 60 + Math.random() * 80;
            }
            
            this.boss.directionChangeCooldown = 0.8 + Math.random() * 1.2;
            this.boss.directionChangeTimer = this.boss.directionChangeCooldown;
        }
        
        // Move side to side with boundaries
        this.boss.x += this.boss.moveDir * this.boss.speed * dt;
        if (this.boss.x <= 50 || this.boss.x >= 650) {
            this.boss.moveDir = -this.boss.moveDir;
        }
        
        // Move toward target Y position (bobbing motion)
        const yDiff = this.boss.targetY - this.boss.y;
        if (Math.abs(yDiff) > 2) {
            this.boss.y += Math.sign(yDiff) * this.boss.speed * 0.5 * dt;
        }
        
        // Clamp Y position
        this.boss.y = Math.max(50, Math.min(150, this.boss.y));
        
        // Shoot pattern
        this.boss.shootTimer -= dt;
        if (this.boss.shootTimer <= 0) {
            // Spread shot
            for (let angle = -30; angle <= 30; angle += 15) {
                const rad = angle * Math.PI / 180;
                this.catBullets.push({
                    x: this.boss.x + this.boss.width/2,
                    y: this.boss.y + this.boss.height,
                    width: 12,
                    height: 12,
                    speed: 180,
                    vx: Math.sin(rad) * 180,
                    vy: Math.cos(rad) * 180
                });
            }
            this.boss.shootTimer = 0.8;
            
            // Boss attack sound!
            if (window.audioManager) {
                window.audioManager.playSynthSound('throw');
            }
        }
        
        // Update boss bullets with custom velocity
        this.catBullets.forEach(bullet => {
            if (bullet.vx !== undefined) {
                bullet.x += bullet.vx * dt;
                bullet.y += bullet.vy * dt;
            }
        });
    }
    
    startBitingPhase() {
        this.phase = 'biting';
        this.displayMessage('🐕 Time to bite! 🦷');
        
        // Dog runs from current position to the boss
        this.bitingPhase = {
            dogX: this.player.x + this.player.width / 2,
            dogY: this.player.y,
            targetX: this.boss.x + this.boss.width / 2,
            targetY: this.boss.y + this.boss.height / 2,
            catX: this.boss.x + this.boss.width / 2,
            catY: this.boss.y + this.boss.height / 2,
            catSize: 70,
            dogSize: 50,
            timer: 0,
            biteCount: 0,
            stage: 'running' // running, biting, done
        };
        
        // Bark excitedly!
        if (window.audioManager) {
            window.audioManager.playSynthSound('bark');
        }
    }
    
    updateBiting(dt) {
        const bp = this.bitingPhase;
        bp.timer += dt;
        
        if (bp.stage === 'running') {
            // Dog runs toward the cat
            const speed = 300;
            const dx = bp.targetX - bp.dogX;
            const dy = bp.targetY - bp.dogY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 30) {
                bp.dogX += (dx / dist) * speed * dt;
                bp.dogY += (dy / dist) * speed * dt;
            } else {
                bp.stage = 'biting';
                bp.timer = 0;
                this.displayMessage('🐕 CHOMP CHOMP! 🦷');
                if (window.audioManager) {
                    window.audioManager.playSynthSound('chomp');
                }
            }
        } else if (bp.stage === 'biting') {
            // Biting animation - dog shakes, cat recoils
            if (bp.timer < 2) {
                bp.dogSize = 50 + Math.sin(bp.timer * 15) * 8; // Shake while biting
                bp.catSize = 70 - bp.timer * 15; // Cat shrinks as it's bitten
                
                // Play bite sounds periodically
                if (Math.floor(bp.timer * 4) > bp.biteCount) {
                    bp.biteCount = Math.floor(bp.timer * 4);
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('chomp');
                    }
                }
            } else {
                bp.stage = 'done';
                bp.timer = 0;
                this.displayMessage('🎉 The Dog bit the Cat! 🐕');
            }
        } else if (bp.stage === 'done') {
            // Victory!
            if (bp.timer > 1.5) {
                this.complete = true;
                if (this.engine.onLevelComplete) {
                    this.engine.onLevelComplete();
                }
            }
        }
    }
    
    displayMessage(text) {
        this.messageText = text;
        this.showMessage = true;
        this.messageTimer = 2;
    }
    
    render(ctx) {
        // Space background
        ctx.fillStyle = '#0a0a2a';
        ctx.fillRect(0, 0, 800, 600);
        
        // Stars - randomized with seeded positions
        ctx.fillStyle = 'white';
        const starSeeds = [739, 283, 547, 911, 127, 853, 419, 631, 173, 967, 349, 701, 89, 563, 271, 823, 457, 619, 103, 787, 331, 929, 191, 677, 443, 859, 53, 599, 367, 773, 211, 883, 29, 521, 317, 941, 157, 709, 383, 829, 71, 577, 293, 863, 137, 659, 401, 797, 223, 917];
        for (let i = 0; i < 50; i++) {
            const seed1 = starSeeds[i];
            const seed2 = starSeeds[(i + 17) % 50];
            const x = ((seed1 * 3 + seed2 * 7 + i * 13) % 800 + this.engine.totalTime * (10 + (i % 5) * 3)) % 800;
            const y = ((seed2 * 11 + seed1 * 5 + i * 23) % 600);
            const size = 1 + (i % 3);
            ctx.fillRect(x, y, size, size);
        }
        
        // Draw cat ships
        this.catShips.forEach(cat => {
            ctx.font = '35px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🐱', cat.x + cat.width/2, cat.y + cat.height/2);
            ctx.fillText('🛸', cat.x + cat.width/2, cat.y + cat.height/2 + 5);
            
            // HP bar
            ctx.fillStyle = 'red';
            ctx.fillRect(cat.x, cat.y - 10, cat.width, 5);
            ctx.fillStyle = 'lime';
            ctx.fillRect(cat.x, cat.y - 10, cat.width * (cat.hp / 50), 5);
        });
        
        // Draw boss
        if (this.boss) {
            ctx.font = '70px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🐱', this.boss.x + this.boss.width/2, this.boss.y + 40);
            ctx.fillText('🛸', this.boss.x + this.boss.width/2, this.boss.y + 60);
            
            // Boss HP bar
            ctx.fillStyle = '#333';
            ctx.fillRect(250, 20, 300, 20);
            ctx.fillStyle = 'red';
            ctx.fillRect(252, 22, 296, 16);
            ctx.fillStyle = 'lime';
            ctx.fillRect(252, 22, 296 * (this.boss.hp / this.boss.maxHp), 16);
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText('BOSS CAT', 400, 35);
        }
        
        // Draw cat bullets - looks like biting mouths!
        ctx.font = '15px Arial';
        this.catBullets.forEach(bullet => {
            ctx.fillText('😾', bullet.x, bullet.y);
        });
        
        // Draw chomping mouths (dog's projectiles) - animated biting!
        this.teeth.forEach(tooth => {
            ctx.save();
            ctx.translate(tooth.x, tooth.y);
            
            // Draw chomping mouth animation
            ctx.font = '28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (tooth.chompOpen) {
                // Open mouth - ready to bite!
                ctx.fillText('👅', 0, 0); // Tongue/open mouth
                // Add teeth around it
                ctx.font = '12px Arial';
                ctx.fillText('🦷', -8, -8);
                ctx.fillText('🦷', 8, -8);
            } else {
                // Closed mouth - CHOMP!
                ctx.fillText('😬', 0, 0); // Grimacing/biting face
            }
            
            // Add motion lines for speed effect
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, 15);
            ctx.lineTo(-10, 25);
            ctx.moveTo(0, 18);
            ctx.lineTo(0, 30);
            ctx.moveTo(10, 15);
            ctx.lineTo(10, 25);
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Draw matzah powerups
        this.matzahPowerups.forEach(matzah => matzah.render(ctx));
        
        // Draw player
        ctx.font = '45px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.player.emoji, this.player.x + this.player.width/2, this.player.y + this.player.height/2);
        
        // Player HP bar
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 570, 150, 20);
        ctx.fillStyle = 'red';
        ctx.fillRect(22, 572, 146, 16);
        ctx.fillStyle = 'lime';
        ctx.fillRect(22, 572, 146 * (this.playerHP / this.maxHP), 16);
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText('DOG HP', 25, 583);
        
        // Progress counter
        ctx.font = '16px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'right';
        if (!this.bossSpawned) {
            ctx.fillText(`Cats: ${this.catsDefeated}/${this.catsNeeded}`, 780, 585);
        }
        
        // Draw biting phase
        if (this.phase === 'biting' && this.bitingPhase) {
            this.renderBitingPhase(ctx);
        }
        
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
        if (this.phase === 'fight') {
            ctx.font = '12px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'center';
            ctx.fillText('← → to move, SPACE to shoot teeth', 400, 595);
        }
    }
    
    renderBitingPhase(ctx) {
        const bp = this.bitingPhase;
        
        // Draw the cat (being bitten)
        if (bp.catSize > 5) {
            ctx.font = `${bp.catSize}px Arial`;
            ctx.textAlign = 'center';
            
            // Cat expression changes
            let catEmoji = '😿'; // Crying cat
            if (bp.stage === 'biting') {
                // Shake the cat
                const shake = Math.sin(bp.timer * 30) * 5;
                ctx.fillText(catEmoji, bp.catX + shake, bp.catY);
                ctx.fillText('💥', bp.catX - 20, bp.catY - 30); // Impact stars
            } else {
                ctx.fillText(catEmoji, bp.catX, bp.catY);
            }
        }
        
        // Draw the dog (running/biting)
        ctx.font = `${bp.dogSize}px Arial`;
        ctx.textAlign = 'center';
        
        let dogEmoji = '🐕';
        if (bp.stage === 'biting') {
            // Alternate between open and closed mouth
            dogEmoji = Math.floor(bp.timer * 8) % 2 === 0 ? '🐕' : '🐶';
            
            // Teeth flying out!
            const teethOffsets = [
                { x: -40, y: -20 },
                { x: 40, y: -30 },
                { x: -30, y: 30 },
                { x: 50, y: 20 }
            ];
            ctx.font = '20px Arial';
            teethOffsets.forEach((offset, i) => {
                const pulse = Math.sin(bp.timer * 5 + i) * 10;
                ctx.fillText('🦷', bp.dogX + offset.x + pulse, bp.dogY + offset.y);
            });
        } else if (bp.stage === 'done') {
            dogEmoji = '🐕'; // Victorious dog
            // Victory sparkles
            ctx.font = '25px Arial';
            for (let i = 0; i < 6; i++) {
                const angle = (bp.timer * 2 + i * Math.PI / 3);
                const dist = 50 + Math.sin(bp.timer * 3 + i) * 20;
                ctx.fillText('✨', bp.dogX + Math.cos(angle) * dist, bp.dogY + Math.sin(angle) * dist);
            }
        }
        
        ctx.font = `${bp.dogSize}px Arial`;
        ctx.fillText(dogEmoji, bp.dogX, bp.dogY);
        
        // "CHOMP!" text during biting
        if (bp.stage === 'biting') {
            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = 'yellow';
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            const bounce = Math.abs(Math.sin(bp.timer * 10)) * 15;
            ctx.strokeText('CHOMP!', bp.dogX, bp.dogY - 60 - bounce);
            ctx.fillText('CHOMP!', bp.dogX, bp.dogY - 60 - bounce);
        }
    }
    
    reset() {
        this.player = {
            x: 400,
            y: 530,
            width: 50,
            height: 50,
            speed: 250,
            emoji: '🐕'
        };
        this.playerHP = 100;
        this.teeth = [];
        this.shootCooldown = 0;
        this.catShips = [];
        this.catBullets = [];
        this.spawnTimer = 0;
        this.boss = null;
        this.bossSpawned = false;
        this.catsDefeated = 0;
        this.matzahPowerups = [];
        this.complete = false;
        this.showMessage = false;
        this.phase = 'fight';
        this.bitingPhase = null;
        this.spawnCatShip();
    }
}

window.Level3 = Level3;
