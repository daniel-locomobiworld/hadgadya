// Audio Pre-generation Script for Had Gadya Game
// Run this script with Node.js whenever audio text changes
// Usage: node scripts/generate-audio.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const API_KEY = 'sk_9fc96cc36feffa108ffbbe65e09c7f015d9957cdfbfc40fb';
const BASE_URL = 'https://api.elevenlabs.io/v1';

// Voice IDs
const VOICES = {
    narrator: 'pNInz6obpgDQGcFmaJgB',      // Adam - dramatic narrator
    funny: 'EXAVITQu4vr4xnSDxMaL',         // Bella - for funny sounds
    old: 'VR6AewLTigWG4xSOukaG',          // Arnold - old wise voice
    kid: 'jBpfuIE2acCO8z3wKNLl',          // Gigi - kid voice
    spuds: 'NOpBlnGInO9m6vDvFkFC',        // Spuds Oxley - verses
    mark: '3jR9BuQAOPMWUjWpi0ll',         // Mark - father voice
    brock: 'DGzg6RaUqxGRTHSBjfgF',        // Brock - spell announcements
};

// All audio that needs to be generated
const AUDIO_MANIFEST = {
    // Verses (using Spuds Oxley voice)
    verses: {
        voice: 'spuds',
        texts: {
            1: "One little goat, one little goat. Which my father bought for two zuzim. One little goat, one little goat.",
            2: "Then came a cat and ate the goat, that my father bought for two zuzim. One little goat, one little goat.",
            3: "Then came a dog and bit the cat, that ate the goat, that my father bought for two zuzim. One little goat, one little goat.",
            4: "Then came a stick and beat the dog, that bit the cat, that ate the goat, that my father bought for two zuzim. One little goat, one little goat.",
            5: "Then came fire and burnt the stick, that beat the dog, that bit the cat, that ate the goat, that my father bought for two zuzim. One little goat, one little goat.",
            6: "Then came water and quenched the fire, that burnt the stick, that beat the dog, that bit the cat, that ate the goat, that my father bought for two zuzim. One little goat, one little goat.",
            7: "Then came an ox and drank the water, that quenched the fire, that burnt the stick, that beat the dog, that bit the cat, that ate the goat, that my father bought for two zuzim. One little goat, one little goat.",
            8: "Then came a slaughterer and slaughtered the ox, that drank the water, that quenched the fire, that burnt the stick, that beat the dog, that bit the cat, that ate the goat, that my father bought for two zuzim. One little goat, one little goat.",
            9: "Then came the Angel of Death and slew the slaughterer, that slaughtered the ox, that drank the water, that quenched the fire, that burnt the stick, that beat the dog, that bit the cat, that ate the goat, that my father bought for two zuzim. One little goat, one little goat.",
            10: "Then came the Holy One, blessed be He, and destroyed the Angel of Death, that slew the slaughterer, that slaughtered the ox, that drank the water, that quenched the fire, that burnt the stick, that beat the dog, that bit the cat, that ate the goat, that my father bought for two zuzim. One little goat, one little goat."
        }
    },
    
    // Victory phrases (using Brock voice for announcer style)
    victory: {
        voice: 'brock',
        texts: {
            1: "FATHER BOUGHT THE GOAT FOR TWO ZUZIM!",
            2: "THE CAT ATE THE GOAT!",
            3: "THE DOG BIT THE CAT!",
            4: "THE STICK BEAT THE DOG!",
            5: "FIRE BURNT THE STICK!",
            6: "WATER QUENCHED THE FIRE!",
            7: "THE OX DRANK THE WATER!",
            8: "THE BUTCHER SLAUGHTERED THE OX!",
            9: "THE ANGEL OF DEATH KILLED THE BUTCHER!",
            10: "THE HOLY ONE, BLESSED BE HE, DESTROYED THE ANGEL OF DEATH! ENJOY YOUR SEDER!"
        }
    },
    
    // Animal sounds (using 'funny' voice)
    animals: {
        voice: 'funny',
        texts: {
            goat1: "Baaaa! Baaaa!",
            goat2: "Meeeeeh!",
            goat3: "Baaaa baaaa baaaa!",
            cat1: "Meooow!",
            cat2: "Hissss!",
            cat3: "Mrrrow!",
            dog1: "Woof woof woof!",
            dog2: "Arf arf!",
            dog3: "Grrrr woof!"
        }
    },
    
    // Battle sounds (using 'funny' voice)
    battle: {
        voice: 'funny',
        texts: {
            attack1: "Pow!",
            attack2: "Wham!",
            attack3: "Kaboom!",
            attack4: "Oof!",
            heal1: "Ahhhhh!",
            heal2: "Much better!",
            heal3: "L'chaim!",
            shield1: "Protected!",
            shield2: "Baruch Hashem!",
            pain1: "Oy vey!",
            pain2: "Ow ow ow!",
            pain3: "That hurts!"
        }
    },
    
    // Battle move announcements (using Brock voice)
    moves: {
        voice: 'brock',
        texts: {
            move1: "MATZAH SLAP!",
            move2: "SHOFAR BLAST!",
            move3: "DREIDEL SPIN!",
            move4: "CHICKEN SOUP!",
            move5: "HORA DANCE!",
            move6: "GEFILTE FISH!",
            move7: "LATKE SPIN!",
            move8: "BLOOD!",
            move9: "FROGS!",
            move10: "LICE!",
            move11: "WILD BEASTS!",
            move12: "PESTILENCE!",
            move13: "BOILS!",
            move14: "HAIL!",
            move15: "LOCUSTS!",
            move16: "DARKNESS!",
            move17: "BURNING BUSH!"
        }
    },
    
    // Kid sounds (using 'kid' voice)
    kids: {
        voice: 'kid',
        texts: {
            laugh1: "Hee hee hee!",
            laugh2: "Ha ha ha!",
            cheer1: "Yay!",
            cheer2: "Hooray!"
        }
    },
    
    // Level 1 zuz messages (using Mark - father voice)
    zuz: {
        voice: 'mark',
        texts: {
            found1: "I found one zuz! Need one more.",
            found2: "Found two zuzim, enough for a goat!"
        }
    },
    
    // Game over messages (using Brock voice)
    gameover: {
        voice: 'brock',
        texts: {
            asleep: "You fell asleep at the Seder! GAME OVER!",
            caught: "You got caught! GAME OVER!",
            eaten: "You got eaten! GAME OVER!",
            burned: "You got burned! GAME OVER!",
            drowned: "You drowned! GAME OVER!",
            killed: "You were killed! GAME OVER!",
            lost: "You lost the battle! GAME OVER!",
            timeout: "Time ran out! GAME OVER!",
            default: "GAME OVER! Better luck next time!"
        }
    },
    
    // Level 4 round winner announcements (using Brock voice)
    roundwinner: {
        voice: 'brock',
        texts: {
            stick: "Stick won!",
            dog: "Dog won!"
        }
    }
};

