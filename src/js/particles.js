/**
 * Particle System for Baby Keyboard Smashing Game
 * Creates beautiful trailing particles that follow mouse cursor movement
 */

import {
    getRandomColor,
    getRandomColors,
    randomBetween,
    randomIntBetween,
    CONFIG,
    distance,
    lerp,
    easeOut,
    ObjectPool,
    getCanvasCoordinates,
    isTouchDevice,
    debugLog
} from './utils.js';

/**
 * Individual Particle class
 */
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0; // velocity x
        this.vy = 0; // velocity y
        this.size = 0;
        this.maxSize = 0;
        this.color = '#FF6B6B';
        this.alpha = 1;
        this.life = 1;
        this.maxLife = 1;
        this.decay = 0.02;
        this.gravity = 0;
        this.friction = 0.98;
        this.isActive = false;
        this.hue = 0;
        this.saturation = 70;
        this.lightness = 60;
        this.rotationSpeed = 0;
        this.rotation = 0;
        this.type = 'circle'; // circle, star, heart, sparkle
    }

    init(x, y, options = {}) {
        this.reset();
        this.x = x;
        this.y = y;
        this.isActive = true;

        // Set particle type and properties based on options
        this.type = options.type || 'circle';
        const isClickParticle = options.isClickParticle || false;
        const burstIntensity = options.burstIntensity || 1;

        // Time-based lifetime with random range (1-4 seconds for normal, 2-6 for clicks)
        if (isClickParticle) {
            this.maxLife = randomBetween(2000, 6000); // 2-6 seconds
            this.maxSize = randomBetween(CONFIG.particles.maxSize, CONFIG.particles.maxSize * 2.5);
        } else {
            this.maxLife = randomBetween(1000, 4000); // 1-4 seconds
            this.maxSize = randomBetween(CONFIG.particles.minSize, CONFIG.particles.maxSize);
        }

        this.life = this.maxLife;
        this.size = 0; // Start small and grow

        // Velocity based on particle type
        if (isClickParticle) {
            // Click particles burst outward in all directions
            const angle = randomBetween(0, Math.PI * 2);
            const speed = randomBetween(3, 10) * burstIntensity;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        } else {
            // Normal particles have gentle, mostly upward movement
            this.vx = randomBetween(-1, 1);
            this.vy = randomBetween(-2, 0.5);
        }

        // Physics properties
        this.gravity = isClickParticle ? randomBetween(0.02, 0.08) : randomBetween(0.05, 0.15);
        this.friction = randomBetween(0.95, 0.99);

        // Visual properties
        this.hue = randomBetween(0, 360);
        this.rotationSpeed = randomBetween(-0.15, 0.15);
        if (isClickParticle) {
            this.rotationSpeed *= 2; // Click particles spin faster
        }

        this.updateColor();
    }

    update(deltaTime) {
        if (!this.isActive) {return false;}

        // Update physics
        this.x += this.vx * deltaTime * 0.06; // Scale for consistent movement
        this.y += this.vy * deltaTime * 0.06;
        this.vy += this.gravity * deltaTime * 0.06;

        this.vx *= this.friction;
        this.vy *= this.friction;

        // Update rotation
        this.rotation += this.rotationSpeed * deltaTime * 0.1;

        // Time-based life decay (subtract actual elapsed time)
        this.life -= deltaTime;
        const lifeProgress = 1 - Math.max(0, this.life / this.maxLife);

        // Update size animation based on life progress
        if (lifeProgress < 0.15) {
            // Growing phase (0-15% of lifetime)
            this.size = this.maxSize * easeOut(lifeProgress / 0.15);
        } else if (lifeProgress > 0.85) {
            // Shrinking phase (85-100% of lifetime)
            const shrinkProgress = (lifeProgress - 0.85) / 0.15;
            this.size = this.maxSize * (1 - easeOut(shrinkProgress));
        } else {
            // Stable phase (15-85% of lifetime)
            this.size = this.maxSize;
        }

        // Update alpha based on life remaining
        this.alpha = Math.max(0, this.life / this.maxLife);

        // Gentle color shifting for rainbow effect
        this.hue = (this.hue + deltaTime * 0.05) % 360;
        this.updateColor();

        // Check if particle is dead
        if (this.life <= 0 || this.size <= 0) {
            this.isActive = false;
            return false;
        }

        return true;
    }

    updateColor() {
        this.color = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha})`;
    }

    render(ctx) {
        if (!this.isActive || this.size <= 0) {return;}

        ctx.save();
        ctx.globalAlpha = this.alpha;

        // Move to particle position
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Set color
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        // Render based on type
        switch (this.type) {
            case 'circle':
                this.renderCircle(ctx);
                break;
            case 'star':
                this.renderStar(ctx);
                break;
            case 'sparkle':
                this.renderSparkle(ctx);
                break;
            case 'heart':
                this.renderHeart(ctx);
                break;
            default:
                this.renderCircle(ctx);
        }

        ctx.restore();
    }

    renderCircle(ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = this.size * 0.5;
        ctx.shadowColor = this.color;
        ctx.fill();
    }

    renderStar(ctx) {
        const spikes = 5;
        const outerRadius = this.size;
        const innerRadius = this.size * 0.4;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    renderSparkle(ctx) {
        const size = this.size;
        ctx.lineWidth = 1;

        // Draw cross shape
        ctx.beginPath();
        ctx.moveTo(-size, 0);
        ctx.lineTo(size, 0);
        ctx.moveTo(0, -size);
        ctx.lineTo(0, size);
        ctx.stroke();

        // Draw diagonal lines
        const halfSize = size * 0.7;
        ctx.beginPath();
        ctx.moveTo(-halfSize, -halfSize);
        ctx.lineTo(halfSize, halfSize);
        ctx.moveTo(halfSize, -halfSize);
        ctx.lineTo(-halfSize, halfSize);
        ctx.stroke();
    }

    renderHeart(ctx) {
        const size = this.size * 0.8;

        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);

        // Left curve
        ctx.bezierCurveTo(-size, -size * 0.3, -size, size * 0.3, 0, size);

        // Right curve
        ctx.bezierCurveTo(size, size * 0.3, size, -size * 0.3, 0, size * 0.3);

        ctx.fill();
    }
}

/**
 * Particle System Manager
 */
export class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particlePool = new ObjectPool(
            () => new Particle(),
            (particle) => particle.reset(),
            50 // Increase pool size for constant emission and click effects
        );

        // Mouse tracking for cursor position
        this.mouseX = this.canvas.width / 2; // Start in center
        this.mouseY = this.canvas.height / 2;

        // Constant emission system
        this.constantEmitRate = 120; // Emit every 120ms
        this.lastConstantEmitTime = 0;
        this.constantParticleTypes = ['circle', 'sparkle'];

        // Click effect system
        this.clickEffects = [];
        this.maxClickParticles = 20; // Particles per click

        // Touch support
        this.isTouch = isTouchDevice();

        this.initEventListeners();

        debugLog('Particle system initialized with constant emission');
    }

    initEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseClick.bind(this));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent right-click menu
            this.handleMouseClick(e); // Treat right-click as click too
        });

        // Touch events for mobile
        if (this.isTouch) {
            this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
            this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
            this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        }
    }

    handleMouseMove(event) {
        const coords = getCanvasCoordinates(event, this.canvas);
        this.mouseX = coords.x;
        this.mouseY = coords.y;
    }

    handleMouseClick(event) {
        const coords = getCanvasCoordinates(event, this.canvas);
        this.createClickEffect(coords.x, coords.y, event.button);
        debugLog(`Mouse click at (${Math.round(coords.x)}, ${Math.round(coords.y)}) button: ${event.button}`);
    }

    handleTouchStart(event) {
        event.preventDefault();
        if (event.touches.length > 0) {
            const coords = getCanvasCoordinates(event, this.canvas);
            this.mouseX = coords.x;
            this.mouseY = coords.y;
            // Touch start creates a click effect
            this.createClickEffect(coords.x, coords.y, 0);
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (event.touches.length > 0) {
            const coords = getCanvasCoordinates(event, this.canvas);
            this.mouseX = coords.x;
            this.mouseY = coords.y;
        }
    }

    handleTouchEnd(event) {
        event.preventDefault();
    }

    createConstantParticles() {
        const now = performance.now();

        // Check if it's time to emit constant particles
        if (now - this.lastConstantEmitTime < this.constantEmitRate) {
            return;
        }

        this.lastConstantEmitTime = now;

        // Create particles at random positions around the cursor
        const particleCount = randomIntBetween(1, 3);

        for (let i = 0; i < particleCount; i++) {
            // Random position around cursor
            const angle = randomBetween(0, Math.PI * 2);
            const distance = randomBetween(10, 50);
            const x = this.mouseX + Math.cos(angle) * distance;
            const y = this.mouseY + Math.sin(angle) * distance;

            // Clamp to canvas bounds
            const clampedX = Math.max(0, Math.min(x, this.canvas.width));
            const clampedY = Math.max(0, Math.min(y, this.canvas.height));

            this.createParticle(clampedX, clampedY, {
                type: this.constantParticleTypes[Math.floor(Math.random() * this.constantParticleTypes.length)],
                isClickParticle: false
            });
        }
    }

    createClickEffect(x, y, button) {
        // Different effects for different mouse buttons
        let effectIntensity = 1;
        let particleTypes = ['star', 'heart', 'sparkle'];

        switch (button) {
            case 0: // Left click
                effectIntensity = 1.5;
                particleTypes = ['star', 'heart'];
                break;
            case 1: // Middle click
                effectIntensity = 2;
                particleTypes = ['sparkle', 'star'];
                break;
            case 2: // Right click
                effectIntensity = 2.5;
                particleTypes = ['heart', 'star', 'sparkle'];
                break;
        }

        // Create burst of particles
        const particleCount = Math.floor(this.maxClickParticles * effectIntensity);

        for (let i = 0; i < particleCount; i++) {
            const particleType = particleTypes[Math.floor(Math.random() * particleTypes.length)];
            this.createParticle(x, y, {
                type: particleType,
                isClickParticle: true,
                burstIntensity: effectIntensity
            });
        }

        debugLog(`Created click effect with ${particleCount} particles (intensity: ${effectIntensity})`);
    }

    createParticle(x, y, options = {}) {
        // Don't create if we have too many particles
        if (this.particles.length >= CONFIG.particles.maxActiveParticles) {
            // Remove oldest particle
            const oldParticle = this.particles.shift();
            this.particlePool.release(oldParticle);
        }

        const particle = this.particlePool.get();

        // Initialize particle with new system
        particle.init(x, y, options);
        this.particles.push(particle);

        return particle;
    }

    createBurst(x, y, count = 10) {
        // Create a burst of particles at specific location
        const colors = getRandomColors(3);

        for (let i = 0; i < count; i++) {
            if (this.particles.length >= CONFIG.particles.maxActiveParticles) {
                break;
            }

            const particle = this.particlePool.get();
            particle.init(x, y, i % 3 === 0 ? 'star' : 'circle');

            // Set burst velocity
            const angle = (i / count) * Math.PI * 2;
            const speed = randomBetween(3, 8);
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;

            // Vary particle properties
            particle.maxSize *= randomBetween(0.8, 1.5);
            particle.hue = randomBetween(0, 360);

            this.particles.push(particle);
        }
    }

    update(deltaTime) {
        // Create constant emission of particles
        this.createConstantParticles();

        // Update all particles
        this.particles = this.particles.filter(particle => {
            const isActive = particle.update(deltaTime);
            if (!isActive) {
                this.particlePool.release(particle);
            }
            return isActive;
        });

        // Remove particles that are off-screen (with larger buffer for click effects)
        this.particles = this.particles.filter(particle => {
            if (particle.x < -100 || particle.x > this.canvas.width + 100 ||
                particle.y < -100 || particle.y > this.canvas.height + 100) {
                this.particlePool.release(particle);
                return false;
            }
            return true;
        });
    }

    render() {
        // Render all particles
        this.particles.forEach(particle => {
            particle.render(this.ctx);
        });

        // Optional: Render mouse position indicator for debugging
        if (import.meta.env.DEV && false) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(this.mouseX, this.mouseY, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    clear() {
        // Return all particles to pool and clear array
        this.particles.forEach(particle => {
            this.particlePool.release(particle);
        });
        this.particles.length = 0;

        debugLog('All particles cleared');
    }

    getActiveParticleCount() {
        return this.particles.length;
    }

    resize(width, height) {
        // Update canvas reference after resize
        this.canvas.width = width;
        this.canvas.height = height;
        debugLog(`Particle system resized to ${width}x${height}`);
    }

    setEmitRate(rate) {
        // Adjust constant emission rate (lower = more frequent)
        this.constantEmitRate = Math.max(50, rate);
        debugLog(`Constant particle emit rate set to ${this.constantEmitRate}ms`);
    }

    destroy() {
        // Remove event listeners
        this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.removeEventListener('mousedown', this.handleMouseClick.bind(this));
        this.canvas.removeEventListener('contextmenu', this.handleMouseClick.bind(this));

        if (this.isTouch) {
            this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
            this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
            this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        }

        this.clear();
        debugLog('Particle system destroyed');
    }
}
