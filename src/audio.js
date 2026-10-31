/**
 * FOREST DASH: SPIRIT RUNNER
 * Procedural Web Audio Engine
 * 
 * 100% self-contained sound effects & ambient music generator.
 * No external MP3/WAV dependencies or missing audio asset risks!
 * Complies with modern browser Autoplay policies.
 */

window.ForestDash = window.ForestDash || {};

window.ForestDash.Audio = (function() {
    let audioCtx = null;
    let masterGain = null;
    let sfxGain = null;
    let musicGain = null;
    let isInitialized = false;
    let soundEnabled = true;
    let musicEnabled = true;

    // Music sequencer state
    let musicTimer = null;
    let musicStep = 0;
    const pentatonicScale = [220, 247.5, 277.5, 330, 370, 440, 495, 555, 660]; // Mysterious forest A-minor pentatonic

    function init() {
        if (isInitialized && audioCtx) {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            return;
        }

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('Web Audio API not supported on this browser.');
                return;
            }
            audioCtx = new AudioContextClass();

            // Load settings
            const settings = window.ForestDash.Storage.getSettings();
            soundEnabled = settings.soundEnabled !== false;
            musicEnabled = settings.musicEnabled !== false;

            // Master Gain
            masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(window.ForestDash.Config.AUDIO.MASTER_VOLUME, audioCtx.currentTime);
            masterGain.connect(audioCtx.destination);

            // SFX Gain
            sfxGain = audioCtx.createGain();
            sfxGain.gain.setValueAtTime(soundEnabled ? window.ForestDash.Config.AUDIO.SFX_VOLUME : 0, audioCtx.currentTime);
            sfxGain.connect(masterGain);

            // Music Gain
            musicGain = audioCtx.createGain();
            musicGain.gain.setValueAtTime(musicEnabled ? window.ForestDash.Config.AUDIO.MUSIC_VOLUME : 0, audioCtx.currentTime);
            musicGain.connect(masterGain);

            isInitialized = true;

            // Start ambient music loop if enabled
            if (musicEnabled) {
                startMusicLoop();
            }
        } catch (e) {
            console.warn('Could not initialize Web Audio context:', e);
        }
    }

    // Safely verify context and resume if needed
    function ensureReady() {
        if (!isInitialized) {
            init();
        } else if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
    }

    /* -------------------------------------------------------------
       SOUND EFFECTS (PROCEDURAL SYNTHESIS)
       ------------------------------------------------------------- */

    function playJump(isDoubleJump = false) {
        if (!soundEnabled || !audioCtx) return;
        ensureReady();
        const now = audioCtx.currentTime;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = isDoubleJump ? 'sine' : 'triangle';
        const startFreq = isDoubleJump ? 360 : 180;
        const endFreq = isDoubleJump ? 680 : 420;

        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(sfxGain);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    function playSlide() {
        if (!soundEnabled || !audioCtx) return;
        ensureReady();
        const now = audioCtx.currentTime;

        // Band-filtered noise for rustling grass/dirt slide
        const bufferSize = audioCtx.sampleRate * 0.18;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(350, now + 0.18);
        filter.Q.value = 3.0;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);

        noise.start(now);
        noise.stop(now + 0.18);
    }

    function playCoin() {
        if (!soundEnabled || !audioCtx) return;
        ensureReady();
        const now = audioCtx.currentTime;

        // High crystal bell tone with harmonic overtone
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';

        // High clear chime
        const baseFreq = 1046.5; // C6
        osc1.frequency.setValueAtTime(baseFreq, now);
        osc1.frequency.setValueAtTime(baseFreq * 1.5, now + 0.04); // Step up to G6
        osc2.frequency.setValueAtTime(baseFreq * 2, now); // Octave overtone

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(sfxGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.28);
        osc2.stop(now + 0.28);
    }

    function playPowerup() {
        if (!soundEnabled || !audioCtx) return;
        ensureReady();
        const now = audioCtx.currentTime;

        // Triumphant rising magical chime arpeggio
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const noteStart = now + idx * 0.05;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.24, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

            osc.connect(gain);
            gain.connect(sfxGain);

            osc.start(noteStart);
            osc.stop(noteStart + 0.25);
        });
    }

    function playShieldBreak() {
        if (!soundEnabled || !audioCtx) return;
        ensureReady();
        const now = audioCtx.currentTime;

        // Glass shatter + energetic warp sound
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(400, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    function playHit() {
        if (!soundEnabled || !audioCtx) return;
        ensureReady();
        const now = audioCtx.currentTime;

        // Low impact thud
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(sfxGain);

        osc.start(now);
        osc.stop(now + 0.28);
    }

    function playGameOver() {
        if (!soundEnabled || !audioCtx) return;
        ensureReady();
        const now = audioCtx.currentTime;

        // Descending sad magical tone
        const notes = [370, 330, 293, 220];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const noteStart = now + idx * 0.12;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.26, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.32);

            osc.connect(gain);
            gain.connect(sfxGain);

            osc.start(noteStart);
            osc.stop(noteStart + 0.32);
        });
    }

    function playClick() {
        if (!soundEnabled || !audioCtx) return;
        ensureReady();
        const now = audioCtx.currentTime;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.04);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(sfxGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    /* -------------------------------------------------------------
       PROCEDURAL BACKGROUND AMBIENCE & MUSIC
       ------------------------------------------------------------- */

    function startMusicLoop() {
        stopMusicLoop();
        if (!musicEnabled) return;

        // A gentle, mystical forest ambient melody step sequencer
        musicTimer = setInterval(() => {
            if (!musicEnabled || !audioCtx || audioCtx.state !== 'running') return;
            const now = audioCtx.currentTime;

            // Pick a melodic note from the pentatonic scale
            const noteIdx = (musicStep % 8 === 0) ? 0 : Math.floor(Math.random() * pentatonicScale.length);
            const freq = pentatonicScale[noteIdx];

            // Warm ambient tone
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(musicGain);

            osc.start(now);
            osc.stop(now + 0.85);

            // Bass pulse every 4 steps
            if (musicStep % 4 === 0) {
                const bassOsc = audioCtx.createOscillator();
                const bassGain = audioCtx.createGain();
                bassOsc.type = 'triangle';
                bassOsc.frequency.setValueAtTime(110, now);

                bassGain.gain.setValueAtTime(0.05, now);
                bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

                bassOsc.connect(bassGain);
                bassGain.connect(musicGain);

                bassOsc.start(now);
                bassOsc.stop(now + 0.65);
            }

            musicStep++;
        }, 340);
    }

    function stopMusicLoop() {
        if (musicTimer) {
            clearInterval(musicTimer);
            musicTimer = null;
        }
    }

    return {
        init,
        ensureReady,
        playJump,
        playSlide,
        playCoin,
        playPowerup,
        playShieldBreak,
        playHit,
        playGameOver,
        playClick,

        setSoundEnabled(enabled) {
            soundEnabled = !!enabled;
            if (sfxGain && audioCtx) {
                sfxGain.gain.setValueAtTime(soundEnabled ? window.ForestDash.Config.AUDIO.SFX_VOLUME : 0, audioCtx.currentTime);
            }
            window.ForestDash.Storage.saveSettings({ soundEnabled });
            return soundEnabled;
        },

        setMusicEnabled(enabled) {
            musicEnabled = !!enabled;
            if (musicGain && audioCtx) {
                musicGain.gain.setValueAtTime(musicEnabled ? window.ForestDash.Config.AUDIO.MUSIC_VOLUME : 0, audioCtx.currentTime);
            }
            if (musicEnabled) {
                startMusicLoop();
            } else {
                stopMusicLoop();
            }
            window.ForestDash.Storage.saveSettings({ musicEnabled });
            return musicEnabled;
        },

        toggleSound() {
            return this.setSoundEnabled(!soundEnabled);
        },

        toggleMusic() {
            return this.setMusicEnabled(!musicEnabled);
        },

        suspend() {
            if (audioCtx && audioCtx.state === 'running') {
                audioCtx.suspend().catch(() => {});
            }
        },

        resume() {
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
        },

        isSoundEnabled() {
            return soundEnabled;
        },

        isMusicEnabled() {
            return musicEnabled;
        }
    };
})();

