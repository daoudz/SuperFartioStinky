# 🗑️ WORLD 2 DESIGN & ARCHITECTURE REFERENCE
## *Super Fartio Bros. — World 2: The Rotten Landfill*

> **Purpose of this Document**: Authoritative game design bible and technical reference for **World 2: The Rotten Landfill** (Stages `2-1` through `2-4`, mapped internally to levels `5` through `8`) and a blueprint for extending *Super Fartio Bros.* into World 3 and future stinky realms.

---

## 1. Creative Vision, Lore & Aesthetic Identity

After flushing **King Poopa** out of the subterranean Sewer Kingdom in `1-4`, Fartio climbs the main city outflow pipe straight into the open-air toxic wasteland above: **The Rotten Landfill**.

Ruled by the colossal junk-golem **Emperor Garbagio**, the Landfill has buried the surface in mountains of fermenting trash, hijacked the municipal Compactor Factory, flooded the lowlands into a boiling **Moldy Cheese Marsh**, and cranked the **Slag Incinerator** to maximum stench. Fartio's mission across all 4 sub-worlds is to fight through Garbagio's mutant garbage legion and activate the **Royal Pine-Fresh Deodorizer Towers** (`FRESH` Bio-Compost Silos) to purify the atmosphere!

### Visual & Audio Direction
- **Distinct Open-Air & Industrial Palette**: Contrasts sharply with World 1's damp green underground brick sewers:
  - `2-1` (`landfill`): Bruised twilight violet-chartreuse smog sky, jagged **Mount Garbagio** garbage-dune silhouettes topped with crooked TV antennas, and rusted electromagnet crane gantries.
  - `2-2` (`factory`): Soot-amber **Compactor Factory** corrugated steel walls, glowing smelter grates, and motorized conveyor assembly lines.
  - `2-3` (`marsh`): Sickly olive **Moldy Cheese Marsh** spore mist, giant porous Swiss-cheese monoliths, and weeping yellow-green fondue stalactites.
  - `2-4` (`incinerator`): Blistering magenta-crimson **Slag Incinerator** boiler plates, roaring furnace fireboxes, and open skylights.
- **100% Procedural Audio (`audio.js`)**:
  - **3 New Chiptune BGM Grooves**:
    - *Junkyard Slap-Tuba Groove* (`2-1` & `2-2`): Bluesy G-Dorian sawtooth bassline + syncopated square lead.
    - *Moldy Marsh Squelchy Bounce* (`2-3`): Staccato octave-leaping swamp groove.
    - *Incinerator Furnace Riff* (`2-4`): Driving low-E (`82.41 Hz`) chromatic metal boss riff.
  - **4 New Synthesized SFX**:
    - `playBouncePad()` — Rubber whoopee-cushion bandpass frequency sweep + LFO flutter.
    - `playArmorClang()` — Metallic garbage-can lid harmonic ring (`880 / 1318.5 / 1760 Hz`).
    - `playGarlicPowerup()` — Spicy ascending harmonic fanfare + turbo jet burst.
    - `playStarCollect()` — Shimmering 5-note triangle/square chime (`C5 -> E6`).

---

## 2. Difficulty Philosophy ("Harder Than World 1, Fair & Joyful")

World 2 raises the skill ceiling over World 1 without introducing cheap or blind deaths:

| Dimension | World 1 (Sewer Kingdom) | World 2 (The Rotten Landfill) | Fairness Safeguards |
|---|---|---|---|
| **Enemy Variety** | Passive walkers (`poop`), micro-hoppers (`bacteria`), sine flyers (`fly`) | Proximity lungers (`maggot`), ranged lobbers (`skunk`), 2-HP armored mimics (`canmonster`) | Clear visual telegraphs (red eyes, tail raise, dented lid) & ledge turnarounds |
| **Platforming Surfaces** | Static ground, bridges, moving lifts | **Conveyor Belts** (`±1.65 px/f`), **Crumbling Soggy Cardboard**, **Bounce Pads**, **Methane Updrafts** | Cardboard shakes visibly for `34` frames (`~0.57s`) before collapsing and shows a ghost outline before overlap-safe respawn (`210` frames) |
| **Hazards** | Rotating castle `FireBar`s (`1-4` only) | Swinging **`TrashPendulum`** wrecking balls (`2-2`, `2-4`) + `FireBar`s (`2-4`) | Only the glowing spiked wrecking ball hurts (not the chain), leaving generous timing windows at swing extremes |
| **Player Power & Boosts** | Super Bean (`2x` air fart total: 1 ground + 1 air) | **Fermented Garlic Burrito (`GARLIC TURBO!`)**: **Triple Fart Jump** (1 ground + 2 air), `+15%` sprint speed, **piercing** gas shots, and **3-tier health buffer** | Damage steps down gracefully: `Garlic Turbo -> Super Bean -> Regular -> Knocked Out` |
| **Boss Battle** | `1-4` **King Poopa** (`6 HP`, linear sludge shot) | `2-4` **Emperor Garbagio** (`8 HP`, Phase 2 Enrage at `≤ 4 HP`, twin-spread junk bombs, converging conveyor arena) | Flanking **Whoopee Cushion Bounce Pads** + high tactical ledges in the arena + Pre-Boss Burrito Armory |

