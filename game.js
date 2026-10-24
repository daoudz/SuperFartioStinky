// ============================================================================
// SUPER FARTIO BROS. - Core Game Engine, World 1 (Levels 1-1 to 1-4) & Physics
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const TILE = 32;
const VIEW_W = canvas.width;   // 800
const VIEW_H = canvas.height;  // 480
const GROUND_ROW = 13;         // Y = 13 * 32 = 416 (2 rows of ground: 13 & 14)

// Input state
const keys = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    shoot: false,
    shootPressed: false
};

window.addEventListener('keydown', (e) => {
    const code = e.code;
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = true;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = true;
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') {
        if (!keys.jump) keys.jumpPressed = true;
        keys.jump = true;
        e.preventDefault();
    }
    if (code === 'KeyX' || code === 'KeyJ' || code === 'KeyZ' || code === 'ShiftLeft' || code === 'ShiftRight') {
        if (!keys.shoot) keys.shootPressed = true;
        keys.shoot = true;
    }
    if (code === 'KeyR') {
        game.resetLevel();
    }
    if (code === 'Enter' || code === 'KeyN') {
        if (game.state === 'VICTORY') {
            game.advanceAfterVictory();
        }
    }
    if (code === 'Digit1') game.selectLevel(1);
    if (code === 'Digit2') game.selectLevel(2);
    if (code === 'Digit3') game.selectLevel(3);
    if (code === 'Digit4') game.selectLevel(4);

    // Start audio context on first interaction
    window.soundFX.init();
    if (window.soundFX.bgmEnabled && !window.soundFX.bgmPlaying && game.state === 'PLAYING') {
        window.soundFX.startBGM();
    }
});

window.addEventListener('keyup', (e) => {
    const code = e.code;
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = false;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = false;
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') keys.jump = false;
    if (code === 'KeyX' || code === 'KeyJ' || code === 'KeyZ' || code === 'ShiftLeft' || code === 'ShiftRight') keys.shoot = false;
});

// UI Buttons
document.getElementById('btn-music').addEventListener('click', (e) => {
    const enabled = window.soundFX.toggleBGM();
    e.target.textContent = enabled ? '🎵 BGM: ON' : '🔇 BGM: OFF';
    e.target.classList.toggle('active', enabled);
    e.target.blur();
});

document.getElementById('btn-crt').addEventListener('click', (e) => {
    const container = document.getElementById('canvas-container');
    const isCrt = container.classList.toggle('crt-effect');
    e.target.textContent = isCrt ? '📺 CRT: ON' : '📺 CRT: OFF';
    e.target.classList.toggle('active', isCrt);
    e.target.blur();
});

document.getElementById('btn-restart').addEventListener('click', (e) => {
    game.resetLevel();
    e.target.blur();
});

document.querySelectorAll('.lvl-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const lvl = parseInt(btn.getAttribute('data-level'), 10);
        game.selectLevel(lvl);
        btn.blur();
    });
});

// ============================================================================
// PARTICLE & VISUAL FX SYSTEMS
// ============================================================================

class GasParticle {
    constructor(x, y, vx, vy, size, color, life = 35) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.maxLife = life;
        this.life = life;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.94;
        this.vy -= 0.04; // Gas rises slightly
        this.size += 0.22;
        this.life--;
    }

    draw(ctx, camX) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = this.color;
        const sx = Math.round(this.x - camX);
        const sy = Math.round(this.y);
        const r = Math.round(this.size);
        // Pixelated puff cluster
        ctx.fillRect(sx - r, sy - r + 2, r * 2, r * 2 - 4);
        ctx.fillRect(sx - r + 2, sy - r, r * 2 - 4, r * 2);
        ctx.restore();
    }
}

class DebrisParticle {
    constructor(x, y, vx, vy, color, size = 6) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = 50;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.42; // Gravity
        this.life--;
    }

    draw(ctx, camX) {
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.round(this.x - camX), Math.round(this.y), this.size, this.size);
        ctx.fillStyle = '#1a1108';
        ctx.strokeRect(Math.round(this.x - camX), Math.round(this.y), this.size, this.size);
    }
}

class FloatingText {
    constructor(x, y, text, color = '#ffe63b') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 45;
    }

    update() {
        this.y -= 1.1;
        this.life--;
    }

    draw(ctx, camX) {
        ctx.save();
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#000';
        ctx.fillText(this.text, Math.round(this.x - camX) + 2, Math.round(this.y) + 2);
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, Math.round(this.x - camX), Math.round(this.y));
        ctx.restore();
    }
}

// ============================================================================
// FART GAS PROJECTILE (Shot when Fartio presses Shoot!)
// ============================================================================

class FartProjectile {
    constructor(x, y, dir, isSuper = false) {
        this.x = x;
        this.y = y;
        this.r = isSuper ? 9 : 7;
        this.vx = dir * (isSuper ? 7.8 : 6.4);
        this.vy = 2.2;
        this.isSuper = isSuper;
        this.bounces = 0;
        this.maxBounces = isSuper ? 5 : 4;
        this.life = 140;
        this.dead = false;
        this.tick = 0;
    }

    update(game) {
        this.tick++;
        this.x += this.vx;
        this.vy += 0.34;
        this.y += this.vy;
        this.life--;

        if (this.life <= 0) {
            this.dead = true;
            return;
        }

        // Emit mini gas trail
        if (this.tick % 2 === 0) {
            game.particles.push(new GasParticle(
                this.x,
                this.y,
                -this.vx * 0.15,
                (Math.random() - 0.5) * 0.8,
                this.isSuper ? 5 : 4,
                this.isSuper ? '#ffaa00' : '#8cff1a',
                16
            ));
        }

        // Check floor collision to bounce like Mario's fireball
        const bottomTile = game.getSolidTileAt(this.x, this.y + this.r);
        if (bottomTile) {
            this.y = bottomTile.y - this.r;
            this.vy = -5.2;
            this.bounces++;
            if (this.bounces > this.maxBounces) {
                this.burst(game);
                return;
            }
        }

        // Check side wall collision
        const sideTile = game.getSolidTileAt(this.x + Math.sign(this.vx) * this.r, this.y);
        if (sideTile) {
            this.burst(game);
            return;
        }

        // Check Enemy collision
        for (const enemy of game.enemies) {
            if (!enemy.dead && !enemy.flipped && !enemy.squished &&
                this.x + this.r > enemy.x &&
                this.x - this.r < enemy.x + enemy.w &&
                this.y + this.r > enemy.y &&
                this.y - this.r < enemy.y + enemy.h) {
                enemy.killByGas(game, Math.sign(this.vx), this.isSuper ? 2 : 1);
                this.burst(game);
                return;
            }
        }
    }

    burst(game) {
        this.dead = true;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            game.particles.push(new GasParticle(
                this.x,
                this.y,
                Math.cos(angle) * 2.5,
                Math.sin(angle) * 2.5,
                6,
                this.isSuper ? '#ccff00' : '#68d916',
                22
            ));
        }
    }

    draw(ctx, camX) {
        const sx = Math.round(this.x - camX);
        const sy = Math.round(this.y);
        const pulse = Math.sin(this.tick * 0.6) * 2;

        // Outer toxic aura
        ctx.fillStyle = this.isSuper ? '#ff8800' : '#4ec414';
        ctx.fillRect(sx - this.r, sy - this.r, this.r * 2, this.r * 2);

        // Inner bright gas core
        ctx.fillStyle = this.isSuper ? '#ffff33' : '#b8ff3b';
        ctx.fillRect(sx - this.r + 3, sy - this.r + 3, (this.r - 3) * 2 + pulse, (this.r - 3) * 2 + pulse);

        // Dark pixel outline corners
        ctx.fillStyle = '#122607';
        ctx.fillRect(sx - this.r, sy - this.r, this.r * 2, 2);
        ctx.fillRect(sx - this.r, sy + this.r - 2, this.r * 2, 2);
    }
}

// ============================================================================
// ITEMS & COLLECTIBLES (Coins, Baked Beans Can, Golden Toilet Paper)
// ============================================================================

class CollectibleItem {
    constructor(x, y, type, fromBlock = false) {
        this.x = x;
        this.y = y;
        this.w = 28;
        this.h = 28;
        this.type = type; // 'coin', 'beans', 'tp'
        this.fromBlock = fromBlock;
        this.spawnY = y - 32;
        this.emerging = fromBlock;
        this.vx = type === 'beans' ? 1.6 : (type === 'tp' ? 1.25 : 0);
        this.vy = 0;
        this.dead = false;
        this.tick = 0;
    }

    update(game) {
        this.tick++;
        if (this.emerging) {
            this.y -= 1.5;
            if (this.y <= this.spawnY) {
                this.y = this.spawnY;
                this.emerging = false;
            }
            return;
        }

        if (this.type === 'beans' || this.type === 'tp') {
            const wasGrounded = this.vy === 0 && game.getSolidRectHit(this.x, this.y + 2, this.w, this.h, false) !== null;
            this.vy += 0.35;
            if (this.vy > 8) this.vy = 8;

            // Horizontal move
            this.x += this.vx;
            const sideHit = game.getSolidRectHit(this.x, this.y, this.w, this.h, false);
            if (sideHit) {
                if (this.vx > 0) this.x = sideHit.x - this.w;
                else if (this.vx < 0) this.x = sideHit.x + sideHit.w;
                this.vx = -this.vx;
            } else if (wasGrounded && this.y + this.h >= GROUND_ROW * TILE - 4) {
                const leadX = this.vx > 0 ? this.x + this.w - 2 : this.x + 2;
                if (!game.getSolidTileAt(leadX, this.y + this.h + 4)) {
                    this.vx = -this.vx;
                    this.x += this.vx * 2;
                }
            }

            // Vertical move
            this.y += this.vy;
            const floorHit = game.getSolidRectHit(this.x, this.y, this.w, this.h, false);
            if (floorHit) {
                if (this.vy >= 0) {
                    this.y = floorHit.y - this.h;
                    this.vy = 0;
                }
            }
        }

        // Check pickup by Fartio
        const p = game.player;
        if (!p.dead &&
            this.x < p.x + p.w &&
            this.x + this.w > p.x &&
            this.y < p.y + p.h &&
            this.y + this.h > p.y) {
            this.collect(game);
        }
    }

    collect(game) {
        this.dead = true;
        if (this.type === 'coin') {
            window.soundFX.playCoin();
            game.coins++;
            game.score += 200;
            game.texts.push(new FloatingText(this.x, this.y, '+200', '#ffe63b'));
        } else if (this.type === 'beans') {
            window.soundFX.playPowerup();
            game.player.makeSuper(game);
            game.score += 1000;
            game.texts.push(new FloatingText(this.x - 10, this.y, 'BEAN POWER! +1000', '#9eff24'));
        } else if (this.type === 'tp') {
            window.soundFX.playPowerup();
            game.score += 1500;
            game.player.invincibleTimer = 240; // Brief Golden Wipe invincibility!
            game.texts.push(new FloatingText(this.x - 10, this.y, 'GOLDEN WIPE! +1500', '#ffffff'));
        }
    }

    draw(ctx, camX) {
        const sx = Math.round(this.x - camX) - 2;
        const sy = Math.round(this.y) - 2;
        if (this.type === 'coin') {
            const spr = (Math.floor(this.tick / 10) % 2 === 0)
                ? window.sprites.cache.coin_1
                : window.sprites.cache.coin_2;
            ctx.drawImage(spr, sx, sy);
        } else if (this.type === 'beans') {
            ctx.drawImage(window.sprites.cache.bean_can, sx, sy);
        } else if (this.type === 'tp') {
            ctx.drawImage(window.sprites.cache.toilet_paper, sx, sy);
        }
    }
}

