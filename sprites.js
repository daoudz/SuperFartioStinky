// ============================================================================
// SUPER FARTIO BROS. - Detailed 8-Bit Pixel Art Sprite & Tile Renderer
// All visuals are hand-crafted pixel matrices & procedural pixel-art routines!
// ============================================================================

class SpriteBank {
    constructor() {
        this.cache = {};
        this.initSprites();
    }

    // Helper: Convert a 16x16 or 16x24 string grid into an offscreen pixel canvas
    createPixelSprite(grid, palette, scale = 2) {
        const height = grid.length;
        const width = grid[0].length;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        for (let y = 0; y < height; y++) {
            const row = grid[y];
            for (let x = 0; x < width; x++) {
                const ch = row[x];
                if (ch !== '.' && ch !== ' ' && palette[ch]) {
                    ctx.fillStyle = palette[ch];
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
        return canvas;
    }

    initSprites() {
        // --------------------------------------------------------------------
        // 1. FARTIO PALETTES (Normal & Bean-Powered Super Mode)
        // --------------------------------------------------------------------
        const fartioNormalPal = {
            'O': '#141812', // Dark pixel outline
            'H': '#68c41a', // Slime green cap & shirt
            'h': '#9ef038', // Cap highlight
            'W': '#ffffff', // Cap emblem / eye whites
            'S': '#f7be8f', // Skin tone
            's': '#d98f5c', // Skin shadow / bulbous nose shading
            'M': '#4a2c11', // Bushy brown mustache & hair
            'B': '#6e4720', // Grimy brown overalls
            'b': '#4d3013', // Overalls shadow
            'Y': '#ffd93d', // Brass overall buttons
            'K': '#2e1d0d', // Heavy sewer boots
            'G': '#8cff00'  // Fart gas accent
        };

        const fartioSuperPal = {
            'O': '#141812',
            'H': '#ff5500', // Chili-bean fiery orange-red cap & shirt
            'h': '#ffaa00', // Bright fiery highlight
            'W': '#ffffff',
            'S': '#f7be8f',
            's': '#d98f5c',
            'M': '#3d1e05',
            'B': '#52b814', // Radioactive green overalls
            'b': '#327808',
            'Y': '#ffff55',
            'K': '#29180b',
            'G': '#b8ff33'
        };

        // 16x16 Fartio Idle Frame
        const fartioIdleGrid = [
            "....OOOOOOOO....",
            "...OHHHHHhhhO...",
            "..OHHWWWHHhhHO..",
            "..OSSSSSSSSSSO..",
            ".OMMSSSWSOSSSSO.",
            ".OMMSSSWSSOsssO.",
            ".OOMSSSSMMMMMMO.",
            "...OSSSSSSSSOO..",
            "..OOHHBBBBHHOO..",
            ".OHHHHBBBBHHHHO.",
            ".OHHBYBBBBYBHHO.",
            ".OSSBBBBBBBBSSO.",
            ".OOSBBBBBBBBSOO.",
            "..OOBBB..BBBOO..",
            ".OOKKKO..OKKKOO.",
            ".OOOOOO..OOOOOO."
        ];

        // 16x16 Fartio Walk Frame 1 (stride open)
        const fartioWalk1Grid = [
            "....OOOOOOOO....",
            "...OHHHHHhhhO...",
            "..OHHWWWHHhhHO..",
            "..OSSSSSSSSSSO..",
            ".OMMSSSWSOSSSSO.",
            ".OMMSSSWSSOsssO.",
            ".OOMSSSSMMMMMMO.",
            "...OSSSSSSSSOO..",
            "..OOHHBBBBHHOO..",
            ".OHHHBBBBBBHHHO.",
            ".OSSBYBBBBYBSSO.",
            "..OOBBBBBBBBOO..",
            "..OBBBB..BBBBO..",
            ".OOKKKO...OKKKO.",
            ".OOOOO....OOOOO.",
            "................"
        ];

        // 16x16 Fartio Walk Frame 2 (arms/legs crossed)
        const fartioWalk2Grid = [
            "................",
            "....OOOOOOOO....",
            "...OHHHHHhhhO...",
            "..OHHWWWHHhhHO..",
            "..OSSSSSSSSSSO..",
            ".OMMSSSWSOSSSSO.",
            ".OMMSSSWSSOsssO.",
            ".OOMSSSSMMMMMMO.",
            "...OSSSSSSSSOO..",
            "...OHHBBBBHHO...",
            "..OHBBBBBBBBHO..",
            "..OSSSSSSSSSSO..",
            "..OOBBBBBBBBOO..",
            "...OOBBBBBBOO...",
            "...OOKKKKKKOO...",
            "...OOOOOOOOOO..."
        ];

        // 16x16 Fartio Jump Frame (knees tucked, butt out with green gas nozzle!)
        const fartioJumpGrid = [
            "....OOOOOOOO....",
            "...OHHHHHhhhO...",
            "..OHHWWWHHhhHO..",
            "..OSSSSSSSSSSO..",
            ".OMMSSSWSOSSSSO.",
            ".OMMSSSWSSOsssO.",
            ".OOMSSSSMMMMMMO.",
            "...OSSSSSSSSOO..",
            ".OOOHHBBBBHHOSSO",
            "OGOHBBBBBBBBHSSO",
            "GGOOBYBBBBYBOO..",
            ".GO.BBBBBBBBKKO.",
            "....OBBBBBBOO...",
            "...OOKKKO.......",
            "...OOOOO........",
            "................"
        ];

        this.cache.fartio_idle = this.createPixelSprite(fartioIdleGrid, fartioNormalPal, 2);
        this.cache.fartio_walk1 = this.createPixelSprite(fartioWalk1Grid, fartioNormalPal, 2);
        this.cache.fartio_walk2 = this.createPixelSprite(fartioWalk2Grid, fartioNormalPal, 2);
        this.cache.fartio_jump = this.createPixelSprite(fartioJumpGrid, fartioNormalPal, 2);

        this.cache.super_idle = this.createPixelSprite(fartioIdleGrid, fartioSuperPal, 2);
        this.cache.super_walk1 = this.createPixelSprite(fartioWalk1Grid, fartioSuperPal, 2);
        this.cache.super_walk2 = this.createPixelSprite(fartioWalk2Grid, fartioSuperPal, 2);
        this.cache.super_jump = this.createPixelSprite(fartioJumpGrid, fartioSuperPal, 2);

        // --------------------------------------------------------------------
        // 2. POOP ENEMY ("TURDION" - Swirled Poop Goomba with Corn & Angry Eyes)
        // --------------------------------------------------------------------
        const poopPalette = {
            'O': '#1f1105', // Dark chocolate outline
            'D': '#522d0e', // Deep shadow brown
            'P': '#7d481b', // Primary poop brown
            'L': '#a6652c', // Highlight brown sheen
            'W': '#ffffe0', // Eye white
            'R': '#ff2200', // Angry pupil / eyebrow
            'C': '#ffd700', // Undigested corn spec!
            'F': '#2e1806'  // Little marching feet
        };

        const poopWalk1 = [
            "......OOOO......",
            ".....OPPLPO.....",
            "....OPPLLPOO....",
            "....ODPPPPDO....",
            "...OOPPLLPPOO...",
            "..OPPPCPPPPPPO..",
            "..ODDWWPPWWDDO..",
            ".OPPPWRPPWRPPPO.",
            ".OPPPWWPPWWPPPO.",
            ".ODPPPPPPPPPPDO.",
            "OOPPPLPPPPCPPPPO",
            "OPPPPPPPPPPPPPPO",
            "ODDDDDDDDDDDDDDO",
            ".OOOOOOOOOOOOOO.",
            "..OFFFO....OFFO.",
            "..OOOOO....OOOO."
        ];

        const poopWalk2 = [
            "......OOOO......",
            ".....OPPLPO.....",
            "....OPPLLPOO....",
            "....ODPPPPDO....",
            "...OOPPLLPPOO...",
            "..OPPPCPPPPPPO..",
            "..ODDWWPPWWDDO..",
            ".OPPPWRPPWRPPPO.",
            ".OPPPWWPPWWPPPO.",
            ".ODPPPPPPPPPPDO.",
            "OOPPPLPPPPCPPPPO",
            "OPPPPPPPPPPPPPPO",
            "ODDDDDDDDDDDDDDO",
            ".OOOOOOOOOOOOOO.",
            ".OFFO....OFFFO..",
            ".OOOO....OOOOO.."
        ];

        const poopSquished = [
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "....OOOOOOOO....",
            "..OOPPPLLLPPPO..",
            ".OPPWWPPPPWWPPO.",
            "OOPPWRCPPPWRPPPO",
            "ODDDDDDDDDDDDDDO",
            "OOOOOOOOOOOOOOOO",
            "................",
            "................"
        ];

        this.cache.poop_1 = this.createPixelSprite(poopWalk1, poopPalette, 2);
        this.cache.poop_2 = this.createPixelSprite(poopWalk2, poopPalette, 2);
        this.cache.poop_squish = this.createPixelSprite(poopSquished, poopPalette, 2);

        // --------------------------------------------------------------------
        // 3. BACTERIA ENEMY ("GERMOID" - Spiky Toxic Microbe)
        // --------------------------------------------------------------------
        const bacteriaPalette = {
            'O': '#0c2906', // Dark membrane outline
            'G': '#38b016', // Outer slime body
            'L': '#8cff26', // Neon cytoplasm highlight
            'N': '#b829d9', // Purple cell organelles / spots
            'W': '#ffffff', // Eye sclera
            'E': '#ff0044', // Bloodshot pupil
            'M': '#133d09'  // Jagged mouth
        };

        const bacteria1 = [
            "..O...OOOO...O..",
            "...O.OGLLGO.O...",
            "..OOOGLLLLGOOO..",
            ".OGGGGLLLLGGGGO.",
            "OOGNNGGGGGGNNGGO",
            ".OGWWGGGGGGWWGO.",
            "OOGWEOGLLGOWEGOO",
            ".OGWWOGLLGOWWGO.",
            ".OGGGGGGGGGGGGO.",
            "OOGGOMOMOMOMOGOO",
            ".OGGOMOLLOMOGGO.",
            ".OGGGGNGGGNGGGO.",
            "..OOOGGGGGGOOO..",
            "..O..OOOOOO..O..",
            ".O....O..O....O.",
            ".....O....O....."
        ];

        const bacteria2 = [
            "....O.OOOO.O....",
            "..O..OGLLGO..O..",
            ".O.OOGLLLLGOO.O.",
            "..OGGGLLLLGGGO..",
            ".OGNNGGGGGGNNG O.".replace(' ', ''),
            "OOGWWGGGGGGWWGOO",
            ".OGWEOGLLGOWEGO.",
            "OOGWWOGLLGOWWGOO",
            ".OGGGGGGGGGGGGO.",
            ".OGGOMOMOMOMOGO.",
            "OOGGOMOLLOMOGGOO",
            "..OGGGNGGGNGGO..",
            ".O.OOOGGGGOOO.O.",
            "....O.OOOO.O....",
            "...O...OO...O...",
            "..O..........O.."
        ];

        const bacteriaSquish = [
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "...OOOOOOOOOO...",
            ".OOGGLLLLLLGGOO.",
            "OGGWWEGNNGEWWGGO",
            "OGGGGGGGGGGGGGGO",
            "OOOOOOOOOOOOOOOO",
            "................",
            "................"
        ];

        this.cache.bacteria_1 = this.createPixelSprite(bacteria1, bacteriaPalette, 2);
        this.cache.bacteria_2 = this.createPixelSprite(bacteria2, bacteriaPalette, 2);
        this.cache.bacteria_squish = this.createPixelSprite(bacteriaSquish, bacteriaPalette, 2);

        // --------------------------------------------------------------------
        // 4. COLLECTIBLES: GOLDEN COIN, BEAN CAN POWERUP, TOILET PAPER
        // --------------------------------------------------------------------
        const coinPalette = {
            'O': '#2e1d00',
            'G': '#e6a800',
            'Y': '#ffe63b',
            'W': '#ffffff'
        };

        const coinFrame1 = [
            "....OOOOOOOO....",
            "...OYYYYYYYYO...",
            "..OYYWWWWWWYYO..",
            ".OYYWGGGGGGWYYO.",
            ".OYWGGYYYYGGWYO.",
            ".OYWGYWWWWYGWYO.",
            ".OYWGYWGGWYGWYO.",
            ".OYWGYWGGWYGWYO.",
            ".OYWGYWGGWYGWYO.",
            ".OYWGYWGGWYGWYO.",
            ".OYWGGYYYYGGWYO.",
            ".OYYWGGGGGGWYYO.",
            "..OYYGGGGGGYYO..",
            "...OGGGGGGGGO...",
            "....OOOOOOOO....",
            "................"
        ];

        const coinFrame2 = [
            ".....OOOOOO.....",
            "....OYYYYYYO....",
            "...OYYWWWWYYO...",
            "...OYWGGGGWYO...",
            "...OYWGYGWYGO...",
            "...OYWGYGWYGO...",
            "...OYWGYGWYGO...",
            "...OYWGYGWYGO...",
            "...OYWGYGWYGO...",
            "...OYWGYGWYGO...",
            "...OYWGGGGWYO...",
            "...OYYGGGGYYO...",
            "....OGGGGGGO....",
            ".....OOOOOO.....",
            "................",
            "................"
        ];

        this.cache.coin_1 = this.createPixelSprite(coinFrame1, coinPalette, 2);
        this.cache.coin_2 = this.createPixelSprite(coinFrame2, coinPalette, 2);

        // Magic Baked Beans Can (Power-Up!)
        const beanPalette = {
            'O': '#1a110b',
            'S': '#a8b8c0', // Tin silver rim
            'W': '#ffffff', // Specular shine
            'R': '#d92b14', // Red label
            'Y': '#ffcc00', // Gold stripe / bean text
            'B': '#7d3814', // Baked bean icon
            'G': '#8cff1a'  // Stink energy glow
        };

        const beanCanGrid = [
            "..G...OOOO...G..",
            "...OOOOOOOOOO...",
            "..OSSWWWWWWSSO..",
            "..OSSSSSSSSSSO..",
            "..OOOOOOOOOOOO..",
            "..ORRYYYYYYRRO..",
            "..ORRYBBBBYRRO..",
            "..ORWBBBBBBWRO..",
            "..ORRYBBBBYRRO..",
            "..ORRYYYYYYRRO..",
            "..ORRRRRRRRRRO..",
            "..OOOOOOOOOOOO..",
            "..OSSWWWWWWSSO..",
            "...OOOOOOOOOO...",
            "................",
            "................"
        ];
        this.cache.bean_can = this.createPixelSprite(beanCanGrid, beanPalette, 2);

        // Golden Roll of Toilet Paper (Bonus item!)
        const tpPalette = {
            'O': '#1c241e',
            'W': '#f5fff8',
            'S': '#c4d9cc',
            'C': '#8c6239', // Cardboard tube
            'G': '#ffd700'  // Gold trim
        };

        const tpGrid = [
            "................",
            "...OOOOOOOOOO...",
            "..OWWWWWWWWWWO..",
            ".OWWWOOOOOOWWWO.",
            ".OWWOCCCCCCOWWO.",
            ".OWWOCOOOOOCWWO.",
            ".OWWWOOOOOOWWWO.",
            ".OWWWWWWWWWWWWO.",
            ".OGGGGGGGGGGGGO.",
            ".OWWWWWWWWWWWWO.",
            ".OSSSSSSSSSSSSO.",
            ".OWWWWWWWOOOOOO.",
            ".OSSSSSSSO......",
            ".OWWWWWWWO......",
            "..OOOOOOO.......",
            "................"
        ];
        this.cache.toilet_paper = this.createPixelSprite(tpGrid, tpPalette, 2);

        // --------------------------------------------------------------------
        // 4B. WINGED MUTANT SEWER FLY ("BUZZGERM" - Flying / Hopping Pest)
        // --------------------------------------------------------------------
        const flyPalette = {
            'O': '#0c1f14',
            'W': '#d8f8ff', // Translucent buzzing wings
            'w': '#8cd6eb', // Wing vein
            'B': '#4a2e6b', // Mutant purple thorax
            'L': '#8cff26', // Toxic green abdomen glow
            'R': '#ff1133', // Compound bug eyes
            'Y': '#ffff55'
        };

        const flyFrame1 = [
            ".OOOO......OOOO.",
            "OWWWwO....OwWWWO",
            "OWWWWwOOOOwWWWWO",
            ".OwwwwBBBBwwwwO.",
            "..OOORBOOORBOOO.",
            "...ORRYBBRRYBO..",
            "...OOBBBBBBBBO..",
            "..OOOBLLLLLBOOO.",
            ".O..OBLLLLLBO..O",
            "....OBBBBBBBBO..",
            "....OOBLLLLBOO..",
            "...O..OOOOOO..O.",
            "..O....O..O....O",
            "................",
            "................",
            "................"
        ];

        const flyFrame2 = [
            "................",
            "................",
            ".....OOOOOO.....",
            "....ORBOOORBO...",
            "...ORRYBBRRYBO..",
            ".OOOOOBBBBBBOOOO",
            "OWWWWwBLLLLwWWWO",
            "OWWWWWBLLLLWWWWO",
            ".OOOOOBBBBBBOOOO",
            "....OOBLLLLBOO..",
            "...O..OOOOOO..O.",
            "..O....O..O....O",
            "................",
            "................",
            "................",
            "................"
        ];

        const flySquish = [
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "..OOOOOOOOOOOO..",
            ".OWWWRRBLLRRWWWO",
            "OWWWBBBBBBBBWWWO",
            ".OOOOOOOOOOOOOO.",
            "................",
            "................",
            "................"
        ];

        this.cache.fly_1 = this.createPixelSprite(flyFrame1, flyPalette, 2);
        this.cache.fly_2 = this.createPixelSprite(flyFrame2, flyPalette, 2);
        this.cache.fly_squish = this.createPixelSprite(flySquish, flyPalette, 2);

        // --------------------------------------------------------------------
        // 4C. KING POOPA (WORLD 1-4 BOSS - Giant Crowned Royal Turd Monarch)
        // --------------------------------------------------------------------
        const bossPalette = {
            'O': '#1a0d04', // Dark outline
            'G': '#ffd700', // Royal gold crown
            'g': '#d98c00', // Crown shading
            'J': '#ff1144', // Crown ruby jewel
            'E': '#5eff00', // Crown emerald / toxic aura
            'P': '#7d4418', // Boss poop brown
            'L': '#a86228', // Poop sheen highlight
            'D': '#4f280a', // Deep crease shadow
            'W': '#ffffff', // Fangs & sclera
            'R': '#ff2200', // Glowing fury eyes
            'C': '#ffcc00'  // Royal corn / gold studs
        };

        const bossFrame1 = [
            "......OO...OO...OO......",
            ".....OGGO.OGGO.OGGO.....",
            ".....OGGGOOGGGOOGGGO....",
            ".....OGgJggGgEggJggO....",
            ".....OgggggggggggggO....",
            ".....OOOOOOOOOOOOOOO....",
            "....OOPPPLLLLLLPPPPOO...",
            "...OPPPPLLLLLLLLPPPPO...",
            "...ODDDDDDDDDDDDDDDDO...",
            "..OOPPPRRWWPPPWWWRRPPOO.",
            ".OOPPPPRRWWPPPWWWRRPPPPO",
            ".OPPLPPPPPPPPPPPPPPPLPPO",
            ".ODDDDDDDDDDDDDDDDDDDDDO",
            "OOPPPPPCPPPPPPPPPCPPPPPO",
            "OPPLPPPPPPPPPPPPPPPPPLPO",
            "OPPPPPPOOOOOOOOOOOPPPPPO",
            "OPPPPPOOWOWWWWWOWOOPPPPO",
            "ODDDDDOOOOOOOOOOOOODDDDO",
            "OOPPPPPPPPPPPPPPPPPPPPPO",
            ".OPPPPLPPPPCPPPPPLPPPPO.",
            ".ODDDDDDDDDDDDDDDDDDDDO.",
            "..OOOOOOOOOOOOOOOOOOOO..",
            "...OODDDDOO....OODDDDO..",
            "...OOOOOOOO....OOOOOOOO."
        ];

        const bossFrame2 = [
            "........................",
            "......OO...OO...OO......",
            ".....OGGO.OGGO.OGGO.....",
            ".....OGGGOOGGGOOGGGO....",
            ".....OGgJggGgEggJggO....",
            ".....OgggggggggggggO....",
            ".....OOOOOOOOOOOOOOO....",
            "....OOPPPLLLLLLPPPPOO...",
            "...OPPPPLLLLLLLLPPPPO...",
            "...ODDDDDDDDDDDDDDDDO...",
            "..OOPPPRRWWPPPWWWRRPPOO.",
            ".OOPPPPRRWWPPPWWWRRPPPPO",
            ".OPPLPPPPPPPPPPPPPPPLPPO",
            ".ODDDDDDDDDDDDDDDDDDDDDO",
            "OOPPPPPCPPPPPPPPPCPPPPPO",
            "OPPLPPPPPPPPPPPPPPPPPLPO",
            "OPPPPPPOOOOOOOOOOOPPPPPO",
            "OPPPPPOOWOWWWWWOWOOPPPPO",
            "ODDDDDOOOOOOOOOOOOODDDDO",
            "OOPPPPPPPPPPPPPPPPPPPPPO",
            ".ODDDDDDDDDDDDDDDDDDDDO.",
            "..OOOOOOOOOOOOOOOOOOOO..",
            "..OODDDDOO......OODDDDO.",
            "..OOOOOOOO......OOOOOOOO"
        ];

        this.cache.boss_1 = this.createPixelSprite(bossFrame1, bossPalette, 2);
        this.cache.boss_2 = this.createPixelSprite(bossFrame2, bossPalette, 2);

        // --------------------------------------------------------------------
        // 5. TILES: SEWER GROUND, CRUSTY BRICKS, ? BLOCKS, EMPTY BLOCK
        // --------------------------------------------------------------------
        this.buildTileSprites();
    }

    buildTileSprites() {
        // 32x32 Sewer Ground Tile (Stonework with green slime top crust)
        const ground = document.createElement('canvas');
        ground.width = 32;
        ground.height = 32;
        const gctx = ground.getContext('2d');

        // Base dark sewer mortar
        gctx.fillStyle = '#111c15';
        gctx.fillRect(0, 0, 32, 32);

        // Stone blocks
        gctx.fillStyle = '#2d4736';
        gctx.fillRect(2, 6, 13, 11);
        gctx.fillRect(17, 6, 13, 11);
        gctx.fillRect(2, 19, 8, 11);
        gctx.fillRect(12, 19, 18, 11);

        // Stone highlights
        gctx.fillStyle = '#43694f';
        gctx.fillRect(2, 6, 13, 2);
        gctx.fillRect(17, 6, 13, 2);
        gctx.fillRect(12, 19, 18, 2);

        // Stone shadows
        gctx.fillStyle = '#1d3023';
        gctx.fillRect(2, 15, 13, 2);
        gctx.fillRect(17, 15, 13, 2);
        gctx.fillRect(12, 28, 18, 2);

        // Toxic green moss/slime top edge with drips
        gctx.fillStyle = '#5ac418';
        gctx.fillRect(0, 0, 32, 5);
        gctx.fillRect(4, 5, 4, 3);
        gctx.fillRect(14, 5, 3, 5);
        gctx.fillRect(25, 5, 4, 4);

        gctx.fillStyle = '#9eff3b';
        gctx.fillRect(0, 0, 32, 2);
        this.cache.tile_ground = ground;

        // 32x32 Destructible Sewer Brick Tile
        const brick = document.createElement('canvas');
        brick.width = 32;
        brick.height = 32;
        const bctx = brick.getContext('2d');

        bctx.fillStyle = '#1c140d'; // Dark mortar
        bctx.fillRect(0, 0, 32, 32);

        const drawBrickRow = (y, offset) => {
            for (let x = -offset; x < 32; x += 16) {
                const bx = Math.max(0, x + 1);
                const bw = Math.min(32, x + 15) - bx;
                if (bw > 0) {
                    bctx.fillStyle = '#754c24';
                    bctx.fillRect(bx, y + 1, bw, 6);
                    bctx.fillStyle = '#9c6b3b';
                    bctx.fillRect(bx, y + 1, bw, 2);
                    bctx.fillStyle = '#4f3113';
                    bctx.fillRect(bx, y + 5, bw, 2);
                }
            }
        };
        drawBrickRow(0, 0);
        drawBrickRow(8, 8);
        drawBrickRow(16, 0);
        drawBrickRow(24, 8);

        // Tiny green moss spec on brick
        bctx.fillStyle = '#5ac418';
        bctx.fillRect(6, 8, 4, 2);
        bctx.fillRect(22, 16, 5, 2);
        this.cache.tile_brick = brick;

        // 32x32 Question Block ( Brass Sewer Tank with '?' )
        const qblock = document.createElement('canvas');
        qblock.width = 32;
        qblock.height = 32;
        const qctx = qblock.getContext('2d');

        qctx.fillStyle = '#1f1605';
        qctx.fillRect(0, 0, 32, 32);
        qctx.fillStyle = '#d99114';
        qctx.fillRect(2, 2, 28, 28);
        qctx.fillStyle = '#ffd230';
        qctx.fillRect(2, 2, 28, 3);
        qctx.fillRect(2, 2, 3, 28);
        qctx.fillStyle = '#8f5806';
        qctx.fillRect(2, 27, 28, 3);
        qctx.fillRect(27, 2, 3, 28);

        // Corner rivets
        qctx.fillStyle = '#3d2604';
        qctx.fillRect(4, 4, 2, 2);
        qctx.fillRect(26, 4, 2, 2);
        qctx.fillRect(4, 26, 2, 2);
        qctx.fillRect(26, 26, 2, 2);

        // '?' Mark shadow & foreground
        const drawQMark = (ox, oy, color) => {
            qctx.fillStyle = color;
            qctx.fillRect(11 + ox, 7 + oy, 10, 3);
            qctx.fillRect(9 + ox, 9 + oy, 4, 4);
            qctx.fillRect(19 + ox, 9 + oy, 4, 5);
            qctx.fillRect(14 + ox, 14 + oy, 6, 3);
            qctx.fillRect(14 + ox, 17 + oy, 4, 3);
            qctx.fillRect(14 + ox, 22 + oy, 4, 4);
        };
        drawQMark(2, 2, '#5c3602');
        drawQMark(0, 0, '#fff7cc');
        this.cache.tile_qblock = qblock;

        // 32x32 Empty/Used Iron Block
        const eblock = document.createElement('canvas');
        eblock.width = 32;
        eblock.height = 32;
        const ectx = eblock.getContext('2d');
        ectx.fillStyle = '#141a16';
        ectx.fillRect(0, 0, 32, 32);
        ectx.fillStyle = '#46544a';
        ectx.fillRect(2, 2, 28, 28);
        ectx.fillStyle = '#627568';
        ectx.fillRect(2, 2, 28, 2);
        ectx.fillStyle = '#2d3830';
        ectx.fillRect(2, 28, 28, 2);
        ectx.fillStyle = '#1f2621';
        ectx.fillRect(5, 5, 2, 2);
        ectx.fillRect(25, 5, 2, 2);
        ectx.fillRect(5, 25, 2, 2);
        ectx.fillRect(25, 25, 2, 2);
        this.cache.tile_empty = eblock;

        // 32x32 Industrial Copper/Iron Pipeworks Tile (World 1-2)
        const pground = document.createElement('canvas');
        pground.width = 32;
        pground.height = 32;
        const pctx = pground.getContext('2d');
        pctx.fillStyle = '#181410';
        pctx.fillRect(0, 0, 32, 32);
        pctx.fillStyle = '#4a3a28';
        pctx.fillRect(2, 6, 13, 11);
        pctx.fillRect(17, 6, 13, 11);
        pctx.fillRect(2, 19, 18, 11);
        pctx.fillRect(22, 19, 8, 11);
        pctx.fillStyle = '#73583a';
        pctx.fillRect(2, 6, 13, 2);
        pctx.fillRect(17, 6, 13, 2);
        pctx.fillRect(2, 19, 18, 2);
        // Brass top plate & slime sheen
        pctx.fillStyle = '#8c9e18';
        pctx.fillRect(0, 0, 32, 5);
        pctx.fillStyle = '#d4ff24';
        pctx.fillRect(0, 0, 32, 2);
        this.cache.tile_pipe_ground = pground;

        // 32x32 Suspended Catwalk Bridge Tile (World 1-3 & 1-4 Boss Bridge)
        const bridge = document.createElement('canvas');
        bridge.width = 32;
        bridge.height = 32;
        const brctx = bridge.getContext('2d');
        brctx.fillStyle = '#141a16';
        brctx.fillRect(0, 0, 32, 18);
        // Steel handrail / top deck
        brctx.fillStyle = '#788a7d';
        brctx.fillRect(0, 0, 32, 5);
        brctx.fillStyle = '#b4c9ba';
        brctx.fillRect(0, 0, 32, 2);
        // Cross-truss struts
        brctx.fillStyle = '#435448';
        brctx.fillRect(2, 6, 6, 10);
        brctx.fillRect(13, 6, 6, 10);
        brctx.fillRect(24, 6, 6, 10);
        // Slime spots
        brctx.fillStyle = '#72e01b';
        brctx.fillRect(6, 0, 8, 3);
        brctx.fillRect(20, 0, 6, 4);
        this.cache.tile_bridge = bridge;

        // 32x32 Obsidian & Scorched Porcelain Castle Stone Tile (World 1-4)
        const castle = document.createElement('canvas');
        castle.width = 32;
        castle.height = 32;
        const cctx = castle.getContext('2d');
        cctx.fillStyle = '#0d090b';
        cctx.fillRect(0, 0, 32, 32);
        cctx.fillStyle = '#2e2227';
        cctx.fillRect(1, 1, 14, 14);
        cctx.fillRect(17, 1, 14, 14);
        cctx.fillRect(1, 17, 9, 14);
        cctx.fillRect(12, 17, 19, 14);
        cctx.fillStyle = '#4a363f';
        cctx.fillRect(1, 1, 14, 2);
        cctx.fillRect(17, 1, 14, 2);
        cctx.fillRect(12, 17, 19, 2);
        cctx.fillStyle = '#1c1317';
        cctx.fillRect(1, 13, 14, 2);
        cctx.fillRect(17, 13, 14, 2);
        cctx.fillRect(12, 29, 19, 2);
        this.cache.tile_castle = castle;
    }

    // Draw a detailed 8-bit Sewer Pipe of any height on the main canvas
    drawSewerPipe(ctx, x, y, width, height) {
        const lipHeight = 28;
        const bodyX = x + 4;
        const bodyW = width - 8;

        // Pipe Body
        ctx.fillStyle = '#0d210b';
        ctx.fillRect(bodyX, y + lipHeight, bodyW, height - lipHeight);

        ctx.fillStyle = '#226b19';
        ctx.fillRect(bodyX + 2, y + lipHeight, bodyW - 4, height - lipHeight);

        // Pipe Vertical Specular Highlight Stripes
        ctx.fillStyle = '#47ad36';
        ctx.fillRect(bodyX + 8, y + lipHeight, 10, height - lipHeight);
        ctx.fillStyle = '#85eb67';
        ctx.fillRect(bodyX + 11, y + lipHeight, 4, height - lipHeight);

        // Pipe Right-side dark shading
        ctx.fillStyle = '#14450e';
        ctx.fillRect(bodyX + bodyW - 14, y + lipHeight, 12, height - lipHeight);

        // Pipe Rim / Lip at Top
        ctx.fillStyle = '#0d210b';
        ctx.fillRect(x, y, width, lipHeight);

        ctx.fillStyle = '#297d1e';
        ctx.fillRect(x + 2, y + 2, width - 4, lipHeight - 4);

        ctx.fillStyle = '#47ad36';
        ctx.fillRect(x + 10, y + 2, 12, lipHeight - 4);

        ctx.fillStyle = '#85eb67';
        ctx.fillRect(x + 13, y + 2, 5, lipHeight - 4);

        ctx.fillStyle = '#14450e';
        ctx.fillRect(x + width - 16, y + 2, 14, lipHeight - 4);

        // Dripping Toxic Sludge on the Pipe Rim
        ctx.fillStyle = '#9eff24';
        ctx.fillRect(x + 6, y + 2, 10, 5);
        ctx.fillRect(x + 8, y + 7, 4, 8);
        ctx.fillRect(x + width - 22, y + 2, 8, 4);
        ctx.fillRect(x + width - 20, y + 6, 3, 6);
    }
}

window.sprites = new SpriteBank();