---

## 3. New Boosts, Collectibles & Goal System

### 🌯 Fermented Garlic Burrito (`type: 'burrito'`, Sprite: `garlic_burrito`)
Spawned from `?` blocks (`content: 'burrito'`). Grants **Garlic Turbo Mode** (`player.isGarlic = true`, `player.isSuper = true`):
1. **Triple Fart Jump (`airFartsLeft = 2`)**: Jump once from the ground (`vy = -11.3`), tap Jump in mid-air for a Double Fart (`vy = -9.8`, `"TOOT!"`), and tap Jump a **third time** for a cyan-violet **`"GARLIC JET!"`** (`vy = -10.3`)!
2. **Turbo Sprint (`+15%` Top Speed)**: Max ground/air horizontal speed rises from `3.4 -> 3.85 px/frame` (walk) and `4.4 -> 5.05 px/frame` (holding Gas/Sprint), trailing cyan exhaust puffs.
3. **Piercing Garlic Gas Bombs (`FartProjectile.isGarlic`)**: Faster (`vx = 8.5` vs `7.8` Super / `6.4` Regular), faster fire rate (`shootCooldown = 14` vs `26`), `2 damage` per hit (one-shots Armored Trashjaws and chunks Bosses for `2 HP`!), and **pierces through 1 enemy** (`pierceLeft = 1`) to hit a second monster behind it.
4. **3-Step Damage Cushion**: Taking a hit in Garlic Turbo mode steps Fartio down to **Super Bean Mode** (`isGarlic = false, isSuper = true`) with `90` frames of invincibility rather than shrinking straight to small Fartio.

### ⭐ Golden Stink Star Medals (`type: 'star'`, Sprites: `star_1`, `star_2`)
- **3 hidden/skill-based Star Medals** are placed in every World 2 stage (`2-1` through `2-4`, `12` total across World 2), tracked live in the HUD (`STARS X/3`) and tallied across the campaign (`W2: Y/12`) on the `2-4` finale screen.
- Each Star awards **`+1000` points** on pickup (`playStarCollect()`).
- Reaching the Goal with all **`3/3` Stink Stars** triggers a celebratory **`★ 3/3 STINK STARS! +3000 ★`** completion jackpot at the flagpole!

### 🌲 World 2 Goal Monument: Royal Pine-Fresh Deodorizer Tower & Bio-Compost Silo
- Replaces World 1's Brass Plunger Flagpole & Porcelain WC Castle across all World 2 stages:
  - **Chrome Deodorizer Mast**: Topped with an emerald-cyan aerosol spray nozzle that blasts mint mist on stage clear and lowers a giant **Pine-Tree Air-Freshener Pennant**.
  - **Bio-Compost Recycling Silo**: Riveted steel-teal dome with yellow hazard stripes, a spinning rooftop fresh-air turbine, and a neon `FRESH` doorway sign.
  - **Victory Bonuses**: Awards `PINE-FRESH BONUS` (scaled by grab height on the Deodorizer pole), `+3000` for `3/3` Stink Stars, and `+500` `GARLIC TURBO BONUS` if finishing in Garlic Turbo form.

---

## 4. New Interactive Environmental Objects