// ============================================================================
// MOVING PLATFORMS, ROTATING FIREBARS & BOSS SLUDGE PROJECTILES
// ============================================================================

class MovingPlatform {
    constructor(x, y, tilesWide, rangeX = 0, rangeY = 0, speed = 0.032, phase = 0) {
        this.baseX = x;
        this.baseY = y;
        this.x = x;
        this.y = y;
        this.w = tilesWide * TILE;
        this.h = 16;
        this.rangeX = rangeX;
        this.rangeY = rangeY;
        this.speed = speed;
        this.phase = phase;
        this.vx = 0;
        this.vy = 0;
        this.isPlatform = true;
    }

    update(worldTick) {
        const prevX = this.x;
        const prevY = this.y;
        const t = worldTick * this.speed + this.phase;
        this.x = this.baseX + Math.sin(t) * this.rangeX;
        this.y = this.baseY + Math.sin(t) * this.rangeY;
        this.vx = this.x - prevX;
        this.vy = this.y - prevY;
    }

    draw(ctx, camX) {
        const sx = Math.round(this.x - camX);
        const sy = Math.round(this.y);
        if (sx + this.w < 0 || sx > VIEW_W) return;

        // Iron sewer grate platform with warning stripes & slime rivets
        ctx.fillStyle = '#141c17';
        ctx.fillRect(sx, sy, this.w, this.h);

        ctx.fillStyle = '#4e6956';
        ctx.fillRect(sx + 2, sy + 2, this.w - 4, this.h - 4);

        ctx.fillStyle = '#89ab93';
        ctx.fillRect(sx + 2, sy + 2, this.w - 4, 3);

        // Grate slots & neon slime glow
        for (let gx = sx + 6; gx < sx + this.w - 8; gx += 12) {
            ctx.fillStyle = '#1b261f';
            ctx.fillRect(gx, sy + 6, 6, 7);
            ctx.fillStyle = '#8cff1a';
            ctx.fillRect(gx + 1, sy + 6, 4, 2);
        }
    }
}

class FireBar {
    constructor(col, row, length = 4, speed = 0.04, startAngle = 0) {
        this.cx = col * TILE + TILE / 2;
        this.cy = row * TILE + TILE / 2;
        this.length = length; // Number of toxic fireballs in the chain
        this.speed = speed;
        this.angle = startAngle;
        this.spacing = 18;
    }

    update(game) {
        this.angle += this.speed;
        const p = game.player;
        if (p.dead || p.won || p.invincibleTimer > 0) return;

        for (let i = 1; i <= this.length; i++) {
            const bx = this.cx + Math.cos(this.angle) * (i * this.spacing);
            const by = this.cy + Math.sin(this.angle) * (i * this.spacing);
            const r = 6;
            if (bx + r > p.x + 3 && bx - r < p.x + p.w - 3 &&
                by + r > p.y + 3 && by - r < p.y + p.h - 3) {
                p.takeDamage(game);
                break;
            }
        }
    }

    draw(ctx, camX, worldTick) {
        const scx = Math.round(this.cx - camX);
        if (scx < -120 || scx > VIEW_W + 120) return;

        for (let i = 0; i <= this.length; i++) {
            const bx = Math.round(scx + Math.cos(this.angle) * (i * this.spacing));
            const by = Math.round(this.cy + Math.sin(this.angle) * (i * this.spacing));
            const pulse = (Math.floor((worldTick + i * 3) / 4) % 2 === 0);

            ctx.fillStyle = pulse ? '#ff4400' : '#72e01b';
            ctx.fillRect(bx - 7, by - 7, 14, 14);
            ctx.fillStyle = pulse ? '#ffee33' : '#d4ff4d';
            ctx.fillRect(bx - 4, by - 4, 8, 8);
        }
    }
}

class BossSludgeBall {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.r = 9;
        this.life = 180;
        this.dead = false;
        this.tick = 0;
    }

    update(game) {
        this.tick++;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.16;
        this.life--;
        if (this.life <= 0 || this.y > VIEW_H + 32) {
            this.dead = true;
            return;
        }

        // Bounce once off floor
        const hit = game.getSolidTileAt(this.x, this.y + this.r);
        if (hit && this.vy > 0) {
            this.y = hit.y - this.r;
            this.vy = -4.2;
        }

        if (this.tick % 3 === 0) {
            game.particles.push(new GasParticle(
                this.x, this.y, 0, -0.5, 4, '#ff6600', 14
            ));
        }

        const p = game.player;
        if (!p.dead && !p.won && p.invincibleTimer <= 0 &&
            this.x + this.r > p.x + 2 && this.x - this.r < p.x + p.w - 2 &&
            this.y + this.r > p.y + 2 && this.y - this.r < p.y + p.h - 2) {
            p.takeDamage(game);
            this.dead = true;
        }
    }

    draw(ctx, camX) {
        const sx = Math.round(this.x - camX);
        const sy = Math.round(this.y);
        ctx.fillStyle = '#5c2c06';
        ctx.fillRect(sx - 9, sy - 9, 18, 18);
        ctx.fillStyle = '#ff5500';
        ctx.fillRect(sx - 7, sy - 7, 14, 14);
        ctx.fillStyle = '#ccff00';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
    }
}

// ============================================================================
// ENEMIES: POOP ("TURDION"), BACTERIA ("GERMOID"), SEWER FLY & KING POOPA BOSS
// ============================================================================

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.type = type; // 'poop', 'bacteria', 'fly', 'boss'
        this.w = type === 'boss' ? 46 : 30;
        this.h = type === 'boss' ? 46 : 30;
        this.vx = type === 'bacteria' ? -1.45 : (type === 'fly' ? -1.65 : (type === 'boss' ? -1.3 : -1.05));
        this.vy = 0;
        this.hp = type === 'boss' ? 6 : 1;
        this.maxHp = this.hp;
        this.hurtTimer = 0;
        this.squished = false;
        this.squishTimer = 0;
        this.flipped = false;
        this.dead = false;
        this.active = false;
        this.tick = Math.floor(Math.random() * 100);
        this.minX = type === 'fly' ? x - 96 : x - 180;
        this.maxX = type === 'fly' ? x + 96 : x + 120;
    }

    update(game) {
        this.tick++;
        if (this.hurtTimer > 0) this.hurtTimer--;

        // Activate when near camera
        if (!this.active) {
            if (this.x < game.camX + VIEW_W + 128) {
                this.active = true;
            } else {
                return;
            }
        }

        if (this.squished) {
            this.squishTimer--;
            if (this.squishTimer <= 0) this.dead = true;
            return;
        }

        if (this.flipped) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.42;
            if (this.y > VIEW_H + 80) this.dead = true;
            return;
        }

        // Winged Mutant Sewer Fly ("Buzzgerm"): swoops in a sine wave / high hop!
        if (this.type === 'fly') {
            if (this.x < this.minX) this.vx = Math.abs(this.vx);
            if (this.x > this.maxX) this.vx = -Math.abs(this.vx);

            this.x += this.vx;
            const sideHit = game.getSolidRectHit(this.x, this.y, this.w, this.h, false);
            if (sideHit) {
                if (this.vx > 0) this.x = sideHit.x - this.w;
                else if (this.vx < 0) this.x = sideHit.x + sideHit.w;
                this.vx = -this.vx;
            }

            const prevY = this.y;
            this.y = this.baseY + Math.sin(this.tick * 0.085) * 30;
            const vertHit = game.getSolidRectHit(this.x, this.y, this.w, this.h, false);
            if (vertHit) {
                if (this.y >= prevY) this.y = vertHit.y - this.h;
                else this.y = vertHit.y + vertHit.h;
            }

            if (this.tick % 16 === 0) {
                game.particles.push(new GasParticle(
                    this.x + 15, this.y + 20, 0, 0.4, 3, '#b829d9', 16
                ));
            }
            return;
        }

        // KING POOPA BOSS AI (World 1-4 Finale!)
        if (this.type === 'boss') {
            // Patrol bridge bounds and face Fartio
            if (this.x < this.minX) this.vx = Math.abs(this.vx);
            if (this.x > this.maxX) this.vx = -Math.abs(this.vx);

            // Periodic heavy royal jump
            if (this.tick % 105 === 0 && this.vy === 0) {
                this.vy = -8.8;
                window.soundFX.playFartJump(true);
            }

            // Hurl burning methane-sludge balls toward Fartio!
            if (this.tick % 85 === 40 && !game.player.dead && !game.player.won) {
                const dir = game.player.x < this.x ? -1 : 1;
                window.soundFX.playFartShoot();
                game.bossProjectiles.push(new BossSludgeBall(
                    this.x + (dir === -1 ? -6 : this.w + 6),
                    this.y + 16,
                    dir * 3.8,
                    -3.6
                ));
                for (let i = 0; i < 6; i++) {
                    game.particles.push(new GasParticle(
                        this.x + this.w / 2, this.y + 16,
                        dir * (Math.random() * 2 + 1), (Math.random() - 0.5) * 2,
                        6, '#ff6600', 22
                    ));
                }
            }
        }

        const wasGrounded = this.vy === 0 && game.getSolidRectHit(this.x, this.y + 2, this.w, this.h, false) !== null;

        // Bacteria periodically does a slimy micro-hop when solid ground is ahead!
        if (this.type === 'bacteria' && this.tick % 95 === 0 && wasGrounded) {
            const hopCheckX = this.vx > 0 ? this.x + this.w + 28 : this.x - 28;
            if (game.getSolidTileAt(hopCheckX, this.y + this.h + 4)) {
                this.vy = -5.2;
            }
        }

        this.vy += 0.38;
        if (this.vy > 9) this.vy = 9;

        // Horizontal movement & collision
        this.x += this.vx;
        const sideHit = game.getSolidRectHit(this.x, this.y, this.w, this.h, false);
        if (sideHit) {
            if (this.vx > 0) this.x = sideHit.x - this.w;
            else if (this.vx < 0) this.x = sideHit.x + sideHit.w;
            this.vx = -this.vx;
        } else if (wasGrounded && (this.type === 'poop' || this.type === 'bacteria')) {
            const leadX = this.vx > 0 ? this.x + this.w - 2 : this.x + 2;
            if (!game.getSolidTileAt(leadX, this.y + this.h + 4)) {
                this.vx = -this.vx;
                this.x += this.vx * 2;
            }
        }

        // Vertical movement & collision
        this.y += this.vy;
        const floorHit = game.getSolidRectHit(this.x, this.y, this.w, this.h, false);
        if (floorHit) {
            if (this.vy >= 0) {
                this.y = floorHit.y - this.h;
                this.vy = 0;
            } else {
                this.y = floorHit.y + floorHit.h;
                this.vy = 0;
            }
        }

        if (this.y > VIEW_H + 64) {
            this.dead = true;
        }

        // Ambient stink particles on Poop & Boss enemies
        if ((this.type === 'poop' || this.type === 'boss') && this.tick % 24 === 0) {
            game.particles.push(new GasParticle(
                this.x + this.w / 2 + (Math.random() - 0.5) * 16,
                this.y + 4,
                0,
                -0.7,
                this.type === 'boss' ? 5 : 3,
                this.type === 'boss' ? '#9eff00' : '#855828',
                25
            ));
        }
    }

    stomp(game) {
        if (this.type === 'boss') {
            this.damageBoss(game, 2, 'ROYAL STOMP!', true);
            return;
        }

        this.squished = true;
        this.squishTimer = 32;
        window.soundFX.playStompSplat();
        const pts = this.type === 'fly' ? 400 : (this.type === 'bacteria' ? 300 : 200);
        game.score += pts;
        const label = this.type === 'fly'
            ? 'BUZZGERM SWAT! +400'
            : (this.type === 'bacteria' ? 'GERM SQUISHED! +300' : 'SPLAT! +200');
        const col = this.type === 'fly' ? '#d88cff' : (this.type === 'bacteria' ? '#8cff26' : '#d48b3b');
        game.texts.push(new FloatingText(this.x - 10, this.y, label, col));

        // Splat particles
        const splatColor = this.type === 'fly' ? '#9c42f5' : (this.type === 'bacteria' ? '#70e01b' : '#7d481b');
        for (let i = 0; i < 10; i++) {
            game.particles.push(new DebrisParticle(
                this.x + 15,
                this.y + 20,
                (Math.random() - 0.5) * 6,
                -Math.random() * 5 - 1,
                splatColor,
                5
            ));
        }
    }

    killByGas(game, dir = 1, dmg = 1) {
        if (this.type === 'boss') {
            this.damageBoss(game, dmg, 'GAS HIT!', false);
            return;
        }

        this.flipped = true;
        this.vx = dir * 2.5;
        this.vy = -6.5;
        window.soundFX.playStompSplat();
        game.score += 250;
        game.texts.push(new FloatingText(this.x, this.y, 'GASSY KO! +250', '#a6ff00'));

        const splatColor = this.type === 'fly' ? '#9c42f5' : (this.type === 'bacteria' ? '#70e01b' : '#7d481b');
        for (let i = 0; i < 8; i++) {
            game.particles.push(new DebrisParticle(
                this.x + 15,
                this.y + 15,
                (Math.random() - 0.5) * 5,
                -Math.random() * 4 - 1,
                splatColor,
                4
            ));
        }
    }

    damageBoss(game, amount, textLabel, fromStomp = false) {
        if (this.hurtTimer > 0) return;
        this.hp -= amount;
        this.hurtTimer = 24;
        window.soundFX.playStompSplat();

        if (this.hp <= 0) {
            this.flipped = true;
            this.vx = 1.5;
            this.vy = -8.5;
            window.soundFX.playBossRoar();
            game.score += 5000;
            game.texts.push(new FloatingText(this.x - 30, this.y - 10, 'KING POOPA FLUSHED! +5000', '#ffd700'));
            for (let i = 0; i < 24; i++) {
                game.particles.push(new DebrisParticle(
                    this.x + 24,
                    this.y + 24,
                    (Math.random() - 0.5) * 9,
                    -Math.random() * 8 - 2,
                    i % 2 === 0 ? '#ffd700' : '#7d4418',
                    7
                ));
            }
        } else {
            window.soundFX.playBossRoar();
            if (!fromStomp && this.vy === 0) {
                this.vy = -3.8;
            } else if (fromStomp && this.vy < 0) {
                this.vy = 0;
            }
            game.score += 500;
            game.texts.push(new FloatingText(this.x - 10, this.y - 8, `${textLabel} (${this.hp} HP)`, '#ffaa00'));
        }
    }

    draw(ctx, camX) {
        if (!this.active) return;
        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 2) % 2 === 1) return;

        const sx = Math.round(this.x - camX) - 1;
        const sy = Math.round(this.y) - 2;

        ctx.save();
        if (this.flipped) {
            ctx.translate(sx + this.w / 2, sy + this.h / 2);
            ctx.scale(1, -1);
            ctx.translate(-(sx + this.w / 2), -(sy + this.h / 2));
        }

        if (this.type === 'boss') {
            const spr = (Math.floor(this.tick / 10) % 2 === 0)
                ? window.sprites.cache.boss_1
                : window.sprites.cache.boss_2;
            ctx.drawImage(spr, sx, sy);

            // Overhead Boss HP Bar above King Poopa
            if (!this.flipped && this.hp > 0) {
                const barW = 54;
                const bx = sx - 3;
                const by = sy - 14;
                ctx.fillStyle = '#000';
                ctx.fillRect(bx - 1, by - 1, barW + 2, 8);
                ctx.fillStyle = '#4a1212';
                ctx.fillRect(bx, by, barW, 6);
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(bx, by, Math.round(barW * (this.hp / this.maxHp)), 6);
            }
        } else if (this.type === 'poop') {
            let spr;
            if (this.squished) {
                spr = window.sprites.cache.poop_squish;
            } else {
                spr = (Math.floor(this.tick / 10) % 2 === 0)
                    ? window.sprites.cache.poop_1
                    : window.sprites.cache.poop_2;
            }
            ctx.drawImage(spr, sx, sy);

            // Draw 2 tiny buzzing sewer flies orbiting the Poop enemy!
            if (!this.squished && !this.flipped) {
                for (let f = 0; f < 2; f++) {
                    const angle = this.tick * 0.14 + f * Math.PI;
                    const fx = sx + 15 + Math.cos(angle) * 14;
                    const fy = sy + 2 + Math.sin(angle * 2) * 5;
                    ctx.fillStyle = '#111';
                    ctx.fillRect(fx, fy, 3, 3);
                    ctx.fillStyle = '#d8f5ff';
                    ctx.fillRect(fx - 1, fy - 2, 2, 2);
                    ctx.fillRect(fx + 2, fy - 2, 2, 2);
                }
            }
        } else if (this.type === 'fly') {
            let spr;
            if (this.squished) {
                spr = window.sprites.cache.fly_squish;
            } else {
                spr = (Math.floor(this.tick / 5) % 2 === 0)
                    ? window.sprites.cache.fly_1
                    : window.sprites.cache.fly_2;
            }
            ctx.drawImage(spr, sx, sy);
        } else {
            let spr;
            if (this.squished) {
                spr = window.sprites.cache.bacteria_squish;
            } else {
                spr = (Math.floor(this.tick / 9) % 2 === 0)
                    ? window.sprites.cache.bacteria_1
                    : window.sprites.cache.bacteria_2;
            }
            ctx.drawImage(spr, sx, sy);
        }
        ctx.restore();
    }
}

