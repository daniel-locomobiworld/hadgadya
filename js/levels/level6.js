// Level 6: Water comes and quenches the Fire
// Chase fire, put out burning Seder items! Items move around!

class Level6 {
    constructor(engine, difficulty = 'normal') {
        this.engine = engine;
        this.difficulty = difficulty;
        this.name = "Quench the Fire";
        this.description = "You are the Water! The Seder plate items are moving around - save them from the fire!";
        this.instructions = "Arrow keys/WASD to move. Catch fire 3 times, then extinguish ALL burning items!";
        this.icon = "💧";
        
        // Difficulty settings
        this.difficultySettings = {
            easy: { fireSpeed: 130, objectSpeed: 0.7 },
            normal: { fireSpeed: 170, objectSpeed: 1.0 },
            hard: { fireSpeed: 200, objectSpeed: 1.3 },
            extreme: { fireSpeed: 240, objectSpeed: 1.6 }
        };
        this.settings = this.difficultySettings[difficulty] || this.difficultySettings.normal;
        
        // Player (Water)
        this.player = new TopDownPlayer(100, 500, '💧', 200);
        
        // Main fire (enemy to catch) - moves fast and spreads chaos!
        this.fire = {
            x: 700,
            y: 100,
            speed: this.settings.fireSpeed,
            emoji: '🔥',
            size: 55,  // Bigger fire for visibility!
            fleeTimer: 0,
            fleeDirection: { x: 0, y: 0 },
            pathfindTimer: 0,
            panicMode: false,
            dashTimer: 0,
            timesExtinguished: 0,
            rage: 0 // Gets angrier each time caught!
        };
        
        // Moving Seder plate items that fire can ignite!
        const speedMult = this.settings.objectSpeed;
        this.burnableObjects = [
            { x: 150, y: 180, vx: 60 * speedMult, vy: 40 * speedMult, emoji: '🥬', name: 'Maror', burning: false, burnTimer: 0, size: 28 },
            { x: 400, y: 120, vx: -50 * speedMult, vy: 55 * speedMult, emoji: '🥗', name: 'Chazeret', burning: false, burnTimer: 0, size: 28 },
            { x: 600, y: 280, vx: 45 * speedMult, vy: -60 * speedMult, emoji: '🍫', name: 'Charoset', burning: false, burnTimer: 0, size: 30 },
            { x: 250, y: 350, vx: -55 * speedMult, vy: -45 * speedMult, emoji: '🌿', name: 'Karpas', burning: false, burnTimer: 0, size: 26 },
            { x: 500, y: 450, vx: 70 * speedMult, vy: 30 * speedMult, emoji: '🍖', name: 'Zeroa', burning: false, burnTimer: 0, size: 32 },
            { x: 680, y: 150, vx: -40 * speedMult, vy: 65 * speedMult, emoji: '🥚', name: 'Beitzah', burning: false, burnTimer: 0, size: 26, isEgg: true },
            { x: 350, y: 520, vx: 55 * speedMult, vy: -50 * speedMult, emoji: '🫓', name: 'Matzah', burning: false, burnTimer: 0, size: 30 },
            { x: 120, y: 420, vx: -65 * speedMult, vy: 35 * speedMult, emoji: '🧂', name: 'Salt Water', burning: false, burnTimer: 0, size: 24 }
        ];
        
        // Walls (stationary, can catch fire)
        this.walls = [
            { x: 200, y: 100, width: 20, height: 150, burning: false, burnTimer: 0 },
            { x: 500, y: 200, width: 20, height: 180, burning: false, burnTimer: 0 },
            { x: 100, y: 320, width: 100, height: 20, burning: false, burnTimer: 0 },
            { x: 600, y: 380, width: 120, height: 20, burning: false, burnTimer: 0 }
        ];
        
        // Elijah appears randomly to help!
        this.elijah = null;
        this.elijahTimer = 15 + Math.random() * 10; // Appears after 15-25 seconds
        
        // Splash effects when extinguishing
        this.splashEffects = [];
        
        // Steam effects
        this.steamParticles = [];
        
        // No kids in this level - just seder plate objects!
        
        // Matzah powerups (also moving!)
        this.matzahPowerups = [
            new MatzahPowerup(300, 150),
            new MatzahPowerup(580, 500),
            new MatzahPowerup(100, 250)
        ];
        
        // Fire particles for visual effect
        this.fireParticles = [];
        
        // Score/combo system
        this.combo = 0;
        this.comboTimer = 0;
        this.score = 0;
        
        // Messages
        this.showMessage = false;
        this.messageText = '';
        this.messageTimer = 0;
        
        // Level state
        this.complete = false;
        this.firesCaught = 0;
        this.firesNeeded = 3;
    }
    