| Class / Tile Type | Where Used | Physics & Behavior Specification |
|---|---|---|
| **`BouncePad`** *(Whoopee Cushion)* | `2-1`, `2-2`, `2-3`, `2-4` | `36×14 px` inflatable pink rubber cushion on steel springs (`power = 1.0` default, tunable for elevated decks). Landing or stepping onto it launches Fartio at `vy = -13.6 * power` (`~7.2` tiles high at `1.0`) or **`vy = -15.0 * power` (`~8.8` tiles high at `1.0`)** when holding `Jump`, locks out early variable-jump release damping for the bounce ascent, **resets all mid-air Fart Jumps**, and awards `+50` pts (`"WHOOPEE!"`). |
| **`UpdraftVent`** *(Methane Geyser)* | `2-1`, `2-2`, `2-3`, `2-4` | `52×14 px` rusted compost nozzle emitting a translucent green thermal column (`liftTiles * 32 px` tall). Applies smooth upward buoyancy (`targetVy = -4.3`, or **`-7.4` holding `Jump`**) and **continuously refreshes mid-air Fart Jumps** for aerial geyser-surfing. |
| **`'conveyor_r'` / `'conveyor_l'`** *(Motorized Conveyor Belts)* | `2-2`, `2-4` | Solid `32×32` tiles rendered via `drawConveyorTile()` with animated hazard chevrons & spinning rollers. Applies `±1.65 px/frame` horizontal carry to Fartio, walking enemies (`±0.65 px/f`), and sliding collectibles (`±0.9 px/f`). |
| **`'cardboard'`** *(Soggy Crumbling Cardboard)* | `2-3`, `2-4` | Corrugated wet box tile (`tile_cardboard`). Standing on it starts a `34`-frame (`~0.57s`) warning jitter (`crumbling = true`), then collapses (`collapsed = true`) for `210` frames (`3.5s`) with flying cardboard debris. **Overlap-safe respawn** waits until no player or enemy occupies the tile before solidifying. |
| **`TrashPendulum`** *(Junk Wrecking Ball)* | `2-2`, `2-4` | Ceiling/beam-mounted iron chain (`chainLen` links × `19 px`) swinging sinusoidally (`angle = π/2 + sin(tick * speed + phase) * swingAmp`) with a `24×24` glowing spiked scrap ball (`r = 11 px` hitbox). |
| **Oil-Drum Pipes** (`drawOilDrumPipe`) | `2-1`, `2-2`, `2-3` | World 2's visual variant of `this.pipes`: ribbed yellow/olive hazardous waste drums oozing lime bio-sludge. |

---

## 5. New World 2 Bestiary & Boss AI

| Enemy Key | Name | Sprites | HP | Behavior & Counterplay |
|---|---|---|---|---|
| `'maggot'` | **Maggotron** *(Mutant Compost Grub)* | `maggot_1`, `maggot_2`, `maggot_squish` | `1` | `30×26 px` segmented larva with angry red eyes. Crawls (`1.15 px/f`) until Fartio enters `170 px` horizontal & `54 px` vertical range ahead—then **lunges toward Fartio at `2.20 px/f` (`~1.9×` speed, `lunging = true`)**! Stomp or gas (`+300` / `+250` pts). |
| `'skunk'` | **Stinktail** *(Mutant Junkyard Skunk)* | `skunk_1`, `skunk_2`, `skunk_squish` | `1` | `30×30 px` black-and-white striped skunk. Patrols ledges and every `120` frames pauses for a `20`-frame magenta tail-lift telegraph (`telegraphing = true`) before lobbing a bouncing **Rotten Stink-Egg (`BossSludgeBall`, `variant: 'stink_egg'`, gravity `0.16`)** with a fart-launch audio cue when within `370 px`. Stomp or gas (`+450` / `+400` pts). |
| `'canmonster'` | **Armored Trashjaw** *(Garbage-Can Mimic)* | `canmonster_1`, `canmonster_2`, `canmonster_dented`, `canmonster_squish` | `2` (gas) / `1` (stomp) | `30×30 px` galvanized steel bin with glowing yellow eyes & chomping lid. **Regular gas shots clang off its armor (`1 dmg`)**, denting its lid (`dented = true`) and angering it (`1.10 -> 1.65 px/f`); a **second regular gas shot**, **1 Super/Garlic blast (`2 dmg`)**, or **any head stomp** finishes it (`+500` / `+450` pts). |
| `'boss2'` | **Emperor Garbagio** *(World 2 Incinerator Boss)* | `boss2_1`, `boss2_2` (`24×24` scaled `2×` to `48×48`) | `8 HP` | **Phase 1 (`8..5 HP`)**: Patrols the Compactor Arena (`cols 114..133`) at `1.40 px/f`, performing heavy ground-pound leaps and hurling bouncing `trash_bomb` projectiles. **Phase 2 Enrage (`≤ 4 HP`)**: Flashes magenta-gold, speeds up to `1.95 px/f`, leaps more aggressively, and hurling **twin-spread bouncing Junk Bombs**! Stomps deal `2 HP`; regular gas deals `1 HP`; Super/Garlic gas deals `2 HP`. Defeat awards **`+8000` points**! |