// ============================================================================
// PLAYER: FARTIO
// ============================================================================

class Player {
    constructor(x, y, isSuper = false) {
        this.x = x;
        this.y = isSuper ? y - 8 : y;
        this.w = 26;
        this.h = isSuper ? 38 : 30;
        this.vx = 0;
        this.vy = 0;
        this.facing = 1; // 1 = right, -1 = left
        this.onGround = false;
        this.ridingPlatform = null;
        this.isSuper = isSuper;   // Bean-Powered Super Fartio
        this.canDoubleFart = true; // 1 extra mid-air fart propulsion per jump!
        this.invincibleTimer = 0;
        this.shootCooldown = 0;
        this.animTick = 0;
        this.dead = false;
        this.won = false;
    }

    makeSuper(game) {
        if (!this.isSuper) {
            this.isSuper = true;
            this.y -= 8;
            this.h = 38;
        }
        // Big celebratory green gas burst
        for (let i = 0; i < 16; i++) {
            const ang = (Math.PI * 2 * i) / 16;
            game.particles.push(new GasParticle(
                this.x + this.w / 2,
                this.y + this.h / 2,
                Math.cos(ang) * 3.5,
                Math.sin(ang) * 3.5,
                7,
                '#9eff24',
                30
            ));
        }
    }

    emitFartCloud(game, count = 10, isBig = false) {
        const buttX = this.facing === 1 ? this.x + 2 : this.x + this.w - 2;
        const buttY = this.y + this.h - 8;
        const colors = isBig
            ? ['#9eff00', '#62c412', '#d4ff4d', '#b8860b']
            : ['#72e01b', '#a6ff00', '#4ca614'];

        for (let i = 0; i < count; i++) {
            const col = colors[i % colors.length];
            game.particles.push(new GasParticle(
                buttX + (Math.random() - 0.5) * 8,
                buttY + (Math.random() - 0.5) * 6,
                -this.facing * (Math.random() * 2.5 + 0.8) + (Math.random() - 0.5) * 1.5,
                Math.random() * 2.4 + 0.6,
                isBig ? 7 : 5,
                col,
                isBig ? 36 : 26
            ));
        }
    }

    update(game) {
        if (this.dead) {
            this.vy += 0.38;
            this.y += this.vy;
            return;
        }

        if (this.won) {
            // Slide down flagpole then walk into the Golden Toilet Fortress
            if (this.y < GROUND_ROW * TILE - this.h) {
                this.y += 3.5;
                if (this.animTick % 6 === 0) {
                    this.emitFartCloud(game, 3, false);
                }
            } else {
                this.y = GROUND_ROW * TILE - this.h;
                this.facing = 1;
                if (this.x < game.flagX + 115) {
                    this.x += 2.0;
                    this.animTick++;
                }
            }
            return;
        }

        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.shootCooldown > 0) this.shootCooldown--;

        // Carry motion if standing on a MovingPlatform
        let carryVx = 0;
        if (this.onGround && this.ridingPlatform) {
            carryVx = this.ridingPlatform.vx;
            this.y = this.ridingPlatform.y - this.h;
        }

        // Horizontal movement (Move Forward and Backward)
        const maxSpeed = keys.shoot ? 4.4 : 3.4;
        const accel = this.onGround ? 0.32 : 0.22;
        const friction = this.onGround ? 0.82 : 0.93;

        if (keys.left) {
            this.vx -= accel;
            this.facing = -1;
        } else if (keys.right) {
            this.vx += accel;
            this.facing = 1;
        } else {
            this.vx *= friction;
            if (Math.abs(this.vx) < 0.08) this.vx = 0;
        }

        if (this.vx > maxSpeed) this.vx = maxSpeed;
        if (this.vx < -maxSpeed) this.vx = -maxSpeed;

        if (Math.abs(this.vx) > 0.2 && this.onGround) {
            this.animTick++;
        }

        // FART JUMP! (Tuned slightly higher so Fartio easily jumps onto/over bricks & catches items)
        if (keys.jumpPressed) {
            keys.jumpPressed = false;
            if (this.onGround) {
                this.vy = -11.3;
                this.onGround = false;
                this.ridingPlatform = null;
                this.canDoubleFart = true;
                window.soundFX.playFartJump(this.isSuper);
                this.emitFartCloud(game, 12, this.isSuper);
            } else if (this.canDoubleFart) {
                // Mid-air Double Fart Boost!
                this.vy = -9.8;
                this.canDoubleFart = false;
                window.soundFX.playFartJump(true);
                this.emitFartCloud(game, 16, true);
                game.texts.push(new FloatingText(this.x - 6, this.y + 16, 'TOOT!', '#b8ff33'));
            }
        }

        // Smooth variable jump height when releasing jump key early
        if (!keys.jump && this.vy < -4.5) {
            this.vy *= 0.80;
        }

        // FART SHOOT ON ENEMIES!
        if (keys.shootPressed) {
            keys.shootPressed = false;
            if (this.shootCooldown <= 0) {
                this.shootCooldown = this.isSuper ? 16 : 26;
                window.soundFX.playFartShoot();
                const spawnX = this.facing === 1 ? this.x + this.w + 4 : this.x - 4;
                const spawnY = this.y + this.h * 0.55;
                game.projectiles.push(new FartProjectile(spawnX, spawnY, this.facing, this.isSuper));
                // Small recoil gas puff
                this.emitFartCloud(game, 5, false);
            }
        }

        // Gravity (0.40 pairs with vy = -11.3 for a crisp ~4.8-tile single jump)
        this.vy += 0.40;
        if (this.vy > 10.5) this.vy = 10.5;

