// Level 9: The Angel of Death comes and kills the Butcher
// 2D Racing Cart Game with WINDING ROAD

class Level9 {
    constructor(engine) {
        this.engine = engine;
        this.name = "Death Race";
        this.description = "You are the Angel of Death! Chase down the fleeing Butcher on the winding road!";
        this.instructions = "← → to steer, ↑ to accelerate! Go FAST to catch the Butcher!";
        this.icon = "💀";
        
        // Track - now winding!
        this.trackWidth = 280;
        this.trackCenterX = 400;
        this.trackCurve = 0; // Current curve offset
        this.trackCurveTarget = 0;
        this.trackCurveSpeed = 0;
        
        // Player (Angel of Death)
        this.player = {
            x: 400,
            y: 450,
            width: 40,
            height: 60,
            speed: 100,  // Start with some speed
            maxSpeed: 400,  // Base max speed - NOT enough to catch butcher alone!
            acceleration: 250,  // Good acceleration
            deceleration: 120,  // Moderate deceleration
            steerSpeed: 250,
            emoji: '💀',
            spinning: false,
            spinTimer: 0,
            spinAngle: 0,
            cleanDriveTime: 0,  // Time driving without hitting anything
            speedBonus: 0,      // Bonus speed from clean driving
            boostCount: 0       // Track how many boosts collected
        };
        
        // Enemy (Butcher) - tries to escape!
        this.enemy = {
            x: 400,
            y: 200,
            width: 40,
            height: 60,
            speed: 200, // Fast base speed - faster than player's base max!
            maxSpeed: 260,
            emoji: '🧑‍🍳',
            wobble: 0,
            panic: 0 // Gets faster when you get close!
        };
        
        // Track segments (scrolling)
        this.scrollSpeed = 0;
        this.scrollPosition = 0;
        
        // Distance tracking - THE KEY TO WINNING
        this.distanceToEnemy = 280; // Start far from butcher
        this.catchProgress = 0; // 0-100, reach 100 to catch!
        
        // Obstacles on track
        this.obstacles = [];
        this.obstacleSpawnTimer = 0;
        
        // Boost pickups
        this.boosts = [];
        
        // WINE SPILLS - Butcher drops wine to make you spin out!
        this.wineSpills = [];
        this.wineSpillTimer = 2; // First spill after 2 seconds
        
        // Matzah powerups (for awakeness)
        this.matzahPowerups = [];
        
        // Star of David powerups (invincibility!)
        this.starPowerups = [];
        this.invincibleTimer = 0; // Invincibility duration remaining
        
        // Incoming powerup warnings (flash at top before appearing)
        this.incomingWarnings = [];
        
        // Track decorations (scrolling)
        this.decorations = [];
        this.generateDecorations();
        
        // Road curve segments for rendering
        this.roadSegments = [];
        for (let i = 0; i < 20; i++) {
            this.roadSegments.push({ curve: 0, y: i * 35 });
        }
        
        // Level state
        this.complete = false;
        this.showMessage = false;
        this.messageText = '';
        this.messageTimer = 0;
        this.gameTime = 0;
        
        this.displayMessage('🏁 GO FAST! Catch the Butcher before he escapes!');
    }
    
    generateDecorations() {
        for (let i = 0; i < 30; i++) {
            const side = Math.random() > 0.5 ? 1 : -1; // 1 = right side, -1 = left side
            this.decorations.push({
                side: side, // Which side of the road
                offsetFromRoad: 30 + Math.random() * 100, // Distance from road edge
                y: Math.random() * 800,
                emoji: ['🌲', '🌳', '🪨', '🏠', '⛪', '🕍'][Math.floor(Math.random() * 6)],
                size: 25 + Math.random() * 15
            });
        }
    }
    
