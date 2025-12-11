// Level 1: The Father buys a Little Goat for Two Zuzim
// Find coins hidden in vases/grass, then buy goat from vending machine

class Level1 {
    constructor(engine) {
        this.engine = engine;
        this.name = "Buy the Goat";
        this.description = "The Father must find two golden zuzim hidden in vases and buy a goat from the vending machine!";
        this.instructions = "Arrow keys/WASD to move. Press SPACE near vases to search. Find 2 coins, then go to the vending machine!";
        this.icon = "🐐";
        
        // Player (Father)
        this.player = new TopDownPlayer(400, 500, '👨', 180);
        
        // Coins found
        this.coinsFound = 0;
        this.coinsNeeded = 2;
        
        // Vases - some have coins, most don't
        this.vases = [];
        this.generateVases();
        
        // Grass patches (decorative and hiding spots)
        this.grassPatches = [];
        this.generateGrass();
        
        // Vending machine
        this.vendingMachine = {
            x: 400,
            y: 80,
            width: 80,
            height: 100,
            activated: false
        };
        
        // Matzah powerups
        this.matzahPowerups = [
            new MatzahPowerup(100, 200),
            new MatzahPowerup(700, 400)
        ];
        
        // Messages
        this.showMessage = false;
        this.messageText = '';
        this.messageTimer = 0;
        
        // Track broken pots for respawning (1 new pot per 2 broken)
        this.brokenPotsCount = 0;
        
        // Level complete
        this.complete = false;
        this.goatBought = false;
    }
    
    generateVases() {
        const vasePositions = [
            { x: 100, y: 150 }, { x: 200, y: 200 }, { x: 350, y: 180 },
            { x: 500, y: 150 }, { x: 650, y: 200 }, { x: 700, y: 300 },
            { x: 150, y: 350 }, { x: 300, y: 400 }, { x: 550, y: 350 },
            { x: 200, y: 500 }, { x: 600, y: 480 }, { x: 450, y: 300 }
        ];
        
        // Funny Jewish-themed items to find in vases
        this.funnyItems = [
            { emoji: '📝', text: 'A Note From Your Mother: "Why have you not called?!"' },
            { emoji: '🍞', text: 'Chametz! Quick, hide it before Pesach!' },
            { emoji: '🥩', text: 'A perfectly good brisket! But it\'s fleishig...' },
            { emoji: '🕷️', text: 'Nothing but a spider!' },
            { emoji: '🧀', text: 'Cream cheese? This is a dairy-free zone!' },
            { emoji: '📜', text: 'Ancient scrolls... just your Bubbe\'s recipes.' },
            { emoji: '🫓', text: 'Just old matzah crumbs from last year...' },
            { emoji: '🍷', text: 'Elijah\'s empty wine cup... he drank it all!' },
            { emoji: '🥔', text: 'A single potato. For the kugel?' },
            { emoji: '👓', text: 'Your Zayde\'s reading glasses! He\'s been looking for these!' },
            { emoji: '🏆', text: 'A "World\'s Best Grandchild" trophy. Dusty.' },
            { emoji: '🥚', text: 'A hardboiled egg. Very symbolic. Very empty.' }
        ];
        
        // Randomly select 2 vases to have coins
        const coinVaseIndices = [];
        while (coinVaseIndices.length < 2) {
            const idx = Math.floor(Math.random() * vasePositions.length);
            if (!coinVaseIndices.includes(idx)) {
                coinVaseIndices.push(idx);
            }
        }
        
        // Shuffle funny items
        const shuffledItems = [...this.funnyItems].sort(() => Math.random() - 0.5);
        
        vasePositions.forEach((pos, idx) => {
            this.vases.push({
                x: pos.x,
                y: pos.y,
                searched: false,
                hasCoin: coinVaseIndices.includes(idx),
                funnyItem: shuffledItems[idx % shuffledItems.length],
                wobble: 0
            });
        });
    }
    