        // Apply Horizontal Velocity & Resolve Wall/Pipe Collisions
        const totalVx = this.vx + carryVx;
        this.x += totalVx;
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        }

        const horizHit = game.getSolidRectHit(this.x, this.y, this.w, this.h, false);
        if (horizHit) {
            if (totalVx > 0) {
                this.x = horizHit.x - this.w;
            } else if (totalVx < 0) {
                this.x = horizHit.x + horizHit.w;
            } else if (this.x + this.w / 2 < horizHit.x + horizHit.w / 2) {
                this.x = horizHit.x - this.w;
            } else {
                this.x = horizHit.x + horizHit.w;
            }
            this.vx = 0;
        }

        // Apply Vertical Velocity & Resolve Floor / Ceiling Block Hits
        const prevBottom = this.y + this.h;
        this.y += this.vy;
        this.onGround = false;
        this.ridingPlatform = null;

        const solidVertHit = game.getSolidRectHit(this.x, this.y, this.w, this.h, false);
        if (solidVertHit) {
            if (this.vy >= 0) {
                // Landing on top of ground, block, or pipe
                this.y = solidVertHit.y - this.h;
                this.vy = 0;
                this.onGround = true;
                this.canDoubleFart = true;
            } else {
                // Jumping up and hitting a block from below!
                this.y = solidVertHit.y + solidVertHit.h;
                this.vy = 1.2;
                game.bumpBlock(solidVertHit);
            }
        } else if (this.vy >= 0) {
            // One-way top landing check for MovingPlatforms
            for (const plat of game.platforms) {
                if (this.x < plat.x + plat.w &&
                    this.x + this.w > plat.x &&
                    this.y < plat.y + plat.h &&
                    this.y + this.h > plat.y &&
                    prevBottom <= plat.y + Math.max(8, Math.abs(plat.vy) + 6)) {
                    this.y = plat.y - this.h;
                    this.vy = 0;
                    this.onGround = true;
                    this.canDoubleFart = true;
                    this.ridingPlatform = plat;
                    break;
                }
            }
        }

        // Check falling into a toxic sewage or molten lava pit
        if (this.y > VIEW_H + 24) {
            this.die(game);
            return;
        }

        // Check Enemy Collisions (Stomp from above vs. Take damage from side)
        for (const enemy of game.enemies) {
            if (enemy.dead || enemy.squished || enemy.flipped) continue;
            if (this.x < enemy.x + enemy.w - 3 &&
                this.x + this.w > enemy.x + 3 &&
                this.y < enemy.y + enemy.h &&
                this.y + this.h > enemy.y) {

                // Is Fartio falling onto the enemy's head?
                const stompPrevBottom = (this.y - this.vy) + this.h;
                if (this.vy > 0 && stompPrevBottom <= enemy.y + 20) {
                    this.y = enemy.y - this.h;
                    enemy.stomp(game);
                    this.vy = -8.6; // Bounce off enemy with a celebratory fart!
                    this.canDoubleFart = true;
                    window.soundFX.playFartJump(false);
                    this.emitFartCloud(game, 10, false);
                } else if (this.invincibleTimer <= 0 && enemy.hurtTimer <= 0) {
                    this.takeDamage(game);
                }
            }
        }

        // Check Goal Flagpole at the end of the Level!
        if (this.x + this.w >= game.flagX && this.x <= game.flagX + 28) {
            this.won = true;
            this.vx = 0;
            this.vy = 0;
            // If King Poopa is still alive when Fartio reaches the Royal Flush Flagpole, flush him!
            for (const enemy of game.enemies) {
                if (enemy.type === 'boss' && !enemy.dead && !enemy.flipped) {
                    enemy.hp = 1;
                    enemy.hurtTimer = 0;
                    enemy.damageBoss(game, 2, 'ROYAL FLUSH!', false);
                }
            }
            game.triggerVictory();
        }
    }

    takeDamage(game) {
        if (this.isSuper) {
            // Shrink from Super Bean Fartio back to normal Fartio
            this.isSuper = false;
            this.h = 30;
            this.invincibleTimer = 90;
            window.soundFX.playDamageOrDie(false);
            game.texts.push(new FloatingText(this.x, this.y, 'GAS DEFLATED!', '#ff6644'));
        } else {
            this.die(game);
        }
    }

    die(game) {
        if (this.dead) return;
        this.dead = true;
        this.vy = -9.5;
        window.soundFX.stopBGM();
        window.soundFX.playDamageOrDie(true);
        game.state = 'GAME_OVER';
    }

    draw(ctx, camX) {
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 1) {
            return; // Blink when invincible
        }

        const prefix = this.isSuper ? 'super_' : 'fartio_';
        let spr = window.sprites.cache[prefix + 'idle'];

        if (!this.onGround && !this.won) {
            spr = window.sprites.cache[prefix + 'jump'];
        } else if (Math.abs(this.vx) > 0.2 || (this.won && this.x < game.flagX + 115)) {
            spr = (Math.floor(this.animTick / 5) % 2 === 0)
                ? window.sprites.cache[prefix + 'walk1']
                : window.sprites.cache[prefix + 'walk2'];
        }

        const sx = Math.round(this.x - camX) - 3;
        const sy = Math.round(this.y) - 2;
        const drawW = 32;
        const drawH = this.isSuper ? 40 : 32;

        ctx.save();
        if (this.facing === -1) {
            ctx.translate(sx + drawW / 2, sy + drawH / 2);
            ctx.scale(-1, 1);
            ctx.translate(-(sx + drawW / 2), -(sy + drawH / 2));
        }
        ctx.drawImage(spr, sx, sy, drawW, drawH);
        ctx.restore();
    }
}

// ============================================================================
// MAIN GAME CONTROLLER & WORLD 1 (LEVELS 1-1, 1-2, 1-3, 1-4)
// ============================================================================

const LEVEL_INFO = {
    1: { code: '1-1', name: 'THE GREAT SEWER', subtitle: 'SLUDGE CANALS & STINK PIPES', theme: 'sewer' },
    2: { code: '1-2', name: 'TOXIC PIPEWORKS', subtitle: 'HIGH DUCTS & GRATE LIFTS', theme: 'pipeworks' },
    3: { code: '1-3', name: 'SEPTIC LAGOON', subtitle: 'HIGH CATWALK BRIDGES', theme: 'lagoon' },
    4: { code: '1-4', name: "POOPA'S CITADEL", subtitle: 'ROYAL PORCELAIN BOSS FORTRESS', theme: 'castle' }
};

class Game {
    constructor() {
        this.score = 0;
        this.coins = 0;
        this.worldTick = 0;
        this.currentLevel = 1;
        this.resetLevel(false);
    }

    selectLevel(lvl) {
        if (lvl < 1 || lvl > 4) return;
        this.currentLevel = lvl;
        this.updateLevelButtons();
        this.resetLevel(false);
    }

    updateLevelButtons() {
        document.querySelectorAll('.lvl-btn').forEach((btn) => {
            const bLvl = parseInt(btn.getAttribute('data-level'), 10);
            btn.classList.toggle('active', bLvl === this.currentLevel);
        });
    }

    advanceAfterVictory() {
        if (this.currentLevel < 4) {
            this.currentLevel++;
            this.updateLevelButtons();
            this.resetLevel(true); // Preserve Super Bean mode across levels!
        } else {
            // Completed all 4 levels of World 1 -> Replay from 1-1 with fresh run
            this.currentLevel = 1;
            this.score = 0;
            this.coins = 0;
            this.updateLevelButtons();
            this.resetLevel(false);
        }
    }

    resetLevel(preservePowerup = false) {
        const keepSuper = preservePowerup && this.player && this.player.isSuper;
        this.state = 'PLAYING'; // 'PLAYING', 'VICTORY', 'GAME_OVER'
        this.victoryTimer = 0;
        this.introBannerTimer = 150;
        this.camX = 0;
        this.timeLeft = 400;
        this.blocks = [];
        this.pipes = [];
        this.platforms = [];
        this.firebars = [];
        this.enemies = [];
        this.items = [];
        this.projectiles = [];
        this.bossProjectiles = [];
        this.particles = [];
        this.texts = [];
        this.pitCols = new Set();

        const info = LEVEL_INFO[this.currentLevel] || LEVEL_INFO[1];
        this.levelTheme = info.theme;

        this.player = new Player(80, (GROUND_ROW - 2) * TILE, keepSuper);

        if (this.currentLevel === 1) {
            this.buildLevel1_1();
        } else if (this.currentLevel === 2) {
            this.buildLevel1_2();
        } else if (this.currentLevel === 3) {
            this.buildLevel1_3();
        } else {
            this.buildLevel1_4();
        }

        this.updateLevelButtons();
        window.soundFX.stopBGM();
        if (window.soundFX.bgmEnabled && window.soundFX.ctx) {
            window.soundFX.startBGM();
        }
    }

    // Shared helpers for level building
    addBlock(col, row, type, content = null, hits = 1) {
        this.blocks.push({
            x: col * TILE,
            y: row * TILE,
            w: TILE,
            h: TILE,
            type: type,       // 'qblock', 'brick', 'empty', 'ground', 'pipe_ground', 'bridge', 'castle'
            content: content, // 'coin', 'beans', 'tp', 'multicoin'
            hitsLeft: hits,
            bumpY: 0
        });
    }

    addPipe(col, heightInTiles, baseRow = GROUND_ROW) {
        const h = heightInTiles * TILE;
        this.pipes.push({
            x: col * TILE,
            y: (baseRow * TILE) - h,
            w: TILE * 2,
            h: h
        });
    }

    spawnEnemy(col, type, row = GROUND_ROW - 1) {
        const yOffset = type === 'boss' ? 18 : 2;
        this.enemies.push(new Enemy(col * TILE, row * TILE - yOffset, type));
    }

