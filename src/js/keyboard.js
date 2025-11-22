/**
 * Keyboard Input Handler for Baby Keyboard Smashing Game
 * Safely handles all keyboard input, filtering dangerous keys and providing fun feedback
 */

import { debugLog, announceToScreenReader } from './utils.js';

/**
 * Keys that should be blocked to prevent accidental browser/system actions
 */
const BLOCKED_KEYS = new Set([
    // Modifier keys that could cause issues
    'Alt', 'AltLeft', 'AltRight',
    'Control', 'ControlLeft', 'ControlRight',
    'Meta', 'MetaLeft', 'MetaRight', // Windows/Cmd key
    'OS', 'OSLeft', 'OSRight',

    // Function keys that could disrupt the browser
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
    'F7', 'F8', 'F9', 'F10', 'F11', 'F12',

    // Navigation keys that might cause issues
    'ContextMenu',
    'PrintScreen',
    'ScrollLock',
    'Pause',
    'Insert',

    // Browser-specific shortcuts we want to avoid
    'BrowserBack',
    'BrowserForward',
    'BrowserRefresh',
    'BrowserStop',
    'BrowserSearch',
    'BrowserFavorites',
    'BrowserHome'
]);

/**
 * Parent control key combinations
 */
const PARENT_CONTROLS = {
    exit: { ctrl: true, shift: true, key: 'Escape' },
    toggleSound: { ctrl: true, shift: true, key: 'KeyM' },
    clearScreen: { ctrl: true, shift: true, key: 'KeyC' },
    showControls: { ctrl: true, shift: true, key: 'KeyP' }
};

/**
 * Special effects for certain key combinations or keys
 */
const SPECIAL_EFFECTS = {
    spacebar: { key: 'Space', effect: 'explosion', sound: 'explosion' },
    enter: { key: 'Enter', effect: 'fireworks', sound: 'fireworks' },
    allLetters: { effect: 'rainbow', sound: 'chime' },
    numbers: { effect: 'sparkle', sound: 'sparkle' },
    arrows: { effect: 'bounce', sound: 'boing' },
    punctuation: { effect: 'bubble', sound: 'bubble' },
    tab: { key: 'Tab', effect: 'whistle', sound: 'whistle' }
};

/**
 * Sound type mapping for different key categories
 */
const KEY_SOUND_MAP = {
    letters: ['note', 'chime', 'bell'],
    numbers: ['sparkle', 'chime', 'whistle'],
    punctuation: ['bubble', 'toy', 'bell'],
    arrows: ['boing', 'toy'],
    function: ['laugh', 'toy'],
    modifiers: ['whistle', 'chime']
};

export class KeyboardHandler {
    constructor() {
        this.gameActive = false;
        this.onKeyPress = null; // Callback for game key presses
        this.onParentControl = null; // Callback for parent controls
        this.keyPressCount = 0;
        this.lastKeyTime = 0;

        this.init();
    }

