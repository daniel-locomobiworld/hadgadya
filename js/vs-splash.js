// VS Splash Screen - 80's Mortal Kombat Style
// Epic battle introductions for each level!

class VSSplashScreen {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.startTime = 0;
        this.duration = 4000; // 4 seconds base animation
        this.onComplete = null;
        
        // All characters for title screen
        this.allCharacters = [
            { emoji: '🐐', name: 'GOAT', color: '#ff6b6b' },
            { emoji: '🐱', name: 'CAT', color: '#9b59b6' },
            { emoji: '🐕', name: 'DOG', color: '#8b4513' },
            { emoji: '🪵', name: 'STICK', color: '#deb887' },
            { emoji: '🔥', name: 'FIRE', color: '#ff4500' },
            { emoji: '💧', name: 'WATER', color: '#00bfff' },
            { emoji: '🐂', name: 'OX', color: '#8b0000' },
            { emoji: '🔪', name: 'BUTCHER', color: '#c0c0c0' },
            { emoji: '💀', name: 'DEATH', color: '#4a0080' },
            { emoji: '✡️', name: 'HOLY ONE', color: '#ffd700' }
        ];
        
        // Battle configurations for each level with verses
        this.battles = {
            1: {
                left: { emoji: '🐐', name: 'GOAT', color: '#ff6b6b' },
                right: { emoji: '🪙🪙', name: 'TWO ZUZIM', color: '#ffd700' },
                subtitle: 'THE PURCHASE',
                verse: 'One little goat, one little goat: Which my father bought for two zuzim.'
            },
            2: {
                left: { emoji: '🐱', name: 'CAT', color: '#9b59b6' },
                right: { emoji: '🐐', name: 'GOAT', color: '#ff6b6b' },
                subtitle: 'THE HUNT BEGINS',
                verse: 'Then came a cat and ate the goat, which my father bought for two zuzim.'
            },
            3: {
                left: { emoji: '🐕', name: 'DOG', color: '#8b4513' },
                right: { emoji: '🐱', name: 'CAT', color: '#9b59b6' },
                subtitle: 'BITE THE CAT',
                verse: 'Then came a dog and bit the cat, that ate the goat.'
            },
            4: {
                left: { emoji: '🪵', name: 'STICK', color: '#deb887' },
                right: { emoji: '🐕', name: 'DOG', color: '#8b4513' },
                subtitle: 'BEAT THE DOG',
                verse: 'Then came a stick and beat the dog, that bit the cat, that ate the goat.'
            },
            5: {
                left: { emoji: '🔥', name: 'FIRE', color: '#ff4500' },
                right: { emoji: '🪵', name: 'STICK', color: '#deb887' },
                subtitle: 'BURN IT DOWN',
                verse: 'Then came fire and burnt the stick, that beat the dog, that bit the cat.'
            },
            6: {
                left: { emoji: '💧', name: 'WATER', color: '#00bfff' },
                right: { emoji: '🔥', name: 'FIRE', color: '#ff4500' },
                subtitle: 'QUENCH THE FLAMES',
                verse: 'Then came water and quenched the fire, that burnt the stick, that beat the dog.'
            },
            7: {
                left: { emoji: '🐂', name: 'OX', color: '#8b0000' },
                right: { emoji: '💧', name: 'WATER', color: '#00bfff' },
                subtitle: 'DRINK IT DRY',
                verse: 'Then came an ox and drank the water, that quenched the fire, that burnt the stick.'
            },
            8: {
                left: { emoji: '🔪', name: 'BUTCHER', color: '#c0c0c0' },
                right: { emoji: '🐂', name: 'OX', color: '#8b0000' },
                subtitle: 'THE SLAUGHTER',
                verse: 'Then came a slaughterer and slaughtered the ox, that drank the water.'
            },
            9: {
                left: { emoji: '💀', name: 'ANGEL OF DEATH', color: '#4a0080' },
                right: { emoji: '🔪', name: 'BUTCHER', color: '#c0c0c0' },
                subtitle: 'DEATH COMES',
                verse: 'Then came the Angel of Death and killed the slaughterer, that slaughtered the ox.'
            },
            10: {
                left: { emoji: '✡️', name: 'THE HOLY ONE', color: '#ffd700' },
                right: { emoji: '💀', name: 'ANGEL OF DEATH', color: '#4a0080' },
                subtitle: 'DIVINE JUSTICE',
                verse: 'Then came the Holy One, Blessed be He, and destroyed the Angel of Death.'
            }
        };
        
