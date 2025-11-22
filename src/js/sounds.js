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
    A5: 880.00
};

const NOTE_NAMES = Object.keys(MUSICAL_NOTES);

/**
 * Sound types and their properties
 */
const SOUND_TYPES = {
    note: { duration: 0.6, volume: 0.7 },
    chime: { duration: 1.2, volume: 0.5 },
    bell: { duration: 0.8, volume: 0.6 },
    toy: { duration: 0.4, volume: 0.8 },
    sparkle: { duration: 0.3, volume: 0.4 },
    explosion: { duration: 1.0, volume: 0.9 },
    fireworks: { duration: 1.5, volume: 0.6 }
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
        if (!this.isEnabled) return;
        
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
        if (!this.isEnabled) return;
        
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
        const soundConfig = SOUND_TYPES[type] || SOUND_TYPES.note;
        const duration = options.duration || soundConfig.duration;
        const volume = (options.volume || soundConfig.volume) * this.volume;
        
        try {
            const now = this.audioContext.currentTime;
            const soundId = `${type}_${now}_${Math.random()}`;
            
            // Create oscillator for the main tone
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Configure oscillator
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            // Set waveform based on sound type
            switch (type) {
                case 'note':
                    oscillator.type = 'triangle'; // Soft, pleasant tone
                    break;
                case 'chime':
                    oscillator.type = 'sine'; // Pure, bell-like tone
                    break;
                case 'bell':
                    oscillator.type = 'triangle';
                    break;
                case 'toy':
                    oscillator.type = 'square'; // Playful, toy-like
                    break;
                case 'sparkle':
                    oscillator.type = 'sine';
                    break;
                case 'explosion':
                    oscillator.type = 'sawtooth'; // More energetic
                    break;
                case 'fireworks':
                    oscillator.type = 'triangle';
                    break;
                default:
                    oscillator.type = 'triangle';
            }
            
            // Set frequency
            oscillator.frequency.setValueAtTime(frequency, now);
            
            // Apply special effects based on sound type
            this.applySoundEffects(oscillator, gainNode, type, now, duration);
            
            // Configure envelope (attack, decay, sustain, release)
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Quick attack
            
            if (type === 'sparkle') {
                // Quick decay for sparkle sounds
                gainNode.gain.exponentialRampToValueAtTime(volume * 0.1, now + duration * 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
            } else {
                // Standard envelope
                gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
            }
            
            // Start and stop
            oscillator.start(now);
            oscillator.stop(now + duration);
            
            // Track active sound
            this.activeSounds.add(soundId);
            
            // Clean up when finished
            oscillator.addEventListener('ended', () => {
                this.activeSounds.delete(soundId);
            });
            
            debugLog(`Playing ${type} sound at ${Math.round(frequency)}Hz`);
            
        } catch (error) {
            debugLog('Error playing Web Audio sound', error);
        }
    }
    
    applySoundEffects(oscillator, gainNode, type, startTime, duration) {
        switch (type) {
            case 'chime':
                // Add slight vibrato
                const lfo = this.audioContext.createOscillator();
                const lfoGain = this.audioContext.createGain();
                lfo.frequency.setValueAtTime(6, startTime); // 6Hz vibrato
                lfoGain.gain.setValueAtTime(10, startTime); // 10Hz depth
                lfo.connect(lfoGain);
                lfoGain.connect(oscillator.frequency);
                lfo.start(startTime);
                lfo.stop(startTime + duration);
                break;
                
            case 'explosion':
                // Frequency sweep down
                oscillator.frequency.exponentialRampToValueAtTime(
                    oscillator.frequency.value * 0.5, 
                    startTime + duration
                );
                break;
                
            case 'fireworks':
                // Multiple frequency sweeps
                const freq = oscillator.frequency.value;
                oscillator.frequency.setValueAtTime(freq, startTime);
                oscillator.frequency.linearRampToValueAtTime(freq * 1.5, startTime + duration * 0.1);
                oscillator.frequency.linearRampToValueAtTime(freq * 0.8, startTime + duration * 0.5);
                oscillator.frequency.linearRampToValueAtTime(freq, startTime + duration);
                break;
                
            case 'sparkle':
                // Quick frequency modulation
                const sparkleFreq = oscillator.frequency.value;
                oscillator.frequency.setValueAtTime(sparkleFreq, startTime);
                oscillator.frequency.linearRampToValueAtTime(sparkleFreq * 2, startTime + duration * 0.1);
                oscillator.frequency.exponentialRampToValueAtTime(sparkleFreq, startTime + duration);
                break;
        }
    }
    
    playFallbackSound(type, frequency, options) {
        // Simple fallback using basic audio elements or beep
        debugLog(`Playing fallback ${type} sound`);
        
        // For now, we'll skip fallback implementation
        // In a real app, you might want to use pre-recorded audio files
    }
    
    getNoteForLetter(letter) {
        // Map letters to musical notes
        const letterIndex = letter.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
        const noteIndex = letterIndex % NOTE_NAMES.length;
        return MUSICAL_NOTES[NOTE_NAMES[noteIndex]];
    }
    
    getRandomNote() {
        const noteName = NOTE_NAMES[Math.floor(Math.random() * NOTE_NAMES.length)];
        return MUSICAL_NOTES[noteName];
    }
    
    playChord(notes, duration = 1.0) {
        // Play multiple notes simultaneously
        if (!this.isEnabled) return;
        
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.playSound('chime', note, { duration });
            }, index * 50); // Slight delay for arpeggio effect
        });
    }
    
    playMelody(notes, noteLength = 0.3) {
        // Play notes in sequence
        if (!this.isEnabled) return;
        
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