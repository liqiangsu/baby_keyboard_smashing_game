/**
 * Utility Functions for Baby Keyboard Smashing Game
 * Contains helper functions for colors, math, positioning, and performance monitoring
 */

// Baby-friendly color palette - bright, high contrast colors
export const BABY_COLORS = [
    '#FF6B6B', // Bright Red
    '#4ECDC4', // Turquoise
    '#45B7D1', // Light Blue
    '#96CEB4', // Mint Green
    '#FFEAA7', // Sunny Yellow
    '#DDA0DD', // Plum Purple
    '#FFB6C1', // Light Pink
    '#98FB98', // Pale Green
    '#FFA07A', // Light Salmon
    '#87CEEB', // Sky Blue
    '#F0E68C', // Khaki Yellow
    '#DEB887'  // Burlywood
];

// Configuration constants
export const CONFIG = {
    shapes: {
        types: ['circle', 'square', 'triangle', 'star', 'heart'],
        minSize: 40,
        maxSize: 120,
        animationDuration: 3000,
        fadeOutDuration: 1500,
        maxActiveShapes: 15,
        emojiMode: true
    },
    emojis: {
        // Baby-friendly emoji collections
        vehicles: ['🚗', '🚕', '🚙', '🚌', '🚎', '🚐', '🚛', '🚜', '🏎️', '🚓', '🚑', '🚒', '✈️', '🚁', '🚢', '⛵'],
        animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐸', '🐙', '🦋', '🐝', '🐛', '🦆', '🐧'],
        food: ['🍎', '🍌', '🍊', '🍇', '🍓', '🥕', '🍅', '🍞', '🧀', '🍪', '🍰', '🍭', '🍯', '🥛', '🧁', '🍒'],
        toys: ['⚽', '🏀', '🎾', '🎲', '🧸', '🪀', '🎨', '🎯', '🎪', '🎠', '🎡', '🎢', '🚀', '🛸', '🎈', '🎁'],
        nature: ['🌸', '🌻', '🌺', '🌷', '🌹', '🌼', '🌳', '🌲', '🍀', '🌿', '🌈', '⭐', '🌟', '💫', '☀️', '🌙'],
        faces: ['😊', '😄', '😆', '🤗', '😍', '🥰', '😘', '😋', '😎', '🤩', '😇', '🙂', '😉', '😌', '☺️', '😚']
    },
    particles: {
        count: 8,
        minSize: 3,
        maxSize: 8,
        maxLifetime: 2000,
        maxActiveParticles: 100,
        trailLength: 20
    },
    audio: {
        volume: 0.7,
        maxConcurrentSounds: 5
    },
    performance: {
        targetFPS: 60,
        maxFrameTime: 16.67 // 1000ms / 60fps
    }
};

/**
 * Get a random baby-friendly color
 * @returns {string} Hex color code
 */
export function getRandomColor() {
    return BABY_COLORS[Math.floor(Math.random() * BABY_COLORS.length)];
}

/**
 * Get multiple random colors (no duplicates)
 * @param {number} count - Number of colors to return
 * @returns {string[]} Array of hex color codes
 */
export function getRandomColors(count) {
    const shuffled = [...BABY_COLORS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, BABY_COLORS.length));
}

/**
 * Generate random number between min and max (inclusive)
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random emoji from a category or all emojis
 * @param {string} category - Category name ('vehicles', 'animals', 'food', 'toys', 'nature', 'faces') or 'all'
 * @returns {string} Random emoji
 */
export function getRandomEmoji(category = 'all') {
    const { emojis } = CONFIG;

    if (category === 'all') {
        // Get random emoji from all categories
        const allCategories = Object.keys(emojis);
        const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
        const categoryEmojis = emojis[randomCategory];
        return categoryEmojis[Math.floor(Math.random() * categoryEmojis.length)];
    }

    if (emojis[category]) {
        const categoryEmojis = emojis[category];
        return categoryEmojis[Math.floor(Math.random() * categoryEmojis.length)];
    }

    // Fallback to a happy face if category not found
    return '😊';
}

/**
 * Get emoji based on key type for more meaningful representation
 * @param {string} keyType - Type of key pressed
 * @param {string} keyChar - Character of the key
 * @returns {string} Appropriate emoji
 */