    // Respawn a new vase at a random position (new pots never have coins!)
    respawnVase() {
        // Find a random position that's not too close to player or other vases
        const minDist = 60;
        let newX, newY;
        
        for (let attempts = 0; attempts < 50; attempts++) {
            newX = 80 + Math.random() * 640;
            newY = 180 + Math.random() * 350;
            
            // Check distance from player
            const distToPlayer = Math.sqrt(
                Math.pow(newX - this.player.x, 2) + 
                Math.pow(newY - this.player.y, 2)
            );
            if (distToPlayer < 100) continue;
            
            // Check distance from vending machine
            if (newY < 200 && newX > 320 && newX < 480) continue;
            
            // Check distance from other active vases
            let tooClose = false;
            for (const v of this.vases) {
                if (v.searched) continue;
                const d = Math.sqrt(Math.pow(newX - v.x, 2) + Math.pow(newY - v.y, 2));
                if (d < minDist) { tooClose = true; break; }
            }
            if (!tooClose) break;
        }
        
        // Pick a random funny item
        const shuffledItems = [...this.funnyItems].sort(() => Math.random() - 0.5);
        
        // Add new vase - NEW POTS NEVER HAVE COINS!
        this.vases.push({
            x: newX,
            y: newY,
            searched: false,
            hasCoin: false, // New pots never have coins
            funnyItem: shuffledItems[0],
            wobble: 0.8 // Start wobbling so player notices
        });
        
        console.log('New pot spawned at', Math.round(newX), Math.round(newY));
    }
    
    generateGrass() {
        for (let i = 0; i < 40; i++) {
            this.grassPatches.push({
                x: Math.random() * 780 + 10,
                y: Math.random() * 400 + 150,
                size: Math.random() * 20 + 10,
                sway: Math.random() * Math.PI * 2
            });
        }
    }
    
