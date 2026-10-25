// ============================================================================
// SUPER FARTIO BROS. - Core Engine, World 1 (Sewer) & World 2 (Rotten Landfill)
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

    // While the level briefing splash is up, only allow starting / level warping
    if (!game.started) {
        if (code === 'Enter' || code === 'Space' || code === 'NumpadEnter') {
            e.preventDefault();
            startGame(false);
        }
        if (code >= 'Digit1' && code <= 'Digit8') {
            game.selectLevel(parseInt(code.slice(5), 10));
        }
        return;
    }

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
    if (code >= 'Digit1' && code <= 'Digit8') {
        game.selectLevel(parseInt(code.slice(5), 10));
    }

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
const btnFullscreen = document.getElementById('btn-fullscreen');
const arcadeWrapper = document.getElementById('arcade-wrapper');

function isFullscreenActive() {
    return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        (arcadeWrapper && arcadeWrapper.classList.contains('is-fullscreen'))
    );
}

const btnFsFloat = document.getElementById('btn-fs-float');

// True when the browser exposes a real Fullscreen API for elements
// (iPhone Safari does not, so we fall back to the CSS "is-fullscreen" mode)
const nativeFullscreenSupported = !!(
    arcadeWrapper && (
        arcadeWrapper.requestFullscreen ||
        arcadeWrapper.webkitRequestFullscreen ||
        arcadeWrapper.msRequestFullscreen
    )
);

function updateFullscreenBtn() {
    const active = isFullscreenActive();
    if (btnFullscreen) {
        btnFullscreen.textContent = active ? '⛶ EXIT FULL' : '⛶ FULLSCREEN';
        btnFullscreen.classList.toggle('active', active);
    }
    if (btnFsFloat) {
        btnFsFloat.classList.toggle('active', active);
        btnFsFloat.title = active ? 'Exit Full Screen' : 'Enter Full Screen';
    }
}

// Best-effort landscape lock once fullscreen (supported on Android Chrome)
function tryLockLandscape() {
    try {
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }
    } catch (_) {}
}

function useCssFullscreenFallback() {
    if (!arcadeWrapper) return;
    arcadeWrapper.classList.add('is-fullscreen');
    window.scrollTo(0, 1);
    updateFullscreenBtn();
}

function enterFullscreen() {
    if (!arcadeWrapper || isFullscreenActive()) return;
    if (arcadeWrapper.requestFullscreen) {
        const p = arcadeWrapper.requestFullscreen({ navigationUI: 'hide' });
        if (p && p.then) {
            p.then(tryLockLandscape).catch(useCssFullscreenFallback);
        } else {
            tryLockLandscape();
        }
    } else if (arcadeWrapper.webkitRequestFullscreen) {
        arcadeWrapper.webkitRequestFullscreen();
        tryLockLandscape();
    } else if (arcadeWrapper.msRequestFullscreen) {
        arcadeWrapper.msRequestFullscreen();
    } else {
        useCssFullscreenFallback();
    }
}

function exitFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
    } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msFullscreenElement && document.msExitFullscreen) {
        document.msExitFullscreen();
    }
    if (arcadeWrapper) {
        arcadeWrapper.classList.remove('is-fullscreen');
    }
    updateFullscreenBtn();
}

function toggleFullscreen() {
    window.soundFX.init();
    if (isFullscreenActive()) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
        toggleFullscreen();
        btnFullscreen.blur();
    });
}

if (btnFsFloat) {
    btnFsFloat.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFullscreen();
        btnFsFloat.blur();
    });
}

document.addEventListener('fullscreenchange', updateFullscreenBtn);
document.addEventListener('webkitfullscreenchange', updateFullscreenBtn);
document.addEventListener('mozfullscreenchange', updateFullscreenBtn);
document.addEventListener('MSFullscreenChange', updateFullscreenBtn);

// Orientation prompt dismiss button & orientation change handler
const btnDismissRotate = document.getElementById('btn-dismiss-rotate');
if (btnDismissRotate) {
    btnDismissRotate.addEventListener('click', () => {
        document.body.classList.add('portrait-dismissed');
        window.soundFX.init();
    });
}

function handleOrientationChange() {
    const isLandscape = (typeof window !== 'undefined') && (
        (window.matchMedia && window.matchMedia('(orientation: landscape)').matches) ||
        (window.innerWidth > window.innerHeight)
    );
    if (isLandscape && typeof document !== 'undefined') {
        document.body.classList.remove('portrait-dismissed');
    }
}

window.addEventListener('resize', handleOrientationChange);
window.addEventListener('orientationchange', handleOrientationChange);

// ============================================================================
// MOBILE TOUCH CONTROLS (Android & iOS)
// Multi-touch, haptic feedback, and audio context unlock
// ============================================================================

function triggerHaptic(duration = 15) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(duration); } catch (_) {}
    }
}

function unlockAudioOnFirstTouch() {
    window.soundFX.init();
    if (window.soundFX.bgmEnabled && !window.soundFX.bgmPlaying && typeof game !== 'undefined' && game && game.started && game.state === 'PLAYING') {
        window.soundFX.startBGM();
    }
}

window.addEventListener('touchstart', unlockAudioOnFirstTouch, { once: true, passive: true });
window.addEventListener('pointerdown', unlockAudioOnFirstTouch, { once: true, passive: true });

function setupTouchButton(elementId, onPress, onRelease) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const handlePress = (e) => {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        unlockAudioOnFirstTouch();
        triggerHaptic(12);
        el.classList.add('pressed');
        onPress();
    };

    const handleRelease = (e) => {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        el.classList.remove('pressed');
        onRelease();
    };

    el.addEventListener('touchstart', handlePress, { passive: false });
    el.addEventListener('touchend', handleRelease, { passive: false });
    el.addEventListener('touchcancel', handleRelease, { passive: false });

    // Pointer/Mouse support for testing
    el.addEventListener('mousedown', handlePress);
    el.addEventListener('mouseup', handleRelease);
    el.addEventListener('mouseleave', handleRelease);
}

setupTouchButton(
    'touch-left',
    () => { keys.left = true; },
    () => { keys.left = false; }
);

setupTouchButton(
    'touch-right',
    () => { keys.right = true; },
    () => { keys.right = false; }
);

setupTouchButton(
    'touch-jump',
    () => {
        if (!keys.jump) keys.jumpPressed = true;
        keys.jump = true;
    },
    () => { keys.jump = false; }
);

setupTouchButton(
    'touch-shoot',
    () => {
        if (!keys.shoot) keys.shootPressed = true;
        keys.shoot = true;
    },
    () => { keys.shoot = false; }
);

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
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lvl = parseInt(btn.getAttribute('data-level'), 10);
        game.selectLevel(lvl);
        btn.blur();
    });
});

// Allow tapping the canvas to advance after stage clear or retry on Game Over (great for mobile!)
canvas.addEventListener('click', () => {
    if (!game.started) return;
    if (game.state === 'VICTORY') {
        game.advanceAfterVictory();
    } else if (game.state === 'GAME_OVER') {
        game.resetLevel();
    }
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
    constructor(x, y, dir, isSuper = false, isGarlic = false) {
        this.x = x;
        this.y = y;
        this.r = (isSuper || isGarlic) ? 9 : 7;
        this.vx = dir * (isGarlic ? 8.5 : (isSuper ? 7.8 : 6.4));
        this.vy = 2.2;
        this.isSuper = isSuper || isGarlic;
        this.isGarlic = isGarlic;
        this.pierceLeft = isGarlic ? 1 : 0; // Garlic blasts pierce 1 regular monster!
        this.hitEnemies = new Set();
        this.bounces = 0;
        this.maxBounces = isGarlic ? 6 : (isSuper ? 5 : 4);
        this.life = 150;
        this.dead = false;
        this.tick = 0;
    }

    update(game) {
        this.tick++;
        const prevY = this.y;
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
            const trailCol = this.isGarlic
                ? (this.tick % 4 === 0 ? '#33ffcc' : '#d97aff')
                : (this.isSuper ? '#ffaa00' : '#8cff1a');
            game.particles.push(new GasParticle(
                this.x,
                this.y,
                -this.vx * 0.15,
                (Math.random() - 0.5) * 0.8,
                this.isSuper ? 5 : 4,
                trailCol,
                16
            ));
        }

        // Check side wall collision first (prevents vertical teleport onto tall pipes/steps)
        const dir = Math.sign(this.vx) || 1;
        const sideTile = game.getSolidTileAt(this.x + dir * this.r, prevY) || game.getSolidTileAt(this.x, prevY);
        if (sideTile && prevY + this.r > sideTile.y + 4) {
            this.burst(game);
            return;
        }

        // Check floor collision to bounce like Mario's fireball
        const bottomTile = game.getSolidTileAt(this.x, this.y + this.r);
        if (bottomTile) {
            if (this.vy >= 0 && prevY + this.r <= bottomTile.y + 10) {
                this.y = bottomTile.y - this.r;
                this.vy = this.isGarlic ? -5.6 : -5.2;
                this.bounces++;
                if (this.bounces > this.maxBounces) {
                    this.burst(game);
                    return;
                }
            } else {
                this.burst(game);
                return;
            }
        }

        // Check Enemy collision
        for (const enemy of game.enemies) {
            if (!enemy.dead && !enemy.flipped && !enemy.squished &&
                !this.hitEnemies.has(enemy) &&
                this.x + this.r > enemy.x &&
                this.x - this.r < enemy.x + enemy.w &&
                this.y + this.r > enemy.y &&
                this.y - this.r < enemy.y + enemy.h) {
                this.hitEnemies.add(enemy);
                enemy.killByGas(game, Math.sign(this.vx), this.isSuper ? 2 : 1);
                const isBoss = (enemy.type === 'boss' || enemy.type === 'boss2');
                if (this.pierceLeft > 0 && !isBoss) {
                    this.pierceLeft--;
                    for (let i = 0; i < 5; i++) {
                        game.particles.push(new GasParticle(
                            this.x, this.y, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3,
                            5, '#33ffcc', 16
                        ));
                    }
                } else {
                    this.burst(game);
                    return;
                }
            }
        }
    }

    burst(game) {
        this.dead = true;
        const col = this.isGarlic ? '#33ffcc' : (this.isSuper ? '#ccff00' : '#68d916');
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            game.particles.push(new GasParticle(
                this.x,
                this.y,
                Math.cos(angle) * 2.5,
                Math.sin(angle) * 2.5,
                6,
                col,
                22
            ));
        }
    }

    draw(ctx, camX) {
        const sx = Math.round(this.x - camX);
        const sy = Math.round(this.y);
        const pulse = Math.sin(this.tick * 0.6) * 2;

        // Outer toxic aura
        ctx.fillStyle = this.isGarlic ? '#a824ff' : (this.isSuper ? '#ff8800' : '#4ec414');
        ctx.fillRect(sx - this.r, sy - this.r, this.r * 2, this.r * 2);

        // Inner bright gas core
        ctx.fillStyle = this.isGarlic ? '#33ffcc' : (this.isSuper ? '#ffff33' : '#b8ff3b');
        ctx.fillRect(sx - this.r + 3, sy - this.r + 3, (this.r - 3) * 2 + pulse, (this.r - 3) * 2 + pulse);

        // Dark pixel outline corners
        ctx.fillStyle = '#122607';
        ctx.fillRect(sx - this.r, sy - this.r, this.r * 2, 2);
        ctx.fillRect(sx - this.r, sy + this.r - 2, this.r * 2, 2);
    }
}

// ============================================================================
// ITEMS & COLLECTIBLES (Coins, Beans, Golden TP, Garlic Burrito & Stink Stars!)
// ============================================================================

