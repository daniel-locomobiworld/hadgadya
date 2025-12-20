// Level 4: A Stick comes and beats the Dog
// Tank Battle - Stick Tank vs Dog Tank - Best of 5 Rounds!

class Level4 {
    constructor(engine, difficulty = 'normal') {
        this.engine = engine;
        this.difficulty = difficulty;
        this.name = "Tank Battle";
        this.description = "Best of 5 tank battle! First to win 3 rounds defeats the dog!";
        this.instructions = "Arrow keys to move, SPACE to fire!";
        this.icon = "🪵";
        
        // Difficulty settings
        this.difficultySettings = {
            easy: { enemySpeedBonus: 0, enemyHPBonus: 0 },
            normal: { enemySpeedBonus: 15, enemyHPBonus: 20 },
            hard: { enemySpeedBonus: 25, enemyHPBonus: 35 },
            extreme: { enemySpeedBonus: 40, enemyHPBonus: 50 }
        };
        this.settings = this.difficultySettings[difficulty] || this.difficultySettings.normal;
        
        // Round tracking
        this.playerWins = 0;
        this.enemyWins = 0;
        this.currentRound = 1;
        this.roundOver = false;
        this.roundMessage = '';
        this.roundMessageTimer = 0;
        this.betweenRounds = false;
        this.betweenRoundsTimer = 0;
        
        // Initialize first round
        this.initRound();
        
        // Level state
        this.complete = false;
        this.showMessage = false;
        this.messageText = '';
        this.messageTimer = 0;
    }
    
    initRound() {
        // Player tank (Stick)
        this.player = {
            x: 100,
            y: 500,
            width: 50,
            height: 50,
            angle: -Math.PI/2, // Facing up
            baseSpeed: 120,
            speed: 120,
            speedModifier: 1.0,
            speedModifierTimer: 0,
            rapidFire: false,
            rapidFireTimer: 0,
            rotSpeed: 2.5,
            hp: 100,
            maxHp: 100,
            shootCooldown: 0
        };
        
        // Enemy tank (Dog) - Gets stronger each round!
        const roundBonus = (this.currentRound - 1) * this.settings.enemyHPBonus;
        this.enemy = {
            x: 650,
            y: 100,
            width: 50,
            height: 50,
            angle: Math.PI/2,
            speed: 100 + this.currentRound * this.settings.enemySpeedBonus, // Faster each round
            hp: 120 + roundBonus,
            maxHp: 120 + roundBonus,
            shootCooldown: 0,
            aiState: 'chase',
            aiTimer: 0,
            strafeDir: 1,
            lastPlayerX: 0,
            lastPlayerY: 0,
            predictionTimer: 0,
            // Confusion mechanic - dog gets confused periodically
            confusionTimer: 5 + Math.random() * 5, // First confusion between 5-10 seconds
            confusedDuration: 0,
            confusedAngle: 0
        };
        
        // Bullets
        this.playerBullets = [];
        this.enemyBullets = [];
        
        // Hit effects (explosions, sparks)
        this.hitEffects = [];
        
        // Generate random walls based on round
        this.generateWalls();
        
        // Matzah powerups - random positions
        this.matzahPowerups = [];
        for (let i = 0; i < 2; i++) {
            let x, y, valid;
            do {
                x = 100 + Math.random() * 600;
                y = 100 + Math.random() * 400;
                valid = true;
                for (let wall of this.walls) {
                    if (x >= wall.x - 30 && x <= wall.x + wall.width + 30 &&
                        y >= wall.y - 30 && y <= wall.y + wall.height + 30) {
                        valid = false;
                        break;
                    }
                }
            } while (!valid);
            this.matzahPowerups.push(new MatzahPowerup(x, y));
        }
        
        // Wine glasses - slow you down!
        this.wineGlasses = [];
        for (let i = 0; i < 3; i++) {
            let x, y, valid;
            do {
                x = 100 + Math.random() * 600;
                y = 100 + Math.random() * 400;
                valid = true;
                for (let wall of this.walls) {
                    if (x >= wall.x - 30 && x <= wall.x + wall.width + 30 &&
                        y >= wall.y - 30 && y <= wall.y + wall.height + 30) {
                        valid = false;
                        break;
                    }
                }
            } while (!valid);
            this.wineGlasses.push({ x, y, collected: false, size: 25, respawnTimer: 0 });
        }
        
        // Potato Kugel - speed boost!
        this.kugels = [];
        for (let i = 0; i < 2; i++) {
            let x, y, valid;
            do {
                x = 100 + Math.random() * 600;
                y = 100 + Math.random() * 400;
                valid = true;
                for (let wall of this.walls) {
                    if (x >= wall.x - 30 && x <= wall.x + wall.width + 30 &&
                        y >= wall.y - 30 && y <= wall.y + wall.height + 30) {
                        valid = false;
                        break;
                    }
                }
            } while (!valid);
            this.kugels.push({ x, y, collected: false, size: 25, respawnTimer: 0 });
        }
        
        // Matzah Brei - rapid fire!
        this.matzahBreis = [];
        for (let i = 0; i < 2; i++) {
            let x, y, valid;
            do {
                x = 100 + Math.random() * 600;
                y = 100 + Math.random() * 400;
                valid = true;
                for (let wall of this.walls) {
                    if (x >= wall.x - 30 && x <= wall.x + wall.width + 30 &&
                        y >= wall.y - 30 && y <= wall.y + wall.height + 30) {
                        valid = false;
                        break;
                    }
                }
            } while (!valid);
            this.matzahBreis.push({ x, y, collected: false, size: 25, respawnTimer: 0 });
        }
        
        // BONES - slow down the dog when he picks them up!
        this.bones = [];
        for (let i = 0; i < 3; i++) {
            let x, y, valid;
            do {
                x = 100 + Math.random() * 600;
                y = 100 + Math.random() * 400;
                valid = true;
                for (let wall of this.walls) {
                    if (x >= wall.x - 30 && x <= wall.x + wall.width + 30 &&
                        y >= wall.y - 30 && y <= wall.y + wall.height + 30) {
                        valid = false;
                        break;
                    }
                }
            } while (!valid);
            this.bones.push({ x, y, collected: false, size: 30, respawnTimer: 0 });
        }
        
        // Dog slow effect
        this.dogSlowTimer = 0;
        this.dogSlowAmount = 1.0;
        
        this.roundOver = false;
    }
    
