# 💨 SUPER FARTIO BROS. 💩
### *World 1: The Sewer Kingdom & World 2: The Rotten Landfill*

An 8-bit retro side-scrolling platformer inspired by the classic arcade era, featuring **Fartio**—the gas-powered subterranean plumber on a quest from the toxic sewer catacombs to the smog-choked garbage mountains of the surface!

📄 **World 2 Game Design & Extensibility Reference**: See [`WORLD_2.md`](WORLD_2.md) for the complete World 2 design bible, physics specs, AI behaviors, and future-world architecture guide.

🎮 **Play Online**: [https://daoudz.github.io/SuperFartioStinky/](https://daoudz.github.io/SuperFartioStinky/)

📱 **Mobile Ready**: Fully optimized for **Android** & **iOS** devices with responsive on-screen virtual controls, automatic landscape orientation prompt, haptic vibration feedback, multi-touch support, and full-screen mode!

---

## 🎬 Level Briefing & One-Tap Fullscreen
Before every level, a **briefing splash screen** lets you pick any stage (`1-1` through `2-4 💀`), displays the world number, level name, the **🎯 level goal**, and a quick controls cheat-sheet. The game stays paused (and silent) until you start.

- **⛶ PLAY FULLSCREEN** — enters fullscreen *and* starts the level in a single tap (on Android it also locks the screen to landscape). Perfect for phones, where the browser address bar can hide the top of the page in landscape.
- **▶ PLAY** — starts the level without fullscreen. Desktop players can just press `Enter` or `Space`.
- A floating **⛶** button inside the game screen (just below the HUD) lets touch players toggle fullscreen at any time without hunting for the header button.
- iPhone Safari doesn't allow true fullscreen for web pages, so the game uses an edge-to-edge fallback and suggests **Share → Add to Home Screen** for the full experience.

---

## 📖 Story & Lore
- **World 1 — The Sewer Kingdom (`1-1` to `1-4`)**: Deep beneath the city, the nefarious **King Poopa** and his army of sentient fecal turds, mutating bacteria germs, and winged sewer flies have clogged the Great Drain and seized the Royal Porcelain Throne!
- **World 2 — The Rotten Landfill (`2-1` to `2-4`)**: Emerging from the main sewer outflow pipe into the open-air wasteland above, Fartio discovers **Emperor Garbagio** has buried the surface in fermenting trash dunes, hijacked the Compactor Factory, flooded the Moldy Cheese Marsh, and fired up the Slag Incinerator! Armed with **Fermented Garlic Burritos**, Fartio must collect **Golden Stink Stars** and activate the **Royal Pine-Fresh Deodorizer Towers** (`FRESH` Bio-Compost Silos) to purify the atmosphere!

---

## 🕹️ Controls (Desktop & Mobile)

| Action | Keyboard Keys | Mobile / Touch Gamepad |
|---|---|---|
| **Move Left / Right** | `A` / `D` or `◀` / `▶` | On-Screen D-Pad `◀` and `▶` |
| **Fart Jump** | `W` / `Space` / `▲` | `💨 JUMP` Virtual Button |
| **Double / Triple Fart Boost** | `W` / `Space` (in mid-air; 3× with Garlic Burrito!) | `💨 JUMP` (tap again while airborne) |
| **Shoot Toxic Gas / Sprint** | `X` / `Shift` / `J` / `Z` | `☣️ GAS` Virtual Button |
| **Start Level (Briefing Screen)** | `Enter` / `Space` | `⛶ PLAY FULLSCREEN` or `▶ PLAY` |
| **Toggle Full Screen** | `⛶ FULLSCREEN` button | Floating in-game `⛶` button (Fullscreen API + iOS edge-to-edge fallback) |
| **Warp to Level** | `1` – `8` (`1-1`..`1-4`, `2-1`..`2-4`) | Top or Briefing Level Selector Buttons (`1-1` to `2-4 💀`) |
| **Advance Next Level** | `Enter` / `N` | Tap screen or press Enter when level cleared |
| **Restart Level** | `R` | `🔄 RESTART` button |
| **Toggle Chiptune Music** | `🎵 BGM` button | Web Audio Synthesizer toggle |
| **Toggle Scanlines** | `📺 CRT` button | Arcade CRT shader toggle |

---

## 🌟 Game Mechanics, Boosts & Environmental Objects

- **Acoustic Fart Jump & Mid-Air Boosts**: Variable jump control reaches ~5 tiles vertically from the ground, followed by a **Double Fart** (`"TOOT!"`) or—in **Garlic Turbo Mode**—a **Triple Fart Jump (`"GARLIC JET!"`)**!
- **Gas Ball & Piercing Garlic Blasts**: Fire bouncing toxic gas spheres (`X` / `Shift` / `J` or `☣️ GAS`). Garlic Turbo blasts travel faster, deal `2×` damage, and **pierce through enemies**!
- **🎈 Whoopee Cushion Bounce Pads (World 2)**: Inflatable rubber pads that rocket Fartio up to ~9 tiles high (hold `Jump` for maximum boost) and refresh all mid-air Fart Jumps!
- **💨 Methane Updraft Geysers (World 2)**: Rising green thermal compost plumes that let Fartio float upward and chain aerial geyser-surfing across chasms.
- **⚙️ Motorized Conveyor Belts (World 2)**: High-speed tailwind and headwind assembly belts affecting Fartio, monsters, and sliding items.
- **📦 Soggy Crumbling Cardboard (World 2)**: Wet corrugated platforms over fondue bogs and slag pits that shake briefly under your boots before collapsing and safely respawning.
- **⛓️ Junk Wrecking-Ball Pendulums (World 2)**: Swinging spiked scrap balls suspended from factory girders and furnace rafters.

---

## 🥫 Power-Ups & Collectibles

| Item | Name | Effect |
|:---:|---|---|
| 🥫 | **Baked Beans Can** | Transforms Fartio into **Super Bean Fartio**! Increases size, grants fiery chili overalls, and boosts gas fireball speed and damage. |
| 🌯 | **Fermented Garlic Burrito** *(World 2)* | Unleashes **Garlic Turbo Mode**! Grants **Triple Fart Jump**, **`+15%` Turbo Sprint**, **enemy-piercing cyan/violet Garlic Gas Bombs**, and a **3-step health shield** (`Garlic → Super → Regular`). |
| ⭐ | **Golden Stink Star Medal** *(World 2)* | `3` optional skill medals hidden in every World 2 stage (`+1000` pts each, plus a **`+3000` Perfect `3/3` Bonus** at the Deodorizer Tower!). |
| 🧻 | **Golden Toilet Paper** | Legendary pristine 2-ply roll. Awards **+1500 points** and temporary Golden Wipe invincibility! |
| 🪙 | **Sewer Token Coin** | Golden coin stamped with a plunger (`+200` points), including 5-hit **Jackpot Multi-Coin Blocks**. |

---

## 👾 Stinky Bestiary

### World 1: The Sewer Kingdom
- **Turdion (Poop Enemy)**: Swirled Goomba-like feces with buzzing flies. Stomp from above or vaporize with gas.
- **Germoid (Bacteria Enemy)**: Spiky radioactive green microbe that performs surprise slimy micro-hops.
- **Winged Mutant Sewer Fly**: Aerial pests that swoop along sinusoidal flight paths over chasms.
- **King Poopa (`1-4` Citadel Boss)**: 6-HP monarch of the porcelain throne who breathes toxic green sludge waves.

### World 2: The Rotten Landfill
- **Maggotron (Mutant Compost Grub)**: Pale segmented grub with angry red eyes that **lunges at `~1.9×` speed** when Fartio gets close!
- **Stinktail (Junkyard Skunk)**: Striped mutant skunk that raises its tail in a toxic-magenta telegraph before lobbing **arcing Rotten Stink-Eggs** from elevated crates and islands.
- **Armored Trashjaw (Garbage-Can Mimic)**: Galvanized steel trash bin with chomping lid. Regular gas shots clang off and dent its armor (`2` hits to defeat), while stomps or Super/Garlic blasts take it down in one!
- **Emperor Garbagio (`2-4` Incinerator Boss)**: Colossal **8-HP** garbage golem crowned with a golden tin can. Enters **Phase 2 Enrage** at `≤ 4 HP`, flashing magenta-gold and hurling twin-spread bouncing Junk Bombs across his converging conveyor arena!

---

## 🗺️ Level Walkthrough (Worlds 1 & 2)

### World 1 — The Sewer Kingdom
- **🚰 World 1-1: The Great Sewer** — Classic question-block clusters, Baked Beans intro, and brass sewer pipes leading to the Royal Flush Flagpole.
- **⚙️ World 1-2: Toxic Pipeworks** — Industrial pipeline maze with vertical/horizontal grate lifts and high ceiling ductwork.
- **🌊 World 1-3: Septic Lagoon** — High-altitude athletic platforming across suspended catwalk bridges above a boiling lagoon.
- **👑 World 1-4: King Poopa's Citadel** — Porcelain dungeon with rotating toxic firebars and the bridge showdown against **King Poopa**.

### World 2 — The Rotten Landfill
- **🗑️ World 2-1: Mount Garbagio** — Open-air junkyard dunes introducing the **Fermented Garlic Burrito**, **Whoopee Cushion Bounce Pads**, **Methane Updraft Geysers**, biohazard oil drums, and the first `3` Golden Stink Stars.
- **🏭 World 2-2: Compactor Factory** — High-speed tailwind/headwind **Conveyor Belts**, swinging **Junk Wrecking-Ball Pendulums**, and multi-tier assembly catwalks.
- **🧀 World 2-3: Moldy Cheese Marsh** — Boiling curdled fondue bog spanned by **Soggy Crumbling Cardboard** rafts, Swiss-cheese islands, and `3` chained mid-air Methane Geysers.
- **🔥 World 2-4: Garbagio's Incinerator** — Blazing molten-slag furnace combining conveyors, firebars, pendulums, scorching cardboard bridges, skylight bounce vaults, and the **Grand Compactor Arena** battle against **Emperor Garbagio**!

---

## 🛠️ Technical Architecture

- **Mobile First & Fullscreen**: Responsive touch gamepad designed for Android and iOS touchscreens with multi-touch tracking, haptic vibration pulses, and viewport-fill fullscreen mode.
- **100% Procedural & Hand-Drawn**: Zero external image or audio files! Every sprite, tile, parallax layer, and animation frame is drawn using custom pixel matrices and offscreen canvas routines in [`sprites.js`](sprites.js) and [`game.js`](game.js).
- **Procedural Web Audio API Synthesizer**: Sound effects (fart jumps, whoopee bounce pads, armor clangs, garlic fanfare, star chimes) and all **6 chiptune BGM tracks** (Sewer, Lagoon, Citadel, Landfill/Factory, Cheese Marsh, and Slag Incinerator) are procedurally synthesized in [`audio.js`](audio.js).
- **Vanilla Modern JavaScript**: No external game engines, build tools, or npm dependencies needed. Runs natively in any modern desktop or mobile browser.
- **Retro CRT Shader**: Optional retro scanline and vignette overlay toggled with a single click.

---

## 🚀 Running Locally

Simply clone the repository and open `index.html` in your favorite web browser:

```bash
git clone https://github.com/daoudz/SuperFartioStinky.git
cd SuperFartioStinky
start index.html # On Windows (or open in Chrome / Edge / Safari / Firefox)
```

---

*Made with 💨, 🌯, and 💩. Long live Fartio!*