    // ========================================================================
    // WORLD 1-1: THE GREAT SEWER
    // ========================================================================
    buildLevel1_1() {
        const levelCols = 135;
        this.levelWidth = levelCols * TILE;
        this.flagX = 123 * TILE;

        this.pitCols = new Set([
            34, 35,
            58, 59, 60,
            88, 89
        ]);

        for (let col = 0; col < levelCols; col++) {
            if (this.pitCols.has(col)) continue;
            for (let row = GROUND_ROW; row < 15; row++) {
                this.addBlock(col, row, 'ground');
            }
        }

        // Opening Mario-1-1 homage cluster!
        this.addBlock(10, 9, 'qblock', 'coin');
        this.addBlock(14, 9, 'brick');
        this.addBlock(15, 9, 'qblock', 'beans'); // First Baked Beans Can Power-Up!
        this.addBlock(16, 9, 'brick');
        this.addBlock(17, 9, 'qblock', 'coin');
        this.addBlock(18, 9, 'brick');
        this.addBlock(16, 5, 'qblock', 'tp');    // High Golden Toilet Paper bonus!

        // Floating coins to teach Fart Jumping
        for (let c = 11; c <= 13; c++) {
            this.items.push(new CollectibleItem(c * TILE + 2, 10 * TILE, 'coin'));
        }

        // Sewer Pipe #1 & #2
        this.addPipe(22, 2);
        this.addPipe(29, 3);

        // Bridge over First Toxic Sludge Pit (Cols 34-35)
        this.addBlock(33, 8, 'brick');
        this.addBlock(34, 8, 'qblock', 'coin');
        this.addBlock(35, 8, 'qblock', 'coin');
        this.addBlock(36, 8, 'brick');

        // Pipe #3 & Mid-Section Multi-Tier Platforms
        this.addPipe(41, 3);

        this.addBlock(46, 9, 'brick');
        this.addBlock(47, 9, 'qblock', 'beans'); // Second Bean Can Power-Up!
        this.addBlock(48, 9, 'brick');
        this.addBlock(49, 9, 'brick');
        this.addBlock(50, 9, 'brick');
        this.addBlock(51, 9, 'brick');
        this.addBlock(49, 5, 'brick');
        this.addBlock(50, 5, 'qblock', 'multicoin', 5); // 5-Coin Jackpot Block!
        this.addBlock(51, 5, 'brick');
        this.addBlock(52, 5, 'qblock', 'coin');

        // High coin arc over Second Toxic Pit (Cols 58-60)
        this.items.push(new CollectibleItem(58 * TILE + 2, 7 * TILE, 'coin'));
        this.items.push(new CollectibleItem(59 * TILE + 2, 6 * TILE, 'coin'));
        this.items.push(new CollectibleItem(60 * TILE + 2, 7 * TILE, 'coin'));

        // Sewer Arena Section
        this.addBlock(65, 9, 'brick');
        this.addBlock(66, 9, 'qblock', 'tp');
        this.addBlock(67, 9, 'brick');

        this.addPipe(72, 2);
        this.addPipe(79, 4);

        this.addBlock(75, 8, 'qblock', 'coin');
        this.addBlock(76, 8, 'qblock', 'coin');

        // Upper Catwalk before Third Pit (Cols 88-89)
        this.addBlock(84, 9, 'brick');
        this.addBlock(85, 9, 'qblock', 'beans');
        this.addBlock(86, 9, 'brick');
        for (let c = 87; c <= 91; c++) {
            this.addBlock(c, 5, 'brick');
            this.items.push(new CollectibleItem(c * TILE + 2, 3 * TILE, 'coin'));
        }

        // Final Gauntlet & Classic Staircase to the Flagpole!
        this.addBlock(96, 9, 'qblock', 'coin');
        this.addBlock(97, 9, 'brick');
        this.addBlock(98, 9, 'qblock', 'multicoin', 5);
        this.addBlock(99, 9, 'brick');
        this.addBlock(98, 5, 'qblock', 'tp');

        this.addPipe(104, 2);

        // Pyramid staircase up to the Brass Sewer Flagpole (Cols 112-117)
        for (let step = 0; step < 6; step++) {
            for (let col = 112 + step; col <= 117; col++) {
                this.addBlock(col, GROUND_ROW - 1 - step, 'ground');
            }
        }

        // Flagpole base block
        this.addBlock(123, GROUND_ROW - 1, 'ground');

        // Enemies
        this.spawnEnemy(16, 'poop');
        this.spawnEnemy(26, 'poop');
        this.spawnEnemy(27.5, 'bacteria');
        this.spawnEnemy(38, 'poop');
        this.spawnEnemy(39.5, 'poop');
        this.spawnEnemy(49, 'bacteria');
        this.spawnEnemy(53, 'poop');
        this.spawnEnemy(55, 'bacteria');
        this.spawnEnemy(65, 'poop');
        this.spawnEnemy(68, 'bacteria');
        this.spawnEnemy(70, 'poop');
        this.spawnEnemy(76, 'bacteria');
        this.spawnEnemy(83, 'poop');
        this.spawnEnemy(85, 'bacteria');
        this.spawnEnemy(94, 'poop');
        this.spawnEnemy(96, 'bacteria');
        this.spawnEnemy(100, 'poop');
        this.spawnEnemy(102, 'bacteria');
        this.spawnEnemy(109, 'poop');
        this.spawnEnemy(110.5, 'bacteria');
    }

    // ========================================================================
    // WORLD 1-2: TOXIC PIPEWORKS (Industrial Pipe Maze, Elevators & High Ducts)
    // ========================================================================
    buildLevel1_2() {
        const levelCols = 145;
        this.levelWidth = levelCols * TILE;
        this.flagX = 133 * TILE;

        // Wide Industrial Acid Vats spanned by Moving Grate Lifts & Pipes
        const pits = [
            26, 27, 28,
            52, 53, 54, 55, 56,
            82, 83, 84, 85,
            108, 109, 110
        ];
        this.pitCols = new Set(pits);

        for (let col = 0; col < levelCols; col++) {
            if (this.pitCols.has(col)) continue;
            for (let row = GROUND_ROW; row < 15; row++) {
                this.addBlock(col, row, 'pipe_ground');
            }
        }

        // Opening power-up & stepped brick riser into the Upper Ductwork!
        this.addBlock(9, 9, 'qblock', 'coin');
        this.addBlock(10, 9, 'brick');
        this.addBlock(11, 9, 'qblock', 'beans');
        this.addBlock(12, 9, 'brick');
        this.addBlock(13, 9, 'qblock', 'coin');

        // Pipe Valley #1 (Cols 16-24)
        this.addPipe(16, 2);
        this.addPipe(20, 4);
        this.addPipe(24, 3);
        for (let c = 17; c <= 23; c += 2) {
            this.items.push(new CollectibleItem(c * TILE + 2, 6 * TILE, 'coin'));
        }

        // First Acid Vat (Cols 26-28) with vertical elevator lift + overhead duct access
        this.platforms.push(new MovingPlatform(26.2 * TILE, 9.5 * TILE, 2, 0, 56, 0.035, 0));

        // High Ceiling Ductwork Route (Cols 30-48, SMB 1-2 style upper path!)
        this.addBlock(30, 9, 'brick');
        this.addBlock(31, 9, 'qblock', 'coin');
        this.addBlock(32, 9, 'brick');
        for (let c = 34; c <= 48; c++) {
            this.addBlock(c, 4, 'brick');
            if (c % 2 === 0) {
                this.items.push(new CollectibleItem(c * TILE + 2, 2.5 * TILE, 'coin'));
            }
        }
        this.addBlock(41, 8, 'qblock', 'multicoin', 5);
        this.addBlock(42, 8, 'brick');
        this.addBlock(43, 8, 'qblock', 'tp');

        // Twin Pipes below the ductwork
        this.addPipe(36, 3);
        this.addPipe(45, 3);

        // Second Wide Acid Vat (Cols 52-56) with Horizontal & Vertical Grate Lifts!
        this.platforms.push(new MovingPlatform(53 * TILE, 10 * TILE, 3, 52, 0, 0.032, 0));
        this.items.push(new CollectibleItem(53 * TILE + 2, 7 * TILE, 'coin'));
        this.items.push(new CollectibleItem(54 * TILE + 2, 6 * TILE, 'coin'));
        this.items.push(new CollectibleItem(55 * TILE + 2, 7 * TILE, 'coin'));

        // Dense Pressurized Pipe Maze (Cols 60-80)
        this.addPipe(60, 2);
        this.addBlock(63, 9, 'brick');
        this.addBlock(64, 9, 'qblock', 'beans');
        this.addBlock(65, 9, 'brick');
        this.addPipe(67, 4);
        this.addBlock(71, 8, 'qblock', 'coin');
        this.addBlock(72, 8, 'brick');
        this.addBlock(73, 8, 'qblock', 'multicoin', 5);
        this.addPipe(75, 3);
        this.addPipe(79, 2);

        // Third Acid Vat (Cols 82-85) with Elevator Lift & Coin Arc
        this.platforms.push(new MovingPlatform(82.5 * TILE, 8.5 * TILE, 2, 0, 68, 0.04, 1.2));
        this.items.push(new CollectibleItem(83 * TILE + 2, 5 * TILE, 'coin'));
        this.items.push(new CollectibleItem(84 * TILE + 2, 5 * TILE, 'coin'));

        // Late-Stage Pipe Gauntlet & Multi-Tier Bricks (Cols 88-106)
        this.addBlock(89, 9, 'brick');
        this.addBlock(90, 9, 'qblock', 'coin');
        this.addBlock(91, 9, 'brick');
        this.addBlock(92, 9, 'qblock', 'beans');
        this.addBlock(93, 9, 'brick');
        this.addBlock(91, 5, 'qblock', 'tp');

        for (let c = 94; c <= 98; c++) {
            this.addBlock(c, 5, 'brick');
            this.items.push(new CollectibleItem(c * TILE + 2, 3.5 * TILE, 'coin'));
        }

        this.addPipe(101, 3);
        this.addPipe(105, 4);

        // Fourth Pit (Cols 108-110) with high-speed shuttle platform
        this.platforms.push(new MovingPlatform(108.5 * TILE, 9.5 * TILE, 2, 28, 0, 0.045, 0));

        // Final Staircase to the Pipeworks Exit Flagpole (Cols 120-126)
        for (let step = 0; step < 7; step++) {
            for (let col = 120 + step; col <= 126; col++) {
                this.addBlock(col, GROUND_ROW - 1 - step, 'pipe_ground');
            }
        }
        this.addBlock(133, GROUND_ROW - 1, 'pipe_ground');

        // Enemies (Poop, Bacteria & Winged Mutant Sewer Flies!)
        this.spawnEnemy(14, 'poop');
        this.spawnEnemy(19, 'bacteria');
        this.spawnEnemy(23, 'poop');
        this.spawnEnemy(27, 'fly', 7);
        this.spawnEnemy(34, 'bacteria');
        this.spawnEnemy(39, 'poop');
        this.spawnEnemy(40.5, 'bacteria');
        this.spawnEnemy(44, 'fly', 7);
        this.spawnEnemy(50, 'poop');
        this.spawnEnemy(63, 'bacteria');
        this.spawnEnemy(65.5, 'poop');
        this.spawnEnemy(71, 'fly', 6);
        this.spawnEnemy(73, 'bacteria');
        this.spawnEnemy(78, 'poop');
        this.spawnEnemy(84, 'fly', 6);
        this.spawnEnemy(90, 'bacteria');
        this.spawnEnemy(92, 'poop');
        this.spawnEnemy(96, 'bacteria', 4);
        this.spawnEnemy(99, 'poop');
        this.spawnEnemy(104, 'fly', 6);
        this.spawnEnemy(114, 'bacteria');
        this.spawnEnemy(116, 'poop');
    }