export function getEmojiForKey(keyType, keyChar) {
    switch (keyType) {
        case 'letter':
            // Map specific letters to themed emojis
            const letterEmojiMap = {
                'a': '🍎', 'b': '🐻', 'c': '🚗', 'd': '🐶', 'e': '🐘',
                'f': '🐸', 'g': '🦒', 'h': '🏠', 'i': '🍦', 'j': '✈️',
                'k': '🪁', 'l': '🦁', 'm': '🐭', 'n': '🌙', 'o': '🐙',
                'p': '🐼', 'q': '👸', 'r': '🚀', 's': '⭐', 't': '🚂',
                'u': '☂️', 'v': '🚐', 'w': '🐋', 'x': '❌', 'y': '💛', 'z': '🦓'
            };
            return letterEmojiMap[keyChar?.toLowerCase()] || getRandomEmoji('animals');

        case 'number':
            // Numbers get counting emojis or number-related items
            const numberEmojiMap = {
                '0': '⭕', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣',
                '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣'
            };
            return numberEmojiMap[keyChar] || getRandomEmoji('toys');

        case 'space':
            return '🚀'; // Space = rocket

        case 'enter':
            return '⭐'; // Enter = star

        case 'arrow':
            return '🏃'; // Arrow = running

        case 'punctuation':
            return getRandomEmoji('faces');

        default:
            return getRandomEmoji('toys');
    }
}

/**
 * Toggle emoji mode in CONFIG
 * @param {boolean} enabled - Whether to enable emoji mode
 */
export function setEmojiMode(enabled) {
    CONFIG.shapes.emojiMode = enabled;
    debugLog(`Emoji mode ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Get random position on canvas with padding
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @param {number} padding - Padding from edges
 * @returns {{x: number, y: number}}
 */
export function getRandomPosition(canvasWidth, canvasHeight, padding = 50) {
    return {
        x: randomBetween(padding, canvasWidth - padding),
        y: randomBetween(padding, canvasHeight - padding)
    };
}

/**
 * Calculate distance between two points
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
export function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Linear interpolation between two values
 * @param {number} start
 * @param {number} end
 * @param {number} factor - Between 0 and 1
 * @returns {number}
 */
export function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

/**
 * Clamp value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Easing function for smooth animations (ease-out)
 * @param {number} t - Time factor (0-1)
 * @returns {number}
 */
export function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function for bounce effect
 * @param {number} t - Time factor (0-1)
 * @returns {number}
 */
export function easeBounce(t) {
    if (t < 1 / 2.75) {
        return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} RGB color string
 */
export function hslToRgb(h, s, l) {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    const hue2rgb = (p, q, t) => {
        if (t < 0) {t += 1;}
        if (t > 1) {t -= 1;}
        if (t < 1/6) {return p + (q - p) * 6 * t;}
        if (t < 1/2) {return q;}
        if (t < 2/3) {return p + (q - p) * (2/3 - t) * 6;}
        return p;
    };

    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.frameTime = 0;
        this.updateInterval = 1000; // Update every second
    }

    update() {
        const now = performance.now();
        const deltaTime = now - this.lastTime;

        this.frameCount++;
        this.frameTime = deltaTime;

        if (deltaTime >= this.updateInterval) {
            this.fps = Math.round((this.frameCount * 1000) / deltaTime);
            this.frameCount = 0;
            this.lastTime = now;
        }
    }

    getFPS() {
        return this.fps;
    }

    getFrameTime() {
        return this.frameTime;
    }

    isPerformanceGood() {
        return this.fps >= 45 && this.frameTime <= CONFIG.performance.maxFrameTime * 1.2;
    }
}

/**
 * Object Pool for memory efficiency
 */
export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];

        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    get() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.createFn();
    }

    release(obj) {
        if (this.resetFn) {
            this.resetFn(obj);
        }
        this.pool.push(obj);
    }

    clear() {
        this.pool.length = 0;
    }
}

/**
 * Debounce function to limit function calls
 * @param {Function} func
 * @param {number} wait - Delay in milliseconds
 * @returns {Function}
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if device supports touch
 * @returns {boolean}
 */
export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get canvas coordinates from mouse/touch event
 * @param {Event} event
 * @param {HTMLCanvasElement} canvas
 * @returns {{x: number, y: number}}
 */
export function getCanvasCoordinates(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

/**
 * Announce to screen readers for accessibility
 * @param {string} message
 */
export function announceToScreenReader(message) {
    const screenReader = document.getElementById('screenReader');
    if (screenReader) {
        screenReader.textContent = message;
        // Clear after a delay to allow for new announcements
        setTimeout(() => {
            screenReader.textContent = '';
        }, 1000);
    }
}

/**
 * Log debug information (only in development)
 * @param {string} message
 * @param {...any} args
 */
export function debugLog(message, ...args) {
    if (import.meta.env.DEV) {
        console.log(`[Baby Game] ${message}`, ...args);
    }
}
