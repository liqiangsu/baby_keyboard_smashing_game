/**
 * Sound Management System for Baby Keyboard Smashing Game
 * Handles baby-friendly audio feedback using Web Audio API with fallbacks
 */

import { CONFIG, randomBetween, randomIntBetween, debugLog } from './utils.js';

/**
 * Musical notes for pleasant baby-friendly sounds
 * Using pentatonic scale which sounds harmonious
 */
const MUSICAL_NOTES = {
    // C Major Pentatonic Scale (baby-friendly frequencies)
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    G4: 392.00,
    A4: 440.00,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    G5: 783.99,
    A5: 880.00,
    C6: 1046.50,
    D6: 1174.66,
    E6: 1318.51
};

// Additional harmonic intervals for richer sounds
const HARMONICS = {
    octave: 2.0,
    fifth: 1.5,
    fourth: 1.33,
    third: 1.25
};

const NOTE_NAMES = Object.keys(MUSICAL_NOTES);

/**
 * Sound types and their properties
 */
const SOUND_TYPES = {
    note: { duration: 0.6, volume: 0.7, waveType: 'sine' },
    chime: { duration: 1.2, volume: 0.5, waveType: 'triangle' },
    bell: { duration: 0.8, volume: 0.6, waveType: 'sine' },
    toy: { duration: 0.4, volume: 0.8, waveType: 'square' },
    sparkle: { duration: 0.3, volume: 0.4, waveType: 'triangle' },
    explosion: { duration: 1.0, volume: 0.9, waveType: 'sawtooth' },
    fireworks: { duration: 1.5, volume: 0.6, waveType: 'sine' },
    bubble: { duration: 0.5, volume: 0.6, waveType: 'sine' },
    boing: { duration: 0.7, volume: 0.8, waveType: 'sawtooth' },
    whistle: { duration: 0.4, volume: 0.5, waveType: 'sine' },
    laugh: { duration: 1.0, volume: 0.7, waveType: 'triangle' }
};