    // ========================================================================
    // WORLD 1-3: SEPTIC LAGOON (High Suspended Catwalk Bridges over Boiling Lake)
    // ========================================================================
    buildLevel1_3() {
        const levelCols = 145;
        this.levelWidth = levelCols * TILE;
        this.flagX = 133 * TILE;

        // Almost the entire middle of 1-3 is a boiling subterranean Septic Lagoon!
        this.pitCols = new Set();
        for (let c = 14; c <= 116; c++) {
            // Leave small stone island piers at cols 42-45 and 78-82
            if ((c >= 42 && c <= 45) || (c >= 78 && c <= 82)) continue;
            this.pitCols.add(c);
        }

        // Solid shore at start (0-13), island piers, and end shore (117-144)
        for (let col = 0; col < levelCols; col++) {
            if (this.pitCols.has(col)) continue;
            for (let row = GROUND_ROW; row < 15; row++) {
                this.addBlock(col, row, 'ground');
            }
        }

        // Starting Dock Power-Up Block
        this.addBlock(8, 9, 'qblock', 'beans');
        this.addBlock(9, 9, 'brick');
        this.addBlock(10, 9, 'qblock', 'coin');

        // Bridge Span #1 (Cols 15-26, Row 9)
        for (let c = 15; c <= 26; c++) {
            this.addBlock(c, 9, 'bridge');
        }
        this.addBlock(20, 5, 'qblock', 'coin');
        this.addBlock(21, 5, 'qblock', 'multicoin', 5);
        this.addBlock(22, 5, 'qblock', 'coin');

        // Moving Lift #1 -> High Catwalk Span #2 (Cols 31-40, Row 6)
        this.platforms.push(new MovingPlatform(28 * TILE, 8 * TILE, 2, 24, 36, 0.035, 0));
        for (let c = 31; c <= 40; c++) {
            this.addBlock(c, 6, 'bridge');
            if (c % 2 === 1) {
                this.items.push(new CollectibleItem(c * TILE + 2, 4 * TILE, 'coin'));
            }
        }
        this.addBlock(35, 3, 'qblock', 'tp');

        // Lower risk-reward bridge below Span #2
        for (let c = 33; c <= 38; c++) {
            this.addBlock(c, 10, 'bridge');
            if (c >= 34 && c <= 37) {
                this.items.push(new CollectibleItem(c * TILE + 2, 8.5 * TILE, 'coin'));
            }
        }

        // Island Pier #1 (Cols 42-45) with Pipe & Beans
        this.addPipe(43, 2);
        this.addBlock(43, 7, 'qblock', 'beans');

        // Double Moving Lifts across Lagoon Chasm (Cols 47-56)
        this.platforms.push(new MovingPlatform(48 * TILE, 9 * TILE, 2.5, 40, 0, 0.036, 0));
        this.platforms.push(new MovingPlatform(54 * TILE, 7 * TILE, 2.5, 0, 55, 0.04, 1.5));
        this.items.push(new CollectibleItem(54 * TILE + 12, 4 * TILE, 'coin'));
        this.items.push(new CollectibleItem(55 * TILE + 12, 4 * TILE, 'coin'));

        // Multi-Tier Catwalk Complex (Cols 58-75)
        for (let c = 58; c <= 68; c++) {
            this.addBlock(c, 8, 'bridge');
        }
        for (let c = 63; c <= 75; c++) {
            this.addBlock(c, 4, 'bridge');
            if (c >= 65 && c <= 73 && c % 2 === 1) {
                this.items.push(new CollectibleItem(c * TILE + 2, 2.5 * TILE, 'coin'));
            }
        }
        this.addBlock(62, 5, 'qblock', 'coin');
        for (let c = 70; c <= 76; c++) {
            this.addBlock(c, 10, 'bridge');
        }
        this.addBlock(73, 7, 'qblock', 'multicoin', 5);

        // Island Pier #2 (Cols 78-82)
        this.addPipe(79, 3);
        this.addBlock(80, 6, 'qblock', 'beans');

        // High-Speed Aerial Catwalk & Lifts (Cols 84-115)
        this.platforms.push(new MovingPlatform(85 * TILE, 8.5 * TILE, 2, 36, 0, 0.04, 0));
        for (let c = 90; c <= 101; c++) {
            this.addBlock(c, 7, 'bridge');
        }
        this.addBlock(94, 3, 'brick');
        this.addBlock(95, 3, 'qblock', 'tp');
        this.addBlock(96, 3, 'brick');

        this.platforms.push(new MovingPlatform(104 * TILE, 8 * TILE, 2.5, 0, 60, 0.042, 0.7));
        for (let c = 108; c <= 115; c++) {
            this.addBlock(c, 6, 'bridge');
            this.items.push(new CollectibleItem(c * TILE + 2, 4.5 * TILE, 'coin'));
        }

        // End Shore Staircase to Flagpole (Cols 120-126)
        for (let step = 0; step < 7; step++) {
            for (let col = 120 + step; col <= 126; col++) {
                this.addBlock(col, GROUND_ROW - 1 - step, 'ground');
            }
        }
        this.addBlock(133, GROUND_ROW - 1, 'ground');

        // Lagoon Enemies (Heavy on Winged Sewer Flies & Hopping Bacteria on Bridges!)
        this.spawnEnemy(19, 'poop', 8);
        this.spawnEnemy(23, 'bacteria', 8);
        this.spawnEnemy(28, 'fly', 5);
        this.spawnEnemy(34, 'poop', 5);
        this.spawnEnemy(38, 'bacteria', 5);
        this.spawnEnemy(49, 'fly', 6);
        this.spawnEnemy(55, 'fly', 5);
        this.spawnEnemy(61, 'bacteria', 7);
        this.spawnEnemy(65, 'poop', 7);
        this.spawnEnemy(69, 'bacteria', 3);
        this.spawnEnemy(73, 'poop', 9);
        this.spawnEnemy(86, 'fly', 6);
        this.spawnEnemy(93, 'bacteria', 6);
        this.spawnEnemy(97, 'poop', 6);
        this.spawnEnemy(99, 'bacteria', 6);
        this.spawnEnemy(105, 'fly', 5);
        this.spawnEnemy(112, 'poop', 5);
        this.spawnEnemy(119, 'bacteria');
    }

    // ========================================================================
    // WORLD 1-4: KING POOPA'S CITADEL (Porcelain Castle, Firebars & Boss Battle!)
    // ========================================================================
    buildLevel1_4() {
        const levelCols = 142;
        this.levelWidth = levelCols * TILE;
        this.flagX = 130 * TILE;

        // Boiling Septic Lava Pits + Under the Boss Bridge (Cols 102-120)
        const lavaCols = [
            18, 19, 20,
            37, 38, 39, 40,
            58, 59, 60,
            78, 79, 80, 81
        ];
        for (let c = 102; c <= 120; c++) lavaCols.push(c);
        this.pitCols = new Set(lavaCols);

        // Build Castle Stone Floor & Dungeon Ceiling
        for (let col = 0; col < levelCols; col++) {
            // Dungeon stone ceiling up to the Boss Arena
            if (col < 122) {
                this.addBlock(col, 1, 'castle');
            }
            if (this.pitCols.has(col)) continue;
            for (let row = GROUND_ROW; row < 15; row++) {
                this.addBlock(col, row, 'castle');
            }
        }

        // Opening Castle Hallway & Bean Supply
        this.addBlock(10, 9, 'qblock', 'beans');
        this.addBlock(11, 9, 'castle');
        this.addBlock(12, 9, 'qblock', 'coin');

        // First Lava Pit (Cols 18-20) with Rotating Firebar!
        this.addBlock(19, 9, 'castle');
        this.firebars.push(new FireBar(19, 9, 4, 0.042, 0));

        // Castle Chicane #1 (Cols 24-35)
        this.addBlock(26, 9, 'castle');
        this.addBlock(27, 9, 'qblock', 'coin');
        this.addBlock(28, 9, 'castle');
        this.firebars.push(new FireBar(28, 9, 4, -0.04, 1.5));

        this.addBlock(32, 8, 'qblock', 'multicoin', 5);

        // Second Lava Pit (Cols 37-40) with Moving Lift
        this.platforms.push(new MovingPlatform(37.5 * TILE, 10 * TILE, 2, 24, 0, 0.04, 0));
        this.items.push(new CollectibleItem(38 * TILE + 2, 7 * TILE, 'coin'));
        this.items.push(new CollectibleItem(39 * TILE + 2, 7 * TILE, 'coin'));

        // Twin Firebar Corridor (Cols 44-56)
        this.addBlock(46, 9, 'castle');
        this.firebars.push(new FireBar(46, 9, 4, 0.045, 0));
        this.addBlock(49, 8, 'qblock', 'beans');
        this.addBlock(52, 9, 'castle');
        this.firebars.push(new FireBar(52, 9, 4, -0.045, 2.2));

        // Third Lava Pit (Cols 58-60)
        this.addBlock(59, 8, 'castle');
        this.items.push(new CollectibleItem(59 * TILE + 2, 6 * TILE, 'coin'));

        // Upper/Lower Split Dungeon Chamber (Cols 63-76)
        for (let c = 64; c <= 74; c++) {
            this.addBlock(c, 7, 'castle');
        }
        this.addBlock(68, 4, 'qblock', 'tp'); // Golden Wipe Invincibility before the final stretch!
        this.addBlock(70, 4, 'qblock', 'coin');
        this.firebars.push(new FireBar(69, 7, 3, 0.05, 0));

        // Fourth Lava Pit (Cols 78-81) with Vertical Elevator
        this.platforms.push(new MovingPlatform(78.8 * TILE, 9 * TILE, 2, 0, 50, 0.042, 0));

        // Pre-Boss Supply Pedestal (Cols 86-96)
        this.addBlock(88, 9, 'castle');
        this.addBlock(89, 9, 'qblock', 'beans');
        this.addBlock(90, 9, 'qblock', 'coin');
        this.addBlock(91, 9, 'castle');
        this.firebars.push(new FireBar(94, 9, 4, 0.04, 0.8));
        this.addBlock(94, 9, 'castle');

        // ====================================================================
        // KING POOPA'S ROYAL BOSS BRIDGE (Cols 102-120)
        // ====================================================================
        for (let c = 102; c <= 120; c++) {
            this.addBlock(c, 10, 'bridge');
        }
        // High catwalk blocks above the Boss Bridge to help dodge or stomp King Poopa!
        this.addBlock(106, 6, 'castle');
        this.addBlock(107, 6, 'qblock', 'coin');
        this.addBlock(113, 6, 'castle');
        this.addBlock(114, 6, 'castle');

        // Flagpole base block after the Boss Bridge
        this.addBlock(130, GROUND_ROW - 1, 'castle');

        // Castle Guards + KING POOPA BOSS!
        this.spawnEnemy(15, 'bacteria');
        this.spawnEnemy(24, 'poop');
        this.spawnEnemy(33, 'fly', 8);
        this.spawnEnemy(44, 'bacteria');
        this.spawnEnemy(55, 'poop');
        this.spawnEnemy(66, 'bacteria', 6);
        this.spawnEnemy(72, 'poop', 12);
        this.spawnEnemy(85, 'fly', 7);
        this.spawnEnemy(97, 'bacteria');

        // Spawn KING POOPA on the Royal Bridge!
        const boss = new Enemy(114 * TILE, 9 * TILE - 16, 'boss');
        boss.minX = 103 * TILE;
        boss.maxX = 118 * TILE;
        this.enemies.push(boss);
    }

    // Check if a point overlaps any solid block, pipe, or moving platform
    getSolidTileAt(px, py) {
        for (const b of this.blocks) {
            if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b;
        }
        for (const p of this.pipes) {
            if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return p;
        }
        for (const plat of this.platforms) {
            if (px >= plat.x && px <= plat.x + plat.w && py >= plat.y && py <= plat.y + plat.h) return plat;
        }
        return null;
    }

    // Check if an AABB rectangle overlaps any solid block, pipe, or moving platform
    // Selects the solid block/pipe with the largest horizontal overlap to prevent adjacent-tile bump errors
    getSolidRectHit(rx, ry, rw, rh, includePlatforms = true) {
        let bestHit = null;
        let bestOverlapX = -1;

        for (const b of this.blocks) {
            if (rx < b.x + b.w && rx + rw > b.x && ry < b.y + b.h && ry + rh > b.y) {
                const overlapX = Math.min(rx + rw, b.x + b.w) - Math.max(rx, b.x);
                if (overlapX > bestOverlapX) {
                    bestOverlapX = overlapX;
                    bestHit = b;
                }
            }
        }
        for (const p of this.pipes) {
            if (rx < p.x + p.w && rx + rw > p.x && ry < p.y + p.h && ry + rh > p.y) {
                const overlapX = Math.min(rx + rw, p.x + p.w) - Math.max(rx, p.x);
                if (overlapX > bestOverlapX) {
                    bestOverlapX = overlapX;
                    bestHit = p;
                }
            }
        }
        if (bestHit) return bestHit;

        if (includePlatforms) {
            for (const plat of this.platforms) {
                if (rx < plat.x + plat.w && rx + rw > plat.x && ry < plat.y + plat.h && ry + rh > plat.y) {
                    return plat;
                }
            }
        }
        return null;
    }