// Generate hash for text + voice combination
function generateHash(text, voice) {
    return crypto.createHash('md5').update(`${voice}:${text}`).digest('hex').substring(0, 12);
}

// Generate speech using ElevenLabs API
async function generateSpeech(text, voiceId) {
    const response = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': API_KEY
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    return Buffer.from(await response.arrayBuffer());
}

// Main function
async function main() {
    const audioDir = path.join(__dirname, '..', 'audio');
    const manifestPath = path.join(audioDir, 'manifest.json');
    
    // Create audio directory if it doesn't exist
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }
    
    // Load existing manifest
    let existingManifest = {};
    if (fs.existsSync(manifestPath)) {
        existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
    
    const newManifest = {};
    let generated = 0;
    let cached = 0;
    let failed = 0;
    
    console.log('🎵 Had Gadya Audio Generator\n');
    console.log('Checking all audio files...\n');
    
    for (const [category, config] of Object.entries(AUDIO_MANIFEST)) {
        console.log(`📁 Processing ${category}...`);
        newManifest[category] = {};
        
        for (const [key, text] of Object.entries(config.texts)) {
            const voiceId = VOICES[config.voice];
            const hash = generateHash(text, config.voice);
            const filename = `${category}_${key}_${hash}.mp3`;
            const filepath = path.join(audioDir, filename);
            
            // Check if file already exists with same hash
            if (existingManifest[category]?.[key]?.hash === hash && fs.existsSync(filepath)) {
                console.log(`  ✓ ${key}: cached`);
                newManifest[category][key] = existingManifest[category][key];
                cached++;
            } else {
                // Generate new audio
                try {
                    console.log(`  ⏳ ${key}: generating...`);
                    const audioData = await generateSpeech(text, voiceId);
                    fs.writeFileSync(filepath, audioData);
                    
                    newManifest[category][key] = {
                        file: filename,
                        hash: hash,
                        text: text,
                        voice: config.voice
                    };
                    
                    console.log(`  ✓ ${key}: generated`);
                    generated++;
                    
                    // Rate limiting - wait 500ms between API calls
                    await new Promise(r => setTimeout(r, 500));
                } catch (error) {
                    console.error(`  ✗ ${key}: FAILED - ${error.message}`);
                    failed++;
                }
            }
        }
        console.log('');
    }
    
    // Save manifest
    fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2));
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✓ Generated: ${generated}`);
    console.log(`✓ Cached: ${cached}`);
    if (failed > 0) {
        console.log(`✗ Failed: ${failed}`);
    }
    console.log(`\n📄 Manifest saved to: audio/manifest.json`);
    console.log('🎮 Audio files ready for game!\n');
}

main().catch(console.error);