    generateWalls() {
        // Different wall layouts based on round
        const layouts = [
            // Layout 1: Basic cross
            [
                { x: 350, y: 200, width: 100, height: 30 },
                { x: 375, y: 230, width: 30, height: 140 },
                { x: 150, y: 300, width: 100, height: 30 },
                { x: 550, y: 350, width: 100, height: 30 },
                { x: 200, y: 150, width: 30, height: 100 },
                { x: 570, y: 450, width: 30, height: 100 }
            ],
            // Layout 2: Maze-like
            [
                { x: 200, y: 150, width: 200, height: 25 },
                { x: 400, y: 150, width: 25, height: 150 },
                { x: 200, y: 300, width: 25, height: 150 },
                { x: 200, y: 425, width: 200, height: 25 },
                { x: 500, y: 250, width: 150, height: 25 },
                { x: 500, y: 400, width: 150, height: 25 },
                { x: 100, y: 250, width: 80, height: 25 }
            ],
            // Layout 3: Scattered bunkers
            [
                { x: 150, y: 200, width: 80, height: 80 },
                { x: 550, y: 150, width: 80, height: 80 },
                { x: 350, y: 350, width: 100, height: 60 },
                { x: 200, y: 450, width: 60, height: 60 },
                { x: 600, y: 420, width: 60, height: 60 },
                { x: 450, y: 200, width: 50, height: 50 }
            ],
            // Layout 4: Corridors
            [
                { x: 250, y: 100, width: 25, height: 250 },
                { x: 525, y: 250, width: 25, height: 250 },
                { x: 250, y: 350, width: 150, height: 25 },
                { x: 400, y: 200, width: 150, height: 25 },
                { x: 100, y: 400, width: 120, height: 25 },
                { x: 580, y: 150, width: 120, height: 25 }
            ],
            // Layout 5: Arena with center obstacle
            [
                { x: 350, y: 275, width: 100, height: 100 },
                { x: 150, y: 150, width: 60, height: 25 },
                { x: 590, y: 150, width: 60, height: 25 },
                { x: 150, y: 475, width: 60, height: 25 },
                { x: 590, y: 475, width: 60, height: 25 },
                { x: 300, y: 150, width: 25, height: 80 },
                { x: 475, y: 420, width: 25, height: 80 }
            ]
        ];
        
        // Pick a random layout, but ensure variety
        const layoutIndex = (this.currentRound - 1 + Math.floor(Math.random() * 3)) % layouts.length;
        this.walls = JSON.parse(JSON.stringify(layouts[layoutIndex]));
        
        // Add some random extra walls for higher rounds
        if (this.currentRound >= 3) {
            const extraWalls = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < extraWalls; i++) {
                const isVertical = Math.random() > 0.5;
                this.walls.push({
                    x: 100 + Math.random() * 550,
                    y: 120 + Math.random() * 350,
                    width: isVertical ? 25 : 60 + Math.random() * 60,
                    height: isVertical ? 60 + Math.random() * 60 : 25
                });
            }
        }
    }
    
    update(dt) {
        if (this.complete) return;
        
        // Between rounds timer
        if (this.betweenRounds) {
            this.betweenRoundsTimer -= dt;
            if (this.betweenRoundsTimer <= 0) {
                this.betweenRounds = false;
                this.currentRound++;
                this.initRound();
                this.displayMessage(`🎯 Round ${this.currentRound} - FIGHT!`);
            }
            return;
        }
        
        // Round over - don't update gameplay
        if (this.roundOver) return;
        
        // Update player tank
        this.updatePlayerTank(dt);
        
        // Update enemy tank AI
        this.updateEnemyAI(dt);
        
        // Update bullets
        this.updateBullets(dt);
        
        // Update hit effects
        this.updateHitEffects(dt);
        
        // Update player speed modifier
        if (this.player.speedModifierTimer > 0) {
            this.player.speedModifierTimer -= dt;
            if (this.player.speedModifierTimer <= 0) {
                this.player.speedModifier = 1.0;
                this.player.speed = this.player.baseSpeed;
            }
        }
        
        // Update rapid fire timer
        if (this.player.rapidFireTimer > 0) {
            this.player.rapidFireTimer -= dt;
            if (this.player.rapidFireTimer <= 0) {
                this.player.rapidFire = false;
            }
        }
        
        // Update matzah powerups
        this.matzahPowerups.forEach(matzah => {
            matzah.update(dt);
            if (matzah.checkCollision(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 30)) {
                this.engine.addAwakeness(matzah.awakenessBoost);
                this.displayMessage('🫓 Matzah! +15 Awakeness!');
            }
        });
        
        // Check wine glass collision - slows player
        const playerCenterX = this.player.x + this.player.width/2;
        const playerCenterY = this.player.y + this.player.height/2;
        
        // Update power-up respawn timers
        this.wineGlasses.forEach(wine => {
            if (wine.collected && wine.respawnTimer > 0) {
                wine.respawnTimer -= dt;
                if (wine.respawnTimer <= 0) {
                    wine.collected = false;
                }
            }
        });
        this.kugels.forEach(kugel => {
            if (kugel.collected && kugel.respawnTimer > 0) {
                kugel.respawnTimer -= dt;
                if (kugel.respawnTimer <= 0) {
                    kugel.collected = false;
                }
            }
        });
        this.matzahBreis.forEach(brei => {
            if (brei.collected && brei.respawnTimer > 0) {
                brei.respawnTimer -= dt;
                if (brei.respawnTimer <= 0) {
                    brei.collected = false;
                }
            }
        });
        
        // Bone respawn timer
        this.bones.forEach(bone => {
            if (bone.collected && bone.respawnTimer > 0) {
                bone.respawnTimer -= dt;
                if (bone.respawnTimer <= 0) {
                    bone.collected = false;
                }
            }
        });
        
        // Dog slow timer decay
        if (this.dogSlowTimer > 0) {
            this.dogSlowTimer -= dt;
            if (this.dogSlowTimer <= 0) {
                this.dogSlowAmount = 1.0; // Reset to full speed
            }
        }
        
        this.wineGlasses.forEach(wine => {
            if (!wine.collected) {
                const dx = playerCenterX - wine.x;
                const dy = playerCenterY - wine.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 35) {
                    wine.collected = true;
                    wine.respawnTimer = 30 + Math.random() * 15; // 30-45 seconds
                    this.player.speedModifier = 0.5; // 50% speed
                    this.player.speed = this.player.baseSpeed * 0.5;
                    this.player.speedModifierTimer = 4; // 4 seconds
                    this.displayMessage('🍷 Wine! Slowed down for 4 seconds!');
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('slurp');
                    }
                }
            }
        });
        
        // Check kugel collision - speeds player up and heals
        this.kugels.forEach(kugel => {
            if (!kugel.collected) {
                const dx = playerCenterX - kugel.x;
                const dy = playerCenterY - kugel.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 35) {
                    kugel.collected = true;
                    kugel.respawnTimer = 30 + Math.random() * 15; // 30-45 seconds
                    this.player.speedModifier = 1.6; // 60% faster
                    this.player.speed = this.player.baseSpeed * 1.6;
                    this.player.speedModifierTimer = 5; // 5 seconds
                    // Heal 20 HP
                    this.player.hp = Math.min(this.player.hp + 20, this.player.maxHp);
                    this.displayMessage('🥔 Potato Kugel! SPEED + HEALTH!');
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('powerup');
                    }
                }
            }
        });
        
        // Check matzah brei collision - rapid fire!
        this.matzahBreis.forEach(brei => {
            if (!brei.collected) {
                const dx = playerCenterX - brei.x;
                const dy = playerCenterY - brei.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 35) {
                    brei.collected = true;
                    brei.respawnTimer = 30 + Math.random() * 15; // 30-45 seconds
                    this.player.rapidFire = true;
                    this.player.rapidFireTimer = 6; // 6 seconds of rapid fire
                    this.displayMessage('🍳 Matzah Brei! RAPID FIRE!');
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('powerup');
                    }
                }
            }
        });
        
        // Check round win/lose
        if (this.enemy.hp <= 0 && !this.roundOver) {
            this.roundOver = true;
            this.playerWins++;
            
            if (this.playerWins >= 3) {
                // Player wins the match!
                this.complete = true;
                this.displayMessage(`🎉 Victory! You beat the Dog ${this.playerWins}-${this.enemyWins}!`);
                setTimeout(() => {
                    if (this.engine.onLevelComplete) {
                        this.engine.onLevelComplete();
                    }
                }, 2500);
            } else {
                // Won this round, next round
                this.displayMessage(`✅ Round ${this.currentRound} WON! Score: ${this.playerWins}-${this.enemyWins}`);
                if (window.audioManager) {
                    window.audioManager.playSynthSound('powerup');
                    // Announce round winner
                    const audioPath = window.audioManager.getAudioPath('roundwinner', 'stick');
                    if (audioPath) {
                        window.audioManager.play(audioPath);
                    }
                }
                this.betweenRounds = true;
                this.betweenRoundsTimer = 2.5;
            }
        }
        
        if (this.player.hp <= 0 && !this.roundOver) {
            this.roundOver = true;
            this.enemyWins++;
            
            if (this.enemyWins >= 3) {
                // Dog wins the match - restart from beginning
                this.displayMessage(`💀 Defeat! The Dog won ${this.enemyWins}-${this.playerWins}! Try again!`);
                setTimeout(() => this.fullReset(), 2500);
            } else {
                // Lost this round, next round
                this.displayMessage(`❌ Round ${this.currentRound} LOST! Score: ${this.playerWins}-${this.enemyWins}`);
                if (window.audioManager) {
                    window.audioManager.playSynthSound('hit');
                    // Announce round winner
                    const audioPath = window.audioManager.getAudioPath('roundwinner', 'dog');
                    if (audioPath) {
                        window.audioManager.play(audioPath);
                    }
                }
                this.betweenRounds = true;
                this.betweenRoundsTimer = 2.5;
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
    
    updatePlayerTank(dt) {
        // Rotation
        if (this.engine.isKeyDown('left')) {
            this.player.angle -= this.player.rotSpeed * dt;
        }
        if (this.engine.isKeyDown('right')) {
            this.player.angle += this.player.rotSpeed * dt;
        }
        
        // Movement
        let dx = 0, dy = 0;
        if (this.engine.isKeyDown('up')) {
            dx = Math.cos(this.player.angle) * this.player.speed * dt;
            dy = Math.sin(this.player.angle) * this.player.speed * dt;
        }
        if (this.engine.isKeyDown('down')) {
            dx = -Math.cos(this.player.angle) * this.player.speed * 0.5 * dt;
            dy = -Math.sin(this.player.angle) * this.player.speed * 0.5 * dt;
        }
        
        // Try to move
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if (this.canMoveTo(newX, newY, this.player.width, this.player.height)) {
            this.player.x = newX;
            this.player.y = newY;
        } else if (dx !== 0 || dy !== 0) {
            // BOUNCE OFF WALLS - push player back 5 pixels in opposite direction
            const pushX = -Math.cos(this.player.angle) * 5;
            const pushY = -Math.sin(this.player.angle) * 5;
            if (this.canMoveTo(this.player.x + pushX, this.player.y + pushY, this.player.width, this.player.height)) {
                this.player.x += pushX;
                this.player.y += pushY;
            }
        }
        
        // Keep in bounds (with bounce)
        if (this.player.x <= 0) this.player.x = 5;
        if (this.player.x >= 750) this.player.x = 745;
        if (this.player.y <= 50) this.player.y = 55;
        if (this.player.y >= 550) this.player.y = 545;
        
        // Shooting - faster with powerups!
        this.player.shootCooldown -= dt;
        if (this.engine.isKeyJustPressed('action') && this.player.shootCooldown <= 0) {
            this.shootBullet(this.player, this.playerBullets);
            // Determine fire rate based on powerups
            if (this.player.rapidFire) {
                this.player.shootCooldown = 0.12; // Super fast!
            } else if (this.player.speedModifier > 1) {
                this.player.shootCooldown = 0.25; // Fast with kugel
            } else {
                this.player.shootCooldown = 0.5; // Normal
            }
        }
    }
    
    updateEnemyAI(dt) {
        // Confusion mechanic - dog randomly drives wrong direction
        this.enemy.confusionTimer -= dt;
        if (this.enemy.confusedDuration > 0) {
            // Dog is confused! Drive in random direction
            this.enemy.confusedDuration -= dt;
            const moveSpeed = this.enemy.speed * this.dogSlowAmount;
            const moveX = Math.cos(this.enemy.confusedAngle) * moveSpeed * dt;
            const moveY = Math.sin(this.enemy.confusedAngle) * moveSpeed * dt;
            
            let newX = this.enemy.x + moveX;
            let newY = this.enemy.y + moveY;
            
            // Try to move, bounce off walls
            if (this.canMoveTo(newX, newY, this.enemy.width, this.enemy.height)) {
                this.enemy.x = newX;
                this.enemy.y = newY;
            } else {
                // Bounce - pick new random direction
                this.enemy.confusedAngle = Math.random() * Math.PI * 2;
            }
            
            // Keep in bounds
            this.enemy.x = Math.max(0, Math.min(750, this.enemy.x));
            this.enemy.y = Math.max(50, Math.min(550, this.enemy.y));
            
            // Spin the turret randomly while confused
            this.enemy.angle += (Math.random() - 0.5) * 8 * dt;
            
            if (this.enemy.confusedDuration <= 0) {
                // Confusion ended, reset timer for next confusion (10-18 seconds)
                this.enemy.confusionTimer = 10 + Math.random() * 8;
                this.enemy.aiTimer = 0; // Reset AI to pick new state
            }
            return; // Skip normal AI while confused
        }
        
        // Trigger confusion
        if (this.enemy.confusionTimer <= 0) {
            this.enemy.confusedDuration = 5; // Confused for 5 seconds
            this.enemy.confusedAngle = Math.random() * Math.PI * 2; // Random direction
            this.enemy.aiState = 'confused';
            return;
        }
        
        this.enemy.aiTimer -= dt;
        this.enemy.predictionTimer += dt;
        
        // Calculate angle to player with prediction
        const dx = this.player.x - this.enemy.x;
        const dy = this.player.y - this.enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Predict player movement
        let predictX = this.player.x;
        let predictY = this.player.y;
        if (this.enemy.predictionTimer > 0.1) {
            const playerVelX = (this.player.x - this.enemy.lastPlayerX) / this.enemy.predictionTimer;
            const playerVelY = (this.player.y - this.enemy.lastPlayerY) / this.enemy.predictionTimer;
            // Lead the target
            const leadTime = distance / 300 * 0.5; // Bullets travel at 300
            predictX = this.player.x + playerVelX * leadTime;
            predictY = this.player.y + playerVelY * leadTime;
            this.enemy.lastPlayerX = this.player.x;
            this.enemy.lastPlayerY = this.player.y;
            this.enemy.predictionTimer = 0;
        }
        
        const targetAngle = Math.atan2(predictY - this.enemy.y, predictX - this.enemy.x);
        
        // Rotate towards predicted position (faster rotation for higher rounds)
        let angleDiff = targetAngle - this.enemy.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        const rotSpeed = 2.5 + this.currentRound * 0.3;
        const rotAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotSpeed * dt);
        this.enemy.angle += rotAmount;
        
        // Smarter AI state machine
        if (this.enemy.aiTimer <= 0) {
            // More aggressive in later rounds
            const aggressionBonus = this.currentRound * 0.1;
            
            if (distance > 300) {
                this.enemy.aiState = 'chase';
            } else if (distance < 120) {
                this.enemy.aiState = 'retreat';
            } else if (this.enemy.hp < this.enemy.maxHp * 0.4) {
                // Low HP - be more evasive
                this.enemy.aiState = Math.random() > 0.5 ? 'strafe' : 'retreat';
            } else if (Math.random() < 0.3 + aggressionBonus) {
                // Aggressive flank maneuver
                this.enemy.aiState = 'flank';
                this.enemy.strafeDir = Math.random() > 0.5 ? 1 : -1;
            } else {
                this.enemy.aiState = 'strafe';
                this.enemy.strafeDir = Math.random() > 0.5 ? 1 : -1;
            }
            this.enemy.aiTimer = 0.5 + Math.random() * 0.5;
        }
        
        let moveX = 0, moveY = 0;
        const moveSpeed = this.enemy.speed * this.dogSlowAmount;
        
        if (this.enemy.aiState === 'chase') {
            moveX = Math.cos(this.enemy.angle) * moveSpeed * dt;
            moveY = Math.sin(this.enemy.angle) * moveSpeed * dt;
        } else if (this.enemy.aiState === 'retreat') {
            // Retreat but at an angle
            const retreatAngle = this.enemy.angle + Math.PI + this.enemy.strafeDir * 0.5;
            moveX = Math.cos(retreatAngle) * moveSpeed * dt;
            moveY = Math.sin(retreatAngle) * moveSpeed * dt;
        } else if (this.enemy.aiState === 'strafe') {
            // Circle strafe - deadly!
            const strafeAngle = this.enemy.angle + Math.PI/2 * this.enemy.strafeDir;
            moveX = Math.cos(strafeAngle) * moveSpeed * 0.8 * dt;
            moveY = Math.sin(strafeAngle) * moveSpeed * 0.8 * dt;
        } else if (this.enemy.aiState === 'flank') {
            // Move at an angle to get a better shot
            const flankAngle = this.enemy.angle + Math.PI/4 * this.enemy.strafeDir;
            moveX = Math.cos(flankAngle) * moveSpeed * dt;
            moveY = Math.sin(flankAngle) * moveSpeed * dt;
        }
        
        // Try to move, with wall avoidance
        let newX = this.enemy.x + moveX;
        let newY = this.enemy.y + moveY;
        
        if (this.canMoveTo(newX, newY, this.enemy.width, this.enemy.height)) {
            this.enemy.x = newX;
            this.enemy.y = newY;
        } else {
            // Try sliding along wall
            if (this.canMoveTo(newX, this.enemy.y, this.enemy.width, this.enemy.height)) {
                this.enemy.x = newX;
            } else if (this.canMoveTo(this.enemy.x, newY, this.enemy.width, this.enemy.height)) {
                this.enemy.y = newY;
            }
            // Switch to different behavior
            this.enemy.aiTimer = 0;
        }
        
        // Keep in bounds
        this.enemy.x = Math.max(0, Math.min(750, this.enemy.x));
        this.enemy.y = Math.max(50, Math.min(550, this.enemy.y));
        
        // CORNER DETECTION - if near multiple walls, escape toward center!
        const nearLeftWall = this.enemy.x <= 60;
        const nearRightWall = this.enemy.x >= 700;
        const nearTopWall = this.enemy.y <= 100;
        const nearBottomWall = this.enemy.y >= 510;
        const inCorner = (nearLeftWall || nearRightWall) && (nearTopWall || nearBottomWall);
        
        if (inCorner && this.enemy.aiState !== 'escapeCorner') {
            // Force escape toward center!
            this.enemy.aiState = 'escapeCorner';
            this.enemy.aiTimer = 1.0; // Escape for 1 second
            const centerX = 400;
            const centerY = 300;
            this.enemy.escapeAngle = Math.atan2(centerY - this.enemy.y, centerX - this.enemy.x);
            // Add random offset
            this.enemy.escapeAngle += (Math.random() - 0.5) * 0.8;
        }
        
        if (this.enemy.aiState === 'escapeCorner') {
            const escapeSpeed = this.enemy.speed * 1.3; // Faster to escape
            const escapeX = Math.cos(this.enemy.escapeAngle) * escapeSpeed * dt;
            const escapeY = Math.sin(this.enemy.escapeAngle) * escapeSpeed * dt;
            
            if (this.canMoveTo(this.enemy.x + escapeX, this.enemy.y + escapeY, this.enemy.width, this.enemy.height)) {
                this.enemy.x += escapeX;
                this.enemy.y += escapeY;
            }
        }
        
        // Check if dog picks up a bone - slows him down!
        for (let bone of this.bones) {
            if (!bone.collected) {
                const bx = bone.x - this.enemy.x - this.enemy.width/2;
                const by = bone.y - this.enemy.y - this.enemy.height/2;
                if (Math.sqrt(bx*bx + by*by) < 40) {
                    bone.collected = true;
                    bone.respawnTimer = 8; // Respawn after 8 seconds
                    this.dogSlowTimer = 4; // Dog slowed for 4 seconds
                    this.dogSlowAmount = 0.4; // 40% speed
                    this.displayMessage('🦴 Dog grabbed a bone! Slowed down!');
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('bark');
                    }
                }
            }
        }
        
        // Shooting - smarter and faster in later rounds
        this.enemy.shootCooldown -= dt;
        const shootDelay = Math.max(0.4, 1.0 - this.currentRound * 0.12);
        const aimTolerance = 0.35 - this.currentRound * 0.03; // More accurate in later rounds
        
        // MERCY MECHANIC: If it's a deciding round (2-2), dog misses 50% of shots!
        let mercyMiss = false;
        if (this.playerWins === 2 && this.enemyWins === 2) {
            mercyMiss = Math.random() < 0.5; // 50% chance to miss
        }
        
        if (this.enemy.shootCooldown <= 0 && Math.abs(angleDiff) < aimTolerance && distance < 450 && !mercyMiss) {
            this.shootBullet(this.enemy, this.enemyBullets, false);
            this.enemy.shootCooldown = shootDelay + Math.random() * 0.3;
        } else if (mercyMiss && this.enemy.shootCooldown <= 0 && Math.abs(angleDiff) < aimTolerance) {
            // Dog hesitates instead of shooting
            this.enemy.shootCooldown = shootDelay * 1.5; // Longer delay
        }
    }
    
    shootBullet(tank, bulletArray, isMatzahBall = true) {
        bulletArray.push({
            x: tank.x + tank.width/2 + Math.cos(tank.angle) * 30,
            y: tank.y + tank.height/2 + Math.sin(tank.angle) * 30,
            vx: Math.cos(tank.angle) * 300,
            vy: Math.sin(tank.angle) * 300,
            size: isMatzahBall ? 12 : 8,
            isMatzahBall: isMatzahBall,
            rotation: 0,
            bounces: 0 // Can bounce once off walls
        });
        
        // Throwing sound!
        if (window.audioManager) {
            window.audioManager.playSynthSound('throw');
        }
    }
    
    updateBullets(dt) {
        // Player bullets
        this.playerBullets = this.playerBullets.filter(bullet => {
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            
            // Check wall collision - bounce once!
            for (let wall of this.walls) {
                if (bullet.x >= wall.x && bullet.x <= wall.x + wall.width &&
                    bullet.y >= wall.y && bullet.y <= wall.y + wall.height) {
                    if (bullet.bounces >= 1) {
                        return false; // Already bounced once, destroy
                    }
                    bullet.bounces++;
                    // Determine which side we hit and bounce
                    const fromLeft = bullet.x - bullet.vx * dt < wall.x;
                    const fromRight = bullet.x - bullet.vx * dt > wall.x + wall.width;
                    const fromTop = bullet.y - bullet.vy * dt < wall.y;
                    const fromBottom = bullet.y - bullet.vy * dt > wall.y + wall.height;
                    
                    if (fromLeft || fromRight) {
                        bullet.vx = -bullet.vx;
                        bullet.x += bullet.vx * dt * 2;
                    }
                    if (fromTop || fromBottom) {
                        bullet.vy = -bullet.vy;
                        bullet.y += bullet.vy * dt * 2;
                    }
                    // Play bounce sound
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('hit');
                    }
                }
            }
            
            // Check enemy hit
            if (bullet.x >= this.enemy.x && bullet.x <= this.enemy.x + this.enemy.width &&
                bullet.y >= this.enemy.y && bullet.y <= this.enemy.y + this.enemy.height) {
                this.enemy.hp -= 15;
                this.engine.screenShake();
                // Hit effect!
                this.createHitEffect(bullet.x, bullet.y, '#FF6600');
                if (window.audioManager) {
                    window.audioManager.playSynthSound('explosion');
                }
                return false;
            }
            
            // Out of bounds
            return bullet.x >= 0 && bullet.x <= 800 && bullet.y >= 0 && bullet.y <= 600;
        });
        
        // Enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            
            // Check wall collision - bounce once!
            for (let wall of this.walls) {
                if (bullet.x >= wall.x && bullet.x <= wall.x + wall.width &&
                    bullet.y >= wall.y && bullet.y <= wall.y + wall.height) {
                    if (bullet.bounces >= 1) {
                        return false; // Already bounced once, destroy
                    }
                    bullet.bounces++;
                    // Determine which side we hit and bounce
                    const fromLeft = bullet.x - bullet.vx * dt < wall.x;
                    const fromRight = bullet.x - bullet.vx * dt > wall.x + wall.width;
                    const fromTop = bullet.y - bullet.vy * dt < wall.y;
                    const fromBottom = bullet.y - bullet.vy * dt > wall.y + wall.height;
                    
                    if (fromLeft || fromRight) {
                        bullet.vx = -bullet.vx;
                        bullet.x += bullet.vx * dt * 2;
                    }
                    if (fromTop || fromBottom) {
                        bullet.vy = -bullet.vy;
                        bullet.y += bullet.vy * dt * 2;
                    }
                    // Play bounce sound
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('hit');
                    }
                }
            }
            
            // Check player hit
            if (bullet.x >= this.player.x && bullet.x <= this.player.x + this.player.width &&
                bullet.y >= this.player.y && bullet.y <= this.player.y + this.player.height) {
                this.player.hp -= 15;
                this.engine.screenShake();
                // Hit effect!
                this.createHitEffect(bullet.x, bullet.y, '#FF0000');
                if (window.audioManager) {
                    window.audioManager.playSynthSound('explosion');
                }
                return false;
            }
            
            // Out of bounds
            return bullet.x >= 0 && bullet.x <= 800 && bullet.y >= 0 && bullet.y <= 600;
        });
    }
    
    createHitEffect(x, y, color) {
        // Create explosion particles
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.3;
            const speed = 80 + Math.random() * 120;
            this.hitEffects.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 6,
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.5 + Math.random() * 0.3,
                color: color,
                type: 'spark'
            });
        }
        // Add central flash
        this.hitEffects.push({
            x: x,
            y: y,
            size: 30,
            life: 0.2,
            maxLife: 0.2,
            color: '#FFFFFF',
            type: 'flash'
        });
        // Add smoke puffs
        for (let i = 0; i < 5; i++) {
            this.hitEffects.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 30,
                vy: -20 - Math.random() * 30,
                size: 10 + Math.random() * 15,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 0.6 + Math.random() * 0.4,
                color: '#666666',
                type: 'smoke'
            });
        }
    }
    
    updateHitEffects(dt) {
        this.hitEffects = this.hitEffects.filter(effect => {
            effect.life -= dt;
            if (effect.life <= 0) return false;
            
            if (effect.type === 'spark' || effect.type === 'smoke') {
                effect.x += effect.vx * dt;
                effect.y += effect.vy * dt;
                effect.vx *= 0.95;
                effect.vy *= 0.95;
                if (effect.type === 'smoke') {
                    effect.size += dt * 20; // Smoke expands
                }
            }
            return true;
        });
    }
    
    renderHitEffects(ctx) {
        this.hitEffects.forEach(effect => {
            const alpha = effect.life / effect.maxLife;
            ctx.save();
            
            if (effect.type === 'flash') {
                // Central flash - white circle that fades
                const gradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, effect.size);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 200, 100, ${alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'spark') {
                // Sparks - small bright particles
                ctx.fillStyle = effect.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                // Add glow
                ctx.shadowColor = effect.color;
                ctx.shadowBlur = 10;
                ctx.fill();
            } else if (effect.type === 'smoke') {
                // Smoke - gray expanding circles
                ctx.globalAlpha = alpha * 0.4;
                ctx.fillStyle = effect.color;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }
    
    canMoveTo(x, y, w, h) {
        const rect = { x, y, width: w, height: h };
        
        for (let wall of this.walls) {
            if (this.engine.rectCollision(rect, wall)) {
                return false;
            }
        }
        
        return true;
    }
    
    displayMessage(text) {
        this.messageText = text;
        this.showMessage = true;
        this.messageTimer = 2;
    }
    
    render(ctx) {
        // Desert/arena background
        ctx.fillStyle = '#c2b280';
        ctx.fillRect(0, 0, 800, 600);
        
        // Ground pattern
        ctx.fillStyle = '#b5a572';
        for (let x = 0; x < 800; x += 40) {
            for (let y = 50; y < 600; y += 40) {
                if ((x + y) % 80 === 0) {
                    ctx.fillRect(x, y, 40, 40);
                }
            }
        }
        
        // Draw walls
        ctx.fillStyle = '#654321';
        this.walls.forEach(wall => {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            // Brick pattern
            ctx.strokeStyle = '#543210';
            ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
        });
        
        // Draw matzah powerups
        this.matzahPowerups.forEach(matzah => matzah.render(ctx));
        
        // Draw wine glasses
        this.wineGlasses.forEach(wine => {
            if (!wine.collected) {
                ctx.save();
                ctx.translate(wine.x, wine.y);
                
                // Glass stem
                ctx.fillStyle = '#E8E8E8';
                ctx.fillRect(-2, 5, 4, 12);
                
                // Glass base
                ctx.beginPath();
                ctx.ellipse(0, 17, 8, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Glass bowl
                ctx.beginPath();
                ctx.moveTo(-10, 5);
                ctx.quadraticCurveTo(-12, -8, 0, -12);
                ctx.quadraticCurveTo(12, -8, 10, 5);
                ctx.lineTo(-10, 5);
                ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
                ctx.fill();
                ctx.strokeStyle = '#E8E8E8';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Wine inside
                ctx.beginPath();
                ctx.moveTo(-8, 5);
                ctx.quadraticCurveTo(-9, -3, 0, -5);
                ctx.quadraticCurveTo(9, -3, 8, 5);
                ctx.lineTo(-8, 5);
                ctx.fillStyle = '#8B0000';
                ctx.fill();
                
                // Wine emoji on top
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🍷', 0, -15);
                
                ctx.restore();
            }
        });
        
        // Draw potato kugels
        this.kugels.forEach(kugel => {
            if (!kugel.collected) {
                ctx.save();
                ctx.translate(kugel.x, kugel.y);
                
                // Kugel dish (oval brown shape)
                ctx.beginPath();
                ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#DAA520';
                ctx.fill();
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Crispy top texture
                ctx.beginPath();
                ctx.ellipse(0, -2, 14, 8, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#CD853F';
                ctx.fill();
                
                // Golden brown spots
                ctx.fillStyle = '#B8860B';
                ctx.beginPath();
                ctx.arc(-5, -3, 3, 0, Math.PI * 2);
                ctx.arc(4, -1, 2.5, 0, Math.PI * 2);
                ctx.arc(0, -4, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Potato emoji
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🥔', 0, -18);
                
                // Speed lines
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(20, -5);
                ctx.lineTo(28, -5);
                ctx.moveTo(20, 0);
                ctx.lineTo(30, 0);
                ctx.moveTo(20, 5);
                ctx.lineTo(28, 5);
                ctx.stroke();
                
                ctx.restore();
            }
        });
        
        // Draw matzah brei
        this.matzahBreis.forEach(brei => {
            if (!brei.collected) {
                ctx.save();
                ctx.translate(brei.x, brei.y);
                
                // Pan/plate
                ctx.beginPath();
                ctx.ellipse(0, 3, 20, 8, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#404040';
                ctx.fill();
                ctx.strokeStyle = '#606060';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Matzah brei (scrambled eggs with matzah)
                ctx.beginPath();
                ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#FFE066';
                ctx.fill();
                
                // Texture - matzah pieces
                ctx.fillStyle = '#D4A574';
                ctx.fillRect(-8, -4, 6, 4);
                ctx.fillRect(2, -2, 5, 3);
                ctx.fillRect(-4, 2, 4, 3);
                
                // Egg bits
                ctx.fillStyle = '#FFF8DC';
                ctx.beginPath();
                ctx.arc(-3, -1, 3, 0, Math.PI * 2);
                ctx.arc(5, 1, 2.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Rapid fire icon
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🍳', 0, -18);
                
                // Fire/speed lines
                ctx.strokeStyle = '#FF4500';
                ctx.lineWidth = 2;
                const flash = Math.sin(Date.now() / 80) > 0;
                if (flash) {
                    ctx.beginPath();
                    ctx.moveTo(-22, -3);
                    ctx.lineTo(-28, -3);
                    ctx.moveTo(-22, 3);
                    ctx.lineTo(-26, 3);
                    ctx.moveTo(22, -3);
                    ctx.lineTo(28, -3);
                    ctx.moveTo(22, 3);
                    ctx.lineTo(26, 3);
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        });
        
        // Draw bones (slow down the dog!)
        this.bones.forEach(bone => {
            if (!bone.collected) {
                ctx.save();
                ctx.translate(bone.x, bone.y);
                
                // Rotate animation
                const bobble = Math.sin(Date.now() / 200) * 0.15;
                ctx.rotate(bobble);
                
                // Bone shape
                ctx.fillStyle = '#F5F5DC'; // Beige bone color
                ctx.strokeStyle = '#D4C4A4';
                ctx.lineWidth = 2;
                
                // Main shaft
                ctx.fillRect(-15, -4, 30, 8);
                ctx.strokeRect(-15, -4, 30, 8);
                
                // Left knob
                ctx.beginPath();
                ctx.arc(-15, -6, 5, 0, Math.PI * 2);
                ctx.arc(-15, 6, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Right knob
                ctx.beginPath();
                ctx.arc(15, -6, 5, 0, Math.PI * 2);
                ctx.arc(15, 6, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Pulsing glow when available
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 10 + Math.sin(Date.now() / 100) * 5;
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                
                // Icon
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#000';
                ctx.fillText('🦴', 0, -18);
                
                ctx.restore();
            }
        });
        
        // Draw slow effect indicator on dog if slowed
        if (this.dogSlowTimer > 0) {
            ctx.save();
            ctx.translate(this.enemy.x + this.enemy.width/2, this.enemy.y - 15);
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#00BFFF';
            ctx.fillText(`🦴 SLOWED ${this.dogSlowTimer.toFixed(1)}s`, 0, 0);
            ctx.restore();
        }
        
        // Draw bullets (flying sticks!)
        this.playerBullets.forEach(bullet => {
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            bullet.rotation += 0.2;
            ctx.rotate(bullet.rotation);
            
            // Draw a stick/branch
            const size = bullet.size;
            
            // Main stick body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-size * 1.5, -3, size * 3, 6);
            
            // Wood grain lines
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-size, -1);
            ctx.lineTo(size, -1);
            ctx.moveTo(-size * 0.5, 1);
            ctx.lineTo(size * 0.8, 1);
            ctx.stroke();
            
            // Knots
            ctx.fillStyle = '#5D3A1A';
            ctx.beginPath();
            ctx.arc(-size * 0.5, 0, 2, 0, Math.PI * 2);
            ctx.arc(size * 0.7, 0, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Small branch stubs
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(size * 0.3, -5, 3, 4);
            ctx.fillRect(-size * 0.8, 2, 2, 3);
            
            ctx.restore();
        });
        
        // Enemy bullets (dog bones!)
        this.enemyBullets.forEach(bullet => {
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            bullet.rotation = (bullet.rotation || 0) + 0.15;
            ctx.rotate(bullet.rotation);
            
            // Dog bone shape
            ctx.fillStyle = '#F5DEB3';
            ctx.fillRect(-10, -3, 20, 6);
            ctx.beginPath();
            ctx.arc(-10, 0, 5, 0, Math.PI * 2);
            ctx.arc(10, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Draw hit effects (explosions, sparks)
        this.renderHitEffects(ctx);
        
        // Draw enemy tank
        this.renderTank(ctx, this.enemy, '🐕', '#8B4513');
        
        // Draw confusion indicator above dog
        if (this.enemy.confusedDuration > 0) {
            ctx.save();
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            // Spinning stars effect
            const stars = '💫🌀❓';
            const bounce = Math.sin(Date.now() / 100) * 5;
            ctx.strokeText(stars, this.enemy.x + this.enemy.width/2, this.enemy.y - 15 + bounce);
            ctx.fillText(stars, this.enemy.x + this.enemy.width/2, this.enemy.y - 15 + bounce);
            
            // "CONFUSED!" text
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#FF4444';
            ctx.strokeText('CONFUSED!', this.enemy.x + this.enemy.width/2, this.enemy.y - 35);
            ctx.fillText('CONFUSED!', this.enemy.x + this.enemy.width/2, this.enemy.y - 35);
            ctx.restore();
        }
        
        // Draw player tank
        this.renderTank(ctx, this.player, '🪵', '#228B22');
        
        // Draw speed modifier indicator above player
        if (this.player.speedModifierTimer > 0) {
            ctx.save();
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            const bounce = Math.sin(Date.now() / 100) * 3;
            
            if (this.player.speedModifier < 1) {
                // Slowed - wine effect
                ctx.fillStyle = '#8B0000';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.strokeText('🍷 SLOW!', this.player.x + this.player.width/2, this.player.y - 15 + bounce);
                ctx.fillText('🍷 SLOW!', this.player.x + this.player.width/2, this.player.y - 15 + bounce);
            } else {
                // Sped up - kugel effect
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.strokeText('🥔 FAST!', this.player.x + this.player.width/2, this.player.y - 15 + bounce);
                ctx.fillText('🥔 FAST!', this.player.x + this.player.width/2, this.player.y - 15 + bounce);
            }
            ctx.restore();
        }
        
        // Draw rapid fire indicator above player
        if (this.player.rapidFire) {
            ctx.save();
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            const bounce = Math.sin(Date.now() / 50) * 3; // Faster bounce for rapid fire
            const yOffset = this.player.speedModifierTimer > 0 ? -35 : -15; // Stack above speed indicator if both active
            
            ctx.fillStyle = '#FF4500';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.strokeText('🍳 RAPID!', this.player.x + this.player.width/2, this.player.y + yOffset + bounce);
            ctx.fillText('🍳 RAPID!', this.player.x + this.player.width/2, this.player.y + yOffset + bounce);
            ctx.restore();
        }
        
        // Draw HP bars
        // Player HP
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 570, 150, 20);
        ctx.fillStyle = 'red';
        ctx.fillRect(22, 572, 146, 16);
        ctx.fillStyle = 'lime';
        ctx.fillRect(22, 572, 146 * (this.player.hp / this.player.maxHp), 16);
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText('STICK', 25, 583);
        
        // Enemy HP
        ctx.fillStyle = '#333';
        ctx.fillRect(630, 570, 150, 20);
        ctx.fillStyle = 'red';
        ctx.fillRect(632, 572, 146, 16);
        ctx.fillStyle = 'lime';
        ctx.fillRect(632, 572, 146 * (this.enemy.hp / this.enemy.maxHp), 16);
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('DOG', 775, 583);
        
        // Round and score display
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(320, 55, 160, 35);
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(`Round ${this.currentRound} of 5`, 400, 72);
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#4CAF50';
        ctx.textAlign = 'right';
        ctx.fillText(this.playerWins.toString(), 385, 85);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('-', 400, 85);
        ctx.fillStyle = '#f44336';
        ctx.textAlign = 'left';
        ctx.fillText(this.enemyWins.toString(), 415, 85);
        
        // Between rounds overlay
        if (this.betweenRounds) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, 800, 600);
            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(`Round ${this.currentRound + 1} Starting...`, 400, 280);
            ctx.font = '24px Arial';
            ctx.fillText(`Score: 🪵 ${this.playerWins} - ${this.enemyWins} 🐕`, 400, 330);
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
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.textAlign = 'center';
        ctx.fillText('← → to rotate, ↑ ↓ to move, SPACE to fire', 400, 595);
    }
    
    renderTank(ctx, tank, emoji, color) {
        ctx.save();
        ctx.translate(tank.x + tank.width/2, tank.y + tank.height/2);
        ctx.rotate(tank.angle);
        
        // Tank body
        ctx.fillStyle = color;
        ctx.fillRect(-tank.width/2, -tank.height/2, tank.width, tank.height);
        
        // Tank barrel
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -5, tank.width/2 + 15, 10);
        
        // Emoji on top
        ctx.rotate(-tank.angle);
        ctx.font = '25px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 0, 0);
        
        ctx.restore();
    }
    
    // Full reset - back to round 1
    fullReset() {
        this.playerWins = 0;
        this.enemyWins = 0;
        this.currentRound = 1;
        this.roundOver = false;
        this.betweenRounds = false;
        this.complete = false;
        this.showMessage = false;
        this.initRound();
        this.displayMessage('🎯 Round 1 - FIGHT!');
    }
    
    // Alias for compatibility
    reset() {
        this.fullReset();
    }
}

window.Level4 = Level4;