    init() {
        // Bind keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Prevent context menu on right-click during game
        document.addEventListener('contextmenu', (e) => {
            if (this.gameActive) {
                e.preventDefault();
            }
        });

        debugLog('Keyboard handler initialized');
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event
     */
    handleKeyDown(event) {
        const now = performance.now();

        debugLog(`Key pressed: ${event.code} (${event.key})`);

        // Check for parent controls first
        if (this.checkParentControls(event)) {
            return;
        }

        // If game is not active, don't process game keys
        if (!this.gameActive) {
            return;
        }

        // Block dangerous keys
        if (this.shouldBlockKey(event)) {
            event.preventDefault();
            event.stopPropagation();
            debugLog(`Blocked dangerous key: ${event.code}`);
            return;
        }

        // Prevent default behavior for all keys during gameplay
        event.preventDefault();
        event.stopPropagation();

        // Check for rapid key pressing (prevent spam) - reduced for better responsiveness
        if (now - this.lastKeyTime < 20) { // 20ms cooldown for better responsiveness
            return;
        }

        this.lastKeyTime = now;
        this.keyPressCount++;

        // Check for debug toggle (D key)
        if (event.code === 'KeyD') {
            window.debugMode = !window.debugMode;
            console.log('Debug mode:', window.debugMode ? 'ON' : 'OFF');
        }

        // Determine key type and effect
        const keyInfo = this.analyzeKey(event);

        // Call the game callback with key information
        if (this.onKeyPress && typeof this.onKeyPress === 'function') {
            this.onKeyPress(keyInfo);
        }

        // Announce to screen reader occasionally for accessibility
        if (this.keyPressCount % 10 === 0) {
            announceToScreenReader(`${this.keyPressCount} keys pressed. Having fun!`);
        }
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event
     */
    handleKeyUp(event) {
        // Currently not used, but available for future features
    }

    /**
     * Check if key should be blocked
     * @param {KeyboardEvent} event
     * @returns {boolean}
     */
    shouldBlockKey(event) {
        // Block if it's in our blocked keys list
        if (BLOCKED_KEYS.has(event.code) || BLOCKED_KEYS.has(event.key)) {
            return true;
        }

        // Block combinations with modifier keys (except parent controls)
        if ((event.ctrlKey || event.altKey || event.metaKey) &&
            !this.isParentControl(event)) {
            return true;
        }

        return false;
    }

    /**
     * Check for parent control key combinations
     * @param {KeyboardEvent} event
     * @returns {boolean} True if parent control was triggered
     */
    checkParentControls(event) {
        for (const [action, combo] of Object.entries(PARENT_CONTROLS)) {
            if (this.matchesKeyCombo(event, combo)) {
                event.preventDefault();
                event.stopPropagation();

                debugLog(`Parent control triggered: ${action}`);

                if (this.onParentControl && typeof this.onParentControl === 'function') {
                    this.onParentControl(action, event);
                }

                return true;
            }
        }

        return false;
    }

    /**
     * Check if event matches parent control combination
     * @param {KeyboardEvent} event
     * @returns {boolean}
     */
    isParentControl(event) {
        for (const combo of Object.values(PARENT_CONTROLS)) {
            if (this.matchesKeyCombo(event, combo)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if event matches a key combination
     * @param {KeyboardEvent} event
     * @param {Object} combo
     * @returns {boolean}
     */
    matchesKeyCombo(event, combo) {
        return (!combo.ctrl || event.ctrlKey) &&
               (!combo.shift || event.shiftKey) &&
               (!combo.alt || event.altKey) &&
               (!combo.meta || event.metaKey) &&
               (event.code === combo.key || event.key === combo.key);
    }

    /**
     * Analyze key press to determine effect type
     * @param {KeyboardEvent} event
     * @returns {Object} Key information object
     */
    analyzeKey(event) {
        const keyInfo = {
            code: event.code,
            key: event.key,
            type: 'normal',
            effect: 'normal',
            timestamp: performance.now()
        };

        // Determine key type and assign sounds
        if (event.code.startsWith('Key')) {
            keyInfo.type = 'letter';
            keyInfo.character = event.key.toLowerCase();
            keyInfo.soundType = this.getRandomSound(KEY_SOUND_MAP.letters);
        } else if (event.code.startsWith('Digit')) {
            keyInfo.type = 'number';
            keyInfo.character = event.key;
            keyInfo.soundType = this.getRandomSound(KEY_SOUND_MAP.numbers);
        } else if (event.code === 'Space') {
            keyInfo.type = 'space';
            keyInfo.effect = 'explosion';
            keyInfo.soundType = 'explosion';
        } else if (event.code === 'Enter') {
            keyInfo.type = 'enter';
            keyInfo.effect = 'fireworks';
            keyInfo.soundType = 'fireworks';
        } else if (event.code === 'Tab') {
            keyInfo.type = 'tab';
            keyInfo.effect = 'whistle';
            keyInfo.soundType = 'whistle';
        } else if (event.code.startsWith('Arrow')) {
            keyInfo.type = 'arrow';
            keyInfo.direction = event.code.replace('Arrow', '').toLowerCase();
            keyInfo.effect = 'bounce';
            keyInfo.soundType = 'boing';
        } else if (this.isPunctuation(event.key)) {
            keyInfo.type = 'punctuation';
            keyInfo.effect = 'bubble';
            keyInfo.soundType = this.getRandomSound(KEY_SOUND_MAP.punctuation);
        } else {
            keyInfo.type = 'special';
            keyInfo.soundType = this.getRandomSound(KEY_SOUND_MAP.modifiers);
        }

        // Add special effects based on patterns
        if (keyInfo.type === 'letter' && this.isVowel(keyInfo.character)) {
            keyInfo.effect = 'sparkle';
            keyInfo.soundType = 'sparkle';
        } else if (keyInfo.type === 'number') {
            keyInfo.effect = 'star';
        }

        // Check for rapid typing (rainbow effect)
        if (this.keyPressCount > 0 && (performance.now() - this.lastKeyTime) < 200) {
            keyInfo.effect = 'rainbow';
            keyInfo.soundType = 'chime';
        }

        // Special sound for consonants vs vowels
        if (keyInfo.type === 'letter') {
            if (this.isVowel(keyInfo.character)) {
                // Vowels get more melodic sounds
                keyInfo.soundType = this.getRandomSound(['chime', 'bell', 'whistle']);
            } else {
                // Consonants get more percussive sounds
                keyInfo.soundType = this.getRandomSound(['note', 'toy', 'bubble']);
            }
        }

        return keyInfo;
    }

    /**
     * Check if character is a vowel
     * @param {string} char
     * @returns {boolean}
     */
    isVowel(char) {
        return 'aeiou'.includes(char.toLowerCase());
    }

    /**
     * Check if character is punctuation
     * @param {string} char
     * @returns {boolean}
     */
    isPunctuation(char) {
        return /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(char);
    }

    /**
     * Get random sound from array
     * @param {string[]} sounds
     * @returns {string}
     */
    getRandomSound(sounds) {
        return sounds[Math.floor(Math.random() * sounds.length)];
    }

    /**
     * Set game active state
     * @param {boolean} active
     */
    setGameActive(active) {
        this.gameActive = active;
        debugLog(`Game active state: ${active}`);

        if (active) {
            document.body.style.overflow = 'hidden'; // Prevent scrolling during game
            announceToScreenReader('Game started! Press any key to create shapes and sounds!');
        } else {
            document.body.style.overflow = ''; // Restore scrolling
            this.keyPressCount = 0;
        }
    }

    /**
     * Set callback for key presses
     * @param {Function} callback
     */
    setOnKeyPress(callback) {
        this.onKeyPress = callback;
    }

    /**
     * Set callback for parent controls
     * @param {Function} callback
     */
    setOnParentControl(callback) {
        this.onParentControl = callback;
    }

    /**
     * Get statistics about key presses
     * @returns {Object}
     */
    getStats() {
        return {
            totalKeyPresses: this.keyPressCount,
            lastKeyTime: this.lastKeyTime,
            gameActive: this.gameActive
        };
    }

    /**
     * Reset key press statistics
     */
    resetStats() {
        this.keyPressCount = 0;
        this.lastKeyTime = 0;
        debugLog('Key press statistics reset');
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        document.removeEventListener('contextmenu', this.handleContextMenu);

        this.gameActive = false;
        this.onKeyPress = null;
        this.onParentControl = null;

        debugLog('Keyboard handler destroyed');
    }
}