    update(dt) {
        if (this.complete) return;
        
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
        
        // Update vase wobble
        this.vases.forEach(vase => {
            if (vase.wobble > 0) {
                vase.wobble -= dt * 5;
            }
        });
        
        // Check for vase interaction
        if (this.engine.isKeyJustPressed('action')) {
            this.checkVaseInteraction();
            this.checkVendingMachine();
        }
        
        // Update message timer
        if (this.showMessage) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                this.showMessage = false;
            }
        }
    }
    
    checkVaseInteraction() {
        for (let vase of this.vases) {
            if (vase.searched) continue;
            
            const dx = this.player.x - vase.x;
            const dy = this.player.y - vase.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 50) {
                vase.searched = true;
                vase.wobble = 1;
                
                // Play vase breaking sound effect (doesn't interrupt speech!)
                if (window.audioManager) {
                    window.audioManager.playSynthSound('vaseBreak');
                }
                
                if (vase.hasCoin) {
                    // Found a coin!
                    this.coinsFound++;
                    
                    // Custom zuz messages with audio!
                    if (this.coinsFound === 1) {
                        this.displayMessage('🪙 I found one zuz! Need one more.');
                        if (window.audioManager) {
                            window.audioManager.playZuzMessage('found1');
                        }
                    } else {
                        this.displayMessage('🪙 Found two zuzim - enough for a goat!');
                        if (window.audioManager) {
                            window.audioManager.playZuzMessage('found2');
                        }
                    }
                    
                    this.engine.screenShake();
                    // Play coin sound effect
                    if (window.audioManager) {
                        setTimeout(() => {
                            window.audioManager.playSynthSound('coinPickup');
                        }, 150);
                    }
                } else {
                    // Show the funny item from this vase
                    this.displayMessage(`${vase.funnyItem.emoji} ${vase.funnyItem.text}`);
                    
                    // Track broken pots - spawn 1 new pot for every 2 broken
                    this.brokenPotsCount++;
                    if (this.brokenPotsCount % 2 === 0) {
                        this.respawnVase();
                    }
                }
                break;
            }
        }
    }
    
    checkVendingMachine() {
        const vm = this.vendingMachine;
        const dx = this.player.x - (vm.x + vm.width/2);
        const dy = this.player.y - (vm.y + vm.height);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 80) {
            if (this.coinsFound >= this.coinsNeeded) {
                this.goatBought = true;
                this.displayMessage('🐐 You bought a goat! חד גדיא!');
                this.complete = true;
                
                // Play goat sound!
                if (window.audioManager) {
                    window.audioManager.playAnimalSound('goat');
                }
                
                // Trigger level complete after delay
                setTimeout(() => {
                    if (this.engine.onLevelComplete) {
                        this.engine.onLevelComplete();
                    }
                }, 2000);
            } else {
                this.displayMessage(`Need ${this.coinsNeeded - this.coinsFound} more zuzim!`);
            }
        }
    }
    
    displayMessage(text) {
        this.messageText = text;
        this.showMessage = true;
        this.messageTimer = 2;
    }
    
    render(ctx) {
        // Draw grass background
        ctx.fillStyle = '#2d5a27';
        ctx.fillRect(0, 0, 800, 600);
        
        // Draw decorative grass
        this.grassPatches.forEach(grass => {
            const sway = Math.sin(grass.sway) * 3;
            ctx.fillStyle = '#3d7a37';
            ctx.beginPath();
            ctx.moveTo(grass.x, grass.y + grass.size);
            ctx.lineTo(grass.x + sway, grass.y);
            ctx.lineTo(grass.x + 5, grass.y + grass.size);
            ctx.fill();
        });
        
        // Draw path to vending machine
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(350, 100, 100, 500);
        
        // Draw vending machine
        this.renderVendingMachine(ctx);
        
        // Draw vases
        this.vases.forEach(vase => this.renderVase(ctx, vase));
        
        // Draw matzah powerups
        this.matzahPowerups.forEach(matzah => matzah.render(ctx));
        
        // Draw player
        this.player.render(ctx);
        
        // Draw coin counter
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 50, 120, 40);
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'left';
        ctx.fillText(`🪙 ${this.coinsFound}/${this.coinsNeeded} Zuzim`, 20, 75);
        
        // Draw message
        if (this.showMessage) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(200, 520, 400, 50);
            ctx.font = '18px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(this.messageText, 400, 550);
        }
        
        // Draw goat if bought
        if (this.goatBought) {
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🐐', this.player.x + 40, this.player.y);
        }
        
        // Draw hint
        if (!this.showMessage) {
            ctx.font = '14px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'center';
            ctx.fillText('Press SPACE near vases to search for coins!', 400, 580);
        }
    }
    
    renderVendingMachine(ctx) {
        const vm = this.vendingMachine;
        
        // Machine shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(vm.x + 5, vm.y + 5, vm.width, vm.height);
        
        // Machine body - metallic look
        const gradient = ctx.createLinearGradient(vm.x, vm.y, vm.x + vm.width, vm.y);
        gradient.addColorStop(0, '#5a5a5a');
        gradient.addColorStop(0.5, '#7a7a7a');
        gradient.addColorStop(1, '#4a4a4a');
        ctx.fillStyle = gradient;
        ctx.fillRect(vm.x, vm.y, vm.width, vm.height);
        
        // Machine border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.strokeRect(vm.x, vm.y, vm.width, vm.height);
        
        // Title sign
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(vm.x - 15, vm.y - 35, vm.width + 30, 30);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(vm.x - 15, vm.y - 35, vm.width + 30, 30);
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText('GOAT-O-MATIC', vm.x + vm.width/2, vm.y - 15);
        
        // Glass window
        ctx.fillStyle = 'rgba(200, 230, 255, 0.3)';
        ctx.fillRect(vm.x + 8, vm.y + 8, vm.width - 16, 55);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.strokeRect(vm.x + 8, vm.y + 8, vm.width - 16, 55);
        
        // Goat display inside glass
        ctx.font = '35px Arial';
        ctx.fillText('🐐', vm.x + vm.width/2, vm.y + 45);
        
        // Screen/Display panel
        ctx.fillStyle = this.coinsFound >= this.coinsNeeded ? '#00ff00' : '#ff6b6b';
        ctx.fillRect(vm.x + 10, vm.y + 68, vm.width - 20, 22);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(vm.x + 10, vm.y + 68, vm.width - 20, 22);
        
        // Screen text
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(this.coinsFound >= this.coinsNeeded ? '✔ INSERT COINS' : '🪙 2 ZUZIM', vm.x + vm.width/2, vm.y + 83);
        
        // Coin slot
        ctx.fillStyle = '#222';
        ctx.fillRect(vm.x + vm.width - 18, vm.y + 40, 8, 20);
        
        // Dispenser slot at bottom
        ctx.fillStyle = '#222';
        ctx.fillRect(vm.x + 15, vm.y + vm.height - 8, vm.width - 30, 6);
    }
    
    renderVase(ctx, vase) {
        // Don't render searched vases - they disappear
        if (vase.searched) return;
        
        const wobble = Math.sin(vase.wobble * 10) * vase.wobble * 5;
        
        ctx.save();
        ctx.translate(vase.x + wobble, vase.y);
        
        // Intact vase - all vases look the same (no hints!)
        ctx.font = '35px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏺', 0, 0);
        
        ctx.restore();
    }
    
    reset() {
        this.player = new TopDownPlayer(400, 500, '👨', 180);
        this.coinsFound = 0;
        this.vases = [];
        this.generateVases();
        this.matzahPowerups = [
            new MatzahPowerup(100, 200),
            new MatzahPowerup(700, 400)
        ];
        this.showMessage = false;
        this.complete = false;
        this.goatBought = false;
    }
}

window.Level1 = Level1;
