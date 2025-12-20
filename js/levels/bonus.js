// Bonus Level: Find the Afikoman!
// Only accessible after completing all 10 levels
// Search through 200 jars to find the hidden Afikoman!

class BonusLevel {
    constructor(engine, difficulty = 'normal') {
        this.engine = engine;
        this.difficulty = difficulty;
        this.name = "Find the Afikoman!";
        this.description = "The Seder can't end without the Afikoman! Search through ALL the hiding spots to find it!";
        this.instructions = "Arrow keys/WASD to move. Press SPACE near jars to search. Find the Afikoman hidden among 200 jars!";
        this.icon = "🫓";
        
        // Difficulty settings - bonus level is always intense!
        this.difficultySettings = {
            easy: { respawnRatio: 0.3, extraStartJars: 0 },
            normal: { respawnRatio: 0.5, extraStartJars: 10 },
            hard: { respawnRatio: 0.8, extraStartJars: 20 },
            extreme: { respawnRatio: 1.2, extraStartJars: 30 }
        };
        this.settings = this.difficultySettings[difficulty] || this.difficultySettings.normal;
        
        // Player (the whole family searching!)
        this.player = new TopDownPlayer(400, 550, '👨‍👩‍👧‍👦', 200);
        
        // Afikoman found
        this.afikomanFound = false;
        
        // Jars - 200 of them! One has the Afikoman
        this.jars = [];
        this.generateJars();
        
        // Track broken jars for respawning
        this.brokenJarsCount = 0;
        
        // Grass patches (decorative)
        this.grassPatches = [];
        this.generateGrass();
        
        // Matzah powerups (more of them for this long level!)
        this.matzahPowerups = [];
        this.generateMatzahPowerups();
        
        // Messages
        this.showMessage = false;
        this.messageText = '';
        this.messageTimer = 0;
        
        // Instructions overlay
        this.showInstructions = true;
        this.instructionsTimer = 4;
        this.controlsText = [
            '🎮 CONTROLS',
            '⬆️⬇️⬅️➡️ or WASD - Move',
            'SPACE - Search jars',
            '',
            '🎯 GOAL: Find the Afikoman!'
        ];
        
        // Level complete
        this.complete = false;
        
        // Funny items to find in jars
        this.funnyItems = [
            { emoji: '🍪', text: 'Macaroons! But we need the Afikoman!' },
            { emoji: '📝', text: 'A napkin with directions... "under the couch"?' },
            { emoji: '🍷', text: 'An empty wine cup. Someone\'s on their 4th!' },
            { emoji: '🥚', text: 'Another hard boiled egg. How many do we need?!' },
            { emoji: '🧂', text: 'Salt water... for the tears of searching!' },
            { emoji: '🥬', text: 'Bitter herbs. This search is bitter too!' },
            { emoji: '🍎', text: 'Charoset! Delicious but not the prize.' },
            { emoji: '🦴', text: 'The shank bone! Wrong symbolic food!' },
            { emoji: '🪙', text: 'Afikoman gelt! But where\'s the matzah?' },
            { emoji: '📖', text: 'A Haggadah. We finished reading already!' },
            { emoji: '🎁', text: 'An empty gift box. The kids took the prize!' },
            { emoji: '🧸', text: 'A stuffed goat toy. Chad Gadya!' },
            { emoji: '🔑', text: 'The key to Elijah\'s door. Wrong treasure!' },
            { emoji: '🍬', text: 'Candy for the kids! But Afikoman comes first!' },
            { emoji: '📜', text: 'A scroll with "Ma Nishtana" lyrics!' },
            { emoji: '🕯️', text: 'Shabbat candles. Wrong holiday item!' },
            { emoji: '👓', text: 'Bubbe\'s reading glasses again!' },
            { emoji: '🧦', text: 'A single sock. How did that get here?!' },
            { emoji: '📱', text: 'Someone\'s phone! They\'ll want this back!' },
            { emoji: '🎲', text: 'A dreidel. Wrong holiday!' },
            { emoji: '🍫', text: 'Chocolate coins! Close but no Afikoman!' },
            { emoji: '🎵', text: 'Sheet music for "Dayenu"!' },
            { emoji: '🦗', text: 'A locust! One of the ten plagues escaped!' },
            { emoji: '🐸', text: 'A frog! Another plague escapee!' },
            { emoji: '🌙', text: 'A moon decoration. It IS the full moon!' },
        ];
        
        // Shuffle funny items
        this.shuffledItems = [...this.funnyItems].sort(() => Math.random() - 0.5);
        this.funnyItemIndex = 0;
    }
    