---

## 6. Stage-by-Stage Level Design Blueprint (`game.js`)

### Stage `2-1` (Level `5`): **MOUNT GARBAGIO** — *Junkyard Dunes & Methane Geysers*
- **Length**: `150` cols (`4800 px`), Flagpole at `col 138`, Theme `'landfill'`, BGM `landfill`.
- **Pacing & Teaching Arc**:
  1. **Dumpster Taqueria Intro (`cols 10–16`)**: Safe introduction to `'scrap_brick'` crates and the first **Fermented Garlic Burrito** (`col 14, row 9`).
  2. **First Whoopee Cushion (`col 23.5`)**: Launches Fartio onto an elevated crate ledge before the first purple leachate ditch (`cols 29–31`).
  3. **Trashjaw Alley (`cols 33–51`)**: Introduces `maggot`, `canmonster`, and `skunk` in readable one-on-one encounters between biohazard oil drums.
  4. **Methane Geyser Gorge (`cols 53–66`)**: Central compost island (`cols 56–57`) with an `UpdraftVent` (`8.5` tiles lift) carrying Fartio to a high catwalk and **Stink Star #1 (`col 63, row 2`)**.
  5. **Scrapyard Stacks (`cols 70–88`)**: Second Burrito supply (`col 73`), Whoopee bounce (`col 75.5`) up to scrap rafters, Golden TP block, and **Stink Star #2 (`col 84, row 5`)**.
  6. **Oil-Drum Valley (`cols 90–119`)**: Whoopee mega-jump across `cols 91–94`, recessed bounce pocket at `col 107` launching high above a 4-tile oil drum for **Stink Star #3 (`col 110, row 4`)** with safe touchdown ground (`cols 112–117`) before leachate ditch `cols 118–119` and the compacted trash pyramid (`cols 126–131`).

### Stage `2-2` (Level `6`): **COMPACTOR FACTORY** — *Turbo Conveyors & Wrecking Pendulums*
- **Length**: `155` cols (`4960 px`), Flagpole at `col 143`, Theme `'factory'`, BGM `landfill`.
- **Key Setpieces**:
  1. **Tailwind Launch Ramp (`cols 20–25`)**: `'conveyor_r'` belt accelerates Fartio into a huge soaring leap over chemical vat `cols 26–29`.
  2. **Headwind Pendulum Press (`cols 34–42`)**: `'conveyor_l'` belt resists forward movement beneath the first swinging `TrashPendulum` (`col 38, row 8`).
  3. **Methane Factory Loft (`cols 46–55`)**: `UpdraftVent` (`8.6` tiles lift) to high catwalk for **Stink Star #1 (`col 51, row 2`)** while a `MovingPlatform` spans the lower vat.
  4. **Elevated Conveyor Chasm (`cols 78–88`)**: Suspended `'conveyor_r'` assembly bridge guarded by a central `TrashPendulum` (`col 83, row 5`) with **Stink Star #2 (`col 83, row 3`)** perched above the pivot.
  5. **Twin-Pendulum Crusher Line & Vault (`cols 93–118`)**: Counter-phased twin pendulums (`0` and `π` rad), Golden TP reward (`col 101`), and a final `BouncePad` (`col 113`) launching to **Stink Star #3 (`col 115, row 4`)**.

### Stage `2-3` (Level `7`): **MOLDY CHEESE MARSH** — *Soggy Cardboard & Fondue Bog*
- **Length**: `155` cols (`4960 px`), Flagpole at `col 143`, Theme `'marsh'`, BGM `marsh`.
- **Key Setpieces**:
  1. **Soggy Rafts Intro (`cols 15–26`)**: Two 5-tile `'cardboard'` spans teaching the `0.57s` shake-and-crumble rhythm before safe Swiss-rind Island #1 (`cols 28–32`).
  2. **Split High/Low Cardboard Route (`cols 32–50`)**: `BouncePad(32)` launches to the high soggy route (`cols 36–41`) holding **Stink Star #1 (`col 38, row 3`)**, with a forgiving lower soggy route + solid rind rest blocks underneath.
  3. **Chained Methane Geyser Canyon (`cols 74–90`)**: Three `UpdraftVent` geysers on 2-tile marsh pilings (`cols 74, 80, 86`) let Fartio surf mid-air across the boiling fondue bog and snag **Stink Star #2 (`col 80, row 4`)**.
  4. **Mid-Bog Bounce Dash (`cols 98–125`)**: Crumbling cardboard rafts with a mid-span `BouncePad(108, 8, 0.72)` launching cleanly to **Stink Star #3 (`col 111, row 3`)** and solid rind deck `cols 111–115` before the final sprint to shore.