    // Triggered when Fartio jumps and hits a block from underneath
    bumpBlock(block) {
        if (!block.type) return; // Pipe or Platform

        // Check if any enemy is standing on top of this block -> launch them!
        for (const enemy of this.enemies) {
            if (!enemy.dead && !enemy.flipped &&
                enemy.x + enemy.w > block.x &&
                enemy.x < block.x + block.w &&
                Math.abs((enemy.y + enemy.h) - block.y) <= 8) {
                enemy.killByGas(this, 1, 1);
            }
        }

        if (block.type === 'empty' || block.type === 'ground' ||
            block.type === 'pipe_ground' || block.type === 'bridge' || block.type === 'castle') {
            window.soundFX.playBlockBump();
            return;
        }

        block.bumpY = -8;

        if (block.type === 'qblock') {
            window.soundFX.playBlockBump();
            if (block.content === 'coin' || block.content === 'multicoin') {
                window.soundFX.playCoin();
                this.coins++;
                this.score += 200;
                this.texts.push(new FloatingText(block.x + 2, block.y - 16, '+200', '#ffe63b'));
                for (let i = 0; i < 6; i++) {
                    this.particles.push(new GasParticle(
                        block.x + 16,
                        block.y - 8,
                        (Math.random() - 0.5) * 3,
                        -Math.random() * 3 - 1,
                        4,
                        '#ffd700',
                        20
                    ));
                }
            } else if (block.content === 'beans' || block.content === 'tp') {
                window.soundFX.playItemAppear();
                this.items.push(new CollectibleItem(block.x + 2, block.y, block.content, true));
            }

            block.hitsLeft--;
            if (block.hitsLeft <= 0) {
                block.type = 'empty';
            }
        } else if (block.type === 'brick') {
            block.hitsLeft = (block.hitsLeft || 2) - (this.player.isSuper ? 2 : 1);
            if (block.hitsLeft <= 0) {
                window.soundFX.playBrickBreak();
                this.score += 50;
                this.blocks = this.blocks.filter(b => b !== block);
                const speeds = [
                    { vx: -3.2, vy: -7.5 },
                    { vx: 3.2, vy: -7.5 },
                    { vx: -2.4, vy: -4.5 },
                    { vx: 2.4, vy: -4.5 }
                ];
                speeds.forEach(s => {
                    this.particles.push(new DebrisParticle(
                        block.x + 12,
                        block.y + 12,
                        s.vx,
                        s.vy,
                        '#8c5828',
                        8
                    ));
                });
            } else {
                window.soundFX.playBlockBump();
            }
        }
    }

    triggerVictory() {
        if (this.state === 'VICTORY') return;
        this.state = 'VICTORY';
        this.victoryTimer = 220; // Auto-advance to next level after fanfare (~3.6s)
        window.soundFX.stopBGM();
        window.soundFX.playStageClear();
        const heightBonus = Math.max(100, Math.round((GROUND_ROW * TILE - this.player.y) * 10));
        this.score += heightBonus;
        this.texts.push(new FloatingText(this.flagX - 20, this.player.y, `FLUSH BONUS +${heightBonus}!`, '#9eff24'));
    }

    update() {
        this.worldTick++;
        if (this.introBannerTimer > 0) this.introBannerTimer--;

        // Auto-advance to next level in World 1 after clearing 1-1, 1-2, or 1-3
        if (this.state === 'VICTORY' && this.currentLevel < 4) {
            if (this.victoryTimer > 0) {
                this.victoryTimer--;
                if (this.victoryTimer === 0) {
                    this.advanceAfterVictory();
                    return;
                }
            }
        }

        // Countdown timer while playing
        if (this.state === 'PLAYING' && this.worldTick % 45 === 0 && this.timeLeft > 0) {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.player.die(this);
            }
        }

        // Update Moving Platforms first so Player can ride them cleanly
        for (const plat of this.platforms) {
            plat.update(this.worldTick);
        }

        // Update Rotating Firebars
        for (const fb of this.firebars) {
            fb.update(this);
        }

        // Smooth block bump animations
        for (const b of this.blocks) {
            if (b.bumpY < 0) {
                b.bumpY += 1.5;
                if (b.bumpY > 0) b.bumpY = 0;
            }
        }

        // Update Player
        this.player.update(this);

        // Smooth Side-Scrolling Camera (can move forward and backward!)
        const targetCamX = this.player.x - VIEW_W * 0.36;
        this.camX += (targetCamX - this.camX) * 0.14;
        if (this.camX < 0) this.camX = 0;
        if (this.camX > this.levelWidth - VIEW_W) {
            this.camX = this.levelWidth - VIEW_W;
        }

        // Update Collectibles
        for (const item of this.items) item.update(this);
        this.items = this.items.filter(i => !i.dead);

        // Update Fart Projectiles & Boss Sludge Projectiles
        for (const proj of this.projectiles) proj.update(this);
        this.projectiles = this.projectiles.filter(p => !p.dead);

        for (const bproj of this.bossProjectiles) bproj.update(this);
        this.bossProjectiles = this.bossProjectiles.filter(p => !p.dead);

        // Update Enemies
        for (const enemy of this.enemies) enemy.update(this);
        this.enemies = this.enemies.filter(e => !e.dead);

        // Ambient Pit Bubbles (Green Acid or Molten Castle Lava)
        if (this.worldTick % 12 === 0) {
            const bubbleCol = this.levelTheme === 'castle' ? '#ff6600' : '#9eff00';
            this.pitCols.forEach(col => {
                const px = col * TILE + Math.random() * TILE;
                if (px >= this.camX - 32 && px <= this.camX + VIEW_W + 32) {
                    this.particles.push(new GasParticle(
                        px,
                        GROUND_ROW * TILE + 18,
                        (Math.random() - 0.5) * 0.5,
                        -Math.random() * 1.2 - 0.4,
                        4,
                        bubbleCol,
                        28
                    ));
                }
            });
        }

        // Update Particles & Floating Texts
        for (const p of this.particles) p.update();
        this.particles = this.particles.filter(p => p.life > 0);

