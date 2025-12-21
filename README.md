# חד גדיא - Had Gadya: The Passover Game

A retro arcade-style game based on the traditional Passover song "Chad Gadya" (One Little Goat). Play through all 10 verses of the song in unique game levels!

🎮 **Play Now:** [shiny-pavlova-eff06f.netlify.app](https://shiny-pavlova-eff06f.netlify.app)

## 🐐 Game Overview

Had Gadya tells the cumulative story of a little goat bought for two zuzim. Each verse adds a new character who defeats the previous one, culminating in the Holy One defeating the Angel of Death.

## 🎯 Levels

| Level | Character | Gameplay Style | Controls |
|-------|-----------|----------------|----------|
| 1 | 🐐 Goat & 🪙 Two Zuzim | Top-down exploration | Arrow/WASD + SPACE |
| 2 | 🐱 Cat vs Goat | Chase + Pokemon battle | Arrow/WASD |
| 3 | 🐕 Dog vs Cat | Vertical shooter (shmup) | ←→ + SPACE |
| 4 | 🪵 Stick vs Dog | Tank battle (Best of 5) | Arrows + SPACE |
| 5 | 🔥 Fire vs Stick | Missile Command defense | ←→ + SPACE |
| 6 | 💧 Water vs Fire | Chase & extinguish | Arrow/WASD |
| 7 | 🐂 Ox vs Water | Collection game | Arrow/WASD |
| 8 | 🔪 Butcher vs Ox | Bullfighting | Arrows + SPACE |
| 9 | 💀 Death vs Butcher | Racing game | ←→↑↓ |
| 10 | ✡️ Holy One vs Death | Fighting game | ←→↑ + Z/X/C |
| Bonus | 🫓 Afikoman Hunt | Search 200 jars | Arrow/WASD + SPACE |

## ✨ Features

### 🎮 Gameplay
- **10 unique levels** - each with different gameplay mechanics
- **4 difficulty modes** - Easy, Normal, Hard, Extreme
- **In-game instructions** - Controls shown at start of each level
- **Awakeness meter** - Don't fall asleep during the Seder!
- **Matzah powerups** - Collect matzah to stay awake
- **High score leaderboard** - Compete for fastest completion

### 🎵 Audio
- **Dramatic sound effects** - Mortal Kombat style announcements
- **Voice narration** - Each verse is read aloud (ElevenLabs)
- **Battle move callouts** - Moves announced when used
- **Synthesized music** - Retro 8-bit style sounds

### 🎨 Visual Style
- **80s arcade aesthetic** - Neon glow, scanlines, CRT effects
- **Epic VS splash screens** - Each level introduced MK-style
- **Animated sprites** - Canvas-based emoji characters
- **Screen effects** - Shakes, flashes, particles

## 🕹️ Controls

### Movement
- **Arrow Keys** or **WASD** - Move character
- **SPACE** - Action (search, shoot, attack)

### Level 10 Fighting Game
- **←→** - Move
- **↑** - Jump
- **Z** - Punch
- **X** - Special Attack (costs 50% meter)
- **C** - Block

## 🛠️ Recent Updates

### December 2024

#### Level Improvements
- **Level 2**: Fixed goat visibility, improved grass rendering, goat escapes from corners
- **Level 3**: Dog shoots animated chomping mouths instead of teeth, added sound effects
- **Level 4**: 
  - Dog misses 50% of shots when tied 2-2 (mercy mechanic)
  - Dog escapes corners instead of getting stuck
  - Bone powerups slow down the dog
  - Player tank bounces off walls
- **Level 5**: Large sticks in wave 3, improved fire visibility
- **Level 6**: Fire visibility improvements, removed kids, added counter text
- **Level 7**: Ox visibility improvements, text changed to "Drink all the water"
- **Level 8**: Mortal Kombat style effects (blood splatters, combo text, screen flash)
- **Level 9**: Harder difficulty (faster enemy, more obstacles, more wine spills)
- **Level 10**: Dramatic 4-phase intro sequence

#### UI/UX Improvements
- **Instructions overlay** - Shows controls and goal at start of each level
- **VS splash fixes** - Name boxes no longer overlap
- **Menu sounds** - Audio starts on first click, MK-style "FIGHT!" sound on game start
- **Battle announcements** - All moves now have voice callouts (including Cholent Throw)

#### Battle System
- **Chicken Soup** now restores +15 Awakeness in addition to HP

## 📁 Project Structure

```
Had Gadya/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── js/
│   ├── engine.js       # Game engine, battle system
│   ├── game.js         # Menu system, game flow
│   ├── audio.js        # Audio manager, synthesized sounds
│   ├── vs-splash.js    # VS screen animations
│   ├── supabase.js     # Database connection
│   └── levels/
│       ├── level1.js   # Buy the Goat
│       ├── level2.js   # Cat vs Goat
│       ├── level3.js   # Dog vs Cat
│       ├── level4.js   # Stick vs Dog
│       ├── level5.js   # Fire vs Stick
│       ├── level6.js   # Water vs Fire
│       ├── level7.js   # Ox vs Water
│       ├── level8.js   # Butcher vs Ox
│       ├── level9.js   # Death vs Butcher
│       ├── level10.js  # Holy One vs Death
│       └── bonus.js    # Afikoman Hunt
├── audio/              # Pre-generated audio files
├── netlify/            # Edge functions for env vars
└── supabase/           # Database migrations
```

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions.

**Quick Deploy:**
1. Push to GitHub
2. Connect to Netlify
3. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables
4. Deploy!

## 🎭 Credits

- **Game Design & Development**: Daniel Aufgang
- **Audio**: ElevenLabs TTS, Web Audio API synthesized sounds
- **Based on**: "Chad Gadya" - Traditional Passover song

## 📜 License

MIT License - Feel free to use and modify for your own Seder!

---

**חג פסח שמח!** Happy Passover! 🐐✡️