    update(dt) {
        if (this.complete) return;
        
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        
        // Update player
        const oldX = this.player.x;
        const oldY = this.player.y;
        this.player.update(dt, this.engine);
        
        // Wall collision for player
        for (let wall of this.walls) {
            if (this.rectCollision(this.player.x, this.player.y, 20, wall)) {
                this.player.x = oldX;
                this.player.y = oldY;
                break;
            }
        }
        
        // Seder item collision for player (push them!)
        for (let obj of this.burnableObjects) {
            const dx = this.player.x - obj.x;
            const dy = this.player.y - obj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 35 && !obj.burning) {
                // Push the item away!
                const pushForce = 150;
                obj.vx -= (dx / dist) * pushForce * dt * 10;
                obj.vy -= (dy / dist) * pushForce * dt * 10;
            }
        }
        
        // Keep player in bounds
        this.player.x = Math.max(25, Math.min(775, this.player.x));
        this.player.y = Math.max(75, Math.min(575, this.player.y));
        
        // Update moving Seder items!
        this.updateSederItems(dt);
        
        // Update fire AI (more aggressive movement!)
        this.updateFireAI(dt);
        
        // Fire lights objects on fire!
        this.updateFireSpread(dt);
        
        // Update burning objects
        this.updateBurningObjects(dt);
        
        // Update fire particles
        this.updateFireParticles(dt);
        
        // Update splash effects
        this.updateSplashEffects(dt);
        
        // Update steam particles
        this.updateSteamParticles(dt);
        
        // Update matzah powerups
        this.matzahPowerups.forEach(matzah => {
            matzah.update(dt);
            if (matzah.checkCollision(this.player.x, this.player.y, this.player.size)) {
                this.engine.addAwakeness(matzah.awakenessBoost);
                this.displayMessage('🫓 Matzah! +15 Awakeness!');
            }
        });
        