### Stage `2-4` (Level `8`): **GARBAGIO'S INCINERATOR** — *Slag Furnace & Emperor Garbagio*
- **Length**: `158` cols (`5056 px`), Flagpole at `col 146`, Theme `'incinerator'`, BGM `incinerator`.
- **Key Setpieces**:
  1. **Firebar & Skylight Vault (`cols 19–38`)**: Rotating `FireBar` over molten slag pit #1, followed by an open furnace skylight (`cols 30–37`) where `BouncePad(31)` launches Fartio to **Stink Star #1 (`col 33, row 3`)**.
  2. **Furnace Conveyor Gauntlet (`cols 49–72`)**: Reverse `'conveyor_l'` belt under a `TrashPendulum` + `FireBar` combo, leading directly onto a 7-tile scorching `'cardboard'` bridge (`cols 66–72`).
  3. **Methane Furnace Chamber & Skylight #2 (`cols 75–104`)**: `UpdraftVent(76)` accesses the upper chamber for **Stink Star #2 (`col 82, row 4`)**; `BouncePad(89)` vaults pit `cols 90–92` through open skylight `cols 89–95` for **Stink Star #3 (`col 92, row 3`)** right before the Pre-Boss Garlic Armory (`col 100`).
  4. **Grand Compactor Boss Arena (`cols 112–136`)**: `25`-tile (`800 px`) suspended deck with **converging `'conveyor_r'` / `'conveyor_l'` belts** pulling toward a central incinerator anvil, **flanking Whoopee Cushion Bounce Pads** (`cols 113.4 & 134.6`, `power = 0.84`), two elevated dodging ledges (`row 6`), and **8-HP Emperor Garbagio**!

---

## 7. Extensibility Guide for Future Worlds (World 3+)

To add **World 3** (e.g., `levels 9..12`, `3-1` to `3-4`) cleanly in future builds:
1. **`LEVEL_INFO` (`game.js`)**: Add entries `9..12` with `code: '3-1'..'3-4'`, `world: 3`, `name`, `subtitle`, `theme`, and `goal`. Update `selectLevel` upper bound (`lvl > 12`), `advanceAfterVictory()` (`this.currentLevel < 12`), and non-boss auto-advance check in `update()`.
2. **Physics & Clearance Invariants**:
   - `TILE = 32`, `GROUND_ROW = 13` (`y = 416`), `VIEW_W = 800`, `VIEW_H = 480`.
   - Super/Garlic Fartio hitbox is `26×38 px` (small is `26×30 px`). **Always leave at least `2` empty vertical tiles (`64 px`)** in any walkable corridor or doorway so powered-up Fartio never gets pinched.
   - Standard single jump reaches `~4.95` tiles vertically (`159 px`) and `~5.9–7.7` tiles horizontally; Double Fart adds `+3.75` tiles height; Garlic Triple Fart adds another `+4.1` tiles height; `BouncePad` reaches `7.2–8.8` tiles height and calls `player.resetAirFarts()`.
3. **Sprites & Tiles (`sprites.js`)**:
   - Register `16×16` character/enemy/item pixel matrices (scaled `2×` to `32×32`) or `24×24` boss matrices (scaled `2×` to `48×48`) via `this.createPixelSprite(matrix, palette, 2)`.
   - Register `32×32` procedural tiles on `this.cache.tile_<name>` and render them inside `Game.draw()` + list non-breakable types in `unbreakableTypes` inside `Game.bumpBlock()`.
4. **Synthesized Audio (`audio.js`)**:
   - Add level BGM `bassSequence` and `leadSequence` arrays (32-step loops at `142 ms` per 16th-note step) inside `SoundEngine.startBGM()` keyed off `window.game.currentLevel`.
5. **UI & Warp Shortcuts (`index.html`, `style.css`, `game.js`)**:
   - Add `<button class="retro-btn lvl-btn ..." data-level="...">` pills to `.level-selector` and `.start-world-bar`; `Game.updateLevelButtons()` automatically binds and highlights any `.lvl-btn[data-level]`.