        for (const t of this.texts) t.update();
        this.texts = this.texts.filter(t => t.life > 0);
    }

    // ========================================================================
    // DETAILED WORLD 1 BACKGROUND & LEVEL THEME RENDERING
    // ========================================================================

    drawSewerBackground() {
        const theme = this.levelTheme;

        // 1. Subterranean Cavern Gradient (customized per level!)
        const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
        if (theme === 'pipeworks') {
            grad.addColorStop(0, '#0f0c07');
            grad.addColorStop(0.55, '#241b10');
            grad.addColorStop(1, '#332814');
        } else if (theme === 'lagoon') {
            grad.addColorStop(0, '#070b14');
            grad.addColorStop(0.55, '#102429');
            grad.addColorStop(1, '#16382b');
        } else if (theme === 'castle') {
            grad.addColorStop(0, '#0d0507');
            grad.addColorStop(0.6, '#210b10');
            grad.addColorStop(1, '#3b140b');
        } else {
            grad.addColorStop(0, '#070f0a');
            grad.addColorStop(0.55, '#112116');
            grad.addColorStop(1, '#1a3320');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);

        // 2. Far Parallax Sewer/Castle Brick Wall Pattern
        const farScroll = Math.floor(this.camX * 0.25);
        ctx.fillStyle = theme === 'castle' ? '#291217' : (theme === 'pipeworks' ? '#2b2113' : (theme === 'lagoon' ? '#132b2e' : '#15291b'));
        for (let y = 36; y < GROUND_ROW * TILE; y += 24) {
            const rowOffset = (Math.floor(y / 24) % 2) * 24;
            for (let x = -((farScroll + rowOffset) % 48); x < VIEW_W; x += 48) {
                ctx.fillRect(x + 2, y + 2, 44, 20);
            }
        }

        // 3. Mid-Parallax Tunnels, Grates & Level-Specific Architecture
        const midScroll = Math.floor(this.camX * 0.5);
        const archSpacing = 260;
        const startArch = -((midScroll) % archSpacing);

        for (let ax = startArch - archSpacing; ax < VIEW_W + archSpacing; ax += archSpacing) {
            // Arch Pillar
            ctx.fillStyle = theme === 'castle' ? '#361a20' : (theme === 'pipeworks' ? '#382b18' : '#1d3624');
            ctx.fillRect(ax, 70, 140, 350);

            // Dark Recessed Grate Window
            ctx.fillStyle = '#060d08';
            ctx.fillRect(ax + 24, 110, 92, 130);

            // Eerie glow inside grate
            ctx.fillStyle = theme === 'castle' ? 'rgba(255, 85, 0, 0.18)' : 'rgba(114, 224, 27, 0.14)';
            ctx.fillRect(ax + 28, 114, 84, 122);

            // Iron Bars across the Grate
            ctx.fillStyle = theme === 'castle' ? '#4a2c32' : '#2d4736';
            for (let bx = ax + 38; bx < ax + 110; bx += 16) {
                ctx.fillRect(bx, 110, 5, 130);
            }
            ctx.fillRect(ax + 24, 155, 92, 6);
            ctx.fillRect(ax + 24, 195, 92, 6);

            // Slime / Molten Waterfall oozing from the bottom of the grate!
            const slimeWave = Math.sin(this.worldTick * 0.08 + ax) * 4;
            ctx.fillStyle = theme === 'castle' ? 'rgba(255, 90, 15, 0.35)' : 'rgba(114, 224, 27, 0.35)';
            ctx.fillRect(ax + 45, 240, 50, 176);
            ctx.fillStyle = theme === 'castle' ? 'rgba(255, 200, 40, 0.45)' : 'rgba(170, 255, 40, 0.45)';
            ctx.fillRect(ax + 56 + slimeWave, 240, 16, 176);
        }

        // 4. Overhead Rusty Sewage Conduit Pipe & Valves
        ctx.fillStyle = theme === 'pipeworks' ? '#4a3519' : '#1f3826';
        ctx.fillRect(0, 22, VIEW_W, 20);
        ctx.fillStyle = theme === 'pipeworks' ? '#705228' : '#33593d';
        ctx.fillRect(0, 25, VIEW_W, 6);
        ctx.fillStyle = '#0d1a11';
        ctx.fillRect(0, 40, VIEW_W, 3);

        const jointSpacing = 180;
        for (let jx = -(midScroll % jointSpacing); jx < VIEW_W; jx += jointSpacing) {
            ctx.fillStyle = theme === 'pipeworks' ? '#8c6932' : '#3f6b4b';
            ctx.fillRect(jx, 18, 14, 28);
            ctx.fillStyle = '#b82514';
            ctx.fillRect(jx + 2, 46, 10, 10);
            ctx.fillStyle = '#ff5533';
            ctx.fillRect(jx + 4, 48, 6, 4);
        }
    }

    drawToxicSludgePits() {
        const isCastle = this.levelTheme === 'castle';
        this.pitCols.forEach(col => {
            const sx = Math.round(col * TILE - this.camX);
            if (sx < -TILE || sx > VIEW_W + TILE) return;

            const sy = GROUND_ROW * TILE + 12;
            const h = VIEW_H - sy;

            // Bubbling radioactive green acid OR molten castle chili-sludge
            ctx.fillStyle = isCastle ? '#b82e00' : '#3cb012';
            ctx.fillRect(sx, sy, TILE, h);

            ctx.fillStyle = isCastle ? '#ff7700' : '#8cff1a';
            const wave = Math.sin(this.worldTick * 0.12 + col) * 3;
            ctx.fillRect(sx, sy + wave, TILE, 7);

            ctx.fillStyle = isCastle ? '#ffee44' : '#d4ff66';
            ctx.fillRect(sx + 6, sy + wave + 1, 12, 3);
        });
    }

    drawGoalFlagpoleAndFortress() {
        const fx = Math.round(this.flagX - this.camX);
        const groundY = GROUND_ROW * TILE;

        if (fx > -200 && fx < VIEW_W + 300) {
            const poleTop = 4 * TILE;
            const poleH = (GROUND_ROW - 1) * TILE - poleTop;

            ctx.fillStyle = '#8c6914';
            ctx.fillRect(fx + 11, poleTop, 10, poleH);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(fx + 13, poleTop, 4, poleH);

            // Top Golden Plunger / Orb Finial
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(fx + 6, poleTop - 14, 20, 14);
            ctx.fillStyle = '#ffff66';
            ctx.fillRect(fx + 9, poleTop - 11, 8, 6);

            // Stink Pennant Flag
            const flagY = this.state === 'VICTORY'
                ? Math.min(groundY - 64, poleTop + (this.worldTick % 200) * 2)
                : poleTop + 8;
            ctx.fillStyle = '#5ac418';
            ctx.fillRect(fx - 36, flagY, 48, 30);
            ctx.fillStyle = '#b8ff3b';
            ctx.fillRect(fx - 32, flagY + 4, 40, 22);
            ctx.fillStyle = '#6e3d12';
            ctx.fillRect(fx - 18, flagY + 8, 12, 14);

            // THE ROYAL GOLDEN TOILET SEWER FORTRESS (Right of Flagpole)
            const cx = fx + 85;
            const cy = groundY - 128;

            ctx.fillStyle = '#2d4736';
            ctx.fillRect(cx, cy + 36, 110, 92);
            ctx.fillStyle = '#1b2e21';
            ctx.fillRect(cx + 6, cy + 42, 98, 86);

            // Battlements
            ctx.fillStyle = '#43694f';
            for (let b = 0; b < 5; b++) {
                ctx.fillRect(cx + b * 24, cy + 20, 16, 18);
            }

            // Giant Golden Toilet Throne above the fortress gate!
            ctx.fillStyle = '#d99114';
            ctx.fillRect(cx + 35, cy - 22, 40, 26);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(cx + 32, cy - 25, 46, 6);
            ctx.fillRect(cx + 38, cy + 4, 34, 16);

            // Dark Arched Doorway
            ctx.fillStyle = '#060c08';
            ctx.fillRect(cx + 38, cy + 76, 34, 52);
            ctx.fillStyle = '#72e01b';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('WC', cx + 47, cy + 68);
        }
    }

    drawHUD() {
        const info = LEVEL_INFO[this.currentLevel] || LEVEL_INFO[1];

        // Top Translucent Retro Status Bar
        ctx.fillStyle = 'rgba(7, 15, 10, 0.78)';
        ctx.fillRect(0, 0, VIEW_W, 44);
        ctx.fillStyle = '#385e42';
        ctx.fillRect(0, 42, VIEW_W, 2);

        ctx.font = '11px "Press Start 2P", monospace';

        // FARTIO SCORE
        ctx.fillStyle = '#9eff24';
        ctx.fillText('FARTIO', 24, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(this.score).padStart(6, '0'), 24, 35);

        // COINS
        ctx.fillStyle = '#ffd700';
        ctx.fillText('COINS', 195, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('x' + String(this.coins).padStart(2, '0'), 195, 35);

        // WORLD
        ctx.fillStyle = '#9eff24';
        ctx.fillText('WORLD', 340, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(info.code, 350, 35);

        // GAS POWER STATUS
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('GAS MODE', 490, 18);
        ctx.fillStyle = this.player.isSuper ? '#ff5500' : '#72e01b';
        ctx.fillText(this.player.isSuper ? 'SUPER BEAN!' : 'REGULAR', 490, 35);

        // TIME
        ctx.fillStyle = '#9eff24';
        ctx.fillText('TIME', 695, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(this.timeLeft).padStart(3, '0'), 702, 35);

        // Level Intro Title Card (fades out after level start)
        if (this.state === 'PLAYING' && this.introBannerTimer > 0) {
            const alpha = Math.min(1, this.introBannerTimer / 35);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(8, 18, 11, 0.82)';
            ctx.fillRect(VIEW_W / 2 - 220, 62, 440, 54);
            ctx.strokeStyle = '#72e01b';
            ctx.lineWidth = 2;
            ctx.strokeRect(VIEW_W / 2 - 220, 62, 440, 54);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffd700';
            ctx.font = '13px "Press Start 2P", monospace';
            ctx.fillText(`WORLD ${info.code}: ${info.name}`, VIEW_W / 2, 85);
            ctx.fillStyle = '#b8ff66';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText(info.subtitle, VIEW_W / 2, 105);
            ctx.restore();
        }

        // Victory or Game Over Overlay Banner
        if (this.state === 'VICTORY') {
            ctx.fillStyle = 'rgba(8, 20, 11, 0.88)';
            ctx.fillRect(VIEW_W / 2 - 250, VIEW_H / 2 - 80, 500, 160);
            ctx.strokeStyle = '#9eff24';
            ctx.lineWidth = 4;
            ctx.strokeRect(VIEW_W / 2 - 250, VIEW_H / 2 - 80, 500, 160);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#9eff24';
            ctx.font = '18px "Press Start 2P", monospace';
            if (this.currentLevel < 4) {
                ctx.fillText(`WORLD ${info.code} CLEARED!`, VIEW_W / 2, VIEW_H / 2 - 30);
                ctx.fillStyle = '#ffd700';
                ctx.font = '12px "Press Start 2P", monospace';
                ctx.fillText(`SCORE: ${this.score}`, VIEW_W / 2, VIEW_H / 2 + 4);
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px "Press Start 2P", monospace';
                const secs = Math.ceil(this.victoryTimer / 60);
                ctx.fillText(`NEXT: WORLD 1-${this.currentLevel + 1} IN ${secs}s [ENTER]`, VIEW_W / 2, VIEW_H / 2 + 42);
            } else {
                ctx.fillStyle = '#ffd700';
                ctx.fillText('WORLD 1 COMPLETE!', VIEW_W / 2, VIEW_H / 2 - 34);
                ctx.fillStyle = '#9eff24';
                ctx.font = '11px "Press Start 2P", monospace';
                ctx.fillText('KING POOPA FLUSHED! GOLDEN THRONE SAVED!', VIEW_W / 2, VIEW_H / 2 - 2);
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px "Press Start 2P", monospace';
                ctx.fillText(`FINAL SCORE: ${this.score}`, VIEW_W / 2, VIEW_H / 2 + 26);
                ctx.font = '9px "Press Start 2P", monospace';
                ctx.fillText('PRESS [ENTER] OR [R] TO PLAY AGAIN!', VIEW_W / 2, VIEW_H / 2 + 56);
            }
            ctx.textAlign = 'left';
        } else if (this.state === 'GAME_OVER') {
            ctx.fillStyle = 'rgba(20, 8, 8, 0.85)';
            ctx.fillRect(VIEW_W / 2 - 220, VIEW_H / 2 - 70, 440, 140);
            ctx.strokeStyle = '#ff4422';
            ctx.lineWidth = 4;
            ctx.strokeRect(VIEW_W / 2 - 220, VIEW_H / 2 - 70, 440, 140);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff4422';
            ctx.font = '22px "Press Start 2P", monospace';
            ctx.fillText('FLUSHED OUT!', VIEW_W / 2, VIEW_H / 2 - 20);

            ctx.fillStyle = '#ffe63b';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText('THE SEWER GOT THE BEST OF FARTIO', VIEW_W / 2, VIEW_H / 2 + 14);

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('PRESS [R] TO TRY AGAIN', VIEW_W / 2, VIEW_H / 2 + 46);
            ctx.textAlign = 'left';
        }
    }

    draw() {
        ctx.clearRect(0, 0, VIEW_W, VIEW_H);

        // 1. Multi-layer Underground Sewer / Castle Background
        this.drawSewerBackground();

        // 2. Goal Flagpole & Royal Golden Toilet Fortress
        this.drawGoalFlagpoleAndFortress();

        // 3. Collectibles (emerging from blocks or floating)
        for (const item of this.items) {
            if (item.x + item.w >= this.camX && item.x <= this.camX + VIEW_W) {
                item.draw(ctx, this.camX);
            }
        }

        // 4. Blocks (Ground, Pipe Ground, Bridge, Castle, Bricks, ? Blocks, Empty Blocks)
        for (const b of this.blocks) {
            if (b.x + b.w < this.camX || b.x > this.camX + VIEW_W) continue;
            const sx = Math.round(b.x - this.camX);
            const sy = Math.round(b.y + (b.bumpY || 0));

            if (b.type === 'ground') {
                ctx.drawImage(window.sprites.cache.tile_ground, sx, sy);
            } else if (b.type === 'pipe_ground') {
                ctx.drawImage(window.sprites.cache.tile_pipe_ground, sx, sy);
            } else if (b.type === 'bridge') {
                ctx.drawImage(window.sprites.cache.tile_bridge, sx, sy);
            } else if (b.type === 'castle') {
                ctx.drawImage(window.sprites.cache.tile_castle, sx, sy);
            } else if (b.type === 'brick') {
                ctx.drawImage(window.sprites.cache.tile_brick, sx, sy);
            } else if (b.type === 'qblock') {
                ctx.drawImage(window.sprites.cache.tile_qblock, sx, sy);
                if (Math.floor(this.worldTick / 18) % 2 === 0) {
                    ctx.fillStyle = 'rgba(255, 255, 180, 0.16)';
                    ctx.fillRect(sx + 2, sy + 2, 28, 28);
                }
            } else if (b.type === 'empty') {
                ctx.drawImage(window.sprites.cache.tile_empty, sx, sy);
            }
        }

        // 5. Moving Grate Platforms
        for (const plat of this.platforms) {
            plat.draw(ctx, this.camX);
        }

        // 6. Sewer Pipes
        for (const p of this.pipes) {
            if (p.x + p.w < this.camX || p.x > this.camX + VIEW_W) continue;
            window.sprites.drawSewerPipe(ctx, Math.round(p.x - this.camX), Math.round(p.y), p.w, p.h);
        }

        // 7. Toxic Acid / Lava Pits
        this.drawToxicSludgePits();

        // 8. Rotating Castle Firebars
        for (const fb of this.firebars) {
            fb.draw(ctx, this.camX, this.worldTick);
        }

        // 9. Enemies (Poop, Bacteria, Sewer Fly & King Poopa Boss)
        for (const enemy of this.enemies) {
            if (enemy.x + enemy.w >= this.camX - 48 && enemy.x <= this.camX + VIEW_W + 48) {
                enemy.draw(ctx, this.camX);
            }
        }

        // 10. Fart Projectiles & Boss Sludge Projectiles
        for (const proj of this.projectiles) {
            proj.draw(ctx, this.camX);
        }
        for (const bproj of this.bossProjectiles) {
            bproj.draw(ctx, this.camX);
        }

        // 11. Fartio Player
        this.player.draw(ctx, this.camX);

        // 12. Gas & Debris Particles + Score Popups
        for (const p of this.particles) p.draw(ctx, this.camX);
        for (const t of this.texts) t.draw(ctx, this.camX);

        // 13. Retro HUD & Victory/GameOver Screens
        this.drawHUD();
    }
}

// Start the Game Loop!
const game = new Game();
window.game = game;

function gameLoop() {
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
