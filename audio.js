// ============================================================================
// SUPER FARTIO BROS. - Procedural 8-Bit & Fart Audio Synthesizer (Web Audio API)
// ============================================================================

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.bgmEnabled = true;
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.stepIndex = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Create a noise buffer for wet/fluttery fart textures and brick breaks
    createNoiseBuffer(duration = 0.4) {
        const sampleRate = this.ctx.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            // Pink/brownish noise filtering
            data[i] = (lastOut + (0.08 * white)) / 1.08;
            lastOut = data[i];
            data[i] *= 2.5;
        }
        return buffer;
    }

    // Signature Fart Jump Sound: Raspberry Sawtooth + LFO Flutter + Filtered Noise
    playFartJump(isSuper = false) {
        this.init();
        const now = this.ctx.currentTime;
        const duration = isSuper ? 0.38 : 0.28;

        // Primary bassy oscillator (sawtooth for brassy/ripping texture)
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        const baseFreq = isSuper ? 68 : 85;
        osc.frequency.setValueAtTime(baseFreq + Math.random() * 18, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, now + duration * 0.45);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, now + duration);

        // LFO to flutter the pitch & amplitude (cheek flap modulation)
        const lfo = this.ctx.createOscillator();
        lfo.type = 'square';
        lfo.frequency.setValueAtTime(34 + Math.random() * 12, now);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(26, now);
        lfo.connect(osc.frequency);

        // Resonant lowpass filter sweeping up then down
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.setValueAtTime(7, now);
        filter.frequency.setValueAtTime(220, now);
        filter.frequency.exponentialRampToValueAtTime(680, now + duration * 0.5);
        filter.frequency.exponentialRampToValueAtTime(140, now + duration);

        // Airy/wet noise burst layered in
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(duration);
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(320, now);
        noiseFilter.Q.setValueAtTime(3.0, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.18, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0.01, now);
        masterGain.gain.linearRampToValueAtTime(0.32, now + 0.03);
        masterGain.gain.exponentialRampToValueAtTime(0.008, now + duration);

        osc.connect(filter);
        filter.connect(masterGain);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        masterGain.connect(this.ctx.destination);

        osc.start(now);
        lfo.start(now);
        noise.start(now);

        osc.stop(now + duration);
        lfo.stop(now + duration);
        noise.stop(now + duration);
    }

    // Squeaky / Bubbly Gas Fireball Shot
    playFartShoot() {
        this.init();
        const now = this.ctx.currentTime;
        const duration = 0.18;

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(190 + Math.random() * 35, now);
        osc.frequency.exponentialRampToValueAtTime(95, now + duration * 0.6);
        osc.frequency.exponentialRampToValueAtTime(260, now + duration);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'triangle';
        lfo.frequency.setValueAtTime(52, now);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(45, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(480, now);
        filter.Q.setValueAtTime(4.5, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        lfo.start(now);
        osc.stop(now + duration);
        lfo.stop(now + duration);
    }

    // Squishy Splat + Mini Fart when stomping Poop or Bacteria
    playStompSplat() {
        this.init();
        const now = this.ctx.currentTime;
        const duration = 0.22;

        // Wet squish pitch drop
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(140, now + duration);

        // Wet noise splat
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(duration);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(180, now + duration);
        filter.Q.setValueAtTime(5, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(filter);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        noise.start(now);
        osc.stop(now + duration);
        noise.stop(now + duration);
    }

    // Classic 8-bit Coin / Plunger Chime (B5 -> E6)
    playCoin() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(987.77, now);        // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.07); // E6

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.008, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    // Block Head-Bump Sound
    playBlockBump() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.11);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
    }

    // Crumbly Sewer Brick Smash
    playBrickBreak() {
        this.init();
        const now = this.ctx.currentTime;
        const duration = 0.25;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(duration);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.frequency.exponentialRampToValueAtTime(150, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.38, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + duration);
    }

    // Item Rising from ? Block (Bubbly sewer rise)
    playItemAppear() {
        this.init();
        const now = this.ctx.currentTime;
        const notes = [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.035);
            gain.gain.setValueAtTime(0.14, now + idx * 0.035);
            gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.035);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.035);
            osc.stop(now + (idx + 1) * 0.035);
        });
    }

    // Bean Can Power-Up (Super Fartio Mode!)
    playPowerup() {
        this.init();
        const now = this.ctx.currentTime;
        const notes = [
            330, 392, 659, 523, 587, 784,
            392, 494, 784, 659, 740, 987
        ];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.045);
            gain.gain.setValueAtTime(0.16, now + idx * 0.045);
            gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.045);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.045);
            osc.stop(now + (idx + 1) * 0.045);
        });
        // Accentuated bass toot at the end
        setTimeout(() => this.playFartJump(true), 450);
    }

    // Damage / Flush Down the Sewer
    playDamageOrDie(isFatal = false) {
        this.init();
        const now = this.ctx.currentTime;
        const notes = isFatal
            ? [493.88, 698.46, 698.46, 698.46, 659.25, 587.33, 523.25, 329.63, 261.63, 130.81]
            : [587.33, 493.88, 392.00, 293.66, 220.00];

        notes.forEach((freq, idx) => {
            const step = isFatal ? 0.085 : 0.055;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * step);
            gain.gain.setValueAtTime(0.18, now + idx * step);
            gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * step);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * step);
            osc.stop(now + (idx + 1) * step);
        });
    }

    // Stage Clear Fanfare!
    playStageClear() {
        this.init();
        const now = this.ctx.currentTime;
        const melody = [
            { f: 261.63, d: 0.12 }, { f: 329.63, d: 0.12 }, { f: 392.00, d: 0.12 },
            { f: 523.25, d: 0.12 }, { f: 659.25, d: 0.12 }, { f: 783.99, d: 0.30 },
            { f: 659.25, d: 0.25 },
            { f: 277.18, d: 0.12 }, { f: 349.23, d: 0.12 }, { f: 415.30, d: 0.12 },
            { f: 554.37, d: 0.12 }, { f: 659.25, d: 0.12 }, { f: 830.61, d: 0.30 },
            { f: 659.25, d: 0.25 },
            { f: 293.66, d: 0.12 }, { f: 369.99, d: 0.12 }, { f: 440.00, d: 0.12 },
            { f: 587.33, d: 0.12 }, { f: 739.99, d: 0.12 }, { f: 880.00, d: 0.32 },
            { f: 1046.50, d: 0.55 }
        ];

        let t = now;
        melody.forEach((n) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(n.f, t);
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + n.d * 0.95);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + n.d);
            t += n.d;
        });
    }

    // King Poopa Boss Roar / Mega Flush Rumbling
    playBossRoar() {
        this.init();
        const now = this.ctx.currentTime;
        const duration = 0.55;

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + duration);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'square';
        lfo.frequency.setValueAtTime(28, now);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(22, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(duration);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(480, now);
        filter.frequency.exponentialRampToValueAtTime(110, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.36, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(filter);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        lfo.start(now);
        noise.start(now);
        osc.stop(now + duration);
        lfo.stop(now + duration);
        noise.stop(now + duration);
    }

    // Whoopee Cushion Bounce Pad Mega-Rip Boost!
    playBouncePad() {
        this.init();
        const now = this.ctx.currentTime;
        const duration = 0.44;

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(62, now);
        osc.frequency.exponentialRampToValueAtTime(255, now + 0.16);
        osc.frequency.exponentialRampToValueAtTime(52, now + duration);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'square';
        lfo.frequency.setValueAtTime(42, now);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(34, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(duration);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(4.2, now);
        filter.frequency.setValueAtTime(240, now);
        filter.frequency.exponentialRampToValueAtTime(920, now + 0.18);
        filter.frequency.exponentialRampToValueAtTime(160, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.36, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(filter);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        lfo.start(now);
        noise.start(now);
        osc.stop(now + duration);
        lfo.stop(now + duration);
        noise.stop(now + duration);
    }

    // Metallic Garbage-Can Lid Clang (Trashjaw armor dent!)
    playArmorClang() {
        this.init();
        const now = this.ctx.currentTime;
        const freqs = [880, 1318.5, 1760];
        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = i === 0 ? 'square' : 'triangle';
            osc.frequency.setValueAtTime(f, now);
            osc.frequency.exponentialRampToValueAtTime(f * 0.72, now + 0.16);
            gain.gain.setValueAtTime(0.16 / (i + 1), now);
            gain.gain.exponentialRampToValueAtTime(0.008, now + 0.16);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.16);
        });
    }

    // Fermented Garlic Burrito Turbo Power-Up Fanfare!
    playGarlicPowerup() {
        this.init();
        const now = this.ctx.currentTime;
        const notes = [
            392, 466.16, 587.33, 783.99, 587.33, 698.46, 880, 1046.5,
            783.99, 932.33, 1174.66, 1567.98
        ];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);
            gain.gain.setValueAtTime(0.15, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.008, now + (idx + 1) * 0.042);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.04);
            osc.stop(now + (idx + 1) * 0.042);
        });
        setTimeout(() => this.playFartJump(true), 420);
    }

    // Golden Stink Star Medal Chime!
    playStarCollect() {
        this.init();
        const now = this.ctx.currentTime;
        const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.055);
            gain.gain.setValueAtTime(0.18, now + idx * 0.055);
            gain.gain.exponentialRampToValueAtTime(0.008, now + idx * 0.055 + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.055);
            osc.stop(now + idx * 0.055 + 0.22);
        });
    }

    // 8-Bit Underground Sewer, Landfill & Boss Groove BGM
    startBGM() {
        if (!this.bgmEnabled || this.bgmPlaying) return;
        this.init();
        this.bgmPlaying = true;

        // Underground Mario-inspired staccato bassline + quirky sewer lead (Levels 1-1 & 1-2)
        const sewerBass = [
            130.81, 261.63, 110.00, 220.00, 116.54, 233.08, 0, 0,
            130.81, 261.63, 110.00, 220.00, 116.54, 233.08, 98.00, 116.54,
            87.31,  174.61, 73.42,  146.83, 77.78,  155.56, 0, 0,
            87.31,  174.61, 73.42,  146.83, 77.78,  98.00,  110.00, 123.47
        ];

        const sewerLead = [
            0, 0, 0, 0, 0, 0, 311.13, 293.66,
            277.18, 261.63, 0, 311.13, 0, 293.66, 0, 207.65,
            196.00, 0, 277.18, 261.63, 392.00, 369.99, 349.23, 311.13,
            293.66, 233.08, 220.00, 196.00, 164.81, 0, 0, 0
        ];

        // Athletic Lagoon Catwalk Groove (Level 1-3)
        const lagoonBass = [
            146.83, 0, 220.00, 0, 146.83, 0, 220.00, 196.00,
            164.81, 0, 246.94, 0, 164.81, 196.00, 220.00, 246.94,
            130.81, 0, 196.00, 0, 130.81, 0, 196.00, 164.81,
            146.83, 164.81, 174.61, 196.00, 220.00, 0, 146.83, 0
        ];

        const lagoonLead = [
            587.33, 0, 440.00, 587.33, 659.25, 0, 587.33, 440.00,
            523.25, 0, 392.00, 523.25, 587.33, 0, 493.88, 392.00,
            440.00, 493.88, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88,
            587.33, 0, 440.00, 392.00, 440.00, 0, 0, 0
        ];

        // King Poopa's Citadel Tension Groove (Level 1-4)
        const castleBass = [
            110.00, 116.54, 110.00, 98.00,  110.00, 116.54, 110.00, 98.00,
            103.83, 110.00, 103.83, 92.50,  103.83, 110.00, 103.83, 92.50,
            98.00,  103.83, 98.00,  87.31,  98.00,  103.83, 98.00,  87.31,
            110.00, 130.81, 146.83, 155.56, 146.83, 130.81, 116.54, 98.00
        ];

        const castleLead = [
            440.00, 415.30, 440.00, 466.16, 440.00, 415.30, 440.00, 0,
            415.30, 392.00, 415.30, 440.00, 415.30, 392.00, 415.30, 0,
            392.00, 369.99, 392.00, 415.30, 392.00, 369.99, 392.00, 0,
            440.00, 523.25, 587.33, 622.25, 587.33, 523.25, 466.16, 440.00
        ];

        // World 2-1 & 2-2: Funky Junkyard Slap-Tuba Groove (G Dorian / Bluesy Stink)
        const landfillBass = [
            98.00,  0, 196.00, 116.54, 130.81, 0, 146.83, 196.00,
            98.00,  0, 196.00, 174.61, 146.83, 130.81, 116.54, 110.00,
            116.54, 0, 233.08, 146.83, 174.61, 0, 164.81, 146.83,
            130.81, 138.59, 146.83, 0, 98.00,  116.54, 130.81, 146.83
        ];

        const landfillLead = [
            392.00, 0, 466.16, 523.25, 587.33, 0, 523.25, 466.16,
            392.00, 466.16, 554.37, 587.33, 0, 523.25, 466.16, 392.00,
            466.16, 0, 587.33, 659.25, 698.46, 659.25, 587.33, 523.25,
            554.37, 523.25, 466.16, 392.00, 440.00, 0, 392.00, 0
        ];

        // World 2-3: Moldy Cheese Marsh Squelchy Bounce
        const marshBass = [
            110.00, 220.00, 0, 164.81, 110.00, 220.00, 155.56, 146.83,
            130.81, 261.63, 0, 196.00, 130.81, 246.94, 220.00, 196.00,
            116.54, 233.08, 0, 174.61, 116.54, 233.08, 196.00, 174.61,
            123.47, 185.00, 246.94, 0, 164.81, 146.83, 130.81, 123.47
        ];

        const marshLead = [
            440.00, 523.25, 659.25, 0, 622.25, 587.33, 523.25, 440.00,
            523.25, 659.25, 783.99, 0, 739.99, 659.25, 587.33, 523.25,
            466.16, 587.33, 698.46, 0, 659.25, 587.33, 523.25, 466.16,
            493.88, 0, 659.25, 587.33, 523.25, 493.88, 440.00, 0
        ];

        // World 2-4: Garbagio's Incinerator Heavy Furnace Riff
        const incineratorBass = [
            82.41,  82.41,  164.81, 87.31,  82.41,  98.00,  92.50,  87.31,
            82.41,  82.41,  164.81, 110.00, 103.83, 98.00,  87.31,  82.41,
            98.00,  98.00,  196.00, 103.83, 98.00,  116.54, 110.00, 103.83,
            123.47, 116.54, 110.00, 103.83, 98.00,  92.50,  87.31,  82.41
        ];

        const incineratorLead = [
            329.63, 0, 493.88, 466.16, 329.63, 392.00, 369.99, 349.23,
            329.63, 0, 659.25, 587.33, 554.37, 493.88, 466.16, 392.00,
            392.00, 0, 587.33, 554.37, 392.00, 466.16, 440.00, 415.30,
            493.88, 587.33, 659.25, 698.46, 659.25, 587.33, 493.88, 466.16
        ];

        const stepDurationMs = 142;
        this.bgmTimer = setInterval(() => {
            if (!this.bgmEnabled || !this.bgmPlaying || !this.ctx || this.ctx.state !== 'running') return;
            const now = this.ctx.currentTime;
            const lvl = (window.game && window.game.currentLevel) || 1;
            let bassSequence = sewerBass;
            let leadSequence = sewerLead;
            if (lvl === 3) {
                bassSequence = lagoonBass;
                leadSequence = lagoonLead;
            } else if (lvl === 4) {
                bassSequence = castleBass;
                leadSequence = castleLead;
            } else if (lvl === 5 || lvl === 6) {
                bassSequence = landfillBass;
                leadSequence = landfillLead;
            } else if (lvl === 7) {
                bassSequence = marshBass;
                leadSequence = marshLead;
            } else if (lvl === 8) {
                bassSequence = incineratorBass;
                leadSequence = incineratorLead;
            }

            const idx = this.stepIndex % bassSequence.length;
            const isBossLvl = (lvl === 4 || lvl === 8);
            const isWorld2 = (lvl >= 5);

            const bassFreq = bassSequence[idx];
            if (bassFreq > 0) {
                const bassOsc = this.ctx.createOscillator();
                const bassGain = this.ctx.createGain();
                bassOsc.type = (idx % 4 === 0 || isBossLvl || isWorld2) ? 'sawtooth' : 'triangle';
                bassOsc.frequency.setValueAtTime(bassFreq, now);
                bassGain.gain.setValueAtTime(0.08, now);
                bassGain.gain.exponentialRampToValueAtTime(0.005, now + 0.13);

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(isBossLvl ? 560 : (isWorld2 ? 490 : 420), now);

                bassOsc.connect(filter);
                filter.connect(bassGain);
                bassGain.connect(this.ctx.destination);
                bassOsc.start(now);
                bassOsc.stop(now + 0.14);
            }

            const leadFreq = leadSequence[idx];
            if (leadFreq > 0) {
                const leadOsc = this.ctx.createOscillator();
                const leadGain = this.ctx.createGain();
                leadOsc.type = (lvl === 8 && idx % 2 === 0) ? 'sawtooth' : 'square';
                leadOsc.frequency.setValueAtTime(leadFreq, now);
                leadGain.gain.setValueAtTime(0.045, now);
                leadGain.gain.exponentialRampToValueAtTime(0.004, now + 0.12);
                leadOsc.connect(leadGain);
                leadGain.connect(this.ctx.destination);
                leadOsc.start(now);
                leadOsc.stop(now + 0.13);
            }

            this.stepIndex++;
        }, stepDurationMs);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    toggleBGM() {
        this.bgmEnabled = !this.bgmEnabled;
        if (this.bgmEnabled) {
            this.startBGM();
        } else {
            this.stopBGM();
        }
        return this.bgmEnabled;
    }
}

window.soundFX = new SoundEngine();