        // Create canvas element
        this.createCanvas();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'vs-splash-canvas';
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.canvas.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            display: none;
            border: 4px solid #ff00ff;
            box-shadow: 0 0 50px #ff00ff, 0 0 100px #00ffff;
            max-width: 95vw;
            max-height: 80vh;
            width: auto;
            height: auto;
        `;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }
    
    show(levelNum, onComplete) {
        this.onComplete = onComplete;
        this.canvas.style.display = 'block';
        this.startTime = Date.now();
        this.fightSoundPlayed = false;
        this.verseFinished = false;
        this.levelNum = levelNum;
        this.titleDuration = null;  // Clear title flag - this is a level VS screen
        
        const battle = this.battles[levelNum] || this.battles[1];
        
        // Play epic Mortal Kombat style theme music!
        if (window.audioManager) {
            window.audioManager.playVSTheme();
        }
        
        // Play dramatic VS sound
        if (window.audioManager) {
            window.audioManager.playSynthSound('versus');
        }
        
        // Play the verse audio during the splash screen!
        // Give it a moment for dramatic effect before starting
        setTimeout(() => {
            if (window.audioManager) {
                window.audioManager.playVerse(levelNum).then(() => {
                    this.verseFinished = true;
                }).catch(() => {
                    this.verseFinished = true;
                });
            } else {
                this.verseFinished = true;
            }
        }, 800); // Start verse after VS appears
        
        // Start animation
        this.animate(battle, levelNum);
    }
    
    animate(battle, levelNum) {
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        
        // Clear with dramatic background
        this.drawBackground(progress, levelNum);
        
        // Draw fighters
        this.drawFighter(battle.left, 'left', progress, battle.left.color);
        this.drawFighter(battle.right, 'right', progress, battle.right.color);
        
        // Draw VS
        this.drawVS(progress);
        
        // Draw text
        this.drawText(battle, progress, levelNum);
        
        // Draw scanlines (80's CRT effect)
        this.drawScanlines();
        
        // Draw lightning
        this.drawLightning(progress);
        
        // Keep animating until animation is done AND verse is finished
        if (progress < 1 || !this.verseFinished) {
            this.animationId = requestAnimationFrame(() => this.animate(battle, levelNum));
        } else {
            // Verse finished and animation complete - show FIGHT! briefly then complete
            setTimeout(() => {
                this.hide();
                if (this.onComplete) this.onComplete();
            }, 500);
        }
    }
    
    drawBackground(progress, levelNum) {
        const ctx = this.ctx;
        
        // Classic 80's arcade black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 800, 600);
        
        // Starfield effect - classic arcade style
        ctx.save();
        for (let i = 0; i < 50; i++) {
            const seed = i * 7919; // Prime for pseudo-random
            const x = (seed * 13) % 800;
            const y = (seed * 17) % 600;
            const twinkle = Math.sin(Date.now() * 0.003 + i) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.5})`;
            ctx.fillRect(x, y, 2, 2);
        }
        ctx.restore();
        
        // Dramatic red/blue corner glows (classic arcade cabinet style)
        const leftGlow = ctx.createRadialGradient(0, 300, 0, 0, 300, 300);
        leftGlow.addColorStop(0, 'rgba(255, 0, 50, 0.4)');
        leftGlow.addColorStop(0.5, 'rgba(255, 0, 50, 0.1)');
        leftGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = leftGlow;
        ctx.fillRect(0, 0, 300, 600);
        
        const rightGlow = ctx.createRadialGradient(800, 300, 0, 800, 300, 300);
        rightGlow.addColorStop(0, 'rgba(0, 100, 255, 0.4)');
        rightGlow.addColorStop(0.5, 'rgba(0, 100, 255, 0.1)');
        rightGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = rightGlow;
        ctx.fillRect(500, 0, 300, 600);
        
        // Horizontal divider lines (arcade style)
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(800, 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 595);
        ctx.lineTo(800, 595);
        ctx.stroke();
    }
    
    drawFighter(fighter, side, progress, color) {
        const ctx = this.ctx;
        const isLeft = side === 'left';
        
        // Slide in animation
        const slideProgress = this.easeOutBack(Math.min(progress * 2, 1));
        const startX = isLeft ? -200 : 1000;
        const endX = isLeft ? 150 : 650;
        const x = startX + (endX - startX) * slideProgress;
        const y = 280;
        
        // Glow effect
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 30 + Math.sin(Date.now() * 0.01) * 15;
        
        // Fighter emoji
        ctx.font = '120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Pulsing effect
        const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.05;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(pulse, pulse);
        if (!isLeft) ctx.scale(-1, 1); // Mirror right fighter
        ctx.fillText(fighter.emoji, 0, 0);
        ctx.restore();
        
        // Name plate - FIXED POSITIONS for left/right halves (no overlap!)
        const nameY = 450;
        ctx.shadowBlur = 20;
        
        // Each side gets half the screen width with clear separation
        const boxWidth = 320;
        const boxX = isLeft ? 40 : 440; // Left: 40-360, Right: 440-760 (80px gap in middle)
        
        // Name background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(boxX, nameY - 25, boxWidth, 50);
        
        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, nameY - 25, boxWidth, 50);
        
        // Name text - centered in the box
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillText(fighter.name, boxX + boxWidth/2, nameY + 5);
        
        ctx.restore();
    }
    
    drawVS(progress) {
        const ctx = this.ctx;
        
        // VS appears with explosion
        const vsProgress = this.easeOutElastic(Math.max(0, (progress - 0.3) * 2));
        if (vsProgress <= 0) return;
        
        ctx.save();
        ctx.translate(400, 250);
        ctx.scale(vsProgress, vsProgress);
        
        // Rotating background effect
        ctx.save();
        ctx.rotate(Date.now() * 0.002);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.5)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.3)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(-100, -100, 200, 200);
        ctx.restore();
        
        // VS text with chrome effect
        ctx.font = 'bold 100px Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Multiple layers for chrome effect
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff0000';
        ctx.fillText('VS', 3, 3);
        
        ctx.shadowColor = '#ffff00';
        ctx.fillStyle = '#ffff00';
        ctx.fillText('VS', 0, 0);
        
        // White highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('VS', -2, -2);
        
        ctx.restore();
    }
    
    drawText(battle, progress, levelNum) {
        const ctx = this.ctx;
        
        // Level number (top)
        const levelProgress = Math.min(progress * 3, 1);
        ctx.save();
        ctx.globalAlpha = levelProgress;
        
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillText(`LEVEL ${levelNum}`, 400, 50);
        
        ctx.restore();
        
        // Verse text (appears after a moment, at the bottom)
        const verseProgress = Math.max(0, (progress - 0.2) * 1.5);
        if (verseProgress > 0 && battle.verse) {
            ctx.save();
            ctx.globalAlpha = Math.min(verseProgress, 1);
            
            // Draw verse background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(50, 480, 700, 70);
            
            // Verse border
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(50, 480, 700, 70);
            
            // Verse text - wrap if needed
            ctx.font = 'italic 16px Georgia, serif';
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 5;
            ctx.textAlign = 'center';
            
            // Simple word wrap
            const words = battle.verse.split(' ');
            let line = '';
            let y = 505;
            const maxWidth = 650;
            
            for (let word of words) {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && line !== '') {
                    ctx.fillText(line.trim(), 400, y);
                    line = word + ' ';
                    y += 22;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line.trim(), 400, y);
            
            ctx.restore();
        }
        
        // Subtitle
        const subtitleProgress = Math.max(0, (progress - 0.5) * 2);
        if (subtitleProgress > 0) {
            ctx.save();
            ctx.globalAlpha = subtitleProgress;
            
            ctx.font = 'bold 28px Impact, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff00ff';
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 20;
            
            // Glitch effect
            const glitchOffset = Math.random() < 0.1 ? (Math.random() - 0.5) * 10 : 0;
            ctx.fillText(battle.subtitle, 400 + glitchOffset, 565);
            
            ctx.restore();
        }
        
        // "FIGHT!" appears when verse is done
        if (this.verseFinished && progress >= 1) {
            ctx.save();
            ctx.font = 'bold 80px Impact, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 40;
            
            // Pulsing effect
            const pulse = 1 + Math.sin(Date.now() * 0.015) * 0.1;
            ctx.translate(400, 300);
            ctx.scale(pulse, pulse);
            ctx.fillText('FIGHT!', 0, 0);
            
            // Play fight sound once
            if (!this.fightSoundPlayed) {
                this.fightSoundPlayed = true;
                if (window.audioManager) {
                    window.audioManager.playSynthSound('explosion');
                }
            }
            
            ctx.restore();
        }
    }
    
    drawScanlines() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let y = 0; y < 600; y += 4) {
            ctx.fillRect(0, y, 800, 2);
        }
    }
    
    drawLightning(progress) {
        const ctx = this.ctx;
        
        // Random lightning bolts
        if (Math.random() < 0.05 && progress > 0.3) {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.random() * 0.5})`;
            ctx.lineWidth = 2 + Math.random() * 3;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            
            ctx.beginPath();
            let x = 350 + Math.random() * 100;
            let y = 0;
            ctx.moveTo(x, y);
            
            while (y < 200) {
                y += 20 + Math.random() * 30;
                x += (Math.random() - 0.5) * 60;
                ctx.lineTo(x, y);
            }
            
            ctx.stroke();
            ctx.restore();
        }
    }
    
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    
    easeOutElastic(t) {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    }
    
    hide() {
        this.canvas.style.display = 'none';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        // Stop the VS theme music
        if (window.audioManager) {
            window.audioManager.stopVSTheme();
        }
    }
    
    // ============================================
    // TITLE SCREEN - Shows all characters!
    // ============================================
    
    showTitleScreen(onComplete) {
        this.onComplete = onComplete;
        this.canvas.style.display = 'block';
        this.startTime = Date.now();
        this.titleDuration = 6000; // 6 seconds
        this.titleSoundPlayed = false;
        this.characterSoundsPlayed = 0;
        this.levelNum = null;  // Clear level flag - this is title screen
        this.musicStarted = false;
        this.waitingForClick = false;
        
        // Start music immediately - user already interacted to get here
        this.startTitleMusic();
        
        // Start title animation
        this.animateTitleScreen();
    }
    
    // Start music after user interaction (required by browsers)
    startTitleMusic() {
        if (this.musicStarted) return;
        this.musicStarted = true;
        
        // Now we can play sounds after user gesture
        if (window.audioManager) {
            window.audioManager.playSynthSound('versus');
            // Play the epic MK-style theme!
            window.audioManager.playVSTheme();
        }
        
        // Start dramatic Mortal Kombat style music!
        if (window.titleMusic) {
            window.titleMusic.play();
        }
    }
    
    animateTitleScreen() {
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.titleDuration, 1);
        
        // Draw title screen
        this.drawTitleBackground(progress);
        this.drawTitleText(progress);
        this.drawAllCharacters(progress);
        this.drawTitleScanlines();
        this.drawTitleLightning(progress);
        this.drawPressStart(progress);
        
        if (progress < 1) {
            this.animationId = requestAnimationFrame(() => this.animateTitleScreen());
        } else {
            // Keep showing until clicked/key pressed
            this.animationId = requestAnimationFrame(() => this.animateTitleScreen());
        }
    }
    
    drawTitleBackground(progress) {
        const ctx = this.ctx;
        
        // Classic 80's arcade pure black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 800, 600);
        
        // Animated starfield - classic arcade style
        ctx.save();
        for (let i = 0; i < 80; i++) {
            const seed = i * 7919;
            const x = (seed * 13) % 800;
            const y = (seed * 17) % 600;
            const twinkle = Math.sin(Date.now() * 0.004 + i * 0.5) * 0.5 + 0.5;
            const size = (i % 3 === 0) ? 3 : 2;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + twinkle * 0.6})`;
            ctx.fillRect(x, y, size, size);
        }
        ctx.restore();
        
        // Red corner glow (classic arcade)
        const leftGlow = ctx.createRadialGradient(0, 300, 0, 0, 300, 350);
        leftGlow.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
        leftGlow.addColorStop(0.4, 'rgba(255, 0, 0, 0.15)');
        leftGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = leftGlow;
        ctx.fillRect(0, 0, 350, 600);
        
        // Blue corner glow
        const rightGlow = ctx.createRadialGradient(800, 300, 0, 800, 300, 350);
        rightGlow.addColorStop(0, 'rgba(0, 50, 255, 0.5)');
        rightGlow.addColorStop(0.4, 'rgba(0, 50, 255, 0.15)');
        rightGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = rightGlow;
        ctx.fillRect(450, 0, 350, 600);
        
        // Classic arcade border lines
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 792, 592);
        
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, 784, 584);
    }
    
    drawTitleText(progress) {
        const ctx = this.ctx;
        
        // Title appears with dramatic effect
        const titleProgress = this.easeOutBack(Math.min(progress * 2, 1));
        
        ctx.save();
        ctx.translate(400, 80);
        ctx.scale(titleProgress, titleProgress);
        
        // "HAD GADYA" main title
        ctx.font = 'bold 72px Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Multiple shadow layers for chrome effect
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff0000';
        ctx.fillText('HAD GADYA', 4, 4);
        
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ff6600';
        ctx.fillText('HAD GADYA', 2, 2);
        
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffd700';
        ctx.fillText('HAD GADYA', 0, 0);
        
        // Metallic highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText('HAD GADYA', -2, -2);
        
        ctx.restore();
        
        // Hebrew subtitle
        const hebrewProgress = Math.max(0, (progress - 0.2) * 2);
        if (hebrewProgress > 0) {
            ctx.save();
            ctx.globalAlpha = Math.min(hebrewProgress, 1);
            ctx.font = 'bold 36px serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.fillText('חד גדיא', 400, 130);
            ctx.restore();
        }
        
        // "The Passover Game" subtitle
        const subProgress = Math.max(0, (progress - 0.3) * 2);
        if (subProgress > 0) {
            ctx.save();
            ctx.globalAlpha = Math.min(subProgress, 1);
            ctx.font = 'bold 28px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff00ff';
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 10;
            ctx.fillText('THE PASSOVER GAME', 400, 165);
            ctx.restore();
        }
    }
    
    drawAllCharacters(progress) {
        const ctx = this.ctx;
        
        // Characters appear one by one in a row
        const characters = this.allCharacters;
        const startY = 280;
        const spacing = 75;
        const startX = 400 - (characters.length - 1) * spacing / 2;
        
        characters.forEach((char, index) => {
            // Staggered entrance
            const charDelay = 0.1 + index * 0.06;
            const charProgress = Math.max(0, (progress - charDelay) * 3);
            
            if (charProgress <= 0) return;
            
            const x = startX + index * spacing;
            const slideProgress = this.easeOutBack(Math.min(charProgress, 1));
            const y = startY + (1 - slideProgress) * 200;
            
            ctx.save();
            
            // Character glow
            ctx.shadowColor = char.color;
            ctx.shadowBlur = 15 + Math.sin(Date.now() * 0.005 + index) * 5;
            
            // Pulsing effect
            const pulse = 1 + Math.sin(Date.now() * 0.008 + index * 0.5) * 0.08;
            
            // Draw character
            ctx.font = '50px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = Math.min(charProgress, 1);
            
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(pulse, pulse);
            ctx.fillText(char.emoji, 0, 0);
            ctx.restore();
            
            // Character name below
            if (charProgress > 0.5) {
                ctx.font = 'bold 10px "Courier New", monospace';
                ctx.fillStyle = char.color;
                ctx.shadowBlur = 5;
                ctx.globalAlpha = Math.min((charProgress - 0.5) * 2, 1);
                ctx.fillText(char.name, x, y + 40);
            }
            
            ctx.restore();
            
            // Play sound for each character appearing
            if (charProgress > 0 && charProgress < 0.1 && this.characterSoundsPlayed < index + 1) {
                this.characterSoundsPlayed = index + 1;
                if (window.audioManager && index % 2 === 0) {
                    window.audioManager.playSynthSound('hit');
                }
            }
        });
        
        // "VS" chains between characters
        if (progress > 0.5) {
            ctx.save();
            ctx.font = 'bold 16px Impact';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
            ctx.globalAlpha = Math.min((progress - 0.5) * 3, 0.8);
            
            for (let i = 0; i < characters.length - 1; i++) {
                const x = startX + i * spacing + spacing / 2;
                ctx.fillText('⚔️', x, startY + 50);
            }
            ctx.restore();
        }
    }
    
    drawTitleScanlines() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let y = 0; y < 600; y += 3) {
            ctx.fillRect(0, y, 800, 1);
        }
    }
    
    drawTitleLightning(progress) {
        const ctx = this.ctx;
        
        // Random lightning effects
        if (Math.random() < 0.03 && progress > 0.2) {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + Math.random() * 0.4})`;
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            
            // Left side lightning
            if (Math.random() < 0.5) {
                ctx.beginPath();
                let x = 50 + Math.random() * 100;
                let y = 0;
                ctx.moveTo(x, y);
                while (y < 400) {
                    y += 15 + Math.random() * 25;
                    x += (Math.random() - 0.5) * 40;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            } else {
                // Right side lightning
                ctx.beginPath();
                let x = 650 + Math.random() * 100;
                let y = 0;
                ctx.moveTo(x, y);
                while (y < 400) {
                    y += 15 + Math.random() * 25;
                    x += (Math.random() - 0.5) * 40;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.restore();
        }
    }
    
    drawPressStart(progress) {
        const ctx = this.ctx;
        
        // Show "PRESS START" - music starts immediately since user already clicked to get here
        if (progress > 0.8) {
            const blink = Math.sin(Date.now() * 0.006) > 0;
            if (blink) {
                ctx.save();
                ctx.font = 'bold 32px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#00ff00';
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 20;
                ctx.fillText('🎮 PRESS START 🎮', 400, 520);
                ctx.restore();
            }
        }
        
        // Credits
        if (progress > 0.5) {
            ctx.save();
            ctx.font = '14px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#888888';
            ctx.fillText('A Passover Game for the Whole Family 🍷', 400, 570);
            ctx.restore();
        }
    }
    
    // Handle input to dismiss title screen
    dismissTitleScreen() {
        // Stop the epic title music
        if (window.titleMusic) {
            window.titleMusic.stop();
        }
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.hide();
        if (this.onComplete) {
            this.onComplete();
        }
    }
}

// Create global instance
window.vsSplash = new VSSplashScreen();

// Add click/key listener for title screen ONLY
document.addEventListener('DOMContentLoaded', () => {
    const handleTitleInteraction = (e) => {
        // Only handle if it's the title screen
        if (window.vsSplash && 
            window.vsSplash.canvas.style.display !== 'none' && 
            window.vsSplash.titleDuration &&
            !window.vsSplash.levelNum) {
            
            e.preventDefault();
            e.stopPropagation();
            
            // Try to start music if it hasn't started (fallback for strict browsers)
            if (!window.vsSplash.musicStarted) {
                window.vsSplash.startTitleMusic();
            }
            
            // Dismiss the title screen
            window.vsSplash.dismissTitleScreen();
        }
    };
    
    document.addEventListener('keydown', handleTitleInteraction);
    document.addEventListener('click', handleTitleInteraction);
});