class CollectibleItem {
    constructor(x, y, type, fromBlock = false) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.w = type === 'star' ? 30 : 28;
        this.h = type === 'star' ? 30 : 28;
        this.type = type; // 'coin', 'beans', 'tp', 'burrito', 'star'
        this.fromBlock = fromBlock;
        this.spawnY = y - 32;
        this.emerging = fromBlock;
        this.vx = type === 'burrito' ? 1.8 : (type === 'beans' ? 1.6 : (type === 'tp' ? 1.25 : 0));
        this.vy = 0;
        this.dead = false;
        this.tick = Math.floor(Math.random() * 40);
    }

    update(game) {
        this.tick++;
        if (this.emerging) {
            this.y -= 1.5;
            if (this.y <= this.spawnY) {
                this.y = this.spawnY;
                this.baseY = this.spawnY;
                this.emerging = false;
            }
            return;
        }

        if (this.type === 'star') {
            this.y = this.baseY + Math.sin(this.tick * 0.08) * 4;
        } else if (this.type === 'beans' || this.type === 'tp' || this.type === 'burrito') {
            const groundTile = this.vy === 0 ? game.getSolidRectHit(this.x, this.y + 2, this.w, this.h, false) : null;
            const wasGrounded = groundTile !== null;
            this.vy += 0.35;
            if (this.vy > 8) this.vy = 8;

            const beltVx = (groundTile && groundTile.type === 'conveyor_r') ? 0.9
                : ((groundTile && groundTile.type === 'conveyor_l') ? -0.9 : 0);

            // Horizontal move
            this.x += this.vx + beltVx;
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
            if (this.y > VIEW_H + 64) {
                this.dead = true;
                return;
            }
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
            const alreadyGarlic = game.player.isGarlic;
            game.player.makeSuper(game);
            game.score += 1000;
            const label = alreadyGarlic ? 'BEAN BONUS! +1000' : 'BEAN POWER! +1000';
            game.texts.push(new FloatingText(this.x - 10, this.y, label, '#9eff24'));
        } else if (this.type === 'burrito') {
            window.soundFX.playGarlicPowerup();
            game.player.makeGarlic(game);
            game.score += 1500;
            game.texts.push(new FloatingText(this.x - 20, this.y, 'GARLIC TURBO! 3x FART!', '#33ffcc'));
        } else if (this.type === 'tp') {
            window.soundFX.playPowerup();
            game.score += 1500;
            game.player.invincibleTimer = 240; // Brief Golden Wipe invincibility!
            game.texts.push(new FloatingText(this.x - 10, this.y, 'GOLDEN WIPE! +1500', '#ffffff'));
        } else if (this.type === 'star') {
            window.soundFX.playStarCollect();
            game.levelStars++;
            if (game.bestStarsByLevel) {
                game.bestStarsByLevel[game.currentLevel] = Math.max(
                    game.bestStarsByLevel[game.currentLevel] || 0,
                    game.levelStars
                );
            }
            game.score += 1000;
            const total = Math.max(3, game.totalStars);
            game.texts.push(new FloatingText(this.x - 18, this.y, `STINK STAR ${game.levelStars}/${total}! +1000`, '#ffe629'));
            for (let i = 0; i < 12; i++) {
                const ang = (Math.PI * 2 * i) / 12;
                game.particles.push(new GasParticle(
                    this.x + 14, this.y + 14, Math.cos(ang) * 2.8, Math.sin(ang) * 2.8, 5, '#ffe629', 26
                ));
            }
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
        } else if (this.type === 'burrito') {
            ctx.drawImage(window.sprites.cache.garlic_burrito, sx, sy);
        } else if (this.type === 'tp') {
            ctx.drawImage(window.sprites.cache.toilet_paper, sx, sy);
        } else if (this.type === 'star') {
            const spr = (Math.floor(this.tick / 12) % 2 === 0)
                ? window.sprites.cache.star_1
                : window.sprites.cache.star_2;
            ctx.drawImage(spr, sx, sy);
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

class BouncePad {
    constructor(col, baseRow, power = 1.0) {
        this.x = col * TILE - 2;
        this.y = baseRow * TILE - 14;
        this.w = 36;
        this.h = 14;
        this.power = power;
        this.compressTimer = 0;
        this.cooldown = 0;
    }

    update() {
        if (this.compressTimer > 0) this.compressTimer--;
        if (this.cooldown > 0) this.cooldown--;
    }

    checkLaunch(player, game, prevVy) {
        if (this.cooldown > 0 || player.dead || player.won) return false;
        if (prevVy < -1.0) return false;
        if (player.x + player.w - 3 > this.x &&
            player.x + 3 < this.x + this.w &&
            player.y + player.h >= this.y - 2 &&
            player.y <= this.y + this.h + 2) {
            player.y = this.y - player.h;
            player.vy = (keys.jump ? -15.0 : -13.6) * this.power;
            player.bounceLock = true;
            player.onGround = false;
            player.ridingPlatform = null;
            player.standingBlock = null;
            player.resetAirFarts();
            this.compressTimer = 16;
            this.cooldown = 10;
            window.soundFX.playBouncePad();
            game.score += 50;
            game.texts.push(new FloatingText(this.x - 10, this.y - 12, 'WHOOPEE! +50', '#ff66aa'));
            for (let i = 0; i < 12; i++) {
                const ang = Math.PI + (Math.PI * i) / 11;
                game.particles.push(new GasParticle(
                    this.x + this.w / 2,
                    this.y + 4,
                    Math.cos(ang) * 3.2,
                    Math.sin(ang) * 2.2 - 0.5,
                    6,
                    i % 2 === 0 ? '#ff66aa' : '#9eff24',
                    24
                ));
            }
            return true;
        }
        return false;
    }

    draw(ctx, camX) {
        const sx = Math.round(this.x - camX);
        if (sx + this.w < -16 || sx > VIEW_W + 16) return;
        const squish = this.compressTimer > 0 ? 5 : 0;
        const sy = Math.round(this.y + squish);
        const h = this.h - squish;

        // Steel coil spring base
        ctx.fillStyle = '#2a3338';
        ctx.fillRect(sx + 6, Math.round(this.y + this.h - 4), this.w - 12, 4);
        ctx.fillStyle = '#8fa3b0';
        ctx.fillRect(sx + 10, sy + h - 3, 4, 3);
        ctx.fillRect(sx + this.w - 14, sy + h - 3, 4, 3);

        // Inflatable rubber Whoopee Cushion!
        ctx.fillStyle = '#2b0816';
        ctx.fillRect(sx, sy, this.w, Math.max(6, h - 2));
        ctx.fillStyle = '#e62e6b';
        ctx.fillRect(sx + 2, sy + 2, this.w - 4, Math.max(4, h - 5));
        ctx.fillStyle = '#ff85ad';
        ctx.fillRect(sx + 6, sy + 3, this.w - 14, 2);

        // Little rubber flapper nozzle on right side
        ctx.fillStyle = '#b81d50';
        ctx.fillRect(sx + this.w - 3, sy + 3, 5, 4);
    }
}

class UpdraftVent {
    constructor(col, baseRow, liftTiles = 7) {
        this.x = col * TILE + 6;
        this.y = baseRow * TILE - 14;
        this.w = 52;
        this.h = 14;
        this.liftHeight = liftTiles * TILE;
    }

    update(game) {
        // Spawn rising compost methane bubbles when near camera
        if (this.x + this.w >= game.camX - 64 && this.x <= game.camX + VIEW_W + 64) {
            if (game.worldTick % 5 === 0) {
                game.particles.push(new GasParticle(
                    this.x + 6 + Math.random() * (this.w - 12),
                    this.y - 4,
                    (Math.random() - 0.5) * 0.4,
                    -3.2 - Math.random() * 1.4,
                    4,
                    game.worldTick % 10 === 0 ? '#33ffcc' : '#b8ff33',
                    Math.min(55, Math.floor(this.liftHeight / 4))
                ));
            }
        }

        const p = game.player;
        if (p.dead || p.won) return;

        // Buoyant thermal lift column
        if (p.x + p.w > this.x - 4 &&
            p.x < this.x + this.w + 4 &&
            p.y + p.h > this.y - this.liftHeight &&
            p.y < this.y + this.h) {
            const distFromVent = Math.max(0, this.y - (p.y + p.h));
            const norm = distFromVent / this.liftHeight;
            const strength = norm > 0.82 ? Math.max(0.25, (1 - norm) / 0.18) : 1.0;
            const targetVy = (keys.jump ? -7.4 : -4.3) * strength;
            if (p.vy > targetVy) {
                p.vy = Math.max(targetVy, p.vy - 0.92 * strength);
            }
            p.onGround = false;
            p.ridingPlatform = null;
            p.standingBlock = null;
            p.resetAirFarts();
        }
    }

    draw(ctx, camX, worldTick) {
        const sx = Math.round(this.x - camX);
        if (sx + this.w < -32 || sx > VIEW_W + 32) return;

        // Translucent rising thermal gas column
        const topY = Math.round(this.y - this.liftHeight);
        ctx.save();
        ctx.fillStyle = 'rgba(158, 255, 36, 0.10)';
        ctx.fillRect(sx + 2, topY, this.w - 4, this.liftHeight);

        // Animated upward wind chevrons/streaks inside the column
        ctx.fillStyle = 'rgba(184, 255, 80, 0.36)';
        const streakPeriod = 48;
        const phaseOffset = (worldTick * 3) % streakPeriod;
        for (let wy = this.y - phaseOffset; wy > topY + 8; wy -= streakPeriod) {
            const sway = Math.round(Math.sin(wy * 0.05 + worldTick * 0.1) * 4);
            ctx.fillRect(sx + 10 + sway, Math.round(wy) - 10, 3, 14);
            ctx.fillRect(sx + 25 - sway, Math.round(wy) - 18, 3, 16);
            ctx.fillRect(sx + 38 + sway, Math.round(wy) - 8, 3, 12);
        }
        ctx.restore();

        // Heavy Rusted Compost Vent Nozzle Base
        const sy = Math.round(this.y);
        ctx.fillStyle = '#1c150c';
        ctx.fillRect(sx, sy, this.w, this.h);
        ctx.fillStyle = '#6e5229';
        ctx.fillRect(sx + 2, sy + 2, this.w - 4, this.h - 3);
        ctx.fillStyle = '#b88c3d';
        ctx.fillRect(sx + 2, sy + 2, this.w - 4, 3);
        // Glowing vent grates
        for (let gx = sx + 6; gx < sx + this.w - 8; gx += 10) {
            ctx.fillStyle = '#122409';
            ctx.fillRect(gx, sy + 5, 6, 7);
            ctx.fillStyle = '#9eff24';
            ctx.fillRect(gx + 1, sy + 5, 4, 3);
        }
    }
}

class TrashPendulum {
    constructor(col, row, chainLen = 4, swingAmp = 1.0, speed = 0.036, phase = 0) {
        this.cx = col * TILE + TILE / 2;
        this.cy = row * TILE + TILE / 2;
        this.chainLen = chainLen;
        this.spacing = 19;
        this.swingAmp = swingAmp;
        this.speed = speed;
        this.phase = phase;
        this.angle = Math.PI / 2;
    }

    update(game) {
        this.angle = Math.PI / 2 + Math.sin(game.worldTick * this.speed + this.phase) * this.swingAmp;
        const p = game.player;
        if (p.dead || p.won || p.invincibleTimer > 0) return;

        const ballX = this.cx + Math.cos(this.angle) * (this.chainLen * this.spacing);
        const ballY = this.cy + Math.sin(this.angle) * (this.chainLen * this.spacing);
        const r = 11;
        if (ballX + r > p.x + 3 && ballX - r < p.x + p.w - 3 &&
            ballY + r > p.y + 3 && ballY - r < p.y + p.h - 3) {
            p.takeDamage(game);
        }
    }

    draw(ctx, camX, worldTick) {
        const scx = Math.round(this.cx - camX);
        if (scx < -140 || scx > VIEW_W + 140) return;

        // Iron ceiling/beam mount
        ctx.fillStyle = '#1f262b';
        ctx.fillRect(scx - 8, Math.round(this.cy) - 8, 16, 16);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(scx - 3, Math.round(this.cy) - 3, 6, 6);

        // Chain links
        for (let i = 1; i < this.chainLen; i++) {
            const lx = Math.round(scx + Math.cos(this.angle) * (i * this.spacing));
            const ly = Math.round(this.cy + Math.sin(this.angle) * (i * this.spacing));
            ctx.fillStyle = '#14181c';
            ctx.fillRect(lx - 4, ly - 4, 8, 8);
            ctx.fillStyle = '#758794';
            ctx.fillRect(lx - 2, ly - 2, 4, 4);
        }

        // Spiked Rusty Junk Wrecking Ball at end!
        const bx = Math.round(scx + Math.cos(this.angle) * (this.chainLen * this.spacing));
        const by = Math.round(this.cy + Math.sin(this.angle) * (this.chainLen * this.spacing));
        const pulse = (Math.floor(worldTick / 6) % 2 === 0);

        // Spikes
        ctx.fillStyle = '#cad8e3';
        ctx.fillRect(bx - 16, by - 3, 32, 6);
        ctx.fillRect(bx - 3, by - 16, 6, 32);

        // Heavy rusted core with toxic glow
        ctx.fillStyle = '#1a1014';
        ctx.fillRect(bx - 12, by - 12, 24, 24);
        ctx.fillStyle = '#593b28';
        ctx.fillRect(bx - 10, by - 10, 20, 20);
        ctx.fillStyle = pulse ? '#c433ff' : '#ff6600';
        ctx.fillRect(bx - 5, by - 5, 10, 10);
    }
}

class BossSludgeBall {
    constructor(x, y, vx, vy, variant = 'sludge') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.variant = variant; // 'sludge', 'stink_egg', 'trash_bomb'
        this.r = variant === 'stink_egg' ? 7 : 9;
        this.bounces = 0;
        this.maxBounces = variant === 'stink_egg' ? 1 : 2;
        this.life = variant === 'stink_egg' ? 120 : 180;
        this.dead = false;
        this.tick = 0;
    }

    update(game) {
        this.tick++;
        const prevY = this.y;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.16;
        this.life--;
        if (this.life <= 0 || this.y > VIEW_H + 32) {
            this.dead = true;
            return;
        }

        // Burst if hitting a vertical wall/pipe side
        const dir = Math.sign(this.vx) || 1;
        const wallHit = game.getSolidTileAt(this.x + dir * this.r, prevY);
        if (wallHit && prevY + this.r > wallHit.y + 4) {
            this.dead = true;
            for (let i = 0; i < 5; i++) {
                game.particles.push(new GasParticle(
                    this.x, prevY, (Math.random() - 0.5) * 2.5, -Math.random() * 2,
                    5, this.variant === 'stink_egg' ? '#d938ff' : '#ff6600', 18
                ));
            }
            return;
        }

        // Bounce off floor
        const hit = game.getSolidTileAt(this.x, this.y + this.r);
        if (hit && this.vy > 0 && prevY + this.r <= hit.y + 10) {
            this.y = hit.y - this.r;
            this.bounces++;
            if (this.bounces > this.maxBounces) {
                this.dead = true;
                for (let i = 0; i < 5; i++) {
                    game.particles.push(new GasParticle(
                        this.x, this.y, (Math.random() - 0.5) * 2.5, -Math.random() * 2,
                        5, this.variant === 'stink_egg' ? '#d938ff' : '#ff6600', 18
                    ));
                }
                return;
            }
            this.vy = this.variant === 'stink_egg' ? -3.6 : -4.2;
        }

        if (this.tick % 3 === 0) {
            const pCol = this.variant === 'stink_egg' ? '#d938ff'
                : (this.variant === 'trash_bomb' ? '#b8ff1a' : '#ff6600');
            game.particles.push(new GasParticle(
                this.x, this.y, 0, -0.5, 4, pCol, 14
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
        if (this.variant === 'stink_egg') {
            ctx.fillStyle = '#240c2e';
            ctx.fillRect(sx - 7, sy - 7, 14, 14);
            ctx.fillStyle = '#e6dec8';
            ctx.fillRect(sx - 5, sy - 5, 10, 10);
            ctx.fillStyle = '#d938ff';
            ctx.fillRect(sx - 3, sy - 3, 5, 5);
        } else if (this.variant === 'trash_bomb') {
            ctx.fillStyle = '#261229';
            ctx.fillRect(sx - 9, sy - 9, 18, 18);
            ctx.fillStyle = '#c433ff';
            ctx.fillRect(sx - 7, sy - 7, 14, 14);
            ctx.fillStyle = '#9eff00';
            ctx.fillRect(sx - 4, sy - 4, 8, 8);
        } else {
            ctx.fillStyle = '#5c2c06';
            ctx.fillRect(sx - 9, sy - 9, 18, 18);
            ctx.fillStyle = '#ff5500';
            ctx.fillRect(sx - 7, sy - 7, 14, 14);
            ctx.fillStyle = '#ccff00';
            ctx.fillRect(sx - 4, sy - 4, 8, 8);
        }
    }
}

// ============================================================================
// ENEMIES: WORLD 1 SEWER PESTS + WORLD 2 LANDFILL MONSTERS & BOSSES!
// ============================================================================

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.type = type; // 'poop', 'bacteria', 'fly', 'boss', 'maggot', 'skunk', 'canmonster', 'boss2'
        const isBigBoss = (type === 'boss' || type === 'boss2');
        this.w = isBigBoss ? 46 : 30;
        this.h = isBigBoss ? 46 : (type === 'maggot' ? 26 : 30);

        const speedMap = {
            poop: -1.05,
            bacteria: -1.45,
            fly: -1.65,
            boss: -1.30,
            maggot: -1.15,
            skunk: -1.25,
            canmonster: -1.10,
            boss2: -1.40
        };
        this.vx = speedMap[type] || -1.15;
        this.vy = 0;
        this.hp = type === 'boss2' ? 8 : (type === 'boss' ? 6 : (type === 'canmonster' ? 2 : 1));
        this.maxHp = this.hp;
        this.dented = false;
        this.lunging = false;
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

        // Winged Mutant Sewer Fly ("Buzzgerm"): swoops in a sine wave!
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
            if (this.x < this.minX) this.vx = Math.abs(this.vx);
            if (this.x > this.maxX) this.vx = -Math.abs(this.vx);

            if (this.tick % 105 === 0 && this.vy === 0) {
                this.vy = -8.8;
                window.soundFX.playFartJump(true);
            }

            if (this.tick % 85 === 40 && !game.player.dead && !game.player.won) {
                const dir = game.player.x < this.x ? -1 : 1;
                window.soundFX.playFartShoot();
                game.bossProjectiles.push(new BossSludgeBall(
                    this.x + (dir === -1 ? -6 : this.w + 6),
                    this.y + 16,
                    dir * 3.8,
                    -3.6,
                    'sludge'
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

        // EMPEROR GARBAGIO BOSS AI (World 2-4 Finale - 8 HP Multi-Phase!)
        if (this.type === 'boss2') {
            const enraged = this.hp <= 4;
            const patrolSpeed = enraged ? 1.95 : 1.40;
            this.vx = (this.vx >= 0 ? 1 : -1) * patrolSpeed;
            if (this.x < this.minX) this.vx = patrolSpeed;
            if (this.x > this.maxX) this.vx = -patrolSpeed;

            // Junk-Quake Heavy Leap
            const jumpInterval = enraged ? 78 : 98;
            if (this.tick % jumpInterval === 0 && this.vy === 0) {
                this.vy = enraged ? -9.5 : -8.9;
                window.soundFX.playFartJump(true);
            }

            // Rancid Trash Bomb Barrage (Twin-Spread when Enraged!)
            const fireInterval = enraged ? 72 : 86;
            if (this.tick % fireInterval === 36 && !game.player.dead && !game.player.won) {
                const dir = game.player.x < this.x ? -1 : 1;
                window.soundFX.playFartShoot();
                const sx = this.x + (dir === -1 ? -6 : this.w + 6);
                game.bossProjectiles.push(new BossSludgeBall(
                    sx, this.y + 14, dir * 4.0, -3.5, 'trash_bomb'
                ));
                if (enraged) {
                    game.bossProjectiles.push(new BossSludgeBall(
                        sx, this.y + 8, dir * 2.7, -5.2, 'trash_bomb'
                    ));
                }
                for (let i = 0; i < 7; i++) {
                    game.particles.push(new GasParticle(
                        this.x + this.w / 2, this.y + 16,
                        dir * (Math.random() * 2.4 + 0.8), (Math.random() - 0.5) * 2.4,
                        6, enraged ? '#c433ff' : '#9eff00', 22
                    ));
                }
            }
        }

        const groundTile = this.vy === 0 ? game.getSolidRectHit(this.x, this.y + 2, this.w, this.h, false) : null;
        const wasGrounded = groundTile !== null;

        // WORLD 2 MONSTER AI BEHAVIORS:
        // 1) Maggotron: proximity scuttle-charge when Fartio is directly ahead on same tier!
        if (this.type === 'maggot' && wasGrounded && !game.player.dead) {
            const dx = game.player.x - this.x;
            const dy = Math.abs(game.player.y - this.y);
            const facingPlayer = (dx > 0 && this.vx > 0) || (dx < 0 && this.vx < 0);
            this.lunging = facingPlayer && Math.abs(dx) < 170 && dy < 54;
            const spd = this.lunging ? 2.2 : 1.15;
            this.vx = (this.vx >= 0 ? 1 : -1) * spd;
            if (this.lunging && this.tick % 8 === 0) {
                game.particles.push(new GasParticle(
                    this.x + this.w / 2, this.y + this.h - 4, 0, -0.4, 3, '#c9e829', 14
                ));
            }
        }

        // 2) Stinktail Skunk: telegraphs tail-lift then lobs a bouncing Rotten Stink Egg toward Fartio!
        if (this.type === 'skunk') {
            this.telegraphing = false;
            if (!game.player.dead && !game.player.won) {
                const dist = Math.abs(game.player.x - this.x);
                const lobPhase = this.tick % 120;
                if (dist < 370 && lobPhase >= 30 && lobPhase < 50) {
                    this.telegraphing = true;
                    if (lobPhase % 5 === 0) {
                        game.particles.push(new GasParticle(
                            this.x + (this.vx > 0 ? 4 : this.w - 4),
                            this.y + 4,
                            0, -1.1, 4, '#ff66ff', 14
                        ));
                    }
                } else if (dist < 370 && lobPhase === 50) {
                    const dir = game.player.x < this.x ? -1 : 1;
                    if (this.x >= game.camX - 32 && this.x <= game.camX + VIEW_W + 32) {
                        window.soundFX.playFartShoot();
                    }
                    game.bossProjectiles.push(new BossSludgeBall(
                        this.x + this.w / 2,
                        this.y + 6,
                        dir * 2.9,
                        -4.3,
                        'stink_egg'
                    ));
                    for (let i = 0; i < 4; i++) {
                        game.particles.push(new GasParticle(
                            this.x + this.w / 2, this.y + 6,
                            dir * (Math.random() * 1.5), -0.8, 4, '#d938ff', 18
                        ));
                    }
                }
            }
        }

        // 3) Trashjaw Can-Monster: speeds up angrily once dented & clatters hop!
        if (this.type === 'canmonster') {
            const spd = this.dented ? 1.65 : 1.10;
            this.vx = (this.vx >= 0 ? 1 : -1) * spd;
            if (wasGrounded && this.tick % 110 === 0) {
                const hopCheckX = this.vx > 0 ? this.x + this.w + 24 : this.x - 24;
                if (game.getSolidTileAt(hopCheckX, this.y + this.h + 4)) {
                    this.vy = -4.6;
                }
            }
        }

        // Bacteria periodically does a slimy micro-hop when solid ground is ahead!
        if (this.type === 'bacteria' && this.tick % 95 === 0 && wasGrounded) {
            const hopCheckX = this.vx > 0 ? this.x + this.w + 28 : this.x - 28;
            if (game.getSolidTileAt(hopCheckX, this.y + this.h + 4)) {
                this.vy = -5.2;
            }
        }

        this.vy += 0.38;
        if (this.vy > 9) this.vy = 9;

        // Gentle conveyor drift for grounded monsters (only if solid floor continues ahead)
        let beltDrift = 0;
        if (wasGrounded && groundTile && (groundTile.type === 'conveyor_r' || groundTile.type === 'conveyor_l')) {
            const dir = groundTile.type === 'conveyor_r' ? 1 : -1;
            const checkX = dir > 0 ? this.x + this.w + 4 : this.x - 4;
            if (game.getSolidTileAt(checkX, this.y + this.h + 4)) {
                beltDrift = dir * 0.65;
            }
        }

        // Horizontal movement & collision
        this.x += this.vx + beltDrift;
        const sideHit = game.getSolidRectHit(this.x, this.y, this.w, this.h, false);
        if (sideHit) {
            if (this.vx + beltDrift > 0) this.x = sideHit.x - this.w;
            else if (this.vx + beltDrift < 0) this.x = sideHit.x + sideHit.w;
            this.vx = -this.vx;
        } else if (wasGrounded && this.type !== 'boss' && this.type !== 'boss2') {
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

        // Ambient stink particles on Poop, Skunk & Boss enemies
        if ((this.type === 'poop' || this.type === 'skunk' || this.type === 'boss' || this.type === 'boss2') && this.tick % 24 === 0) {
            const pCol = this.type === 'boss2'
                ? (this.hp <= 4 ? '#c433ff' : '#ffcc00')
                : (this.type === 'skunk' ? '#d938ff' : (this.type === 'boss' ? '#9eff00' : '#855828'));
            game.particles.push(new GasParticle(
                this.x + this.w / 2 + (Math.random() - 0.5) * 16,
                this.y + 4,
                0,
                -0.7,
                (this.type === 'boss' || this.type === 'boss2') ? 5 : 3,
                pCol,
                25
            ));
        }
    }

    stomp(game) {
        if (this.type === 'boss' || this.type === 'boss2') {
            const stompMsg = this.type === 'boss2' ? 'JUNK CRUSH!' : 'ROYAL STOMP!';
            this.damageBoss(game, 2, stompMsg, true);
            return;
        }

        this.squished = true;
        this.squishTimer = 32;
        if (this.type === 'canmonster') {
            window.soundFX.playArmorClang();
        }
        window.soundFX.playStompSplat();

        const ptsMap = { poop: 200, bacteria: 300, fly: 400, maggot: 300, skunk: 450, canmonster: 500 };
        const labelMap = {
            poop: 'SPLAT! +200',
            bacteria: 'GERM SQUISHED! +300',
            fly: 'BUZZGERM SWAT! +400',
            maggot: 'GRUB POPPED! +300',
            skunk: 'DE-STUNK! +450',
            canmonster: 'CAN CRUSHED! +500'
        };
        const colMap = {
            poop: '#d48b3b',
            bacteria: '#8cff26',
            fly: '#d88cff',
            maggot: '#f2eab6',
            skunk: '#ff85ff',
            canmonster: '#cad8e3'
        };

        const pts = ptsMap[this.type] || 250;
        game.score += pts;
        game.texts.push(new FloatingText(this.x - 10, this.y, labelMap[this.type] || `SPLAT! +${pts}`, colMap[this.type] || '#9eff24'));

        for (let i = 0; i < 10; i++) {
            game.particles.push(new DebrisParticle(
                this.x + 15,
                this.y + 20,
                (Math.random() - 0.5) * 6,
                -Math.random() * 5 - 1,
                colMap[this.type] || '#7d481b',
                5
            ));
        }
    }

    killByGas(game, dir = 1, dmg = 1) {
        if (this.type === 'boss' || this.type === 'boss2') {
            this.damageBoss(game, dmg, 'GAS HIT!', false);
            return;
        }

        // Trashjaw Can-Monster's galvanized lid absorbs 1 regular gas hit before breaking!
        if (this.type === 'canmonster' && this.hp > dmg) {
            this.hp -= dmg;
            this.dented = true;
            this.hurtTimer = 8;
            this.vy = -3.0;
            window.soundFX.playArmorClang();
            game.score += 100;
            game.texts.push(new FloatingText(this.x - 10, this.y - 6, 'CLANG! DENTED!', '#cad8e3'));
            for (let i = 0; i < 6; i++) {
                game.particles.push(new DebrisParticle(
                    this.x + 15, this.y + 10, (Math.random() - 0.5) * 5, -Math.random() * 4 - 1, '#e1eef7', 4
                ));
            }
            return;
        }

        this.flipped = true;
        this.vx = dir * 2.5;
        this.vy = -6.5;
        window.soundFX.playStompSplat();
        const pts = this.type === 'canmonster' ? 450 : (this.type === 'skunk' ? 400 : 250);
        game.score += pts;
        const msg = this.type === 'canmonster' ? `TRASHED! +${pts}` : `GASSY KO! +${pts}`;
        game.texts.push(new FloatingText(this.x, this.y, msg, '#a6ff00'));

        const splatColor = this.type === 'canmonster' ? '#8a9ba8'
            : (this.type === 'skunk' ? '#d938ff'
            : (this.type === 'maggot' ? '#f2eab6'
            : (this.type === 'fly' ? '#9c42f5' : (this.type === 'bacteria' ? '#70e01b' : '#7d481b'))));
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
            this.vy = -8.8;
            window.soundFX.playBossRoar();
            const isBoss2 = this.type === 'boss2';
            const bonus = isBoss2 ? 8000 : 5000;
            const winMsg = isBoss2 ? 'GARBAGIO INCINERATED! +8000' : 'KING POOPA FLUSHED! +5000';
            game.score += bonus;
            game.texts.push(new FloatingText(this.x - 40, this.y - 10, winMsg, '#ffd700'));
            for (let i = 0; i < 28; i++) {
                game.particles.push(new DebrisParticle(
                    this.x + 24,
                    this.y + 24,
                    (Math.random() - 0.5) * 10,
                    -Math.random() * 8 - 2,
                    i % 2 === 0 ? '#ffd700' : (isBoss2 ? '#c433ff' : '#7d4418'),
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
            const phaseNote = (this.type === 'boss2' && this.hp === 4) ? ' ENRAGED!' : '';
            game.texts.push(new FloatingText(this.x - 12, this.y - 8, `${textLabel} (${this.hp} HP)${phaseNote}`, '#ffaa00'));
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

        // Flip sprite horizontally when moving right for directional monsters
        const faceRight = this.vx > 0 && (this.type === 'maggot' || this.type === 'skunk');
        if (faceRight && !this.flipped) {
            ctx.translate(sx + 16, sy + 16);
            ctx.scale(-1, 1);
            ctx.translate(-(sx + 16), -(sy + 16));
        }

        if (this.type === 'boss' || this.type === 'boss2') {
            const isBoss2 = this.type === 'boss2';
            const animSpeed = (isBoss2 && this.hp <= 4) ? 6 : 10;
            const spr = (Math.floor(this.tick / animSpeed) % 2 === 0)
                ? window.sprites.cache[isBoss2 ? 'boss2_1' : 'boss_1']
                : window.sprites.cache[isBoss2 ? 'boss2_2' : 'boss_2'];
            ctx.drawImage(spr, sx, sy);

            // Overhead Boss HP Bar
            if (!this.flipped && this.hp > 0) {
                const barW = 58;
                const bx = sx - 5;
                const by = sy - 14;
                ctx.fillStyle = '#000';
                ctx.fillRect(bx - 1, by - 1, barW + 2, 8);
                ctx.fillStyle = '#4a1212';
                ctx.fillRect(bx, by, barW, 6);
                ctx.fillStyle = (isBoss2 && this.hp <= 4) ? '#d938ff' : '#ff3300';
                ctx.fillRect(bx, by, Math.round(barW * (this.hp / this.maxHp)), 6);
            }
        } else if (this.type === 'poop') {
            const spr = this.squished
                ? window.sprites.cache.poop_squish
                : ((Math.floor(this.tick / 10) % 2 === 0) ? window.sprites.cache.poop_1 : window.sprites.cache.poop_2);
            ctx.drawImage(spr, sx, sy);

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
            const spr = this.squished
                ? window.sprites.cache.fly_squish
                : ((Math.floor(this.tick / 5) % 2 === 0) ? window.sprites.cache.fly_1 : window.sprites.cache.fly_2);
            ctx.drawImage(spr, sx, sy);
        } else if (this.type === 'maggot') {
            const rate = this.lunging ? 4 : 8;
            const spr = this.squished
                ? window.sprites.cache.maggot_squish
                : ((Math.floor(this.tick / rate) % 2 === 0) ? window.sprites.cache.maggot_1 : window.sprites.cache.maggot_2);
            ctx.drawImage(spr, sx, sy - 4);
        } else if (this.type === 'skunk') {
            const spr = this.squished
                ? window.sprites.cache.skunk_squish
                : ((Math.floor(this.tick / (this.telegraphing ? 4 : 8)) % 2 === 0) ? window.sprites.cache.skunk_1 : window.sprites.cache.skunk_2);
            ctx.drawImage(spr, sx, sy - (this.telegraphing ? 2 : 0));
            if (this.telegraphing && !this.squished && !this.flipped) {
                ctx.fillStyle = (Math.floor(this.tick / 3) % 2 === 0) ? '#ff66ff' : '#ffee33';
                ctx.fillRect(sx + 22, sy - 6, 6, 6);
            }
        } else if (this.type === 'canmonster') {
            let spr;
            if (this.squished) {
                spr = window.sprites.cache.canmonster_squish;
            } else if (this.dented) {
                spr = window.sprites.cache.canmonster_dented;
            } else {
                spr = (Math.floor(this.tick / 9) % 2 === 0)
                    ? window.sprites.cache.canmonster_1
                    : window.sprites.cache.canmonster_2;
            }
            ctx.drawImage(spr, sx, sy);
        } else {
            const spr = this.squished
                ? window.sprites.cache.bacteria_squish
                : ((Math.floor(this.tick / 9) % 2 === 0) ? window.sprites.cache.bacteria_1 : window.sprites.cache.bacteria_2);
            ctx.drawImage(spr, sx, sy);
        }
        ctx.restore();
    }
}

// ============================================================================
// PLAYER: FARTIO (Regular, Super Bean & Garlic Burrito Turbo Modes!)
// ============================================================================

class Player {
    constructor(x, y, isSuper = false, isGarlic = false) {
        const big = isSuper || isGarlic;
        this.x = x;
        this.y = big ? y - 8 : y;
        this.w = 26;
        this.h = big ? 38 : 30;
        this.vx = 0;
        this.vy = 0;
        this.facing = 1; // 1 = right, -1 = left
        this.onGround = false;
        this.ridingPlatform = null;
        this.standingBlock = null;
        this.bounceLock = false;
        this.isSuper = big;       // Bean-Powered Super Fartio
        this.isGarlic = isGarlic; // World 2 Fermented Garlic Burrito Turbo Mode!
        this.airFartsLeft = isGarlic ? 2 : 1; // 2 mid-air fart boosts in Garlic Turbo mode!
        this.canDoubleFart = true;
        this.invincibleTimer = 0;
        this.shootCooldown = 0;
        this.animTick = 0;
        this.dead = false;
        this.won = false;
    }

    getMaxAirFarts() {
        return this.isGarlic ? 2 : 1;
    }

    resetAirFarts() {
        this.airFartsLeft = this.getMaxAirFarts();
        this.canDoubleFart = true;
    }

    growTallSafely(game) {
        if (!this.isSuper) {
            this.isSuper = true;
            this.y -= 8;
            this.h = 38;
            const ceilHit = game.getSolidRectHit(this.x, this.y, this.w, this.h, false);
            if (ceilHit && ceilHit.y < this.y + 16) {
                this.y = ceilHit.y + ceilHit.h;
            }
        }
    }

    makeSuper(game) {
        this.growTallSafely(game);
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

    makeGarlic(game) {
        this.growTallSafely(game);
        this.isGarlic = true;
        this.resetAirFarts();
        for (let i = 0; i < 20; i++) {
            const ang = (Math.PI * 2 * i) / 20;
            game.particles.push(new GasParticle(
                this.x + this.w / 2,
                this.y + this.h / 2,
                Math.cos(ang) * 4.0,
                Math.sin(ang) * 4.0,
                7,
                i % 2 === 0 ? '#33ffcc' : '#d97aff',
                32
            ));
        }
    }

    emitFartCloud(game, count = 10, isBig = false) {
        const buttX = this.facing === 1 ? this.x + 2 : this.x + this.w - 2;
        const buttY = this.y + this.h - 8;
        const colors = this.isGarlic
            ? ['#33ffcc', '#d97aff', '#b8ff33', '#ffd700']
            : (isBig
                ? ['#9eff00', '#62c412', '#d4ff4d', '#b8860b']
                : ['#72e01b', '#a6ff00', '#4ca614']);

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
            // Slide down flagpole then walk into the Fortress / Deodorizer Silo
            const doorTargetX = game.currentWorld === 2 ? game.flagX + 126 : game.flagX + 115;
            if (this.y < GROUND_ROW * TILE - this.h) {
                this.y += 3.5;
                this.animTick++;
                if (this.animTick % 6 === 0) {
                    this.emitFartCloud(game, 3, false);
                }
            } else {
                this.y = GROUND_ROW * TILE - this.h;
                this.facing = 1;
                if (this.x < doorTargetX) {
                    this.x += 2.0;
                    this.animTick++;
                }
            }
            return;
        }

        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.shootCooldown > 0) this.shootCooldown--;

        // Carry motion if standing on a MovingPlatform or Motorized Conveyor Belt!
        let carryVx = 0;
        if (this.onGround && this.ridingPlatform) {
            carryVx = this.ridingPlatform.vx;
            this.y = this.ridingPlatform.y - this.h;
        } else if (this.onGround && this.standingBlock && !this.standingBlock.collapsed) {
            if (this.standingBlock.type === 'conveyor_r') carryVx = 1.65;
            else if (this.standingBlock.type === 'conveyor_l') carryVx = -1.65;
        }

        // Horizontal movement (Garlic Turbo grants +15% faster sprint boost!)
        const maxSpeed = this.isGarlic
            ? (keys.shoot ? 5.05 : 3.85)
            : (keys.shoot ? 4.4 : 3.4);
        const accel = this.onGround ? (this.isGarlic ? 0.36 : 0.32) : 0.23;
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
            if (this.isGarlic && Math.abs(this.vx) > 3.9 && this.animTick % 3 === 0) {
                game.particles.push(new GasParticle(
                    this.x + this.w / 2, this.y + this.h - 5,
                    -this.facing * 1.2, -0.3, 4, '#33ffcc', 14
                ));
            }
        }

        // FART JUMP! (Supports Double Fart, or TRIPLE FART in Garlic Turbo Mode!)
        if (keys.jumpPressed) {
            keys.jumpPressed = false;
            if (this.onGround) {
                this.vy = -11.3;
                this.bounceLock = false;
                this.onGround = false;
                this.ridingPlatform = null;
                this.standingBlock = null;
                this.resetAirFarts();
                window.soundFX.playFartJump(this.isSuper);
                this.emitFartCloud(game, 12, this.isSuper);
            } else if (this.airFartsLeft > 0) {
                this.airFartsLeft--;
                this.canDoubleFart = this.airFartsLeft > 0;
                this.bounceLock = false;
                const isThirdJet = this.isGarlic && this.airFartsLeft === 0;
                this.vy = isThirdJet ? -10.3 : -9.8;
                window.soundFX.playFartJump(true);
                this.emitFartCloud(game, 16, true);
                game.texts.push(new FloatingText(
                    this.x - 8,
                    this.y + 16,
                    isThirdJet ? 'GARLIC JET!' : 'TOOT!',
                    isThirdJet ? '#33ffcc' : '#b8ff33'
                ));
            }
        }

        if (this.bounceLock && this.vy >= -4.5) {
            this.bounceLock = false;
        }

        // Smooth variable jump height when releasing jump key early (preserves Whoopee BouncePad launches)
        if (!keys.jump && !this.bounceLock && this.vy < -4.5) {
            this.vy *= 0.80;
        }

        // FART SHOOT ON ENEMIES!
        if (keys.shootPressed) {
            keys.shootPressed = false;
            if (this.shootCooldown <= 0) {
                this.shootCooldown = this.isGarlic ? 14 : (this.isSuper ? 16 : 26);
                window.soundFX.playFartShoot();
                const spawnX = this.facing === 1 ? this.x + this.w + 4 : this.x - 4;
                const spawnY = this.y + this.h * 0.55;
                game.projectiles.push(new FartProjectile(spawnX, spawnY, this.facing, this.isSuper, this.isGarlic));
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
        const prevVy = this.vy;
        this.y += this.vy;
        this.onGround = false;
        this.ridingPlatform = null;
        this.standingBlock = null;

        const solidVertHit = game.getSolidRectHit(this.x, this.y, this.w, this.h, false);
        if (solidVertHit) {
            if (this.vy >= 0) {
                this.y = solidVertHit.y - this.h;
                this.vy = 0;
                this.bounceLock = false;
                this.onGround = true;
                this.standingBlock = solidVertHit;
                this.resetAirFarts();
            } else {
                this.y = solidVertHit.y + solidVertHit.h;
                this.vy = 1.2;
                this.bounceLock = false;
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
                    this.bounceLock = false;
                    this.onGround = true;
                    this.resetAirFarts();
                    this.ridingPlatform = plat;
                    break;
                }
            }
        }

        // Check Whoopee Cushion Bounce Pads!
        for (const pad of game.bouncePads) {
            if (pad.checkLaunch(this, game, prevVy)) break;
        }

        // Trigger Soggy Cardboard Crumble Platforms when standing on them!
        if (this.onGround) {
            for (const b of game.blocks) {
                if (b.type === 'cardboard' && !b.collapsed && !b.crumbling &&
                    this.x + this.w - 2 > b.x &&
                    this.x + 2 < b.x + b.w &&
                    Math.abs((this.y + this.h) - b.y) <= 3) {
                    b.crumbling = true;
                    b.crumbleTimer = 34;
                }
            }
        }

        // Check falling into a toxic sewage, leachate, fondue or molten lava pit
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

                const stompPrevBottom = (this.y - this.vy) + this.h;
                if (this.vy > 0 && stompPrevBottom <= enemy.y + 20) {
                    this.y = enemy.y - this.h;
                    enemy.stomp(game);
                    this.vy = -8.6;
                    this.resetAirFarts();
                    window.soundFX.playFartJump(false);
                    this.emitFartCloud(game, 10, false);
                } else if (this.invincibleTimer <= 0 && enemy.hurtTimer <= 0) {
                    this.takeDamage(game);
                }
            }
        }

        // Check Goal Flagpole / Deodorizer Tower at the end of the Level!
        if (this.x + this.w >= game.flagX && this.x <= game.flagX + 28) {
            this.won = true;
            this.vx = 0;
            this.vy = 0;
            for (const enemy of game.enemies) {
                if ((enemy.type === 'boss' || enemy.type === 'boss2') && !enemy.dead && !enemy.flipped) {
                    enemy.hp = 1;
                    enemy.hurtTimer = 0;
                    const msg = enemy.type === 'boss2' ? 'MEGA BIO-FLUSH!' : 'ROYAL FLUSH!';
                    enemy.damageBoss(game, 2, msg, false);
                }
            }
            game.triggerVictory();
        }
    }

    takeDamage(game) {
        if (this.isGarlic) {
            // Step down from Garlic Turbo to Super Bean Fartio!
            this.isGarlic = false;
            this.airFartsLeft = Math.min(this.airFartsLeft, 1);
            this.canDoubleFart = this.airFartsLeft > 0;
            this.invincibleTimer = 90;
            window.soundFX.playDamageOrDie(false);
            game.texts.push(new FloatingText(this.x - 10, this.y, 'GARLIC BOOST LOST!', '#d97aff'));
        } else if (this.isSuper) {
            // Shrink from Super Bean Fartio back to normal Fartio while keeping feet planted
            const prevH = this.h;
            this.isSuper = false;
            this.h = 30;
            this.y += (prevH - this.h);
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
            return;
        }

        const prefix = this.isGarlic ? 'garlic_' : (this.isSuper ? 'super_' : 'fartio_');
        let spr = window.sprites.cache[prefix + 'idle'];
        const walkTargetX = game.currentWorld === 2 ? game.flagX + 126 : game.flagX + 115;

        if (!this.onGround && !this.won) {
            spr = window.sprites.cache[prefix + 'jump'];
        } else if (Math.abs(this.vx) > 0.2 || (this.won && this.x < walkTargetX)) {
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
// MAIN GAME CONTROLLER — WORLD 1 (1-1..1-4) & WORLD 2: THE ROTTEN LANDFILL (2-1..2-4)
// ============================================================================

const LEVEL_INFO = {
    1: { code: '1-1', world: 1, name: 'THE GREAT SEWER', subtitle: 'SLUDGE CANALS & STINK PIPES', theme: 'sewer',
         goal: 'Run through the sewer, stomp poop monsters and reach the Royal Flush Flagpole before time runs out!' },
    2: { code: '1-2', world: 1, name: 'TOXIC PIPEWORKS', subtitle: 'HIGH DUCTS & GRATE LIFTS', theme: 'pipeworks',
         goal: 'Ride the moving grate lifts across the toxic ducts and reach the flagpole at the end!' },
    3: { code: '1-3', world: 1, name: 'SEPTIC LAGOON', subtitle: 'HIGH CATWALK BRIDGES', theme: 'lagoon',
         goal: 'Hop across the high catwalk bridges - don\'t fall into the septic lagoon - and reach the flagpole!' },
    4: { code: '1-4', world: 1, name: "POOPA'S CITADEL", subtitle: 'ROYAL PORCELAIN BOSS FORTRESS', theme: 'castle',
         goal: 'Dodge the firebars, defeat King Poopa (stomp or gas him) and flush him at the Royal Flagpole!' },
    5: { code: '2-1', world: 2, name: 'MOUNT GARBAGIO', subtitle: 'JUNKYARD DUNES & METHANE GEYSERS', theme: 'landfill',
         goal: 'Grab the Fermented Garlic Burrito for Triple Fart Jumps, bounce off Whoopee Cushions & reach the Pine-Fresh Deodorizer Tower! (3 ★ Hidden)' },
    6: { code: '2-2', world: 2, name: 'COMPACTOR FACTORY', subtitle: 'TURBO CONVEYORS & WRECKING PENDULUMS', theme: 'factory',
         goal: 'Sprint across motorized Conveyor Belts, dodge swinging Junk Wrecking Balls & shut down the Compactor line! (3 ★ Hidden)' },
    7: { code: '2-3', world: 2, name: 'MOLDY CHEESE MARSH', subtitle: 'SOGGY CARDBOARD & FONDUE BOG', theme: 'marsh',
         goal: 'Dash across crumbling soggy Cardboard rafts, surf Methane Updraft geysers over the fondue bog & reach the Deodorizer! (3 ★ Hidden)' },
    8: { code: '2-4', world: 2, name: "GARBAGIO'S INCINERATOR", subtitle: 'SLAG FURNACE & EMPEROR GARBAGIO', theme: 'incinerator',
         goal: 'Brave the furnace traps, defeat 8-HP Emperor Garbagio on the Compactor Arena & activate the Royal Pine-Fresh Deodorizer! (3 ★ Hidden)' }
};

class Game {
    constructor() {
        this.score = 0;
        this.coins = 0;
        this.worldTick = 0;
        this.currentLevel = 1;
        this.bestStarsByLevel = {};
        this.started = false; // false while the level briefing splash is shown
        this.resetLevel(false);
    }

    getWorld2TotalStars() {
        let sum = 0;
        for (let lvl = 5; lvl <= 8; lvl++) {
            sum += (this.bestStarsByLevel && this.bestStarsByLevel[lvl]) || 0;
        }
        return sum;
    }

    selectLevel(lvl) {
        if (lvl < 1 || lvl > 8) return;
        this.currentLevel = lvl;
        this.updateLevelButtons();
        this.started = false;
        this.resetLevel(false);
        showStartScreen();
    }

    updateLevelButtons() {
        document.querySelectorAll('.lvl-btn').forEach((btn) => {
            const bLvl = parseInt(btn.getAttribute('data-level'), 10);
            btn.classList.toggle('active', bLvl === this.currentLevel);
        });
    }

    advanceAfterVictory() {
        this.started = false; // Show the briefing for the next level
        if (this.currentLevel < 8) {
            this.currentLevel++;
            this.updateLevelButtons();
            this.resetLevel(true); // Preserve Super Bean & Garlic Turbo modes across stages & into World 2!
        } else {
            // Completed all 8 stages across World 1 & World 2 -> Fresh New Game loop from 1-1
            this.currentLevel = 1;
            this.score = 0;
            this.coins = 0;
            this.bestStarsByLevel = {};
            this.updateLevelButtons();
            this.resetLevel(false);
        }
        showStartScreen();
    }

    resetLevel(preservePowerup = false) {
        const keepSuper = Boolean(preservePowerup && this.player && this.player.isSuper);
        const keepGarlic = Boolean(preservePowerup && this.player && this.player.isGarlic);
        this.state = 'PLAYING'; // 'PLAYING', 'VICTORY', 'GAME_OVER'
        this.victoryTimer = 0;
        this.introBannerTimer = 150;
        this.camX = 0;
        this.timeLeft = 400;
        this.blocks = [];
        this.pipes = [];
        this.platforms = [];
        this.firebars = [];
        this.bouncePads = [];
        this.updraftVents = [];
        this.pendulums = [];
        this.enemies = [];
        this.items = [];
        this.projectiles = [];
        this.bossProjectiles = [];
        this.particles = [];
        this.texts = [];
        this.pitCols = new Set();
        this.levelStars = 0;
        this.totalStars = 0;

        const info = LEVEL_INFO[this.currentLevel] || LEVEL_INFO[1];
        this.levelTheme = info.theme;
        this.currentWorld = info.world || (this.currentLevel >= 5 ? 2 : 1);

        this.player = new Player(80, (GROUND_ROW - 2) * TILE, keepSuper, keepGarlic);

        if (this.currentLevel === 1) {
            this.buildLevel1_1();
        } else if (this.currentLevel === 2) {
            this.buildLevel1_2();
        } else if (this.currentLevel === 3) {
            this.buildLevel1_3();
        } else if (this.currentLevel === 4) {
            this.buildLevel1_4();
        } else if (this.currentLevel === 5) {
            this.buildLevel2_1();
        } else if (this.currentLevel === 6) {
            this.buildLevel2_2();
        } else if (this.currentLevel === 7) {
            this.buildLevel2_3();
        } else {
            this.buildLevel2_4();
        }

        this.updateLevelButtons();
        window.soundFX.stopBGM();
        if (this.started && window.soundFX.bgmEnabled && window.soundFX.ctx) {
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
            type: type,       // World 1 & 2 solid/interactive tile type
            content: content, // 'coin', 'beans', 'burrito', 'tp', 'multicoin'
            hitsLeft: hits,
            bumpY: 0,
            crumbling: false,
            crumbleTimer: 0,
            collapsed: false,
            respawnTimer: 0
        });
    }

    addStar(col, row) {
        this.items.push(new CollectibleItem(col * TILE + 1, row * TILE + 1, 'star'));
        this.totalStars++;
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
        const yOffset = (type === 'boss' || type === 'boss2') ? 18 : (type === 'maggot' ? -2 : 2);
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

    // ========================================================================
    // WORLD 2-1: MOUNT GARBAGIO (Junkyard Dunes, Whoopee Pads & Methane Geysers)
    // ========================================================================
    buildLevel2_1() {
        const levelCols = 150;
        this.levelWidth = levelCols * TILE;
        this.flagX = 138 * TILE;

        // Bubbling Purple-Gold Landfill Leachate Pits (with safe Compost Island at 56-57)
        this.pitCols = new Set([
            29, 30, 31,
            53, 54, 55,
            58, 59, 60,
            91, 92, 93, 94,
            118, 119
        ]);

        for (let col = 0; col < levelCols; col++) {
            if (this.pitCols.has(col)) continue;
            for (let row = GROUND_ROW; row < 15; row++) {
                this.addBlock(col, row, 'trash_ground');
            }
        }

        // Opening Dumpster Taqueria Cluster — First Fermented Garlic Burrito!
        this.addBlock(10, 9, 'qblock', 'coin');
        this.addBlock(13, 9, 'scrap_brick');
        this.addBlock(14, 9, 'qblock', 'burrito'); // Grants Garlic Turbo (Triple Fart + Piercing Gas!)
        this.addBlock(15, 9, 'scrap_brick');
        this.addBlock(16, 9, 'qblock', 'coin');
        this.addBlock(14, 5, 'qblock', 'multicoin', 5);

        // Rusty Oil-Drum Pipe & First Whoopee Cushion Bounce Pad!
        this.addPipe(21, 2);
        this.bouncePads.push(new BouncePad(23.5, GROUND_ROW));
        for (let c = 26; c <= 28; c++) {
            this.addBlock(c, 6, 'scrap_brick');
            this.items.push(new CollectibleItem(c * TILE + 2, 4.5 * TILE, 'coin'));
        }

        // Trashjaw Alley & Scrap Crate Terraces (Cols 33-51)
        this.addPipe(36, 3);
        this.addBlock(41, 9, 'scrap_brick');
        this.addBlock(42, 9, 'qblock', 'beans');
        this.addBlock(43, 9, 'scrap_brick');
        this.addPipe(47, 4);

        // Methane Compost Geyser Gorge (Cols 53-66) -> STINK STAR #1!
        this.updraftVents.push(new UpdraftVent(56, GROUND_ROW, 8.5));
        for (let c = 60; c <= 66; c++) {
            this.addBlock(c, 4, 'bridge');
            if (c !== 63 && c % 2 === 0) {
                this.items.push(new CollectibleItem(c * TILE + 2, 2.5 * TILE, 'coin'));
            }
        }
        this.addStar(63, 2); // ★ Golden Stink Star #1!

        // Scrapyard Compactor Stacks (Cols 70-88) -> STINK STAR #2!
        this.addBlock(72, 9, 'scrap_brick');
        this.addBlock(73, 9, 'qblock', 'burrito');
        this.addBlock(74, 9, 'scrap_brick');
        this.bouncePads.push(new BouncePad(75.5, GROUND_ROW));

        for (let c = 79; c <= 85; c++) {
            this.addBlock(c, 7, 'scrap_brick');
        }
        this.addBlock(82, 3, 'qblock', 'tp');
        this.addStar(84, 5); // ★ Golden Stink Star #2!

        // Whoopee Cushion Mega-Jump over Leachate Chasm (Cols 90-95)
        this.bouncePads.push(new BouncePad(90, GROUND_ROW));
        for (let c = 91; c <= 94; c++) {
            this.items.push(new CollectibleItem(c * TILE + 2, 6 * TILE, 'coin'));
        }

        // Biohazard Oil-Drum Valley (Cols 98-117) -> STINK STAR #3!
        this.addPipe(98, 2);
        this.addPipe(104, 3);
        this.bouncePads.push(new BouncePad(107, GROUND_ROW));
        this.addPipe(110, 4);
        this.addStar(110, 4); // ★ Golden Stink Star #3 high above tallest drum!

        // Final Junkyard Gauntlet & Compacted Trash Pyramid (Cols 120-138)
        this.addBlock(121, 9, 'qblock', 'coin');
        this.addBlock(122, 9, 'scrap_brick');
        this.addBlock(123, 9, 'qblock', 'multicoin', 5);

        for (let step = 0; step < 6; step++) {
            for (let col = 126 + step; col <= 131; col++) {
                this.addBlock(col, GROUND_ROW - 1 - step, 'trash_ground');
            }
        }
        this.addBlock(138, GROUND_ROW - 1, 'trash_ground');

        // Landfill Monsters (Maggotron, Stinktail, Armored Trashjaw & Sewer Mutants)
        this.spawnEnemy(17, 'maggot');
        this.spawnEnemy(27, 'poop');
        this.spawnEnemy(34, 'maggot');
        this.spawnEnemy(40, 'canmonster');
        this.spawnEnemy(45, 'skunk');
        this.spawnEnemy(50, 'maggot');
        this.spawnEnemy(67, 'fly', 6);
        this.spawnEnemy(63, 'bacteria');
        this.spawnEnemy(68, 'maggot');
        this.spawnEnemy(71, 'canmonster');
        this.spawnEnemy(82, 'canmonster');
        this.spawnEnemy(86, 'skunk');
        this.spawnEnemy(96, 'maggot');
        this.spawnEnemy(101, 'skunk');
        this.spawnEnemy(106, 'bacteria');
        this.spawnEnemy(113, 'canmonster');
        this.spawnEnemy(121, 'maggot');
        this.spawnEnemy(124, 'skunk');
    }

    // ========================================================================
    // WORLD 2-2: COMPACTOR FACTORY (Motorized Conveyors & Wrecking Pendulums)
    // ========================================================================
    buildLevel2_2() {
        const levelCols = 155;
        this.levelWidth = levelCols * TILE;
        this.flagX = 143 * TILE;

        this.pitCols = new Set([
            26, 27, 28, 29,
            52, 53, 54, 55,
            78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
            114, 115, 116, 117
        ]);

        for (let col = 0; col < levelCols; col++) {
            if (this.pitCols.has(col)) continue;
            // Surface Row 13 mixes Factory Steel with Motorized Conveyor Belts!
            let topType = 'factory_ground';
            if (col >= 20 && col <= 25) topType = 'conveyor_r';      // Tailwind launch belt!
            else if (col >= 34 && col <= 42) topType = 'conveyor_l'; // Headwind belt!
            else if (col >= 93 && col <= 100) topType = 'conveyor_l';

            this.addBlock(col, GROUND_ROW, topType);
            this.addBlock(col, GROUND_ROW + 1, 'factory_ground');
        }

        // Assembly Line Power-Up Supply
        this.addBlock(10, 9, 'qblock', 'coin');
        this.addBlock(11, 9, 'scrap_brick');
        this.addBlock(12, 9, 'qblock', 'burrito');
        this.addBlock(13, 9, 'scrap_brick');
        this.addBlock(14, 9, 'qblock', 'coin');

        // Tailwind Belt (Cols 20-25) launches Fartio through Coin Arc over Pit 26-29!
        for (let c = 26; c <= 29; c++) {
            this.items.push(new CollectibleItem(c * TILE + 2, 7 * TILE, 'coin'));
        }

        // Headwind Belt (Cols 34-42) + First Swinging Junk Wrecking-Ball Pendulum!
        this.addBlock(38, 8, 'factory_ground');
        this.pendulums.push(new TrashPendulum(38, 8, 6, 1.0, 0.036, 0));

        // Methane Loft & Upper Factory Catwalk (Cols 46-55) -> STINK STAR #1!
        this.updraftVents.push(new UpdraftVent(46, GROUND_ROW, 8.6));
        for (let c = 48; c <= 55; c++) {
            this.addBlock(c, 4, 'bridge');
        }
        this.addStar(51, 2); // ★ Golden Stink Star #1!

        // Lower Route Moving Grate Lift across Pit 52-55
        this.platforms.push(new MovingPlatform(52.5 * TILE, 10 * TILE, 2.5, 36, 0, 0.038, 0));

        // Sorting Floor & Oil-Drum Presses (Cols 58-76)
        this.addPipe(60, 2);
        this.addBlock(64, 9, 'scrap_brick');
        this.addBlock(65, 9, 'qblock', 'burrito');
        this.addBlock(66, 9, 'scrap_brick');
        this.addPipe(70, 3);
        this.bouncePads.push(new BouncePad(76, GROUND_ROW));

        // Elevated Conveyor Chasm (Cols 78-88) -> STINK STAR #2!
        for (let c = 79; c <= 87; c++) {
            this.addBlock(c, 9, 'conveyor_r');
        }
        this.addBlock(83, 5, 'factory_ground');
        this.pendulums.push(new TrashPendulum(83, 5, 5, 0.95, 0.04, 1.2));
        this.addStar(83, 3); // ★ Golden Stink Star #2 above pendulum anchor!

        // Reverse Crusher Line & Twin Pendulums (Cols 93-108)
        this.addBlock(96, 8, 'factory_ground');
        this.pendulums.push(new TrashPendulum(96, 8, 6, 0.98, 0.038, 0));
        this.addBlock(101, 9, 'qblock', 'tp');
        this.addBlock(106, 8, 'factory_ground');
        this.pendulums.push(new TrashPendulum(106, 8, 6, 0.98, 0.038, Math.PI));

        // Pre-Exit Whoopee Vault over Pit 114-117 -> STINK STAR #3!
        this.bouncePads.push(new BouncePad(113, GROUND_ROW));
        this.addStar(115, 4); // ★ Golden Stink Star #3!

        // Final Factory Steel Staircase to Pine-Fresh Deodorizer Tower (Cols 129-143)
        for (let step = 0; step < 7; step++) {
            for (let col = 129 + step; col <= 135; col++) {
                this.addBlock(col, GROUND_ROW - 1 - step, 'factory_ground');
            }
        }
        this.addBlock(143, GROUND_ROW - 1, 'factory_ground');

        // Factory Monsters
        this.spawnEnemy(17, 'maggot');
        this.spawnEnemy(23, 'canmonster');
        this.spawnEnemy(32, 'skunk');
        this.spawnEnemy(40, 'maggot');
        this.spawnEnemy(49, 'fly', 6);
        this.spawnEnemy(58, 'canmonster');
        this.spawnEnemy(64, 'maggot');
        this.spawnEnemy(68, 'skunk');
        this.spawnEnemy(74, 'canmonster');
        this.spawnEnemy(81, 'bacteria', 8);
        this.spawnEnemy(86, 'fly', 6);
        this.spawnEnemy(91, 'skunk');
        this.spawnEnemy(99, 'canmonster');
        this.spawnEnemy(109, 'maggot');
        this.spawnEnemy(111, 'skunk');
        this.spawnEnemy(121, 'canmonster');
        this.spawnEnemy(125, 'maggot');
    }

    // ========================================================================
    // WORLD 2-3: MOLDY CHEESE MARSH (Soggy Cardboard Bridges & Fondue Bog)
    // ========================================================================
    buildLevel2_3() {
        const levelCols = 155;
        this.levelWidth = levelCols * TILE;
        this.flagX = 143 * TILE;

        // Boiling Curdled Fondue Bog spanning Cols 14-126 (with Swiss-Rind Islands & Geyser Pilings)
        this.pitCols = new Set();
        for (let c = 14; c <= 126; c++) {
            const isIsland =
                (c >= 28 && c <= 32) ||
                (c >= 52 && c <= 56) ||
                (c >= 74 && c <= 75) ||
                (c >= 80 && c <= 81) ||
                (c >= 86 && c <= 87) ||
                (c >= 92 && c <= 96);
            if (!isIsland) this.pitCols.add(c);
        }

        for (let col = 0; col < levelCols; col++) {
            if (this.pitCols.has(col)) continue;
            for (let row = GROUND_ROW; row < 15; row++) {
                this.addBlock(col, row, 'marsh_ground');
            }
        }

        // Starting Marsh Shore Power-Up
        this.addBlock(8, 9, 'qblock', 'burrito');
        this.addBlock(9, 9, 'scrap_brick');
        this.addBlock(10, 9, 'qblock', 'coin');

        // Span #1: First Soggy Crumbling Cardboard Rafts (Cols 15-26)
        for (let c = 15; c <= 19; c++) this.addBlock(c, 10, 'cardboard');
        for (let c = 22; c <= 26; c++) {
            this.addBlock(c, 9, 'cardboard');
            if (c % 2 === 0) this.items.push(new CollectibleItem(c * TILE + 2, 7 * TILE, 'coin'));
        }

        // Swiss-Rind Island #1 (Cols 28-32) with Oil-Drum & Whoopee Cushion!
        this.addPipe(29, 2);
        this.bouncePads.push(new BouncePad(32, GROUND_ROW));

        // Span #2: Split High/Low Soggy Cardboard Route (Cols 35-50) -> STINK STAR #1!
        for (let c = 36; c <= 41; c++) this.addBlock(c, 5, 'cardboard');
        this.addStar(38, 3); // ★ Golden Stink Star #1 on High Soggy Route!

        for (let c = 35; c <= 40; c++) this.addBlock(c, 9, 'cardboard');
        this.addBlock(42, 8, 'marsh_ground');
        this.addBlock(43, 8, 'marsh_ground');
        for (let c = 45; c <= 50; c++) this.addBlock(c, 9, 'cardboard');

        // Swiss-Rind Island #2 (Cols 52-56) — Mid-Stage Burrito Refresh
        this.addBlock(53, 9, 'qblock', 'burrito');
        this.addBlock(54, 9, 'scrap_brick');
        this.addBlock(55, 9, 'qblock', 'multicoin', 5);

        // Span #3: Shuttle Grate + Dual-Deck Marsh Catwalk (Cols 58-71)
        this.platforms.push(new MovingPlatform(58 * TILE, 10 * TILE, 2.5, 32, 0, 0.038, 0));
        for (let c = 64; c <= 71; c++) this.addBlock(c, 9, 'cardboard');
        for (let c = 65; c <= 70; c++) this.addBlock(c, 5, 'bridge');
        this.addBlock(67, 2, 'qblock', 'tp');

        // Span #4: Chained Methane Updraft Geyser Canyon (Cols 74-90) -> STINK STAR #2!
        this.updraftVents.push(new UpdraftVent(74, GROUND_ROW, 7.5));
        this.updraftVents.push(new UpdraftVent(80, GROUND_ROW, 8.5));
        this.updraftVents.push(new UpdraftVent(86, GROUND_ROW, 7.5));
        this.addStar(80, 4); // ★ Golden Stink Star #2 hovering in middle geyser plume!

        // Swiss-Rind Island #3 (Cols 92-96)
        this.addBlock(94, 9, 'qblock', 'beans');

        // Span #5: Final Soggy Cardboard Dash (Cols 98-125) -> STINK STAR #3!
        for (let c = 98; c <= 102; c++) this.addBlock(c, 10, 'cardboard');
        for (let c = 105; c <= 109; c++) this.addBlock(c, 8, 'cardboard');
        this.bouncePads.push(new BouncePad(108, 8, 0.72));
        this.addStar(111, 3); // ★ Golden Stink Star #3 via mid-bog Whoopee Bounce!

        for (let c = 111; c <= 115; c++) this.addBlock(c, 9, 'marsh_ground');
        for (let c = 117; c <= 124; c++) {
            this.addBlock(c, 9, 'cardboard');
            if (c % 2 === 1) this.items.push(new CollectibleItem(c * TILE + 2, 7 * TILE, 'coin'));
        }

        // End Shore Staircase to Pine-Fresh Deodorizer Tower (Cols 130-143)
        for (let step = 0; step < 7; step++) {
            for (let col = 130 + step; col <= 136; col++) {
                this.addBlock(col, GROUND_ROW - 1 - step, 'marsh_ground');
            }
        }
        this.addBlock(143, GROUND_ROW - 1, 'marsh_ground');

        // Marsh Monsters (Winged Flies, Stinktails & Marsh Hoppers)
        this.spawnEnemy(18, 'maggot', 9);
        this.spawnEnemy(21, 'fly', 6);
        this.spawnEnemy(31, 'skunk');
        this.spawnEnemy(39, 'fly', 6);
        this.spawnEnemy(48, 'fly', 5);
        this.spawnEnemy(55, 'canmonster');
        this.spawnEnemy(67, 'bacteria', 4);
        this.spawnEnemy(70, 'skunk', 4);
        this.spawnEnemy(78, 'fly', 5);
        this.spawnEnemy(84, 'fly', 5);
        this.spawnEnemy(95, 'canmonster');
        this.spawnEnemy(103, 'fly', 6);
        this.spawnEnemy(113, 'skunk', 8);
        this.spawnEnemy(121, 'fly', 5);
        this.spawnEnemy(127.2, 'maggot');
        this.spawnEnemy(128.6, 'bacteria');
    }

    // ========================================================================
    // WORLD 2-4: GARBAGIO'S INCINERATOR (Furnace Gauntlet & Emperor Garbagio!)
    // ========================================================================
    buildLevel2_4() {
        const levelCols = 158;
        this.levelWidth = levelCols * TILE;
        this.flagX = 146 * TILE;

        // Boiling Molten Slag Pits + Chasm beneath Emperor Garbagio's Compactor Arena (112-136)
        const slagCols = [
            19, 20, 21,
            42, 43, 44, 45,
            66, 67, 68, 69, 70, 71, 72,
            90, 91, 92
        ];
        for (let c = 112; c <= 136; c++) slagCols.push(c);
        this.pitCols = new Set(slagCols);

        for (let col = 0; col < levelCols; col++) {
            // Furnace Iron Ceiling up to Boss Arena (with open Skylights at 30-37 & 89-95)
            const inSkylight = (col >= 30 && col <= 37) || (col >= 89 && col <= 95);
            if (col <= 104 && !inSkylight) {
                this.addBlock(col, 1, 'incinerator');
            }
            if (this.pitCols.has(col)) continue;

            const topType = (col >= 49 && col <= 58) ? 'conveyor_l' : 'incinerator';
            this.addBlock(col, GROUND_ROW, topType);
            this.addBlock(col, GROUND_ROW + 1, 'incinerator');
        }

        // Furnace Entry Supply
        this.addBlock(10, 9, 'qblock', 'burrito');
        this.addBlock(11, 9, 'incinerator');
        this.addBlock(12, 9, 'qblock', 'coin');

        // Slag Pit #1 (Cols 19-21) with Rotating Toxic Firebar
        this.addBlock(20, 9, 'incinerator');
        this.firebars.push(new FireBar(20, 9, 4, 0.044, 0));

        // Skylight Bounce Vault (Cols 30-38) -> STINK STAR #1!
        this.bouncePads.push(new BouncePad(31, GROUND_ROW));
        this.addStar(33, 3); // ★ Golden Stink Star #1 through open furnace skylight!
        for (let c = 34; c <= 38; c++) {
            this.addBlock(c, 6, 'incinerator');
        }

        // Slag Pit #2 (Cols 42-45) with High-Speed Shuttle Grate
        this.platforms.push(new MovingPlatform(42.5 * TILE, 10 * TILE, 2, 32, 0, 0.042, 0));

        // Reverse Conveyor Furnace & Wrecking Pendulum + Firebar (Cols 49-63)
        this.addBlock(53, 8, 'incinerator');
        this.pendulums.push(new TrashPendulum(53, 8, 6, 0.98, 0.038, 0));
        this.addBlock(61, 9, 'incinerator');
        this.firebars.push(new FireBar(61, 9, 4, -0.045, 1.6));

        // Slag Pit #3 (Cols 66-72): Scorching Crumbling Cardboard Bridge!
        for (let c = 66; c <= 72; c++) {
            this.addBlock(c, 10, 'cardboard');
        }

        // Methane Furnace Loft (Cols 75-87) -> STINK STAR #2!
        this.updraftVents.push(new UpdraftVent(76, GROUND_ROW, 7.5));
        for (let c = 79; c <= 86; c++) {
            this.addBlock(c, 6, 'incinerator');
        }
        this.addStar(82, 4); // ★ Golden Stink Star #2 in upper furnace chamber!

        // Pre-Boss Skylight Bounce Vault over Pit 90-92 -> STINK STAR #3!
        this.bouncePads.push(new BouncePad(89, GROUND_ROW));
        this.addStar(92, 3); // ★ Golden Stink Star #3!

        // Pre-Boss Garlic Armory (Cols 98-104)
        this.addBlock(99, 9, 'incinerator');
        this.addBlock(100, 9, 'qblock', 'burrito');
        this.addBlock(101, 9, 'qblock', 'multicoin', 5);
        this.addBlock(102, 9, 'incinerator');

        // ====================================================================
        // EMPEROR GARBAGIO'S GRAND COMPACTOR BOSS ARENA (Cols 112-136)
        // ====================================================================
        for (let c = 112; c <= 136; c++) {
            let deckType = 'incinerator';
            if (c <= 115 || c >= 133) deckType = 'bridge';
            else if (c >= 116 && c <= 121) deckType = 'conveyor_r'; // Pulls toward center!
            else if (c >= 127 && c <= 132) deckType = 'conveyor_l'; // Pulls toward center!
            this.addBlock(c, 10, deckType);
        }
        // Flanking Whoopee Cushion Bounce Pads & Tactical Dodging Ledges!
        this.bouncePads.push(new BouncePad(113.4, 10, 0.84));
        this.bouncePads.push(new BouncePad(134.6, 10, 0.84));
        this.addBlock(118, 6, 'incinerator');
        this.addBlock(119, 6, 'incinerator');
        this.addBlock(129, 6, 'incinerator');
        this.addBlock(130, 6, 'incinerator');

        // Pine-Fresh Deodorizer Flagpole Base after the Boss Arena
        this.addBlock(146, GROUND_ROW - 1, 'incinerator');

        // Incinerator Guards + EMPEROR GARBAGIO (WORLD 2 BOSS)!
        this.spawnEnemy(17.5, 'maggot');
        this.spawnEnemy(26, 'canmonster');
        this.spawnEnemy(36, 'skunk', 5);
        this.spawnEnemy(47, 'maggot');
        this.spawnEnemy(57, 'canmonster');
        this.spawnEnemy(74, 'maggot');
        this.spawnEnemy(83, 'skunk', 5);
        this.spawnEnemy(85, 'canmonster');
        this.spawnEnemy(96, 'skunk');
        this.spawnEnemy(106, 'canmonster');

        // Spawn 8-HP EMPEROR GARBAGIO on the Grand Compactor Arena!
        const boss2 = new Enemy(128 * TILE, 9 * TILE - 16, 'boss2');
        boss2.minX = 114 * TILE;
        boss2.maxX = 133 * TILE;
        this.enemies.push(boss2);
    }

    // Check if a point overlaps any solid block, pipe, or moving platform
    getSolidTileAt(px, py) {
        for (const b of this.blocks) {
            if (b.collapsed) continue;
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
            if (b.collapsed) continue;
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
        if (!block.type || block.collapsed) return; // Pipe, Platform, or Collapsed Cardboard

        // Check if any enemy is standing on top of this block -> launch them!
        for (const enemy of this.enemies) {
            if (!enemy.dead && !enemy.flipped &&
                enemy.x + enemy.w > block.x &&
                enemy.x < block.x + block.w &&
                Math.abs((enemy.y + enemy.h) - block.y) <= 8) {
                enemy.killByGas(this, 1, 2);
            }
        }

        const unbreakableTypes = new Set([
            'empty', 'ground', 'pipe_ground', 'bridge', 'castle',
            'trash_ground', 'factory_ground', 'marsh_ground', 'incinerator',
            'conveyor_r', 'conveyor_l', 'cardboard'
        ]);
        if (unbreakableTypes.has(block.type)) {
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
            } else if (block.content === 'beans' || block.content === 'burrito' || block.content === 'tp') {
                window.soundFX.playItemAppear();
                this.items.push(new CollectibleItem(block.x + 2, block.y, block.content, true));
            }

            block.hitsLeft--;
            if (block.hitsLeft <= 0) {
                block.type = 'empty';
            }
        } else if (block.type === 'brick' || block.type === 'scrap_brick') {
            block.hitsLeft = (block.hitsLeft || 2) - (this.player.isSuper ? 2 : 1);
            if (block.hitsLeft <= 0) {
                window.soundFX.playBrickBreak();
                this.score += 50;
                const debrisColor = block.type === 'scrap_brick' ? '#7a8b99' : '#8c5828';
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
                        debrisColor,
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
        this.victoryTimer = 220; // Auto-advance on non-boss stages after fanfare (~3.6s)
        window.soundFX.stopBGM();
        window.soundFX.playStageClear();

        if (!this.bestStarsByLevel) this.bestStarsByLevel = {};
        this.bestStarsByLevel[this.currentLevel] = Math.max(
            this.bestStarsByLevel[this.currentLevel] || 0,
            this.levelStars
        );

        const heightBonus = Math.max(100, Math.round((GROUND_ROW * TILE - this.player.y) * 10));
        this.score += heightBonus;
        const bonusLabel = this.currentWorld === 2
            ? `PINE-FRESH BONUS +${heightBonus}!`
            : `FLUSH BONUS +${heightBonus}!`;
        this.texts.push(new FloatingText(this.flagX - 30, this.player.y, bonusLabel, '#9eff24'));

        if (this.totalStars > 0 && this.levelStars >= this.totalStars) {
            this.score += 3000;
            this.texts.push(new FloatingText(
                this.flagX - 50,
                this.player.y - 22,
                '★ 3/3 STINK STARS! +3000 ★',
                '#ffd700'
            ));
        }

        if (this.player.isGarlic) {
            this.score += 500;
            this.texts.push(new FloatingText(
                this.flagX - 30,
                this.player.y - 42,
                'GARLIC TURBO BONUS +500!',
                '#33ffcc'
            ));
        }
    }

    update() {
        this.worldTick++;
        if (this.introBannerTimer > 0) this.introBannerTimer--;

        // Auto-advance after clearing non-boss stages (1-1..1-3 and 2-1..2-3)
        if (this.state === 'VICTORY' && this.currentLevel !== 4 && this.currentLevel !== 8) {
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

        // Update Bounce Pads, Methane Updraft Vents, Firebars & Wrecking Pendulums
        for (const pad of this.bouncePads) {
            pad.update();
        }
        for (const vent of this.updraftVents) {
            vent.update(this);
        }
        for (const fb of this.firebars) {
            fb.update(this);
        }
        for (const pend of this.pendulums) {
            pend.update(this);
        }

        // Smooth block bump animations & Soggy Cardboard Crumble/Respawn lifecycle
        for (const b of this.blocks) {
            if (b.bumpY < 0) {
                b.bumpY += 1.5;
                if (b.bumpY > 0) b.bumpY = 0;
            }
            if (b.type === 'cardboard') {
                if (b.crumbling && !b.collapsed) {
                    b.crumbleTimer--;
                    if (b.crumbleTimer <= 0) {
                        b.crumbling = false;
                        b.collapsed = true;
                        b.respawnTimer = 210;
                        if (this.player.standingBlock === b) {
                            this.player.standingBlock = null;
                        }
                        window.soundFX.playBlockBump();
                        for (let i = 0; i < 4; i++) {
                            this.particles.push(new DebrisParticle(
                                b.x + 6 + (i % 2) * 14,
                                b.y + 8 + Math.floor(i / 2) * 12,
                                (i % 2 === 0 ? -1.6 : 1.6),
                                -2.5 - Math.random() * 1.5,
                                '#a67c46',
                                7
                            ));
                        }
                    }
                } else if (b.collapsed) {
                    if (b.respawnTimer > 0) {
                        b.respawnTimer--;
                    }
                    if (b.respawnTimer <= 0) {
                        const p = this.player;
                        const playerOverlap = !p.dead &&
                            p.x < b.x + b.w && p.x + p.w > b.x &&
                            p.y < b.y + b.h && p.y + p.h > b.y;
                        const enemyOverlap = this.enemies.some(e =>
                            !e.dead && !e.flipped &&
                            e.x < b.x + b.w && e.x + e.w > b.x &&
                            e.y < b.y + b.h && e.y + e.h > b.y
                        );
                        if (!playerOverlap && !enemyOverlap) {
                            b.collapsed = false;
                            b.crumbling = false;
                        }
                    }
                }
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

        // Update Fart Projectiles & Boss/Enemy Projectiles
        for (const proj of this.projectiles) proj.update(this);
        this.projectiles = this.projectiles.filter(p => !p.dead);

        for (const bproj of this.bossProjectiles) bproj.update(this);
        this.bossProjectiles = this.bossProjectiles.filter(p => !p.dead);

        // Update Enemies
        for (const enemy of this.enemies) enemy.update(this);
        this.enemies = this.enemies.filter(e => !e.dead);

        // Ambient Pit Bubbles (themed per sewer/castle/landfill/factory/marsh/incinerator)
        if (this.worldTick % 12 === 0) {
            let bubbleCol = '#9eff00';
            if (this.levelTheme === 'castle') bubbleCol = '#ff6600';
            else if (this.levelTheme === 'landfill') bubbleCol = '#d97aff';
            else if (this.levelTheme === 'factory') bubbleCol = '#ffbf00';
            else if (this.levelTheme === 'marsh') bubbleCol = '#ffe047';
            else if (this.levelTheme === 'incinerator') bubbleCol = '#ff44aa';

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
    // WORLD 1 (SEWER) & WORLD 2 (ROTTEN LANDFILL) PARALLAX BACKGROUNDS
    // ========================================================================

    drawLandfillBackground() {
        const theme = this.levelTheme;

        // 1. Toxic Smog Sky / Furnace Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
        if (theme === 'factory') {
            grad.addColorStop(0, '#120e17');
            grad.addColorStop(0.55, '#261e2b');
            grad.addColorStop(1, '#3b2919');
        } else if (theme === 'marsh') {
            grad.addColorStop(0, '#0f1709');
            grad.addColorStop(0.55, '#243312');
            grad.addColorStop(1, '#3f4a14');
        } else if (theme === 'incinerator') {
            grad.addColorStop(0, '#170511');
            grad.addColorStop(0.55, '#360c21');
            grad.addColorStop(1, '#5c1b0e');
        } else {
            // 2-1 Mount Garbagio: bruised violet-chartreuse landfill twilight
            grad.addColorStop(0, '#160b24');
            grad.addColorStop(0.52, '#2f193b');
            grad.addColorStop(1, '#473a16');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);

        // 2. Drifting Stink-Smog Bands in Upper Sky
        const cloudScroll = Math.floor(this.camX * 0.15 + this.worldTick * 0.25);
        ctx.fillStyle = theme === 'incinerator'
            ? 'rgba(255, 80, 140, 0.10)'
            : (theme === 'marsh' ? 'rgba(215, 255, 70, 0.10)' : 'rgba(180, 255, 60, 0.09)');
        for (let i = 0; i < 6; i++) {
            const cx = VIEW_W - ((cloudScroll + i * 190) % (VIEW_W + 220)) + 40;
            const cy = 58 + (i % 3) * 34;
            ctx.fillRect(cx, cy, 130, 14);
            ctx.fillRect(cx + 22, cy - 8, 84, 8);
        }

        // 3. Far Parallax Silhouettes (Trash Mountains / Factory Plates / Cheese Monoliths / Boilers)
        const farScroll = Math.floor(this.camX * 0.25);
        const groundY = GROUND_ROW * TILE;

        if (theme === 'factory' || theme === 'incinerator') {
            // Corrugated steel / riveted boiler wall panels
            ctx.fillStyle = theme === 'incinerator' ? '#2b0d1b' : '#1e1924';
            for (let x = -(farScroll % 64); x < VIEW_W; x += 64) {
                ctx.fillRect(x + 2, 44, 58, groundY - 44);
                ctx.fillStyle = theme === 'incinerator' ? '#451529' : '#2c2533';
                ctx.fillRect(x + 8, 56, 6, groundY - 68);
                ctx.fillStyle = theme === 'incinerator' ? '#2b0d1b' : '#1e1924';
            }
        } else if (theme === 'marsh') {
            // Distant porous Swiss-cheese mounds in the bog mist
            const moundSpacing = 220;
            for (let mx = -(farScroll % moundSpacing) - moundSpacing; mx < VIEW_W + moundSpacing; mx += moundSpacing) {
                ctx.fillStyle = '#2d3b14';
                ctx.fillRect(mx + 20, 170, 160, groundY - 170);
                ctx.fillRect(mx + 44, 135, 112, 35);
                // Cheese holes in distant monoliths
                ctx.fillStyle = '#1b260b';
                ctx.fillRect(mx + 56, 165, 22, 22);
                ctx.fillRect(mx + 112, 205, 28, 26);
                ctx.fillRect(mx + 70, 255, 18, 18);
            }
        } else {
            // Jagged Mount Garbagio Trash-Dune Peaks & Crooked Antennas!
            const peakSpacing = 240;
            for (let px = -(farScroll % peakSpacing) - peakSpacing; px < VIEW_W + peakSpacing; px += peakSpacing) {
                ctx.fillStyle = '#261a2e';
                ctx.fillRect(px + 10, 220, 200, groundY - 220);
                ctx.fillRect(px + 40, 175, 140, 45);
                ctx.fillRect(px + 75, 140, 70, 35);
                // Crooked TV antenna & old tire silhouette on top of the garbage peak!
                ctx.fillStyle = '#3d2c47';
                ctx.fillRect(px + 106, 106, 4, 34);
                ctx.fillRect(px + 94, 114, 28, 3);
                ctx.fillRect(px + 98, 123, 20, 3);
            }
        }

        // 4. Mid-Parallax Structures (Junkyard Crane Gantries / Smelter Furnaces / Fondue Arches)
        const midScroll = Math.floor(this.camX * 0.5);
        const span = 280;
        const startX = -(midScroll % span);

        for (let gx = startX - span; gx < VIEW_W + span; gx += span) {
            if (theme === 'marsh') {
                // Dripping Moldy Fondue Stalactite Arch
                ctx.fillStyle = '#384718';
                ctx.fillRect(gx + 20, 64, 28, groundY - 64);
                ctx.fillRect(gx + 150, 64, 28, groundY - 64);
                ctx.fillRect(gx + 20, 64, 158, 24);
                const drip = Math.round(Math.sin(this.worldTick * 0.07 + gx) * 6);
                ctx.fillStyle = 'rgba(230, 216, 58, 0.42)';
                ctx.fillRect(gx + 88, 88, 20, 120 + drip);
            } else if (theme === 'factory' || theme === 'incinerator') {
                // Industrial Compactor Pillar & Glowing Furnace / Smelter Window
                ctx.fillStyle = theme === 'incinerator' ? '#3d1422' : '#2b2430';
                ctx.fillRect(gx + 16, 60, 132, groundY - 60);
                ctx.fillStyle = '#0d080c';
                ctx.fillRect(gx + 36, 112, 92, 116);
                ctx.fillStyle = theme === 'incinerator'
                    ? 'rgba(255, 70, 140, 0.28)'
                    : 'rgba(255, 185, 30, 0.22)';
                ctx.fillRect(gx + 40, 116, 84, 108);
                // Grate bars
                ctx.fillStyle = theme === 'incinerator' ? '#592033' : '#43394a';
                for (let bx = gx + 52; bx < gx + 120; bx += 18) {
                    ctx.fillRect(bx, 112, 5, 116);
                }
            } else {
                // Rusted Junkyard Crane Tower & Hanging Electromagnet
                ctx.fillStyle = '#3b2820';
                ctx.fillRect(gx + 30, 68, 18, groundY - 68);
                ctx.fillRect(gx + 30, 68, 124, 14);
                ctx.fillStyle = '#5c3f2e';
                for (let y = 86; y < groundY; y += 28) {
                    ctx.fillRect(gx + 33, y, 12, 6);
                }
                const sway = Math.round(Math.sin(this.worldTick * 0.05 + gx) * 5);
                ctx.fillStyle = '#73828c';
                ctx.fillRect(gx + 126 + sway, 82, 3, 56);
                ctx.fillStyle = '#b83728';
                ctx.fillRect(gx + 114 + sway, 138, 28, 14);
                ctx.fillStyle = '#d9e3eb';
                ctx.fillRect(gx + 114 + sway, 148, 8, 6);
                ctx.fillRect(gx + 134 + sway, 148, 8, 6);
            }
        }

        // 5. Overhead Conveyor / Smog Girders
        ctx.fillStyle = theme === 'incinerator' ? '#4a1525' : '#2b241d';
        ctx.fillRect(0, 22, VIEW_W, 18);
        ctx.fillStyle = theme === 'incinerator' ? '#ff5588' : '#b88c28';
        for (let hx = -(midScroll % 48); hx < VIEW_W; hx += 48) {
            ctx.fillRect(hx, 25, 20, 4);
        }
    }

    drawSewerBackground() {
        if (this.currentWorld === 2) {
            this.drawLandfillBackground();
            return;
        }
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
        const theme = this.levelTheme;
        let baseCol = '#3cb012';
        let crestCol = '#8cff1a';
        let foamCol = '#d4ff66';

        if (theme === 'castle') {
            baseCol = '#b82e00';
            crestCol = '#ff7700';
            foamCol = '#ffee44';
        } else if (theme === 'landfill') {
            baseCol = '#5c1d78';
            crestCol = '#b84dff';
            foamCol = '#e6ff66';
        } else if (theme === 'factory') {
            baseCol = '#6e4b0c';
            crestCol = '#ffaa1a';
            foamCol = '#d4ff4d';
        } else if (theme === 'marsh') {
            baseCol = '#8c7a12';
            crestCol = '#e6d42e';
            foamCol = '#ffff99';
        } else if (theme === 'incinerator') {
            baseCol = '#8f113b';
            crestCol = '#ff4488';
            foamCol = '#ffcc44';
        }

        this.pitCols.forEach(col => {
            const sx = Math.round(col * TILE - this.camX);
            if (sx < -TILE || sx > VIEW_W + TILE) return;

            const sy = GROUND_ROW * TILE + 12;
            const h = VIEW_H - sy;

            ctx.fillStyle = baseCol;
            ctx.fillRect(sx, sy, TILE, h);

            ctx.fillStyle = crestCol;
            const wave = Math.sin(this.worldTick * 0.12 + col) * 3;
            ctx.fillRect(sx, sy + wave, TILE, 7);

            ctx.fillStyle = foamCol;
            ctx.fillRect(sx + 6, sy + wave + 1, 12, 3);
        });
    }

    drawGoalFlagpoleAndFortress() {
        const fx = Math.round(this.flagX - this.camX);
        const groundY = GROUND_ROW * TILE;

        if (fx <= -200 || fx >= VIEW_W + 300) return;

        const poleTop = 4 * TILE;
        const poleH = (GROUND_ROW - 1) * TILE - poleTop;

        if (this.currentWorld === 2) {
            // ================================================================
            // WORLD 2 GOAL: ROYAL PINE-FRESH DEODORIZER TOWER & COMPOST SILO!
            // ================================================================
            ctx.fillStyle = '#4a626e';
            ctx.fillRect(fx + 11, poleTop, 10, poleH);
            ctx.fillStyle = '#99f2e6';
            ctx.fillRect(fx + 13, poleTop, 4, poleH);

            // Top Chrome Aerosol Spray Nozzle Finial
            ctx.fillStyle = '#d9ecf2';
            ctx.fillRect(fx + 6, poleTop - 16, 20, 16);
            ctx.fillStyle = '#1cd99b';
            ctx.fillRect(fx + 9, poleTop - 12, 14, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(fx + 4, poleTop - 10, 4, 4);

            // Celebratory Mint Mist Puff when activated!
            if (this.state === 'VICTORY' && this.worldTick % 4 === 0) {
                ctx.fillStyle = 'rgba(102, 255, 217, 0.65)';
                ctx.fillRect(fx - 12 - (this.worldTick % 18), poleTop - 14, 10, 8);
            }

            // Giant Pine-Tree Air-Freshener Pennant!
            const flagY = this.state === 'VICTORY'
                ? Math.min(groundY - 68, poleTop + (this.worldTick % 200) * 2)
                : poleTop + 8;
            ctx.fillStyle = '#0d5938';
            ctx.fillRect(fx - 40, flagY, 52, 32);
            ctx.fillStyle = '#24d97a';
            ctx.fillRect(fx - 36, flagY + 3, 44, 26);
            // Stylized Pine-Tree emblem on pennant
            ctx.fillStyle = '#d9fff0';
            ctx.fillRect(fx - 18, flagY + 6, 8, 6);
            ctx.fillRect(fx - 22, flagY + 12, 16, 6);
            ctx.fillRect(fx - 25, flagY + 18, 22, 5);

            // BIO-COMPOST RECYCLING SILO FORTRESS (Right of Deodorizer Pole)
            const cx = fx + 82;
            const cy = groundY - 134;

            // Rounded Silo Dome & Riveted Body
            ctx.fillStyle = '#2b4247';
            ctx.fillRect(cx + 12, cy + 16, 90, 22);
            ctx.fillRect(cx, cy + 36, 114, 98);
            ctx.fillStyle = '#1c2d30';
            ctx.fillRect(cx + 6, cy + 42, 102, 92);

            // Hazard Stripes Across Silo Belt
            ctx.fillStyle = '#f2b705';
            for (let hx = cx + 8; hx < cx + 104; hx += 18) {
                ctx.fillRect(hx, cy + 48, 10, 8);
            }

            // Spinning Rooftop Fresh-Air Turbine!
            const bladeW = Math.max(6, Math.round(Math.abs(Math.cos(this.worldTick * 0.14)) * 34));
            ctx.fillStyle = '#73969e';
            ctx.fillRect(cx + 52, cy - 2, 10, 18);
            ctx.fillStyle = '#33ffcc';
            ctx.fillRect(cx + 57 - Math.floor(bladeW / 2), cy - 8, bladeW, 8);

            //Blast Door & 'FRESH' Neon Sign
            ctx.fillStyle = '#081214';
            ctx.fillRect(cx + 38, cy + 82, 38, 52);
            ctx.fillStyle = '#33ffcc';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('FRESH', cx + 37, cy + 74);
            return;
        }

        // ====================================================================
        // WORLD 1 GOAL: BRASS PLUNGER FLAGPOLE & GOLDEN TOILET SEWER FORTRESS
        // ====================================================================
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

    drawHUD() {
        const info = LEVEL_INFO[this.currentLevel] || LEVEL_INFO[1];
        const hasStars = this.totalStars > 0;

        // Top Translucent Retro Status Bar
        ctx.fillStyle = this.currentWorld === 2 ? 'rgba(18, 10, 24, 0.82)' : 'rgba(7, 15, 10, 0.78)';
        ctx.fillRect(0, 0, VIEW_W, 44);
        ctx.fillStyle = this.currentWorld === 2 ? '#b88c28' : '#385e42';
        ctx.fillRect(0, 42, VIEW_W, 2);

        ctx.font = '11px "Press Start 2P", monospace';

        // FARTIO SCORE
        ctx.fillStyle = '#9eff24';
        ctx.fillText('FARTIO', 18, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(this.score).padStart(6, '0'), 18, 35);

        // COINS
        ctx.fillStyle = '#ffd700';
        ctx.fillText('COINS', hasStars ? 132 : 195, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('x' + String(this.coins).padStart(2, '0'), hasStars ? 132 : 195, 35);

        // WORLD
        ctx.fillStyle = this.currentWorld === 2 ? '#ffbf3b' : '#9eff24';
        ctx.fillText('WORLD', hasStars ? 232 : 340, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(info.code, hasStars ? 240 : 350, 35);

        // GOLDEN STINK STARS (World 2 Collectible Goal!)
        if (hasStars) {
            ctx.fillStyle = '#ffd700';
            ctx.fillText('STARS', 332, 18);
            ctx.fillStyle = this.levelStars >= this.totalStars ? '#33ffcc' : '#ffffff';
            ctx.fillText(`${this.levelStars}/${this.totalStars}`, 340, 35);
        }

        // GAS POWER STATUS
        const gasX = hasStars ? 442 : 490;
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('GAS MODE', gasX, 18);
        if (this.player.isGarlic) {
            ctx.fillStyle = '#33ffcc';
            ctx.fillText('GARLIC TURBO!', gasX, 35);
        } else if (this.player.isSuper) {
            ctx.fillStyle = '#ff5500';
            ctx.fillText('SUPER BEAN!', gasX, 35);
        } else {
            ctx.fillStyle = '#72e01b';
            ctx.fillText('REGULAR', gasX, 35);
        }

        // TIME
        ctx.fillStyle = '#9eff24';
        ctx.fillText('TIME', 700, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(this.timeLeft).padStart(3, '0'), 706, 35);

        // Level Intro Title Card (fades out after level start)
        if (this.state === 'PLAYING' && this.introBannerTimer > 0) {
            const alpha = Math.min(1, this.introBannerTimer / 35);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.currentWorld === 2 ? 'rgba(22, 11, 30, 0.86)' : 'rgba(8, 18, 11, 0.82)';
            ctx.fillRect(VIEW_W / 2 - 245, 62, 490, 56);
            ctx.strokeStyle = this.currentWorld === 2 ? '#ffbf3b' : '#72e01b';
            ctx.lineWidth = 2;
            ctx.strokeRect(VIEW_W / 2 - 245, 62, 490, 56);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffd700';
            ctx.font = '13px "Press Start 2P", monospace';
            ctx.fillText(`WORLD ${info.code}: ${info.name}`, VIEW_W / 2, 85);
            ctx.fillStyle = this.currentWorld === 2 ? '#33ffcc' : '#b8ff66';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText(info.subtitle, VIEW_W / 2, 106);
            ctx.restore();
        }

        // Victory or Game Over Overlay Banner
        if (this.state === 'VICTORY') {
            ctx.fillStyle = 'rgba(8, 20, 14, 0.90)';
            ctx.fillRect(VIEW_W / 2 - 265, VIEW_H / 2 - 84, 530, 168);
            ctx.strokeStyle = this.currentWorld === 2 ? '#33ffcc' : '#9eff24';
            ctx.lineWidth = 4;
            ctx.strokeRect(VIEW_W / 2 - 265, VIEW_H / 2 - 84, 530, 168);

            ctx.textAlign = 'center';
            const nextInfo = LEVEL_INFO[this.currentLevel + 1];

            if (this.currentLevel === 4) {
                ctx.fillStyle = '#ffd700';
                ctx.font = '18px "Press Start 2P", monospace';
                ctx.fillText('WORLD 1 COMPLETE!', VIEW_W / 2, VIEW_H / 2 - 36);
                ctx.fillStyle = '#9eff24';
                ctx.font = '10px "Press Start 2P", monospace';
                ctx.fillText('KING POOPA FLUSHED! GOLDEN THRONE SAVED!', VIEW_W / 2, VIEW_H / 2 - 6);
                ctx.fillStyle = '#ffbf3b';
                ctx.fillText('NEXT UP: WORLD 2 — THE ROTTEN LANDFILL!', VIEW_W / 2, VIEW_H / 2 + 20);
                ctx.fillStyle = '#ffffff';
                ctx.font = '9px "Press Start 2P", monospace';
                ctx.fillText('PRESS [ENTER] OR TAP TO ENTER WORLD 2-1!', VIEW_W / 2, VIEW_H / 2 + 54);
            } else if (this.currentLevel === 8) {
                ctx.fillStyle = '#ffd700';
                ctx.font = '17px "Press Start 2P", monospace';
                ctx.fillText('WORLD 2 DEODORIZED!', VIEW_W / 2, VIEW_H / 2 - 40);
                ctx.fillStyle = '#33ffcc';
                ctx.font = '10px "Press Start 2P", monospace';
                ctx.fillText('EMPEROR GARBAGIO RECYCLED! LANDFILL SAVED!', VIEW_W / 2, VIEW_H / 2 - 12);
                ctx.fillStyle = '#ffe63b';
                ctx.font = '9px "Press Start 2P", monospace';
                ctx.fillText(
                    `STARS: ${this.levelStars}/${this.totalStars} (W2: ${this.getWorld2TotalStars()}/12) | SCORE: ${this.score}`,
                    VIEW_W / 2,
                    VIEW_H / 2 + 18
                );
                ctx.fillStyle = '#ffffff';
                ctx.font = '9px "Press Start 2P", monospace';
                ctx.fillText('PRESS [ENTER] OR TAP FOR A NEW VICTORY LAP!', VIEW_W / 2, VIEW_H / 2 + 54);
            } else {
                ctx.fillStyle = this.currentWorld === 2 ? '#33ffcc' : '#9eff24';
                ctx.font = '17px "Press Start 2P", monospace';
                ctx.fillText(`WORLD ${info.code} CLEARED!`, VIEW_W / 2, VIEW_H / 2 - 34);
                ctx.fillStyle = '#ffd700';
                ctx.font = '11px "Press Start 2P", monospace';
                const starSummary = hasStars ? `  |  STARS: ${this.levelStars}/${this.totalStars}` : '';
                ctx.fillText(`SCORE: ${this.score}${starSummary}`, VIEW_W / 2, VIEW_H / 2 + 2);
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px "Press Start 2P", monospace';
                const secs = Math.ceil(this.victoryTimer / 60);
                const nextCode = nextInfo ? nextInfo.code : '1-1';
                ctx.fillText(`NEXT: WORLD ${nextCode} IN ${secs}s [ENTER]`, VIEW_W / 2, VIEW_H / 2 + 42);
            }
            ctx.textAlign = 'left';
        } else if (this.state === 'GAME_OVER') {
            ctx.fillStyle = 'rgba(20, 8, 8, 0.86)';
            ctx.fillRect(VIEW_W / 2 - 235, VIEW_H / 2 - 70, 470, 140);
            ctx.strokeStyle = '#ff4422';
            ctx.lineWidth = 4;
            ctx.strokeRect(VIEW_W / 2 - 235, VIEW_H / 2 - 70, 470, 140);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff4422';
            ctx.font = '21px "Press Start 2P", monospace';
            ctx.fillText(this.currentWorld === 2 ? 'COMPACTED!' : 'FLUSHED OUT!', VIEW_W / 2, VIEW_H / 2 - 20);

            ctx.fillStyle = '#ffe63b';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText(
                this.currentWorld === 2
                    ? 'THE ROTTEN LANDFILL BURIED FARTIO!'
                    : 'THE SEWER GOT THE BEST OF FARTIO',
                VIEW_W / 2,
                VIEW_H / 2 + 14
            );

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('PRESS [R] OR TAP TO TRY AGAIN', VIEW_W / 2, VIEW_H / 2 + 46);
            ctx.textAlign = 'left';
        }
    }

    draw() {
        ctx.clearRect(0, 0, VIEW_W, VIEW_H);

        // 1. Multi-layer Parallax Background (World 1 Sewer or World 2 Rotten Landfill)
        this.drawSewerBackground();

        // 2. Goal Monument (Golden Toilet Fortress OR Pine-Fresh Deodorizer Silo)
        this.drawGoalFlagpoleAndFortress();

        // 3. Methane Updraft Vents & Rising Thermal Plumes
        for (const vent of this.updraftVents) {
            vent.draw(ctx, this.camX, this.worldTick);
        }

        // 4. Collectibles (Coins, Beans, Garlic Burritos, Golden TP, Stink Stars)
        for (const item of this.items) {
            if (item.x + item.w >= this.camX && item.x <= this.camX + VIEW_W) {
                item.draw(ctx, this.camX);
            }
        }

        // 5. Solid & Interactive Blocks (World 1 & World 2 Tiles, Conveyors & Cardboard)
        for (const b of this.blocks) {
            if (b.x + b.w < this.camX || b.x > this.camX + VIEW_W) continue;
            const shakeX = (b.crumbling && !b.collapsed)
                ? Math.round(Math.sin(this.worldTick * 1.4 + b.x) * 2.5)
                : 0;
            const sx = Math.round(b.x - this.camX) + shakeX;
            const sy = Math.round(b.y + (b.bumpY || 0));

            if (b.collapsed) {
                // Subtle ghost outline showing where soggy cardboard will respawn
                ctx.strokeStyle = 'rgba(215, 170, 95, 0.26)';
                ctx.lineWidth = 2;
                ctx.strokeRect(sx + 3, sy + 3, TILE - 6, TILE - 6);
                continue;
            }

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
            } else if (b.type === 'trash_ground') {
                ctx.drawImage(window.sprites.cache.tile_trash_ground, sx, sy);
            } else if (b.type === 'scrap_brick') {
                ctx.drawImage(window.sprites.cache.tile_scrap_brick, sx, sy);
            } else if (b.type === 'factory_ground') {
                ctx.drawImage(window.sprites.cache.tile_factory_ground, sx, sy);
            } else if (b.type === 'marsh_ground') {
                ctx.drawImage(window.sprites.cache.tile_marsh_ground, sx, sy);
            } else if (b.type === 'incinerator') {
                ctx.drawImage(window.sprites.cache.tile_incinerator, sx, sy);
            } else if (b.type === 'cardboard') {
                ctx.drawImage(window.sprites.cache.tile_cardboard, sx, sy);
                if (b.crumbling) {
                    ctx.fillStyle = 'rgba(255, 90, 40, 0.22)';
                    ctx.fillRect(sx + 2, sy + 2, 28, 28);
                }
            } else if (b.type === 'conveyor_r') {
                window.sprites.drawConveyorTile(ctx, sx, sy, 1, this.worldTick);
            } else if (b.type === 'conveyor_l') {
                window.sprites.drawConveyorTile(ctx, sx, sy, -1, this.worldTick);
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

        // 6. Moving Grate Platforms & Whoopee Cushion Bounce Pads
        for (const plat of this.platforms) {
            plat.draw(ctx, this.camX);
        }
        for (const pad of this.bouncePads) {
            pad.draw(ctx, this.camX);
        }

        // 7. Sewer Pipes (World 1) OR Biohazard Oil-Drum Stacks (World 2)
        for (const p of this.pipes) {
            if (p.x + p.w < this.camX || p.x > this.camX + VIEW_W) continue;
            if (this.currentWorld === 2) {
                window.sprites.drawOilDrumPipe(ctx, Math.round(p.x - this.camX), Math.round(p.y), p.w, p.h);
            } else {
                window.sprites.drawSewerPipe(ctx, Math.round(p.x - this.camX), Math.round(p.y), p.w, p.h);
            }
        }

        // 8. Toxic Acid / Leachate / Fondue / Molten Slag Pits
        this.drawToxicSludgePits();

        // 9. Rotating Firebars & Swinging Junk Wrecking-Ball Pendulums
        for (const fb of this.firebars) {
            fb.draw(ctx, this.camX, this.worldTick);
        }
        for (const pend of this.pendulums) {
            pend.draw(ctx, this.camX, this.worldTick);
        }

        // 10. Enemies & Bosses (World 1 & World 2)
        for (const enemy of this.enemies) {
            if (enemy.x + enemy.w >= this.camX - 48 && enemy.x <= this.camX + VIEW_W + 48) {
                enemy.draw(ctx, this.camX);
            }
        }

        // 11. Fart Projectiles & Boss/Skunk Projectiles
        for (const proj of this.projectiles) {
            proj.draw(ctx, this.camX);
        }
        for (const bproj of this.bossProjectiles) {
            bproj.draw(ctx, this.camX);
        }

        // 12. Fartio Player
        this.player.draw(ctx, this.camX);

        // 13. Gas & Debris Particles + Score Popups
        for (const p of this.particles) p.draw(ctx, this.camX);
        for (const t of this.texts) t.draw(ctx, this.camX);

        // 14. Retro HUD & Victory/GameOver Screens
        this.drawHUD();
    }
}

// Start the Game Loop!
const game = new Game();
window.game = game;

// ============================================================================
// LEVEL BRIEFING SPLASH SCREEN (Fullscreen prompt + Level Goal)
// ============================================================================
const startScreen = document.getElementById('start-screen');
const btnStartFullscreen = document.getElementById('btn-start-fullscreen');
const btnStartPlay = document.getElementById('btn-start-play');
const startIosHint = document.getElementById('start-ios-hint');

function showStartScreen() {
    if (!startScreen) {
        game.started = true;
        return;
    }
    const info = LEVEL_INFO[game.currentLevel] || LEVEL_INFO[1];
    document.getElementById('start-level-code').textContent = 'WORLD ' + info.code;
    document.getElementById('start-level-name').textContent = info.name;
    document.getElementById('start-level-sub').textContent = info.subtitle;
    document.getElementById('start-level-goal').textContent = info.goal;

    const startCard = startScreen.querySelector('.start-card');
    if (startCard) {
        startCard.classList.toggle('world-2', info.world === 2);
    }
    const startTipPower = document.getElementById('start-tip-power');
    if (startTipPower) {
        startTipPower.innerHTML = info.world === 2
            ? '<span class="tip-key">🌯</span> Burrito = 3x Fart + Turbo'
            : '<span class="tip-key">🥫</span> Beans = Super Gas';
    }

    // Already fullscreen? Then a plain PLAY button is all that's needed.
    const fsActive = isFullscreenActive();
    btnStartFullscreen.hidden = fsActive;
    btnStartPlay.classList.toggle('start-btn-primary', fsActive);
    if (startIosHint) {
        startIosHint.hidden = fsActive || nativeFullscreenSupported ||
            !/iPhone|iPod/i.test(navigator.userAgent || '');
    }

    keys.left = keys.right = keys.jump = keys.shoot = false;
    keys.jumpPressed = keys.shootPressed = false;
    startScreen.classList.add('visible');
}

function startGame(withFullscreen) {
    // Must run synchronously inside the click/tap so the browser allows fullscreen
    if (withFullscreen) enterFullscreen();
    window.soundFX.init();
    if (startScreen) startScreen.classList.remove('visible');
    game.started = true;
    game.introBannerTimer = 150;
    if (window.soundFX.bgmEnabled && !window.soundFX.bgmPlaying) {
        window.soundFX.startBGM();
    }
}

if (btnStartFullscreen) {
    btnStartFullscreen.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame(true);
    });
}
if (btnStartPlay) {
    btnStartPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame(false);
    });
}

showStartScreen();

function gameLoop() {
    if (game.started) game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
