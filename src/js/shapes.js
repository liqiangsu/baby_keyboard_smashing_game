/**
 * Shape Generation System for Baby Keyboard Smashing Game
 * Creates colorful, animated geometric shapes for visual feedback
 */

import { 
    getRandomColor, 
    getRandomPosition, 
    randomBetween, 
    randomIntBetween,
    CONFIG,
    easeOut,
    easeBounce,
    ObjectPool,
    debugLog 
} from './utils.js';

/**
 * Individual Shape class
 */
class Shape {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.size = 0;
        this.maxSize = 0;
        this.color = '#FF6B6B';
        this.type = 'circle';
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.createdAt = 0;
        this.lifespan = CONFIG.shapes.animationDuration;
        this.fadeOutStart = this.lifespan - CONFIG.shapes.fadeOutDuration;
        this.scaleAnimation = 0;
        this.isActive = false;
        this.effect = 'normal';
        
        // Animation properties
        this.initialScale = 0;
        this.targetScale = 1;
        this.bounceHeight = 0;
        this.bounceSpeed = 0;
        this.pulsePeriod = 0;
        
        // Effect-specific properties
        this.sparkles = [];
        this.trails = [];
    }
    
    init(x, y, type, color, effect = 'normal') {
        this.reset();
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.effect = effect;
        this.createdAt = performance.now();
        this.isActive = true;
        
        // Set size based on shape type
        this.maxSize = randomBetween(CONFIG.shapes.minSize, CONFIG.shapes.maxSize);
        this.size = 0;
        
        // Set rotation properties
        this.rotation = randomBetween(0, Math.PI * 2);
        this.rotationSpeed = randomBetween(-0.005, 0.005);
        
        // Effect-specific initialization
        this.initEffect();
        
        debugLog(`Created ${type} shape at (${Math.round(x)}, ${Math.round(y)}) with effect: ${effect}`);
    }
    
    initEffect() {
        switch (this.effect) {
            case 'explosion':
                this.lifespan = CONFIG.shapes.animationDuration * 1.5;
                this.maxSize *= 1.5;
                this.rotationSpeed *= 1.5;
                break;
                
            case 'fireworks':
                this.lifespan = CONFIG.shapes.animationDuration * 2;
                this.maxSize *= 0.8;
                this.pulsePeriod = 500; // Pulse every 500ms
                break;
                
            case 'sparkle':
                this.lifespan = CONFIG.shapes.animationDuration * 1.2;
                this.initSparkles();
                break;
                
            case 'rainbow':
                this.lifespan = CONFIG.shapes.animationDuration * 1.3;
                this.maxSize *= 1.2;
                break;
                
            case 'star':
                this.bounceHeight = randomBetween(20, 40);
                this.bounceSpeed = randomBetween(0.05, 0.1);
                break;
        }
        
        this.fadeOutStart = this.lifespan - CONFIG.shapes.fadeOutDuration;
    }
    
    initSparkles() {
        const sparkleCount = randomIntBetween(5, 10);
        for (let i = 0; i < sparkleCount; i++) {
            this.sparkles.push({
                x: randomBetween(-this.maxSize * 0.5, this.maxSize * 0.5),
                y: randomBetween(-this.maxSize * 0.5, this.maxSize * 0.5),
                size: randomBetween(2, 6),
                rotation: randomBetween(0, Math.PI * 2),
                speed: randomBetween(0.005, 0.015)
            });
        }
    }
    
    update(deltaTime) {
        if (!this.isActive) return false;
        
        const now = performance.now();
        const age = now - this.createdAt;
        const progress = Math.min(age / this.lifespan, 1);
        
        // Update rotation
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Update size animation
        if (age < this.lifespan * 0.3) {
            // Growing phase - ease out for smooth growth
            const growProgress = age / (this.lifespan * 0.3);
            this.size = this.maxSize * easeOut(growProgress);
        } else {
            this.size = this.maxSize;
        }
        
        // Update effect-specific animations
        this.updateEffect(age, progress, deltaTime);
        
        // Check if shape should be destroyed
        if (progress >= 1) {
            this.isActive = false;
            return false;
        }
        
        return true;
    }
    
    updateEffect(age, progress, deltaTime) {
        switch (this.effect) {
            case 'explosion':
                // Explosive growth followed by fade
                if (progress < 0.2) {
                    this.size = this.maxSize * easeBounce(progress * 5);
                }
                break;
                
            case 'fireworks':
                // Pulsing effect
                if (this.pulsePeriod > 0) {
                    const pulsePhase = (age % this.pulsePeriod) / this.pulsePeriod;
                    const pulse = 1 + Math.sin(pulsePhase * Math.PI * 2) * 0.3;
                    this.size = this.maxSize * pulse;
                }
                break;
                
            case 'sparkle':
                // Update sparkles
                this.sparkles.forEach(sparkle => {
                    sparkle.rotation += sparkle.speed * deltaTime;
                });
                break;
                
            case 'rainbow':
                // Color cycling effect handled in render
                break;
                
            case 'star':
                // Bouncing effect
                if (this.bounceHeight > 0) {
                    const bouncePhase = Math.sin(age * this.bounceSpeed);
                    this.y += bouncePhase * this.bounceHeight * 0.01;
                }
                break;
        }
    }
    
    render(ctx, canvasWidth, canvasHeight) {
        if (!this.isActive) return;
        
        ctx.save();
        
        // Debug: draw a red dot at shape position for testing
        if (window.debugMode) {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
            ctx.fillStyle = 'white';
            ctx.fillText(`${Math.round(this.x)},${Math.round(this.y)}`, this.x + 5, this.y);
        }
        
        // Calculate alpha for fading
        const now = performance.now();
        const age = now - this.createdAt;
        let alpha = 1;
        
        if (age > this.fadeOutStart) {
            const fadeProgress = (age - this.fadeOutStart) / CONFIG.shapes.fadeOutDuration;
            alpha = 1 - easeOut(fadeProgress);
        }
        
        // Set alpha
        ctx.globalAlpha = alpha;
        
        // Move to shape position
        ctx.translate(this.x, this.y);
        
        // Apply rotation
        ctx.rotate(this.rotation);
        
        // Set color (with effect modifications)
        let color = this.color;
        if (this.effect === 'rainbow') {
            color = this.getRainbowColor(age);
        }
        
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        
        // Render shape based on type
        this.renderShapeType(ctx);
        
        // Render effect overlays
        this.renderEffects(ctx, alpha);
        
        ctx.restore();
    }
    
    renderShapeType(ctx) {
        const halfSize = this.size / 2;
        
        switch (this.type) {
            case 'circle':
                this.renderCircle(ctx, halfSize);
                break;
                
            case 'square':
                this.renderSquare(ctx, halfSize);
                break;
                
            case 'triangle':
                this.renderTriangle(ctx, halfSize);
                break;
                
            case 'star':
                this.renderStar(ctx, halfSize);
                break;
                
            case 'heart':
                this.renderHeart(ctx, halfSize);
                break;
                
            default:
                this.renderCircle(ctx, halfSize);
        }
    }
    
    renderCircle(ctx, radius) {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    renderSquare(ctx, halfSize) {
        ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
        ctx.strokeRect(-halfSize, -halfSize, this.size, this.size);
    }
    
    renderTriangle(ctx, halfSize) {
        ctx.beginPath();
        ctx.moveTo(0, -halfSize);
        ctx.lineTo(-halfSize, halfSize);
        ctx.lineTo(halfSize, halfSize);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    renderStar(ctx, halfSize) {
        const spikes = 5;
        const outerRadius = halfSize;
        const innerRadius = halfSize * 0.4;
        
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
        ctx.stroke();
    }
    
    renderHeart(ctx, halfSize) {
        const size = halfSize * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);
        
        // Left curve
        ctx.bezierCurveTo(-size, -size * 0.3, -size, size * 0.3, 0, size);
        
        // Right curve  
        ctx.bezierCurveTo(size, size * 0.3, size, -size * 0.3, 0, size * 0.3);
        
        ctx.fill();
        ctx.stroke();
    }
    
    renderEffects(ctx, alpha) {
        switch (this.effect) {
            case 'sparkle':
                this.renderSparkles(ctx, alpha);
                break;
                
            case 'explosion':
                this.renderExplosionRays(ctx, alpha);
                break;
                
            case 'fireworks':
                this.renderFireworks(ctx, alpha);
                break;
        }
    }
    
    renderSparkles(ctx, alpha) {
        ctx.globalAlpha = alpha * 0.8;
        this.sparkles.forEach(sparkle => {
            ctx.save();
            ctx.translate(sparkle.x, sparkle.y);
            ctx.rotate(sparkle.rotation);
            
            ctx.fillStyle = '#FFD700'; // Gold color
            ctx.beginPath();
            ctx.moveTo(0, -sparkle.size);
            ctx.lineTo(sparkle.size * 0.3, 0);
            ctx.lineTo(0, sparkle.size);
            ctx.lineTo(-sparkle.size * 0.3, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    renderExplosionRays(ctx, alpha) {
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        
        const rayCount = 8;
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const startX = Math.cos(angle) * this.size * 0.6;
            const startY = Math.sin(angle) * this.size * 0.6;
            const endX = Math.cos(angle) * this.size * 1.2;
            const endY = Math.sin(angle) * this.size * 1.2;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }
    
    renderFireworks(ctx, alpha) {
        ctx.globalAlpha = alpha * 0.7;
        
        // Draw small circles around the main shape
        const particleCount = 6;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = this.size * 0.8;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    getRainbowColor(age) {
        const hue = (age / 50) % 360; // Cycle through hues
        return `hsl(${hue}, 70%, 60%)`;
    }
}

/**
 * Shape Manager class
 */
export class ShapeManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.shapes = [];
        this.shapePool = new ObjectPool(
            () => new Shape(),
            (shape) => shape.reset(),
            10
        );
        
        debugLog('Shape manager initialized');
    }
    
    createShape(keyInfo) {
        // Use CSS dimensions for positioning, not canvas dimensions
        const rect = this.canvas.getBoundingClientRect();
        const position = getRandomPosition(
            rect.width, 
            rect.height, 
            CONFIG.shapes.maxSize
        );
        
        debugLog(`Creating shape at (${Math.round(position.x)}, ${Math.round(position.y)}) in canvas ${Math.round(rect.width)}x${Math.round(rect.height)}`);
        
        const shape = this.shapePool.get();
        const shapeType = this.getShapeType(keyInfo);
        const color = getRandomColor();
        const effect = keyInfo.effect || 'normal';
        
        shape.init(position.x, position.y, shapeType, color, effect);
        this.shapes.push(shape);
        
        // Limit active shapes for performance
        if (this.shapes.length > CONFIG.shapes.maxActiveShapes) {
            const oldShape = this.shapes.shift();
            this.shapePool.release(oldShape);
        }
        
        return shape;
    }
    
    getShapeType(keyInfo) {
        // Choose shape based on key type with better variety
        switch (keyInfo.type) {
            case 'letter':
                // Different shapes for different letters to add variety
                const letterIndex = keyInfo.character.toLowerCase().charCodeAt(0) - 97; // a=0, b=1, etc.
                if (keyInfo.character === keyInfo.character.toUpperCase()) {
                    return 'star'; // Uppercase letters get stars
                } else {
                    // Distribute lowercase letters across all shape types
                    return CONFIG.shapes.types[letterIndex % CONFIG.shapes.types.length];
                }
            case 'number':
                // Use the number value to pick shape
                const num = parseInt(keyInfo.character) || 0;
                return CONFIG.shapes.types[num % CONFIG.shapes.types.length];
            case 'space':
                return 'heart'; // Make space special with hearts
            case 'enter':
                return 'star'; // Enter gets stars
            case 'arrow':
                return 'triangle';
            default:
                // Random selection for other keys - this gives much better variety
                return CONFIG.shapes.types[
                    Math.floor(Math.random() * CONFIG.shapes.types.length)
                ];
        }
    }
    
    update(deltaTime) {
        // Update all active shapes
        this.shapes = this.shapes.filter(shape => {
            const isActive = shape.update(deltaTime);
            if (!isActive) {
                this.shapePool.release(shape);
            }
            return isActive;
        });
    }
    
    render() {
        // Render all shapes
        this.shapes.forEach(shape => {
            shape.render(this.ctx, this.canvas.width, this.canvas.height);
        });
    }
    
    clear() {
        // Return all shapes to pool and clear array
        this.shapes.forEach(shape => {
            this.shapePool.release(shape);
        });
        this.shapes.length = 0;
        
        debugLog('All shapes cleared');
    }
    
    getActiveShapeCount() {
        return this.shapes.length;
    }
    
    resize(width, height) {
        // Just log the resize - canvas reference is maintained by main controller
        debugLog(`Shape manager notified of resize to ${width}x${height}`);
    }
}