    generateJars() {
        const jarCount = 200;
        const positions = [];
        
        // Generate grid-like positions with some randomness
        const cols = 16;
        const rows = Math.ceil(jarCount / cols);
        const startX = 50;
        const startY = 80;
        const spacingX = 45;
        const spacingY = 35;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (positions.length >= jarCount) break;
                
                // Add randomness to positions
                const x = startX + col * spacingX + (Math.random() - 0.5) * 20;
                const y = startY + row * spacingY + (Math.random() - 0.5) * 15;
                
                // Skip positions too close to player start
                if (y > 500 && x > 300 && x < 500) continue;
                
                positions.push({ x, y });
            }
        }
        
        // Randomly select 1 jar to have the Afikoman
        const afikomanIndex = Math.floor(Math.random() * positions.length);
        
        positions.forEach((pos, idx) => {
            this.jars.push({
                x: pos.x,
                y: pos.y,
                searched: false,
                hasAfikoman: idx === afikomanIndex,
                wobble: 0,
                jarType: Math.floor(Math.random() * 3) // Different jar styles
            });
        });
        
        // Add extra starting jars based on difficulty
        for (let i = 0; i < this.settings.extraStartJars; i++) {
            this.respawnJar();
        }
    }
    
    respawnJar() {
        // Find a random position that's not too close to player or other jars
        const minDist = 40;
        let newX, newY;
        
        for (let attempts = 0; attempts < 50; attempts++) {
            newX = 50 + Math.random() * 700;
            newY = 80 + Math.random() * 400;
            
            // Check distance from player
            const distToPlayer = Math.sqrt(
                Math.pow(newX - this.player.x, 2) + 
                Math.pow(newY - this.player.y, 2)
            );
            if (distToPlayer < 80) continue;
            
            // Check distance from other active jars
            let tooClose = false;
            for (const j of this.jars) {
                if (j.searched) continue;
                const d = Math.sqrt(Math.pow(newX - j.x, 2) + Math.pow(newY - j.y, 2));
                if (d < minDist) { tooClose = true; break; }
            }
            if (!tooClose) break;
        }
        
        // Add new jar - NEW JARS NEVER HAVE AFIKOMAN!
        this.jars.push({
            x: newX,
            y: newY,
            searched: false,
            hasAfikoman: false,
            wobble: 0.8,
            jarType: Math.floor(Math.random() * 3)
        });
    }
    
    generateGrass() {
        for (let i = 0; i < 60; i++) {
            this.grassPatches.push({
                x: Math.random() * 780 + 10,
                y: Math.random() * 500 + 80,
                size: Math.random() * 15 + 8,
                sway: Math.random() * Math.PI * 2
            });
        }
    }
    
    generateMatzahPowerups() {
        // More matzah for this longer level
        const positions = [
            { x: 100, y: 150 }, { x: 700, y: 150 },
            { x: 100, y: 350 }, { x: 700, y: 350 },
            { x: 400, y: 250 }, { x: 250, y: 450 }, { x: 550, y: 450 }
        ];
        
        positions.forEach(pos => {
            this.matzahPowerups.push(new MatzahPowerup(pos.x, pos.y));
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
        
        // Update player
        this.player.update(dt, this.engine);
        
        // Update matzah powerups
        this.matzahPowerups.forEach(matzah => {
            matzah.update(dt);
            if (matzah.checkCollision(this.player.x, this.player.y, this.player.size)) {
                this.engine.addAwakeness(matzah.awakenessBoost);
                this.displayMessage('🫓 Matzah! +15 Awakeness!');
            }
        });
        
        // Update grass sway
        this.grassPatches.forEach(grass => {
            grass.sway += dt * 2;
        });
        
        // Update jar wobble
        this.jars.forEach(jar => {
            if (jar.wobble > 0) {
                jar.wobble -= dt * 5;
            }
        });
        
        // Check for jar interaction
        if (this.engine.isKeyJustPressed('action')) {
            this.checkJarInteraction();
        }
        
        // Update message timer
        if (this.showMessage) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                this.showMessage = false;
            }
        }
    }
    
    checkJarInteraction() {
        for (let jar of this.jars) {
            if (jar.searched) continue;
            
            const dx = this.player.x - jar.x;
            const dy = this.player.y - jar.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 45) {
                jar.searched = true;
                jar.wobble = 1;
                
                // Play jar breaking sound
                if (window.audioManager) {
                    window.audioManager.playSynthSound('vaseBreak');
                }
                
                if (jar.hasAfikoman) {
                    // Found the Afikoman!
                    this.afikomanFound = true;
                    this.displayMessage('🫓✨ FOUND THE AFIKOMAN! ✨🫓');
                    
                    if (window.audioManager) {
                        window.audioManager.playSynthSound('levelComplete');
                    }
                    
                    this.engine.screenShake();
                    
                    // Complete level after celebration
                    setTimeout(() => {
                        this.complete = true;
                        if (this.engine.onLevelComplete) {
                            this.engine.onLevelComplete();
                        }
                    }, 2500);
                } else {
                    // Show funny item
                    const item = this.shuffledItems[this.funnyItemIndex % this.shuffledItems.length];
                    this.funnyItemIndex++;
                    this.displayMessage(`${item.emoji} ${item.text}`);
                    
                    // Track broken jars and maybe spawn new ones
                    this.brokenJarsCount++;
                    const ratio = this.settings.respawnRatio;
                    if (ratio > 0) {
                        const spawnsNeeded = Math.floor(this.brokenJarsCount * ratio) - Math.floor((this.brokenJarsCount - 1) * ratio);
                        for (let i = 0; i < spawnsNeeded; i++) {
                            this.respawnJar();
                        }
                    }
                }
                break;
            }
        }
    }
    
    displayMessage(text) {
        this.messageText = text;
        this.showMessage = true;
        this.messageTimer = 2;
    }
    
    render(ctx) {
        // Draw festive Seder background
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#1a0a2e');
        gradient.addColorStop(0.5, '#2d1b4e');
        gradient.addColorStop(1, '#1a0a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // Starry night (it's the Seder night!)
        for (let i = 0; i < 50; i++) {
            const x = (i * 137) % 800;
            const y = (i * 89) % 200;
            const twinkle = Math.sin(Date.now() * 0.003 + i) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 200, ${0.3 + twinkle * 0.5})`;
            ctx.beginPath();
            ctx.arc(x, y, 1 + Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw decorative grass
        this.grassPatches.forEach(grass => {
            const sway = Math.sin(grass.sway) * 2;
            ctx.fillStyle = '#2a4a2a';
            ctx.beginPath();
            ctx.moveTo(grass.x, grass.y + grass.size);
            ctx.lineTo(grass.x + sway, grass.y);
            ctx.lineTo(grass.x + 4, grass.y + grass.size);
            ctx.fill();
        });
        
        // Draw all jars
        this.jars.forEach(jar => this.renderJar(ctx, jar));
        
        // Draw matzah powerups
        this.matzahPowerups.forEach(matzah => matzah.render(ctx));
        
        // Draw player
        this.player.render(ctx);
        
        // Draw Afikoman if found (celebration!)
        if (this.afikomanFound) {
            // Glowing Afikoman celebration
            ctx.save();
            const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
            ctx.font = `${80 * pulse}px Arial`;
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 30;
            ctx.fillText('🫓', 400, 300);
            
            // Celebration sparkles
            ctx.font = '30px Arial';
            for (let i = 0; i < 8; i++) {
                const angle = (Date.now() * 0.003 + i * Math.PI / 4);
                const radius = 80 + Math.sin(Date.now() * 0.01 + i) * 20;
                const sx = 400 + Math.cos(angle) * radius;
                const sy = 300 + Math.sin(angle) * radius;
                ctx.fillText(['⭐', '✨', '🎉', '💫'][i % 4], sx, sy);
            }
            ctx.restore();
        }
        
        // Draw jar counter
        const remainingJars = this.jars.filter(j => !j.searched).length;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 50, 150, 40);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'left';
        ctx.fillText(`🏺 ${remainingJars} jars left`, 20, 75);
        
        // Draw title
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(280, 5, 240, 35);
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText('🫓 FIND THE AFIKOMAN! 🫓', 400, 28);
        
        // Draw message
        if (this.showMessage) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(150, 520, 500, 55);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(150, 520, 500, 55);
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(this.messageText, 400, 552);
        }
        
        // Draw hint
        if (!this.showMessage && !this.afikomanFound) {
            ctx.font = '14px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'center';
            ctx.fillText('Press SPACE near jars to search for the Afikoman!', 400, 590);
        }
        
        // Instructions overlay (at start)
        this.renderInstructionsOverlay(ctx);
    }
    
    renderJar(ctx, jar) {
        if (jar.searched) return;
        
        const wobble = Math.sin(jar.wobble * 10) * jar.wobble * 5;
        
        ctx.save();
        ctx.translate(jar.x + wobble, jar.y);
        
        // Different jar emojis for variety
        const jarEmojis = ['🏺', '🫙', '🍯'];
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(jarEmojis[jar.jarType], 0, 0);
        
        ctx.restore();
    }
    
    renderInstructionsOverlay(ctx) {
        // INSTRUCTIONS OVERLAY
        if (this.showInstructions && this.instructionsTimer > 0) {
            const alpha = Math.min(1, this.instructionsTimer / 0.5);
            ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * alpha})`;
            ctx.fillRect(200, 180, 400, 200);
            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.strokeRect(200, 180, 400, 200);
            
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            let y = 220;
            for (let line of this.controlsText) {
                ctx.font = line.includes('CONTROLS') ? 'bold 24px Arial' : '18px Arial';
                ctx.fillText(line, 400, y);
                y += 32;
            }
        }
    }
    
    reset() {
        this.player = new TopDownPlayer(400, 550, '👨‍👩‍👧‍👦', 200);
        this.afikomanFound = false;
        this.jars = [];
        this.generateJars();
        this.brokenJarsCount = 0;
        this.matzahPowerups = [];
        this.generateMatzahPowerups();
        this.showMessage = false;
        this.complete = false;
        this.funnyItemIndex = 0;
    }
}

window.BonusLevel = BonusLevel;