    update(dt) {
        if (this.complete) return;
        
        this.gameTime += dt;
        
        // Update winding road curve
        this.trackCurveSpeed += (Math.random() - 0.5) * dt * 100;
        this.trackCurveSpeed = Math.max(-80, Math.min(80, this.trackCurveSpeed));
        this.trackCurve += this.trackCurveSpeed * dt;
        this.trackCurve = Math.max(-120, Math.min(120, this.trackCurve));
        
        // Occasionally change curve direction more dramatically
        if (Math.random() < dt * 0.5) {
            this.trackCurveSpeed = (Math.random() - 0.5) * 150;
        }
        
        // Update road segments (for visual winding effect)
        for (let i = this.roadSegments.length - 1; i >= 0; i--) {
            if (i === 0) {
                this.roadSegments[i].curve = this.trackCurve;
            } else {
                this.roadSegments[i].curve = this.roadSegments[i-1].curve;
            }
        }
        
        // Update player
        this.updatePlayer(dt);
        
        // Update scrolling based on player speed
        this.scrollSpeed = this.player.speed;
        this.scrollPosition += this.scrollSpeed * dt;
        
        // BUTCHER AI - He ALWAYS tries to ESCAPE!
        // Butcher speeds up when you get close (panic!)
        this.enemy.panic = Math.max(0, 1 - this.distanceToEnemy / 200);
        const butcherSpeed = this.enemy.speed + this.enemy.panic * 50; // Big panic boost when close
        
        // THE CHASE - Butcher is ALWAYS driving forward!
        // Distance changes based on relative speeds
        // If you're slower than butcher, he escapes!
        // If you're faster, you catch up!
        const relativeSpeed = this.player.speed - butcherSpeed;
        
        // Butcher always tries to escape - you must be FASTER than him!
        this.distanceToEnemy -= relativeSpeed * dt * 1.0;
        
        // If player is barely moving, butcher escapes
        if (this.player.speed < 100) {
            this.distanceToEnemy += (butcherSpeed * 0.25) * dt;
        }
        
        this.distanceToEnemy = Math.max(-50, Math.min(700, this.distanceToEnemy)); // Allow negative to get really close!
        
        // Update enemy position on screen (follows winding road)
        // FIXED: When distance is 0 or negative, butcher is RIGHT IN FRONT of player!
        // Close (-50) = y=400 (about to collide!), Far (600+) = y=-50 (off screen top)
        this.enemy.y = 400 - (this.distanceToEnemy * 0.7);
        this.enemy.wobble += dt * 4;
        // Butcher follows the road curve
        this.enemy.x = this.trackCenterX + this.trackCurve * 0.7 + Math.sin(this.enemy.wobble) * 30;
        
        // BUTCHER SPILLS WINE to slow you down!
        this.wineSpillTimer -= dt;
        if (this.wineSpillTimer <= 0 && this.distanceToEnemy < 350) {
            // Butcher drops wine - spawns at TOP of screen!
            const curveOffset = this.trackCurve * 0.5;
            this.wineSpills.push({
                x: this.trackCenterX + curveOffset + (Math.random() - 0.5) * this.trackWidth * 0.6,
                y: -100,  // Start at very top of screen
                size: 35 + Math.random() * 15,
                opacity: 1
            });
            // Add warning for wine too!
            this.incomingWarnings.push({ 
                x: this.trackCenterX + curveOffset + (Math.random() - 0.5) * this.trackWidth * 0.6, 
                emoji: '🍷', 
                timer: 0.8, 
                flash: 0, 
                type: 'danger' 
            });
            this.wineSpillTimer = 1.5 + Math.random() * 2; // Drop wine every 1.5-3.5 seconds
            
            // Visual feedback - butcher throws wine
            if (this.distanceToEnemy < 200) {
                this.displayMessage('🍷 The Butcher spills wine! Watch out!');
            }
        }
        
        // Update wine spills
        this.wineSpills = this.wineSpills.filter(wine => {
            wine.y += this.scrollSpeed * dt;
            wine.x += this.trackCurveSpeed * dt * 0.3;
            
            // Check collision with player - SPIN OUT! (unless invincible)
            if (!this.player.spinning && this.invincibleTimer <= 0) {
                const dx = this.player.x - wine.x;
                const dy = this.player.y - wine.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 45) {
                    // HIT WINE - SPIN OUT!
                    this.player.spinning = true;
                    this.player.spinTimer = 1.2; // Spin for 1.2 seconds
                    this.player.spinAngle = 0;
                    this.player.speed *= 0.3; // Major slowdown!
                    this.engine.screenShake();
                    this.displayMessage('🌀 SPINNING OUT! Wine on the road!');
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('hit');
                    }
                    wine.opacity = 0.3; // Fade the wine
                }
            } else if (this.invincibleTimer > 0 && this.checkCollision(this.player, {x: wine.x, y: wine.y, width: 40, height: 40})) {
                // Invincible - splash through wine!
                wine.opacity = 0.1;
            }
            
            return wine.y < 700 && wine.opacity > 0.2;
        });
        
        // Spawn obstacles (less frequent!)
        this.obstacleSpawnTimer -= dt;
        if (this.obstacleSpawnTimer <= 0 && this.player.speed > 50) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 2.5 + Math.random() * 2.0; // Even less frequent: 2.5-4.5 seconds
        }
        
        // Update invincibility timer
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.displayMessage('✡️ Shield fading...');
            }
        }
        
        // Update obstacles
        this.obstacles = this.obstacles.filter(obs => {
            obs.y += this.scrollSpeed * dt;
            // Obstacles also follow road curve slightly
            obs.x += this.trackCurveSpeed * dt * 0.3;
            
            // Check collision with player - SLOWS YOU DOWN! (unless invincible)
            if (this.checkCollision(this.player, obs)) {
                if (this.invincibleTimer > 0) {
                    // Invincible! Blast through obstacles!
                    return false; // Destroy obstacle
                }
                this.player.speed *= 0.4; // Big slowdown!
                this.player.cleanDriveTime = 0; // Reset streak!
                this.player.speedBonus = 0;
                this.engine.screenShake();
                this.displayMessage('💥 CRASH! Go around obstacles!');
                if (window.audioManager) {
                    window.audioManager.playSynthSound('hit');
                }
                return false;
            }
            
            return obs.y < 650;
        });
        
        // Update boosts - SPEED IS KEY!
        this.boosts = this.boosts.filter(boost => {
            boost.y += this.scrollSpeed * dt;
            boost.x += this.trackCurveSpeed * dt * 0.3;
            
            if (this.checkCollision(this.player, boost)) {
                this.player.boostCount++;
                this.player.maxSpeed += 100; // Permanent +100 to max speed per boost!
                this.player.speed = Math.min(this.player.maxSpeed, this.player.speed + 150);
                this.player.cleanDriveTime += 3; // Bonus clean drive time!
                if (this.player.boostCount >= 2) {
                    this.displayMessage('⚡⚡ DOUBLE BOOST! You can catch him now!');
                } else {
                    this.displayMessage('⚡ BOOST! Get one more to catch the Butcher!');
                }
                if (window.audioManager) {
                    window.audioManager.playSynthSound('powerup');
                }
                return false;
            }
            
            return boost.y < 650;
        });
        
        // Update matzah
        this.matzahPowerups = this.matzahPowerups.filter(matzah => {
            matzah.y += this.scrollSpeed * dt;
            matzah.x += this.trackCurveSpeed * dt * 0.3;
            
            const dx = this.player.x - matzah.x;
            const dy = this.player.y - matzah.y;
            if (Math.sqrt(dx*dx + dy*dy) < 40) {
                this.engine.addAwakeness(matzah.awakenessBoost * 2); // Double awakeness!
                this.displayMessage('🫓 Matzah! +30 Awakeness!');
                return false;
            }
            
            return matzah.y < 650;
        });
        
        // Update incoming warnings (flash before powerups appear)
        this.incomingWarnings = this.incomingWarnings.filter(warning => {
            warning.timer -= dt;
            warning.flash += dt * 15; // Fast flash
            return warning.timer > 0;
        });
        
        // Spawn boost/matzah/star occasionally
        if (Math.random() < dt * 0.5) {
            const curveOffset = this.trackCurve * 0.5;
            const x = this.trackCenterX + curveOffset + (Math.random() - 0.5) * this.trackWidth * 0.8;
            const roll = Math.random();
            if (roll < 0.03) {
                // Star of David - VERY rare invincibility powerup!
                // Add warning first!
                this.incomingWarnings.push({ x: x, emoji: '✡️', timer: 1.0, flash: 0, type: 'star' });
                this.starPowerups.push({
                    x: x,
                    y: -100,
                    width: 35,
                    height: 35,
                    emoji: '✡️'
                });
            } else if (roll < 0.15) {
                // Matzah warning
                this.incomingWarnings.push({ x: x, emoji: '🫓', timer: 0.8, flash: 0, type: 'matzah' });
                const m = new MatzahPowerup(x, -100);
                m.y = -100;
                this.matzahPowerups.push(m);
            } else {
                // Boost warning
                this.incomingWarnings.push({ x: x, emoji: '⚡', timer: 0.8, flash: 0, type: 'boost' });
                this.boosts.push({
                    x: x,
                    y: -100,
                    width: 30,
                    height: 30,
                    emoji: '⚡'
                });
            }
        }
        
        // Update star powerups
        this.starPowerups = this.starPowerups.filter(star => {
            star.y += this.scrollSpeed * dt;
            star.x += this.trackCurveSpeed * dt * 0.3;
            
            if (this.checkCollision(this.player, star)) {
                this.invincibleTimer = 8; // 8 seconds of invincibility!
                this.player.speed = Math.min(this.player.maxSpeed, this.player.speed + 200); // Speed boost too!
                this.displayMessage('✡️ STAR POWER! Invincible for 8 seconds!');
                if (window.audioManager) {
                    window.audioManager.playSynthSound('powerup');
                }
                return false;
            }
            
            return star.y < 650;
        });
        
        // Update decorations (scrolling)
        this.decorations.forEach(dec => {
            dec.y += this.scrollSpeed * dt * 0.8;
            if (dec.y > 650) {
                dec.y = -50;
            }
        });
        
        // WIN CONDITION - Must actually COLLIDE with the butcher!
        // Calculate actual distance between player and butcher
        const dx = this.player.x - this.enemy.x;
        const dy = this.player.y - this.enemy.y;
        const actualDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Must physically touch the butcher (carts collide)
        if (actualDistance < 55 && !this.player.spinning) {
            this.complete = true;
            this.displayMessage('💀 THE ANGEL OF DEATH CATCHES THE BUTCHER!');
            if (window.audioManager) {
                window.audioManager.playSynthSound('death');
            }
            setTimeout(() => {
                if (this.engine.onLevelComplete) {
                    this.engine.onLevelComplete();
                }
            }, 2500);
        }
        
        // Show "CLOSE!" message when nearly touching
        if (actualDistance < 80 && actualDistance >= 55 && !this.complete && !this.player.spinning) {
            if (!this.closeMessageShown || Date.now() - this.closeMessageTime > 1000) {
                this.displayMessage('💀 SO CLOSE! Ram into him!');
                this.closeMessageShown = true;
                this.closeMessageTime = Date.now();
            }
        }
        
        // LOSE CONDITION - Butcher escapes off the top of the screen!
        if (this.distanceToEnemy >= 550 && !this.butcherEscaping) {
            this.butcherEscaping = true;
            this.displayMessage('💨 The Butcher is ESCAPING!');
        }
        
        // Butcher drives off screen to escape (y goes negative)
        if (this.enemy.y < -80) {
            this.displayMessage('💨 The Butcher ESCAPED! You were too slow!');
            setTimeout(() => this.reset(), 2000);
        }
        
        // Hint messages based on game state
        if (this.gameTime > 3 && this.gameTime < 3.1 && this.player.speed < 100) {
            this.displayMessage('⬆️ Hold UP ARROW to go faster!');
        }
        if (this.gameTime > 8 && this.gameTime < 8.1 && this.catchProgress < 20) {
            this.displayMessage('💨 You need more SPEED to catch him!');
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
        // Handle spinning state (from wine spills!)
        if (this.player.spinning) {
            this.player.spinTimer -= dt;
            this.player.spinAngle += dt * 15; // Spin fast!
            
            // While spinning, player drifts and can't control well
            this.player.x += Math.sin(this.player.spinAngle * 2) * 100 * dt;
            this.player.speed -= this.player.deceleration * dt * 0.5;
            this.player.speed = Math.max(50, this.player.speed); // Don't stop completely
            
            if (this.player.spinTimer <= 0) {
                this.player.spinning = false;
                this.player.spinAngle = 0;
                this.displayMessage('✅ Recovered! Keep going!');
            }
            
            // Limited control while spinning
            if (this.engine.isKeyDown('left')) {
                this.player.x -= this.player.steerSpeed * dt * 0.3;
            }
            if (this.engine.isKeyDown('right')) {
                this.player.x += this.player.steerSpeed * dt * 0.3;
            }
        } else {
            // Normal steering
            if (this.engine.isKeyDown('left')) {
                this.player.x -= this.player.steerSpeed * dt;
            }
            if (this.engine.isKeyDown('right')) {
                this.player.x += this.player.steerSpeed * dt;
            }
        }
        
        // Road curve pushes the player
        this.player.x += this.trackCurveSpeed * dt * 0.4;
        
        // Acceleration - KEY TO WINNING! (reduced when spinning)
        const accelMultiplier = this.player.spinning ? 0.3 : 1.0;
        if (this.engine.isKeyDown('up')) {
            this.player.speed += this.player.acceleration * dt * accelMultiplier;
            
            // Clean driving streak - go faster the longer without hitting!
            if (!this.player.spinning) {
                this.player.cleanDriveTime += dt;
                // After 15 seconds of clean driving, gain enough bonus to catch butcher!
                // Need +200 bonus to match butcher's 200 speed with player's 400 base
                this.player.speedBonus = Math.min(250, this.player.cleanDriveTime * 16.67); // 250 bonus at 15 sec
                
                if (this.player.cleanDriveTime >= 15 && this.player.cleanDriveTime < 15.1) {
                    this.displayMessage('🔥 PERFECT DRIVING! Max speed unlocked!');
                }
            }
        } else if (this.engine.isKeyDown('down')) {
            this.player.speed -= this.player.deceleration * dt * 2;
        } else {
            // Natural deceleration (slower than before)
            this.player.speed -= this.player.deceleration * dt * 0.3;
        }
        
        // Apply speed bonus from clean driving!
        const effectiveMaxSpeed = this.player.maxSpeed + this.player.speedBonus;
        
        // Clamp speed
        this.player.speed = Math.max(0, Math.min(effectiveMaxSpeed, this.player.speed));
        
        // Keep on track (track center moves with curve)
        const currentTrackCenter = this.trackCenterX + this.trackCurve;
        const leftBound = currentTrackCenter - this.trackWidth/2 + 25;
        const rightBound = currentTrackCenter + this.trackWidth/2 - 25;
        
        if (this.player.x < leftBound) {
            this.player.x = leftBound;
            this.player.speed *= 0.7; // Hit edge = slow down!
            this.player.cleanDriveTime = 0; // Reset streak!
            this.player.speedBonus = 0;
            // Play hum/scrape sound
            if (window.audioManager) {
                window.audioManager.playSynthSound('hurt');
            }
        }
        if (this.player.x > rightBound) {
            this.player.x = rightBound;
            this.player.speed *= 0.7;
            this.player.cleanDriveTime = 0; // Reset streak!
            this.player.speedBonus = 0;
            // Play hum/scrape sound
            if (window.audioManager) {
                window.audioManager.playSynthSound('hurt');
            }
        }
    }
    
    spawnObstacle() {
        // Seder plate items on the road (no matzah - those are powerups!)
        const obstacles = ['🥬', '🥗', '🍫', '🌿', '🍖', '🥚'];
        // Spawn on the winding road
        const curveOffset = this.trackCurve * 0.5;
        const x = this.trackCenterX + curveOffset + (Math.random() - 0.5) * (this.trackWidth - 80);
        
        this.obstacles.push({
            x: x,
            y: -100,
            width: 35,
            height: 35,
            emoji: obstacles[Math.floor(Math.random() * obstacles.length)]
        });
    }
    
    checkCollision(a, b) {
        return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
               Math.abs(a.y - b.y) < (a.height + b.height) / 2;
    }
    
    displayMessage(text) {
        this.messageText = text;
        this.showMessage = true;
        this.messageTimer = 1.5;
    }
    
    render(ctx) {
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#1a1a3a');
        gradient.addColorStop(1, '#2d2d5a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // Ground/grass on sides
        ctx.fillStyle = '#2d5a27';
        ctx.fillRect(0, 0, 800, 600);
        
        // Draw winding road using segments
        ctx.fillStyle = '#444';
        ctx.beginPath();
        
        // Left edge of road
        ctx.moveTo(this.trackCenterX - this.trackWidth/2 + this.roadSegments[this.roadSegments.length-1].curve, 600);
        for (let i = this.roadSegments.length - 1; i >= 0; i--) {
            const seg = this.roadSegments[i];
            const y = 600 - (this.roadSegments.length - 1 - i) * 35;
            ctx.lineTo(this.trackCenterX - this.trackWidth/2 + seg.curve, y);
        }
        // Right edge of road (going back down)
        for (let i = 0; i < this.roadSegments.length; i++) {
            const seg = this.roadSegments[i];
            const y = 600 - (this.roadSegments.length - 1 - i) * 35;
            ctx.lineTo(this.trackCenterX + this.trackWidth/2 + seg.curve, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Road center line (dashed, follows curve)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.setLineDash([30, 20]);
        ctx.lineDashOffset = -this.scrollPosition % 50;
        ctx.beginPath();
        for (let i = 0; i < this.roadSegments.length; i++) {
            const seg = this.roadSegments[i];
            const y = 600 - (this.roadSegments.length - 1 - i) * 35;
            if (i === 0) {
                ctx.moveTo(this.trackCenterX + seg.curve, y);
            } else {
                ctx.lineTo(this.trackCenterX + seg.curve, y);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Road edges (yellow warning lines)
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i < this.roadSegments.length; i++) {
            const seg = this.roadSegments[i];
            const y = 600 - (this.roadSegments.length - 1 - i) * 35;
            if (i === 0) {
                ctx.moveTo(this.trackCenterX - this.trackWidth/2 + seg.curve, y);
            } else {
                ctx.lineTo(this.trackCenterX - this.trackWidth/2 + seg.curve, y);
            }
        }
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < this.roadSegments.length; i++) {
            const seg = this.roadSegments[i];
            const y = 600 - (this.roadSegments.length - 1 - i) * 35;
            if (i === 0) {
                ctx.moveTo(this.trackCenterX + this.trackWidth/2 + seg.curve, y);
            } else {
                ctx.lineTo(this.trackCenterX + this.trackWidth/2 + seg.curve, y);
            }
        }
        ctx.stroke();
        
        // Draw decorations - positioned relative to the CURVED road edges!
        this.decorations.forEach(dec => {
            // Find the road curve at this decoration's Y position
            // Map y position to road segment
            const segmentIndex = Math.floor((600 - dec.y) / 35);
            const clampedIndex = Math.max(0, Math.min(this.roadSegments.length - 1, segmentIndex));
            const roadCurveAtY = this.roadSegments[clampedIndex].curve;
            
            // Calculate x position: road center + curve + side offset
            const roadEdge = this.trackCenterX + roadCurveAtY + (dec.side * this.trackWidth / 2);
            const xPos = roadEdge + (dec.side * dec.offsetFromRoad);
            
            ctx.font = `${dec.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(dec.emoji, xPos, dec.y);
        });
        
        // Draw obstacles
        this.obstacles.forEach(obs => {
            ctx.font = '35px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(obs.emoji, obs.x, obs.y);
        });
        
        // Draw boosts
        this.boosts.forEach(boost => {
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(boost.emoji, boost.x, boost.y);
        });
        
        // Draw star powerups (with glow effect!)
        this.starPowerups.forEach(star => {
            ctx.save();
            // Glowing effect
            ctx.shadowColor = 'gold';
            ctx.shadowBlur = 20;
            ctx.font = '35px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(star.emoji, star.x, star.y);
            ctx.restore();
        });
        
        // Draw incoming powerup warnings at top of screen!
        this.incomingWarnings.forEach(warning => {
            ctx.save();
            // Flashing effect
            const flashAlpha = 0.5 + 0.5 * Math.sin(warning.flash);
            ctx.globalAlpha = flashAlpha;
            
            // Draw arrow pointing down
            ctx.fillStyle = warning.type === 'star' ? 'gold' : 
                           warning.type === 'boost' ? '#00ffff' : 
                           warning.type === 'danger' ? '#ff4444' : '#ffcc00';
            ctx.beginPath();
            ctx.moveTo(warning.x, 60);
            ctx.lineTo(warning.x - 15, 45);
            ctx.lineTo(warning.x + 15, 45);
            ctx.closePath();
            ctx.fill();
            
            // Glowing background circle
            ctx.shadowColor = warning.type === 'star' ? 'gold' : 
                             warning.type === 'danger' ? '#ff0000' : '#00ffff';
            ctx.shadowBlur = 15;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(warning.x, 30, 22, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw the emoji
            ctx.font = '25px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(warning.emoji, warning.x, 30);
            ctx.restore();
        });
        
        // Draw wine spills on road!
        this.wineSpills.forEach(wine => {
            ctx.save();
            ctx.globalAlpha = wine.opacity;
            ctx.font = `${wine.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🍷', wine.x, wine.y);
            // Wine puddle effect
            ctx.fillStyle = `rgba(128, 0, 32, ${wine.opacity * 0.5})`;
            ctx.beginPath();
            ctx.ellipse(wine.x, wine.y + 10, wine.size * 0.6, wine.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Draw matzah
        this.matzahPowerups.forEach(matzah => matzah.render(ctx));
        
        // Draw enemy (Butcher) - SAME SIZE as player (no perspective, it's 2D!)
        const baseSize = 50; // Nice big size for both characters
        ctx.font = `${baseSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(this.enemy.emoji, this.enemy.x, this.enemy.y);
        // Cart under butcher
        ctx.font = '45px Arial';
        ctx.fillText('🛒', this.enemy.x, this.enemy.y + 25);
        
        // Draw player (Angel of Death - same size as butcher)
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        
        // Invincibility shield effect!
        if (this.invincibleTimer > 0) {
            ctx.save();
            // Pulsing golden shield
            const pulse = 0.5 + 0.5 * Math.sin(this.gameTime * 10);
            ctx.shadowColor = 'gold';
            ctx.shadowBlur = 30 * pulse;
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + 0.5 * pulse})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 50, 0, Math.PI * 2);
            ctx.stroke();
            // Star of David in shield
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('✡️', 0, -45);
            ctx.restore();
        }
        
        // Rotate if spinning!
        if (this.player.spinning) {
            ctx.rotate(this.player.spinAngle);
            // Dizzy effect
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.font = `${baseSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.player.emoji, 0, 0);
        // Cart/vehicle under player
        ctx.font = '40px Arial';
        ctx.fillText('🛒', 0, 25);
        
        // Spin indicator
        if (this.player.spinning) {
            ctx.font = '20px Arial';
            ctx.fillText('💫', -20, -30);
            ctx.fillText('💫', 20, -30);
        }
        ctx.restore();
        
        // Speed effect lines when going fast
        if (this.player.speed > 200) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${(this.player.speed - 200) / 150})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const x = this.player.x - 30 + Math.random() * 60;
                ctx.beginPath();
                ctx.moveTo(x, this.player.y + 40);
                ctx.lineTo(x, this.player.y + 60 + Math.random() * 20);
                ctx.stroke();
            }
        }
        
        // UI Panel background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 55, 200, 80);
        ctx.fillRect(590, 55, 200, 80);
        
        // UI - Speed meter (left side)
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText('⬆️ SPEED', 20, 75);
        
        // Speed bar - shows bonus from clean driving!
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 80, 180, 15);
        const effectiveMax = this.player.maxSpeed + this.player.speedBonus;
        const speedRatio = this.player.speed / effectiveMax;
        const speedColor = speedRatio > 0.7 ? '#00ff00' : speedRatio > 0.4 ? '#ffff00' : '#ff4444';
        ctx.fillStyle = speedColor;
        ctx.fillRect(22, 82, Math.min(speedRatio * 176, 176), 11);
        
        // Show speed bonus if active
        if (this.player.speedBonus > 10) {
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(`${Math.round(this.player.speed)} +${Math.round(this.player.speedBonus)}🔥`, 25, 92);
        } else {
            ctx.font = '12px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(`${Math.round(this.player.speed)} mph`, 25, 92);
        }
        
        // Speed hint - show streak info
        ctx.font = '11px Arial';
        if (this.player.speedBonus > 50) {
            ctx.fillStyle = '#00ffff';
            ctx.fillText('🔥 ON FIRE! Keep it clean!', 20, 125);
        } else if (speedRatio < 0.5) {
            ctx.fillStyle = '#ff4444';
            ctx.fillText('TOO SLOW! Hold ⬆️', 20, 125);
        } else {
            ctx.fillStyle = '#88ff88';
            ctx.fillText('Good speed!', 20, 125);
        }
        
        // DISTANCE TO BUTCHER (right side) - Close the gap and HIT him!
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText('📏 DISTANCE TO BUTCHER', 600, 75);
        
        // Distance bar (closer = more filled, green when close!)
        ctx.fillStyle = '#333';
        ctx.fillRect(600, 80, 180, 20);
        const distanceRatio = 1 - (this.distanceToEnemy / 500); // Inverted: closer = more filled
        const distanceColor = this.distanceToEnemy < 100 ? '#00ff00' : this.distanceToEnemy < 250 ? '#ffff00' : '#ff4444';
        ctx.fillStyle = distanceColor;
        ctx.fillRect(602, 82, Math.max(0, distanceRatio * 176), 16);
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(this.distanceToEnemy)}m`, 690, 95);
        
        // Distance hint - tell player to RAM him!
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        if (this.distanceToEnemy < 100) {
            ctx.fillStyle = '#00ff00';
            ctx.fillText('🎯 CLOSE! Steer into him!', 600, 125);
        } else if (this.distanceToEnemy < 250) {
            ctx.fillStyle = '#ffff00';
            ctx.fillText('Getting closer...', 600, 125);
        } else if (this.distanceToEnemy > 400) {
            ctx.fillStyle = '#ff0000';
            ctx.fillText('⚠️ HE\'S ESCAPING!!!', 600, 125);
        } else {
            ctx.fillStyle = '#ff4444';
            ctx.fillText('Go FASTER to catch up!', 600, 125);
        }
        
        // Draw message (TOP of screen, not middle!)
        if (this.showMessage) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(150, 140, 500, 50);
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(150, 140, 500, 50);
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(this.messageText, 400, 170);
        }
        
        // Controls hint at bottom
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('⬆️ GO FAST to catch up! ⬅️ ➡️ Steer to RAM the Butcher! 🍷 Avoid wine spills!', 400, 590);
    }
    
    reset() {
        this.player = {
            x: 400,
            y: 450,
            width: 40,
            height: 60,
            speed: 100,
            maxSpeed: 400,
            acceleration: 250,
            deceleration: 120,
            steerSpeed: 250,
            emoji: '💀',
            spinning: false,
            spinTimer: 0,
            spinAngle: 0,
            cleanDriveTime: 0,
            speedBonus: 0,
            boostCount: 0
        };
        this.enemy = {
            x: 400,
            y: 200,
            width: 40,
            height: 60,
            speed: 200,
            maxSpeed: 260,
            emoji: '🧑‍🍳',
            wobble: 0,
            panic: 0
        };
        this.scrollPosition = 0;
        this.distanceToEnemy = 280;
        this.catchProgress = 0;
        this.trackCurve = 0;
        this.trackCurveSpeed = 0;
        this.gameTime = 0;
        this.obstacles = [];
        this.boosts = [];
        this.wineSpills = [];
        this.wineSpillTimer = 2;
        this.matzahPowerups = [];
        this.starPowerups = [];
        this.invincibleTimer = 0;
        this.incomingWarnings = [];
        this.complete = false;
        this.butcherEscaping = false;
        this.showMessage = false;
        this.displayMessage('🏁 GO FAST! Catch the Butcher before he escapes!');
    }
}

window.Level9 = Level9;