export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.masterGainNode = null;
        this.isEnabled = true;
        this.volume = CONFIG.audio.volume;
        this.activeSounds = new Set();
        this.maxConcurrentSounds = CONFIG.audio.maxConcurrentSounds;

        // Fallback for browsers without Web Audio API
        this.useWebAudio = false;
        this.audioElements = new Map();

        this.init();
    }

    async init() {
        try {
            await this.initWebAudio();
            this.useWebAudio = true;
            debugLog('Sound manager initialized with Web Audio API');
        } catch (error) {
            debugLog('Web Audio API not available, falling back to HTML5 Audio', error);
            this.initHtmlAudio();
        }

        // Handle browser autoplay policies
        this.handleAutoplayPolicy();
    }

    async initWebAudio() {
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            throw new Error('Web Audio API not supported');
        }

        this.audioContext = new AudioContext();

        // Create master gain node for volume control
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);
        this.masterGainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

        // Handle audio context state
        if (this.audioContext.state === 'suspended') {
            debugLog('Audio context suspended, waiting for user interaction');
        }
    }

    initHtmlAudio() {
        // Fallback: pre-create some audio elements for common sounds
        this.useWebAudio = false;
        // We'll generate sounds on-the-fly or use simple beeps
    }

    handleAutoplayPolicy() {
        // Modern browsers require user interaction before playing audio
        const resumeAudioContext = async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                try {
                    await this.audioContext.resume();
                    debugLog('Audio context resumed after user interaction');
                } catch (error) {
                    debugLog('Failed to resume audio context', error);
                }
            }
        };

        // Listen for first user interaction
        const events = ['click', 'touchstart', 'keydown'];
        const enableAudio = () => {
            resumeAudioContext();
            events.forEach(event => {
                document.removeEventListener(event, enableAudio);
            });
        };

        events.forEach(event => {
            document.addEventListener(event, enableAudio, { once: true });
        });
    }

    /**
     * Play sound based on key information
     * @param {Object} keyInfo - Information about the pressed key
     */
    playKeySound(keyInfo) {
        if (!this.isEnabled) {return;}

        let soundType = 'note';
        let note = this.getRandomNote();

        // Customize sound based on key type and effect
        switch (keyInfo.type) {
            case 'letter':
                soundType = 'note';
                note = this.getNoteForLetter(keyInfo.character);
                break;
            case 'number':
                soundType = 'chime';
                note = MUSICAL_NOTES[NOTE_NAMES[parseInt(keyInfo.character) % NOTE_NAMES.length]];
                break;
            case 'space':
                soundType = 'explosion';
                note = MUSICAL_NOTES.C4;
                break;
            case 'enter':
                soundType = 'fireworks';
                note = MUSICAL_NOTES.C5;
                break;
            case 'arrow':
                soundType = 'toy';
                note = this.getRandomNote();
                break;
        }

        // Apply effect modifications
        switch (keyInfo.effect) {
            case 'explosion':
                soundType = 'explosion';
                break;
            case 'fireworks':
                soundType = 'fireworks';
                break;
            case 'sparkle':
                soundType = 'sparkle';
                break;
            case 'rainbow':
                soundType = 'chime';
                break;
        }

        this.playSound(soundType, note);
    }

    /**
     * Play a specific sound
     * @param {string} type - Sound type
     * @param {number} frequency - Base frequency
     * @param {Object} options - Additional options
     */
    playSound(type = 'note', frequency = 440, options = {}) {
        if (!this.isEnabled) {return;}

        // Limit concurrent sounds for performance
        if (this.activeSounds.size >= this.maxConcurrentSounds) {
            debugLog('Too many concurrent sounds, skipping');
            return;
        }

        if (this.useWebAudio && this.audioContext) {
            this.playWebAudioSound(type, frequency, options);
        } else {
            this.playFallbackSound(type, frequency, options);
        }
    }

    playWebAudioSound(type, frequency, options) {
        const soundConfig = { ...SOUND_TYPES[type] || SOUND_TYPES.note, ...options };
        const currentTime = this.audioContext.currentTime;
        const soundId = Date.now() + Math.random();

        this.activeSounds.add(soundId);

        try {
            switch (type) {
                case 'bubble':
                    this.createBubbleSound(frequency, soundConfig, currentTime);
                    break;
                case 'boing':
                    this.createBoingSound(frequency, soundConfig, currentTime);
                    break;
                case 'whistle':
                    this.createWhistleSound(frequency, soundConfig, currentTime);
                    break;
                case 'laugh':
                    this.createLaughSound(frequency, soundConfig, currentTime);
                    break;
                case 'chime':
                    this.createChimeSound(frequency, soundConfig, currentTime);
                    break;
                case 'explosion':
                    this.createExplosionSound(frequency, soundConfig, currentTime);
                    break;
                case 'fireworks':
                    this.createFireworksSound(frequency, soundConfig, currentTime);
                    break;
                default:
                    this.createBasicSound(frequency, soundConfig, currentTime);
            }
        } catch (error) {
            debugLog('Error playing Web Audio sound:', error);
        }

        // Clean up sound ID after duration
        setTimeout(() => {
            this.activeSounds.delete(soundId);
        }, soundConfig.duration * 1000 + 100);
    }

    /**
     * Enhanced sound synthesis methods for baby-friendly audio
     */
    createBasicSound(frequency, config, startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);

        oscillator.type = config.waveType || 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);

        // Smooth envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(config.volume * this.volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + config.duration);
    }

    createBubbleSound(frequency, config, startTime) {
        // Create a bubble-like sound with frequency modulation
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const lfo = this.audioContext.createOscillator(); // Low frequency oscillator
        const lfoGain = this.audioContext.createGain();

        // Setup LFO for frequency modulation
        lfo.frequency.setValueAtTime(8, startTime); // 8 Hz modulation
        lfo.connect(lfoGain);
        lfoGain.gain.setValueAtTime(frequency * 0.1, startTime); // 10% modulation depth
        lfoGain.connect(oscillator.frequency);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);

        // Bubble envelope - quick attack, gentle decay
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(config.volume * this.volume, startTime + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration);

        lfo.start(startTime);
        oscillator.start(startTime);
        lfo.stop(startTime + config.duration);
        oscillator.stop(startTime + config.duration);
    }

    createBoingSound(frequency, config, startTime) {
        // Create a bouncy "boing" sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);

        oscillator.type = 'sawtooth';

        // Frequency bounce effect
        oscillator.frequency.setValueAtTime(frequency * 2, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency, startTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.2, startTime + 0.3);
        oscillator.frequency.exponentialRampToValueAtTime(frequency, startTime + config.duration);

        // Bouncy envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(config.volume * this.volume, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(config.volume * this.volume * 0.3, startTime + 0.2);
        gainNode.gain.linearRampToValueAtTime(config.volume * this.volume * 0.6, startTime + 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + config.duration);
    }

    createWhistleSound(frequency, config, startTime) {
        // Create a cheerful whistle sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);

        oscillator.type = 'sine';

        // Whistle frequency sweep
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.frequency.linearRampToValueAtTime(frequency * 1.5, startTime + config.duration * 0.3);
        oscillator.frequency.linearRampToValueAtTime(frequency * 1.2, startTime + config.duration);

        // Smooth whistle envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(config.volume * this.volume, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(config.volume * this.volume * 0.8, startTime + config.duration * 0.7);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + config.duration);
    }

    createLaughSound(frequency, config, startTime) {
        // Create a playful laughing sound with multiple oscillators
        const oscillators = [];
        const gainNodes = [];

        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.masterGainNode);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(frequency * (1 + i * 0.2), startTime);

            // Rapid frequency modulation for laugh effect
            for (let j = 0; j < 5; j++) {
                const time = startTime + (j * config.duration / 5);
                const nextTime = startTime + ((j + 1) * config.duration / 5);
                const freq = frequency * (1 + i * 0.2);

                osc.frequency.setValueAtTime(freq, time);
                osc.frequency.linearRampToValueAtTime(freq * 1.1, time + config.duration / 10);
                osc.frequency.linearRampToValueAtTime(freq, nextTime);
            }

            // Staggered envelope for each oscillator
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime((config.volume * this.volume) / 3, startTime + 0.05 + i * 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration - i * 0.1);

            osc.start(startTime);
            osc.stop(startTime + config.duration);

            oscillators.push(osc);
            gainNodes.push(gain);
        }
    }

    createChimeSound(frequency, config, startTime) {
        // Create a beautiful chime with harmonics
        const harmonics = [1, 2, 3, 5]; // Harmonic ratios

        harmonics.forEach((harmonic, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGainNode);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency * harmonic, startTime);

            // Each harmonic has different volume and decay
            const harmonicVolume = (config.volume * this.volume) / (harmonic * 2);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(harmonicVolume, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration * (2 - harmonic * 0.1));

            oscillator.start(startTime);
            oscillator.stop(startTime + config.duration * 2);
        });
    }

    createExplosionSound(frequency, config, startTime) {
        // Create an exciting explosion sound with noise
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGainNode);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.1, startTime + config.duration);

        // Low-pass filter sweep for explosion effect
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(frequency * 4, startTime);
        filter.frequency.exponentialRampToValueAtTime(frequency * 0.5, startTime + config.duration);
        filter.Q.setValueAtTime(10, startTime);

        // Explosion envelope - sharp attack, slow decay
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(config.volume * this.volume, startTime + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + config.duration);
    }

    createFireworksSound(frequency, config, startTime) {
        // Create a spectacular fireworks sound with multiple bursts
        for (let i = 0; i < 4; i++) {
            const delay = i * 0.1;
            const burstTime = startTime + delay;

            // Main burst
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();

            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.masterGainNode);

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(frequency * (1 + i * 0.3), burstTime);
            oscillator.frequency.linearRampToValueAtTime(frequency * (2 + i * 0.2), burstTime + 0.05);
            oscillator.frequency.exponentialRampToValueAtTime(frequency * (0.5 + i * 0.1), burstTime + config.duration - delay);

            // Sparkle filter
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(frequency * 2, burstTime);
            filter.Q.setValueAtTime(5, burstTime);

            // Firework envelope
            const burstVolume = (config.volume * this.volume) / (i + 1);
            gainNode.gain.setValueAtTime(0, burstTime);
            gainNode.gain.linearRampToValueAtTime(burstVolume, burstTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, burstTime + config.duration - delay);

            oscillator.start(burstTime);
            oscillator.stop(burstTime + config.duration - delay);
        }
    }

    playFallbackSound(type, frequency, options) {
        // Simple fallback using basic audio elements or beep
        debugLog(`Playing fallback ${type} sound`);

        // For now, we'll skip fallback implementation
        // In a real app, you might want to use pre-recorded audio files
    }

    getNoteForLetter(letter) {
        // Map letters to musical notes with better distribution
        // Keep all notes in a comfortable baby-friendly range
        const letterMap = {
            'a': MUSICAL_NOTES.C4,   'b': MUSICAL_NOTES.D4,   'c': MUSICAL_NOTES.E4,
            'd': MUSICAL_NOTES.G4,   'e': MUSICAL_NOTES.A4,   'f': MUSICAL_NOTES.C5,
            'g': MUSICAL_NOTES.D5,   'h': MUSICAL_NOTES.E5,   'i': MUSICAL_NOTES.G5,
            'j': MUSICAL_NOTES.A5,   'k': MUSICAL_NOTES.C4,   'l': MUSICAL_NOTES.D4,
            'm': MUSICAL_NOTES.E4,   'n': MUSICAL_NOTES.G4,   'o': MUSICAL_NOTES.A4,
            'p': MUSICAL_NOTES.C5,   'q': MUSICAL_NOTES.D5,   'r': MUSICAL_NOTES.E5,
            's': MUSICAL_NOTES.G5,   't': MUSICAL_NOTES.A5,   'u': MUSICAL_NOTES.C4,
            'v': MUSICAL_NOTES.D4,   'w': MUSICAL_NOTES.E4,
            // Z and X get nice low, pleasant frequencies
            'x': MUSICAL_NOTES.G4,   'y': MUSICAL_NOTES.A4,   'z': MUSICAL_NOTES.C4
        };

        const lowerLetter = letter.toLowerCase();
        return letterMap[lowerLetter] || MUSICAL_NOTES.C5;
    }

    getRandomNote() {
        const noteName = NOTE_NAMES[Math.floor(Math.random() * NOTE_NAMES.length)];
        return MUSICAL_NOTES[noteName];
    }

    playChord(notes, duration = 1.0) {
        // Play multiple notes simultaneously
        if (!this.isEnabled) {return;}

        notes.forEach((note, index) => {
            setTimeout(() => {
                this.playSound('chime', note, { duration });
            }, index * 50); // Slight delay for arpeggio effect
        });
    }

    playMelody(notes, noteLength = 0.3) {
        // Play notes in sequence
        if (!this.isEnabled) {return;}

        notes.forEach((note, index) => {
            setTimeout(() => {
                this.playSound('note', note, { duration: noteLength });
            }, index * noteLength * 1000);
        });
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));

        if (this.masterGainNode && this.audioContext) {
            this.masterGainNode.gain.setValueAtTime(
                this.volume,
                this.audioContext.currentTime
            );
        }

        debugLog(`Volume set to ${Math.round(this.volume * 100)}%`);
    }

    toggleMute() {
        this.isEnabled = !this.isEnabled;
        debugLog(`Sound ${this.isEnabled ? 'enabled' : 'disabled'}`);
        return this.isEnabled;
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
        debugLog(`Sound ${this.isEnabled ? 'enabled' : 'disabled'}`);
    }

    getVolume() {
        return this.volume;
    }

    isAudioEnabled() {
        return this.isEnabled;
    }

    getStats() {
        return {
            enabled: this.isEnabled,
            volume: this.volume,
            activeSounds: this.activeSounds.size,
            useWebAudio: this.useWebAudio,
            audioContextState: this.audioContext ? this.audioContext.state : 'not available'
        };
    }

    // Special sound effects for different occasions
    playWelcomeSound() {
        const welcomeNotes = [
            MUSICAL_NOTES.C4,
            MUSICAL_NOTES.E4,
            MUSICAL_NOTES.G4,
            MUSICAL_NOTES.C5
        ];
        this.playMelody(welcomeNotes, 0.4);
    }

    playSuccessSound() {
        const successNotes = [
            MUSICAL_NOTES.C5,
            MUSICAL_NOTES.E5,
            MUSICAL_NOTES.G5
        ];
        this.playChord(successNotes, 1.2);
    }

    destroy() {
        // Clean up resources
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        this.activeSounds.clear();
        this.audioElements.clear();

        debugLog('Sound manager destroyed');
    }
}