        // Check if player catches main fire
        const dx = this.player.x - this.fire.x;
        const dy = this.player.y - this.fire.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 40) {
            this.catchFire();
        }
        
        // Check if player extinguishes burning objects
        for (let obj of this.burnableObjects) {
            if (obj.burning) {
                const objDx = this.player.x - obj.x;
                const objDy = this.player.y - obj.y;
                const objDist = Math.sqrt(objDx * objDx + objDy * objDy);
                
                if (objDist < 40) {
                    obj.burning = false;
                    obj.burnTimer = 0;
                    
                    // Combo system!
                    this.combo++;
                    this.comboTimer = 3;
                    const comboBonus = this.combo > 1 ? ` COMBO x${this.combo}!` : '';
                    this.displayMessage(`💧 Saved the ${obj.name}!${comboBonus}`);
                    this.engine.screenShake();
                    
                    // Create splash and steam effects
                    this.createSplashEffect(obj.x, obj.y);
                    this.createSteamEffect(obj.x, obj.y);
                    
                    // Splash/sizzle sound
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('splash');
                        // Also play a sizzle/steam sound
                        setTimeout(() => {
                            if (window.audioManager) {
                                window.audioManager.playSynthSound('fire');
                            }
                        }, 100);
                    }
                    
                    // Bonus awakeness for combos
                    if (this.combo >= 3) {
                        this.engine.addAwakeness(5);
                    }
                }
            }
        }
        
        // Check if player extinguishes burning walls
        for (let wall of this.walls) {
            if (wall.burning) {
                // Check if player is touching the wall
                const wallCenterX = wall.x + wall.width / 2;
                const wallCenterY = wall.y + wall.height / 2;
                const wallDx = this.player.x - wallCenterX;
                const wallDy = this.player.y - wallCenterY;
                const wallDist = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
                
                // Larger range for walls since they're bigger
                if (wallDist < 50 || this.rectCollision(this.player.x, this.player.y, 25, wall)) {
                    wall.burning = false;
                    wall.burnTimer = 0;
                    this.displayMessage('💧 Extinguished the burning wall!');
                    this.engine.screenShake();
                    
                    // Create splash and steam effects
                    this.createSplashEffect(wall.x + wall.width/2, wall.y + wall.height/2);
                    this.createSteamEffect(wall.x + wall.width/2, wall.y + wall.height/2);
                    
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('splash');
                    }
                }
            }
        }
        
        // Check win condition: caught fire 3 times AND no burning objects/walls
        this.checkWinCondition();
        
        // Update message timer
        if (this.showMessage) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                this.showMessage = false;
            }
        }
    }
    
    catchFire() {
        this.firesCaught++;
        this.fire.timesExtinguished++;
        this.engine.screenShake();
        
        // Splash sound!
        if (window.audioManager) {
            window.audioManager.playSynthSound('splash');
        }
        
        // Cap display at 3/3 and change message
        const displayCaught = Math.min(this.firesCaught, this.firesNeeded);
        
        if (this.firesCaught >= this.firesNeeded) {
            this.displayMessage(`💧 ${displayCaught}/${this.firesNeeded} fire put out! Now put out all burning items!`);
        } else {
            this.displayMessage(`💧 Fire put out! (${displayCaught}/${this.firesNeeded})`);
        }
        
        // Visual effects!
        this.createSplashEffect(this.fire.x, this.fire.y);
        this.createSteamEffect(this.fire.x, this.fire.y);
        
        // Reshuffle the walls each time fire is caught!
        this.reshuffleWalls();
        
        // Respawn fire farther away and make it faster!
        this.respawnFire();
        this.fire.speed = Math.min(220, this.fire.speed + 15);
    }
    
    reshuffleWalls() {
        // Create new random wall layout each time fire is caught!
        const wallConfigs = [
            // Horizontal walls
            { width: 80 + Math.random() * 60, height: 20 },
            { width: 100 + Math.random() * 40, height: 20 },
            // Vertical walls  
            { width: 20, height: 100 + Math.random() * 80 },
            { width: 20, height: 120 + Math.random() * 60 }
        ];
        
        this.walls = wallConfigs.map(config => {
            // Random position avoiding edges and player spawn
            let x, y, attempts = 0;
            do {
                x = 80 + Math.random() * 600;
                y = 100 + Math.random() * 400;
                attempts++;
            } while (
                attempts < 20 && 
                (Math.abs(x - this.player.x) < 100 && Math.abs(y - this.player.y) < 100)
            );
            
            return {
                x: x,
                y: y,
                width: config.width,
                height: config.height,
                burning: false,
                burnTimer: 0
            };
        });
        
        this.displayMessage('🧱 The walls shifted!');
    }
    
    checkWinCondition() {
        if (this.firesCaught >= this.firesNeeded) {
            // Check if any objects or walls are still burning
            const burningObjects = this.burnableObjects.filter(obj => obj.burning);
            const burningWalls = this.walls.filter(wall => wall.burning);
            
            if (burningObjects.length === 0 && burningWalls.length === 0) {
                this.complete = true;
                this.displayMessage('🎉 Water quenched all the fires!');
                setTimeout(() => {
                    if (this.engine.onLevelComplete) {
                        this.engine.onLevelComplete();
                    }
                }, 2000);
            }
        }
    }
    
    updateFireAI(dt) {
        const dx = this.fire.x - this.player.x;
        const dy = this.fire.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Smart AI state machine
        this.fire.thinkTimer = (this.fire.thinkTimer || 0) - dt;
        this.fire.wanderTimer = (this.fire.wanderTimer || 0) - dt;
        
        // Calculate threat level
        const threatLevel = Math.max(0, 1 - distance / 300);
        this.fire.panicMode = distance < 150;
        
        // WANDERING MODE - when player is far, fire roams around causing chaos!
        if (distance > 250 && !this.fire.panicMode) {
            this.fire.isWandering = true;
            if (this.fire.wanderTimer <= 0) {
                this.fire.wanderTimer = 0.8 + Math.random() * 1.2;
                // Pick a random direction, but prefer moving towards unburned objects
                let targetX = 100 + Math.random() * 600;
                let targetY = 100 + Math.random() * 400;
                
                // 60% chance to move towards an unburned object
                const unburned = this.burnableObjects.filter(o => !o.burning);
                if (unburned.length > 0 && Math.random() < 0.6) {
                    const target = unburned[Math.floor(Math.random() * unburned.length)];
                    targetX = target.x;
                    targetY = target.y;
                }
                
                const wanderDx = targetX - this.fire.x;
                const wanderDy = targetY - this.fire.y;
                const wanderDist = Math.sqrt(wanderDx * wanderDx + wanderDy * wanderDy);
                if (wanderDist > 0) {
                    this.fire.fleeDirection.x = wanderDx / wanderDist;
                    this.fire.fleeDirection.y = wanderDy / wanderDist;
                }
            }
        } else {
            this.fire.isWandering = false;
        }
        
        // Dash cooldown
        this.fire.dashTimer -= dt;
        this.fire.dashCooldown = (this.fire.dashCooldown || 0) - dt;
        
        // Emergency dash when player gets too close
        if (distance < 100 && this.fire.dashCooldown <= 0) {
            this.fire.isDashing = true;
            this.fire.dashTimer = 0.4;
            this.fire.dashCooldown = 2.0;
            // Dash perpendicular or away - pick best escape route
            const escapeAngle = this.findBestEscapeAngle();
            this.fire.fleeDirection.x = Math.cos(escapeAngle);
            this.fire.fleeDirection.y = Math.sin(escapeAngle);
        }
        
        // Update dash state
        if (this.fire.dashTimer <= 0) {
            this.fire.isDashing = false;
        }
        
        // Recalculate escape direction periodically
        if (this.fire.thinkTimer <= 0 && !this.fire.isDashing) {
            this.fire.thinkTimer = this.fire.panicMode ? 0.1 : 0.3;
            
            // Find the best escape direction
            const escapeAngle = this.findBestEscapeAngle();
            
            // Add some randomness based on distance
            const randomness = this.fire.panicMode ? 0.3 : 0.6;
            const finalAngle = escapeAngle + (Math.random() - 0.5) * randomness;
            
            this.fire.fleeDirection.x = Math.cos(finalAngle);
            this.fire.fleeDirection.y = Math.sin(finalAngle);
        }
        
        // Calculate speed
        let currentSpeed = this.fire.speed;
        if (this.fire.isDashing) {
            currentSpeed *= 2.5; // Dash is very fast
        } else if (this.fire.panicMode) {
            currentSpeed *= 1.5;
        }
        
        // Elijah slows the fire!
        if (this.fire.elijahSlowed) {
            currentSpeed *= 0.4;
        }
        
        // Move fire
        let newX = this.fire.x + this.fire.fleeDirection.x * currentSpeed * dt;
        let newY = this.fire.y + this.fire.fleeDirection.y * currentSpeed * dt;
        
        // Wall collision - fire cannot pass through but sets them on fire!
        let blocked = false;
        for (let wall of this.walls) {
            if (this.rectCollision(newX, newY, 15, wall)) {
                blocked = true;
                // Set wall on fire!
                if (!wall.burning) {
                    wall.burning = true;
                    wall.burnTimer = 0;
                    this.displayMessage('🔥 A wall caught fire!');
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('fire');
                    }
                }
                // Try to slide along wall
                if (!this.rectCollision(this.fire.x, newY, 15, wall)) {
                    newX = this.fire.x;
                    blocked = false;
                } else if (!this.rectCollision(newX, this.fire.y, 15, wall)) {
                    newY = this.fire.y;
                    blocked = false;
                } else {
                    // Completely blocked - find new direction
                    this.fire.thinkTimer = 0;
                }
                break;
            }
        }
        
        if (!blocked) {
            // Boundary check with smarter bouncing
            if (newX < 30 || newX > 770) {
                this.fire.fleeDirection.x = -this.fire.fleeDirection.x;
                newX = Math.max(30, Math.min(770, newX));
                this.fire.thinkTimer = 0;
            }
            if (newY < 80 || newY > 570) {
                this.fire.fleeDirection.y = -this.fire.fleeDirection.y;
                newY = Math.max(80, Math.min(570, newY));
                this.fire.thinkTimer = 0;
            }
            this.fire.x = newX;
            this.fire.y = newY;
        }
        
        // Spawn fire particles (more when dashing)
        const particleChance = this.fire.isDashing ? 0.6 : 0.3;
        if (Math.random() < particleChance) {
            this.fireParticles.push({
                x: this.fire.x + (Math.random() - 0.5) * 20,
                y: this.fire.y + (Math.random() - 0.5) * 20,
                vy: -50 - Math.random() * 30,
                life: 0.5 + Math.random() * 0.3,
                size: 8 + Math.random() * 8
            });
        }
    }
    
    findBestEscapeAngle() {
        const playerAngle = Math.atan2(this.player.y - this.fire.y, this.player.x - this.fire.x);
        const awayAngle = playerAngle + Math.PI; // Direct opposite
        
        // Test several escape angles and pick the best one
        const testAngles = [
            awayAngle,
            awayAngle + Math.PI / 4,
            awayAngle - Math.PI / 4,
            awayAngle + Math.PI / 2,
            awayAngle - Math.PI / 2,
            awayAngle + Math.PI * 3 / 4,
            awayAngle - Math.PI * 3 / 4
        ];
        
        let bestAngle = awayAngle;
        let bestScore = -Infinity;
        
        for (const angle of testAngles) {
            const testDist = 80;
            const testX = this.fire.x + Math.cos(angle) * testDist;
            const testY = this.fire.y + Math.sin(angle) * testDist;
            
            // Score based on: distance from player, not hitting walls, staying in bounds
            let score = 0;
            
            // Distance from player after move (higher is better)
            const newDistToPlayer = Math.sqrt(
                Math.pow(testX - this.player.x, 2) + 
                Math.pow(testY - this.player.y, 2)
            );
            score += newDistToPlayer * 2;
            
            // Penalty for walls
            let hitsWall = false;
            for (const wall of this.walls) {
                if (this.rectCollision(testX, testY, 15, wall)) {
                    hitsWall = true;
                    break;
                }
            }
            if (hitsWall) score -= 200;
            
            // Penalty for going out of bounds
            if (testX < 50 || testX > 750 || testY < 100 || testY > 550) {
                score -= 150;
            }
            
            // PENALTY for corners - fire should run around, not hide!
            const distFromCenterX = Math.abs(testX - 400);
            const distFromCenterY = Math.abs(testY - 325);
            if (distFromCenterX > 300 || distFromCenterY > 200) {
                score -= 150; // Heavy penalty for corners/edges
            }
            
            // Bonus for being in the middle area - fire should run around!
            if (distFromCenterX < 200 && distFromCenterY < 150) {
                score += 50;
            }
            
            // Bonus for moving towards burnable objects (fire wants to spread!)
            for (const obj of this.burnableObjects) {
                if (!obj.burning) {
                    const objDist = Math.sqrt(Math.pow(testX - obj.x, 2) + Math.pow(testY - obj.y, 2));
                    if (objDist < 100) {
                        score += 30; // Fire is attracted to things it can burn!
                    }
                }
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestAngle = angle;
            }
        }
        
        return bestAngle;
    }
    
    updateFireSpread(dt) {
        // Fire lights nearby burnable objects on fire - larger range!
        for (let obj of this.burnableObjects) {
            if (!obj.burning) {
                const dx = this.fire.x - obj.x;
                const dy = this.fire.y - obj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Larger ignition range!
                if (dist < 60) {
                    obj.burning = true;
                    obj.burnTimer = 0;
                    this.displayMessage(`🔥 The ${obj.name} caught fire!`);
                    
                    // Fire crackle sound
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('fire');
                    }
                }
            }
        }
        
        // Fire also ignites nearby walls!
        for (let wall of this.walls) {
            if (!wall.burning) {
                const wallCenterX = wall.x + wall.width / 2;
                const wallCenterY = wall.y + wall.height / 2;
                const dx = this.fire.x - wallCenterX;
                const dy = this.fire.y - wallCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Check if fire is near the wall
                if (dist < 50 || this.rectCollision(this.fire.x, this.fire.y, 30, wall)) {
                    wall.burning = true;
                    wall.burnTimer = 0;
                    this.displayMessage('🔥 A wall caught fire!');
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('fire');
                    }
                }
            }
        }
    }
    
    // NEW: Update moving Seder items
    updateSederItems(dt) {
        for (let obj of this.burnableObjects) {
            // Move the item
            obj.x += obj.vx * dt;
            obj.y += obj.vy * dt;
            
            // Bounce off screen edges
            const margin = 30;
            if (obj.x < margin) {
                obj.x = margin;
                obj.vx = Math.abs(obj.vx);
            }
            if (obj.x > 770) {
                obj.x = 770;
                obj.vx = -Math.abs(obj.vx);
            }
            if (obj.y < 80) {
                obj.y = 80;
                obj.vy = Math.abs(obj.vy);
            }
            if (obj.y > 570) {
                obj.y = 570;
                obj.vy = -Math.abs(obj.vy);
            }
            
            // Bounce off walls
            for (let wall of this.walls) {
                if (this.rectCollision(obj.x, obj.y, obj.size / 2, wall)) {
                    // Push out and reverse velocity
                    const wallCenterX = wall.x + wall.width / 2;
                    const wallCenterY = wall.y + wall.height / 2;
                    const dx = obj.x - wallCenterX;
                    const dy = obj.y - wallCenterY;
                    
                    if (Math.abs(dx) > Math.abs(dy)) {
                        obj.vx = -obj.vx;
                        obj.x += obj.vx * dt * 2;
                    } else {
                        obj.vy = -obj.vy;
                        obj.y += obj.vy * dt * 2;
                    }
                }
            }
            
            // Items bounce off each other!
            for (let other of this.burnableObjects) {
                if (other === obj) continue;
                const dx = obj.x - other.x;
                const dy = obj.y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = (obj.size + other.size) / 2 + 5;
                
                if (dist < minDist && dist > 0) {
                    // Elastic collision!
                    const nx = dx / dist;
                    const ny = dy / dist;
                    
                    // Separate them
                    const overlap = (minDist - dist) / 2;
                    obj.x += nx * overlap;
                    obj.y += ny * overlap;
                    other.x -= nx * overlap;
                    other.y -= ny * overlap;
                    
                    // Exchange velocities along collision normal
                    const dvx = obj.vx - other.vx;
                    const dvy = obj.vy - other.vy;
                    const dvn = dvx * nx + dvy * ny;
                    
                    obj.vx -= dvn * nx * 0.9;
                    obj.vy -= dvn * ny * 0.9;
                    other.vx += dvn * nx * 0.9;
                    other.vy += dvn * ny * 0.9;
                }
            }
            
            // Add some random wobble when burning
            if (obj.burning) {
                obj.vx += (Math.random() - 0.5) * 200 * dt;
                obj.vy += (Math.random() - 0.5) * 200 * dt;
            }
            
            // Cap speed
            const speed = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy);
            const maxSpeed = 120;
            if (speed > maxSpeed) {
                obj.vx = (obj.vx / speed) * maxSpeed;
                obj.vy = (obj.vy / speed) * maxSpeed;
            }
            
            // Egg bounces more energetically!
            if (obj.isEgg) {
                obj.vx *= 1.001;
                obj.vy *= 1.001;
            }
        }
    }
    
    // NEW: Elijah helper - appears and freezes fire temporarily!
    updateElijah(dt) {
        this.elijahTimer -= dt;
        
        // Spawn Elijah
        if (!this.elijah && this.elijahTimer <= 0) {
            this.elijah = {
                x: 400,
                y: 100,
                emoji: '🧙‍♂️',
                activeTime: 5,
                freezeFire: true
            };
            this.displayMessage('🧙‍♂️ Elijah appears to help! Fire is slowed!');
            if (window.audioManager) {
                window.audioManager.playSynthSound('collect');
            }
        }
        
        // Update active Elijah
        if (this.elijah) {
            this.elijah.activeTime -= dt;
            
            // Slow down fire while Elijah is present
            this.fire.elijahSlowed = true;
            
            if (this.elijah.activeTime <= 0) {
                this.elijah = null;
                this.fire.elijahSlowed = false;
                this.elijahTimer = 20 + Math.random() * 15; // Respawn timer
            }
        } else {
            this.fire.elijahSlowed = false;
        }
    }
    
    // NEW: Splash effects when extinguishing
    createSplashEffect(x, y) {
        const colors = ['#00bfff', '#87ceeb', '#4169e1', '#1e90ff'];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
            const speed = 80 + Math.random() * 60;
            this.splashEffects.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.6 + Math.random() * 0.3,
                maxLife: 0.6 + Math.random() * 0.3,
                size: 4 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }
    
    updateSplashEffects(dt) {
        for (let i = this.splashEffects.length - 1; i >= 0; i--) {
            const splash = this.splashEffects[i];
            splash.x += splash.vx * dt;
            splash.y += splash.vy * dt;
            splash.vy += 150 * dt; // Gravity
            splash.life -= dt;
            
            if (splash.life <= 0) {
                this.splashEffects.splice(i, 1);
            }
        }
    }
    
    // NEW: Steam particles when water meets fire
    createSteamEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            this.steamParticles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                vx: (Math.random() - 0.5) * 30,
                vy: -40 - Math.random() * 30,
                life: 0.8 + Math.random() * 0.4,
                maxLife: 0.8 + Math.random() * 0.4,
                size: 8 + Math.random() * 8
            });
        }
    }
    
    updateSteamParticles(dt) {
        for (let i = this.steamParticles.length - 1; i >= 0; i--) {
            const steam = this.steamParticles[i];
            steam.x += steam.vx * dt;
            steam.y += steam.vy * dt;
            steam.vy -= 20 * dt; // Float up faster
            steam.vx += (Math.random() - 0.5) * 50 * dt; // Drift
            steam.size += 10 * dt; // Expand
            steam.life -= dt;
            
            if (steam.life <= 0) {
                this.steamParticles.splice(i, 1);
            }
        }
    }

    updateBurningObjects(dt) {
        // Update burning objects
        for (let obj of this.burnableObjects) {
            if (obj.burning) {
                obj.burnTimer += dt;
                
                // Spawn fire particles on burning objects
                if (Math.random() < 0.2) {
                    this.fireParticles.push({
                        x: obj.x + (Math.random() - 0.5) * 30,
                        y: obj.y + (Math.random() - 0.5) * 30,
                        vy: -40 - Math.random() * 20,
                        life: 0.4 + Math.random() * 0.2,
                        size: 6 + Math.random() * 6
                    });
                }
            }
        }
        
        // Update burning walls
        for (let wall of this.walls) {
            if (wall.burning) {
                wall.burnTimer += dt;
                
                // Spawn fire particles along the wall
                if (Math.random() < 0.3) {
                    this.fireParticles.push({
                        x: wall.x + Math.random() * wall.width,
                        y: wall.y + Math.random() * wall.height,
                        vy: -40 - Math.random() * 20,
                        life: 0.4 + Math.random() * 0.2,
                        size: 6 + Math.random() * 6
                    });
                }
            }
        }
    }
    
    initKids() {
        // Create 3 little water droplet kids that help block the fire
        const kidEmojis = ['👦', '👧', '🧒'];
        this.kids = kidEmojis.map((emoji, i) => ({
            x: 200 + i * 200,
            y: 300 + (i % 2) * 100,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            emoji: emoji,
            size: 28,
            changeTimer: 1 + Math.random() * 2
        }));
    }
    
    updateKids(dt) {
        for (let kid of this.kids) {
            kid.changeTimer -= dt;
            kid.walkTimer = (kid.walkTimer || 0) - dt;
            
            // Kids actively walk around the play area!
            if (kid.changeTimer <= 0) {
                // Pick a random destination to walk to
                kid.targetX = 80 + Math.random() * 640;
                kid.targetY = 100 + Math.random() * 440;
                kid.changeTimer = 2 + Math.random() * 3;
            }
            
            // Walk towards target destination
            if (kid.targetX && kid.targetY) {
                const toDx = kid.targetX - kid.x;
                const toDy = kid.targetY - kid.y;
                const toDist = Math.sqrt(toDx * toDx + toDy * toDy);
                
                if (toDist > 20) {
                    // Walk towards destination
                    const walkSpeed = 100 + Math.random() * 50;
                    kid.vx = (toDx / toDist) * walkSpeed;
                    kid.vy = (toDy / toDist) * walkSpeed;
                } else {
                    // Reached destination, slow down and pick new one soon
                    kid.vx *= 0.9;
                    kid.vy *= 0.9;
                    kid.changeTimer = Math.min(kid.changeTimer, 0.5);
                }
            }
            
            // Also move towards fire if it's close (to block it)
            const dx = this.fire.x - kid.x;
            const dy = this.fire.y - kid.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 180 && dist > 40) {
                // Chase the fire to block it - override walking!
                kid.vx = (dx / dist) * 120;
                kid.vy = (dy / dist) * 120;
            }
            
            // Apply velocity
            let newX = kid.x + kid.vx * dt;
            let newY = kid.y + kid.vy * dt;
            
            // Wall collision
            let blocked = false;
            for (let wall of this.walls) {
                if (this.rectCollision(newX, newY, 15, wall)) {
                    blocked = true;
                    kid.vx = -kid.vx;
                    kid.vy = -kid.vy;
                    break;
                }
            }
            
            if (!blocked) {
                kid.x = Math.max(30, Math.min(770, newX));
                kid.y = Math.max(80, Math.min(570, newY));
            }
            
            // Boundary bounce
            if (kid.x <= 30 || kid.x >= 770) kid.vx = -kid.vx;
            if (kid.y <= 80 || kid.y >= 570) kid.vy = -kid.vy;
        }
    }
    
    updateFireParticles(dt) {
        this.fireParticles = this.fireParticles.filter(p => {
            p.y += p.vy * dt;
            p.life -= dt;
            return p.life > 0;
        });
    }
    
    rectCollision(x, y, radius, rect) {
        return x + radius > rect.x && x - radius < rect.x + rect.width &&
               y + radius > rect.y && y - radius < rect.y + rect.height;
    }
    
    respawnFire() {
        let attempts = 0;
        let bestX = 400, bestY = 300;
        let bestDist = 0;
        
        while (attempts < 30) {
            const testX = Math.random() * 700 + 50;
            const testY = Math.random() * 450 + 80;
            
            const dist = Math.sqrt(Math.pow(testX - this.player.x, 2) + Math.pow(testY - this.player.y, 2));
            
            // Check not in wall
            let inWall = false;
            for (let wall of this.walls) {
                if (this.rectCollision(testX, testY, 20, wall)) {
                    inWall = true;
                    break;
                }
            }
            
            if (!inWall && dist > bestDist) {
                bestDist = dist;
                bestX = testX;
                bestY = testY;
            }
            
            attempts++;
        }
        
        this.fire.x = bestX;
        this.fire.y = bestY;
    }
    
    displayMessage(text) {
        this.messageText = text;
        this.showMessage = true;
        this.messageTimer = 2;
    }
    
    render(ctx) {
        // Dungeon floor
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, 0, 800, 600);
        
        // Floor pattern
        ctx.fillStyle = '#2d2d2d';
        for (let x = 0; x < 800; x += 40) {
            for (let y = 50; y < 600; y += 40) {
                if ((x/40 + y/40) % 2 === 0) {
                    ctx.fillRect(x, y, 40, 40);
                }
            }
        }
        
        // Draw walls
        this.walls.forEach(wall => {
            ctx.save();
            
            if (wall.burning) {
                // Burning wall effect
                const burnIntensity = Math.min(wall.burnTimer * 0.5, 1);
                ctx.shadowColor = '#ff4400';
                ctx.shadowBlur = 15 + Math.sin(wall.burnTimer * 10) * 8;
                
                // Gradient from brown to charred black based on burn time
                const charAmount = Math.min(wall.burnTimer * 0.2, 0.7);
                const r = Math.floor(101 * (1 - charAmount) + 30 * charAmount);
                const g = Math.floor(67 * (1 - charAmount) + 20 * charAmount);
                const b = Math.floor(33 * (1 - charAmount) + 15 * charAmount);
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                
                // Wobbling flames on top
                ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
                
                // Draw flame emojis along the wall
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const flameCount = Math.floor(wall.width / 25) || 1;
                for (let i = 0; i < flameCount; i++) {
                    const fx = wall.x + (i + 0.5) * (wall.width / flameCount);
                    const fy = wall.y - 5 + Math.sin(wall.burnTimer * 10 + i) * 3;
                    ctx.fillText('🔥', fx, fy);
                }
            } else {
                ctx.fillStyle = '#654321';
                ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            }
            
            ctx.strokeStyle = '#4a3015';
            ctx.lineWidth = 2;
            ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
            ctx.restore();
        });
        
        // Draw burnable objects (Seder items)
        for (let obj of this.burnableObjects) {
            ctx.save();
            ctx.font = `${obj.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Calculate speed for motion effects
            const speed = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy);
            
            if (obj.burning) {
                // Burning effect - red glow and wobble
                ctx.shadowColor = '#ff4400';
                ctx.shadowBlur = 20 + Math.sin(obj.burnTimer * 10) * 10;
                const wobble = Math.sin(obj.burnTimer * 15) * 3;
                ctx.fillText(obj.emoji, obj.x + wobble, obj.y);
                
                // Fire emoji on top
                ctx.font = '20px Arial';
                ctx.fillText('🔥', obj.x, obj.y - 20);
            } else {
                // Motion blur/trail for fast moving objects
                if (speed > 50) {
                    ctx.globalAlpha = 0.3;
                    ctx.fillText(obj.emoji, obj.x - obj.vx * 0.03, obj.y - obj.vy * 0.03);
                    ctx.globalAlpha = 0.5;
                    ctx.fillText(obj.emoji, obj.x - obj.vx * 0.015, obj.y - obj.vy * 0.015);
                    ctx.globalAlpha = 1;
                }
                
                // Subtle glow for moving items
                if (speed > 30) {
                    ctx.shadowColor = '#4fc3f7';
                    ctx.shadowBlur = 8 + speed * 0.05;
                }
                
                ctx.fillText(obj.emoji, obj.x, obj.y);
                
                // Name label below
                ctx.font = '10px Arial';
                ctx.fillStyle = '#888';
                ctx.fillText(obj.name, obj.x, obj.y + obj.size / 2 + 10);
            }
            ctx.restore();
        }
        
        // Draw fire particles
        for (let p of this.fireParticles) {
            const alpha = p.life * 2;
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            gradient.addColorStop(0, `rgba(255, 200, 50, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.7})`);
            gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw splash effects
        for (let splash of this.splashEffects) {
            const alpha = splash.life / splash.maxLife;
            ctx.fillStyle = splash.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(splash.x, splash.y, splash.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        // Draw steam particles
        for (let steam of this.steamParticles) {
            const alpha = (steam.life / steam.maxLife) * 0.6;
            ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
            ctx.beginPath();
            ctx.arc(steam.x, steam.y, steam.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw matzah powerups
        this.matzahPowerups.forEach(matzah => matzah.render(ctx));
        
        // Draw main fire - larger with pulsing glow like water drop
        ctx.save();
        const fireWobble = Math.sin(Date.now() * 0.01) * 4;
        const firePulse = Math.sin(Date.now() * 0.008) * 5;
        const bobY = Math.sin(Date.now() * 0.005) * 6;
        
        // Outer glow
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 40 + firePulse;
        ctx.font = `${this.fire.size + firePulse}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.fire.emoji, this.fire.x + fireWobble, this.fire.y + bobY);
        
        // Inner glow layer
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 20;
        ctx.fillText(this.fire.emoji, this.fire.x + fireWobble, this.fire.y + bobY);
        
        // Sparkle effect
        if (Math.floor(Date.now() / 200) % 2 === 0) {
            ctx.font = '16px Arial';
            ctx.fillText('✨', this.fire.x + 25, this.fire.y - 20 + bobY);
        }
        
        // Exclamation when panicking
        if (this.fire.panicMode) {
            ctx.font = '22px Arial';
            ctx.fillText('😱', this.fire.x, this.fire.y - 40 + bobY);
        }
        ctx.restore();
        
        // Draw player
        this.player.render(ctx);
        
        // HUD - Progress
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 55, 200, 50);
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        const displayCaught = Math.min(this.firesCaught, this.firesNeeded);
        ctx.fillText(`💧 Fire put out: ${displayCaught}/${this.firesNeeded}`, 20, 75);
        
        // Count burning objects
        const burningCount = this.burnableObjects.filter(obj => obj.burning).length;
        ctx.fillStyle = burningCount > 0 ? '#ff6b6b' : '#6bff6b';
        ctx.fillText(`🧯 Burning: ${burningCount}`, 20, 95);
        
        // Combo display
        if (this.combo > 1) {
            ctx.save();
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#ffeb3b';
            ctx.textAlign = 'right';
            ctx.shadowColor = '#ff9800';
            ctx.shadowBlur = 10;
            ctx.fillText(`COMBO x${this.combo}!`, 780, 85);
            ctx.restore();
        }
        
        // Draw message
        if (this.showMessage) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(150, 520, 500, 50);
            ctx.font = '18px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(this.messageText, 400, 550);
        }
    }
    
    reset() {
        this.player = new TopDownPlayer(100, 500, '💧', 180);
        this.fire = {
            x: 700,
            y: 100,
            speed: 160,
            emoji: '🔥',
            size: 55,
            fleeTimer: 0,
            fleeDirection: { x: 0, y: 0 },
            pathfindTimer: 0,
            panicMode: false,
            dashTimer: 0,
            timesExtinguished: 0
        };
        this.burnableObjects.forEach(obj => {
            obj.burning = false;
            obj.burnTimer = 0;
        });
        this.matzahPowerups = [
            new MatzahPowerup(300, 150),
            new MatzahPowerup(580, 500),
            new MatzahPowerup(100, 250)
        ];
        this.fireParticles = [];
        this.splashEffects = [];
        this.steamParticles = [];
        this.firesCaught = 0;
        this.complete = false;
        this.showMessage = false;
    }
}

window.Level6 = Level6;
