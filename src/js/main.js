        /**
 * Main Application Controller for Baby Keyboard Smashing Game
 * Coordinates all systems and manages game state
 */

import { KeyboardHandler } from './keyboard.js';
import { ShapeManager } from './shapes.js';
import { ParticleSystem } from './particles.js';
import { SoundManager } from './sounds.js';
import { 
    CONFIG, 
    PerformanceMonitor, 
    debugLog, 
    announceToScreenReader,
    debounce,
    isTouchDevice 
} from './utils.js';

class BabyKeyboardGame {
    constructor() {
        // Game state
        this.isInitialized = false;
        this.isRunning = false;
        this.isPaused = false;
        this.gameStartTime = 0;
        
        // DOM elements
        this.canvas = null;
        this.ctx = null;
        this.loadingScreen = null;
        this.startScreen = null;
        this.gameContainer = null;
        this.parentControls = null;
        this.soundStatus = null;
        this.fullscreenBtn = null;
        
        // Game systems
        this.keyboardHandler = null;
        this.shapeManager = null;
        this.particleSystem = null;
        this.soundManager = null;
        this.performanceMonitor = new PerformanceMonitor();
        
        // Animation
        this.animationId = null;
        this.lastFrameTime = 0;
        
        // Statistics
        this.stats = {
            totalKeyPresses: 0,
            totalPlayTime: 0,
            shapesCreated: 0,
            particlesCreated: 0,
            soundsPlayed: 0
        };
        
        // Debug mode toggle (press D key when game is running)
        window.debugMode = false;
        
        // Accessibility settings
        this.accessibilitySettings = {
            highContrast: false,
            reducedMotion: false,
            soundEnabled: true
        };
        
        this.init();
    }
    
    async init() {
        try {
            debugLog('Initializing Baby Keyboard Game...');
            
            // Initialize DOM elements
            this.initDOMElements();
            
            // Initialize canvas
            this.initCanvas();
            
            // Initialize game systems
            await this.initGameSystems();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Handle initial screen state
            this.showStartScreen();
            
            this.isInitialized = true;
            
            debugLog('Game initialization complete');
            announceToScreenReader('Baby Keyboard Game loaded and ready to play!');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to load the game. Please refresh the page.');
        }
    }
    
    initDOMElements() {
        this.canvas = document.getElementById('gameCanvas');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.startScreen = document.getElementById('startScreen');
        this.gameContainer = document.getElementById('gameContainer');
        this.parentControls = document.getElementById('parentControls');
        this.soundStatus = document.getElementById('soundStatus');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        
        if (!this.canvas) {
            throw new Error('Game canvas not found');
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        debugLog('DOM elements initialized');
    }
    
    initCanvas() {
        // Set canvas size to match viewport
        this.resizeCanvas();
        
        // Set canvas properties for optimal rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        debugLog(`Canvas initialized at ${this.canvas.width}x${this.canvas.height}`);
    }
    
    async initGameSystems() {
        // Initialize keyboard handler
        this.keyboardHandler = new KeyboardHandler();
        this.keyboardHandler.setOnKeyPress(this.handleKeyPress.bind(this));
        this.keyboardHandler.setOnParentControl(this.handleParentControl.bind(this));
        
        // Initialize shape manager
        this.shapeManager = new ShapeManager(this.canvas);
        
        // Initialize particle system
        this.particleSystem = new ParticleSystem(this.canvas);
        
        // Initialize sound manager
        this.soundManager = new SoundManager();
        await this.soundManager.init();
        
        debugLog('Game systems initialized');
    }
    
    setupEventListeners() {
        // Window events
        window.addEventListener('resize', debounce(this.handleResize.bind(this), 250));
        window.addEventListener('orientationchange', debounce(this.handleOrientationChange.bind(this), 500));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // Visibility API for pause/resume
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Mobile-specific events
        if (isTouchDevice()) {
            // Prevent iOS Safari bounce scrolling
            document.addEventListener('touchmove', this.preventBounceScroll.bind(this), { passive: false });
            // Handle iOS viewport changes
            window.addEventListener('resize', debounce(this.handleMobileResize.bind(this), 100));
        }
        
        // Global keyboard listener for start screen
        document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
        
        // Start button
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.addEventListener('click', this.startGame.bind(this));
        }
        
        // Parent control buttons
        this.setupParentControlButtons();
        
        // Fullscreen button
        if (this.fullscreenBtn) {
            this.fullscreenBtn.addEventListener('click', this.toggleFullscreen.bind(this));
        }
        
        // Accessibility controls
        this.setupAccessibilityControls();
        
        // Touch device considerations
        if (isTouchDevice()) {
            document.addEventListener('touchstart', this.handleFirstTouch.bind(this), { once: true });
        }
        
        debugLog('Event listeners set up');
    }
    
    setupParentControlButtons() {
        const toggleSoundBtn = document.getElementById('toggleSound');
        const clearScreenBtn = document.getElementById('clearScreen');
        const exitGameBtn = document.getElementById('exitGame');
        
        if (toggleSoundBtn) {
            toggleSoundBtn.addEventListener('click', () => this.handleParentControl('toggleSound'));
        }
        
        if (clearScreenBtn) {
            clearScreenBtn.addEventListener('click', () => this.handleParentControl('clearScreen'));
        }
        
        if (exitGameBtn) {
            exitGameBtn.addEventListener('click', () => this.handleParentControl('exit'));
        }
    }
    
    handleGlobalKeydown(event) {
        // Handle space key on start screen
        if (event.code === 'Space' && this.startScreen && !this.startScreen.classList.contains('hidden') && !this.isRunning) {
            event.preventDefault();
            event.stopPropagation();
            
            // Start the game when space is pressed
            this.startGame();
            
            debugLog('Game started with Space key');
            announceToScreenReader('Game started! Press keys to create shapes!');
            return;
        }
        
        // Accessibility shortcuts (work in any screen)
        if (event.altKey) {
            switch (event.code) {
                case 'KeyC':
                    event.preventDefault();
                    this.toggleHighContrast();
                    break;
                case 'KeyM':
                    event.preventDefault();
                    this.toggleReducedMotion();
                    break;
                case 'KeyA':
                    event.preventDefault();
                    this.toggleAccessibilityPanel();
                    break;
            }
        }
        
        // ESC key to show/hide accessibility controls
        if (event.code === 'Escape' && !event.ctrlKey && !event.shiftKey) {
            this.toggleAccessibilityPanel();
        }
    }
    
    handleFirstTouch() {
        // Enable audio on first touch for mobile devices
        debugLog('First touch detected, enabling audio context');
        announceToScreenReader('Touch detected. Audio is now enabled!');
    }
    
    handleOrientationChange() {
        // Handle device orientation changes
        setTimeout(() => {
            this.handleResize();
            debugLog(`Orientation changed to: ${window.orientation || screen.orientation?.angle || 'unknown'}`);
        }, 100);
    }
    
    handleMobileResize() {
        // Handle iOS Safari viewport changes when keyboard appears/disappears
        if (window.visualViewport) {
            const viewport = window.visualViewport;
            this.canvas.style.height = `${viewport.height}px`;
            this.resizeCanvas();
        }
    }
    
    preventBounceScroll(event) {
        // Prevent iOS Safari bounce scrolling
        if (event.target === document.body) {
            event.preventDefault();
        }
    }
    
    setupAccessibilityControls() {
        const highContrastBtn = document.getElementById('toggleHighContrast');
        const reducedMotionBtn = document.getElementById('toggleReducedMotion');
        const accessibilityPanelBtn = document.getElementById('toggleAccessibilityPanel');
        
        if (highContrastBtn) {
            highContrastBtn.addEventListener('click', this.toggleHighContrast.bind(this));
        }
        
        if (reducedMotionBtn) {
            reducedMotionBtn.addEventListener('click', this.toggleReducedMotion.bind(this));
        }
        
        if (accessibilityPanelBtn) {
            accessibilityPanelBtn.addEventListener('click', this.toggleAccessibilityPanel.bind(this));
        }
        
        // Check for system preferences
        this.checkSystemAccessibilityPreferences();
    }
    
    checkSystemAccessibilityPreferences() {
        // Check for system high contrast preference
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            this.toggleHighContrast(true);
        }
        
        // Check for system reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.toggleReducedMotion(true);
        }
    }
    
    toggleHighContrast(force = null) {
        this.accessibilitySettings.highContrast = force !== null ? force : !this.accessibilitySettings.highContrast;
        
        if (this.accessibilitySettings.highContrast) {
            document.body.classList.add('high-contrast');
            announceToScreenReader('High contrast mode enabled');
        } else {
            document.body.classList.remove('high-contrast');
            announceToScreenReader('High contrast mode disabled');
        }
        
        debugLog(`High contrast: ${this.accessibilitySettings.highContrast ? 'ON' : 'OFF'}`);
    }
    
    toggleReducedMotion(force = null) {
        this.accessibilitySettings.reducedMotion = force !== null ? force : !this.accessibilitySettings.reducedMotion;
        
        if (this.accessibilitySettings.reducedMotion) {
            document.body.classList.add('reduced-motion');
            announceToScreenReader('Reduced motion enabled');
        } else {
            document.body.classList.remove('reduced-motion');
            announceToScreenReader('Reduced motion disabled');
        }
        
        debugLog(`Reduced motion: ${this.accessibilitySettings.reducedMotion ? 'ON' : 'OFF'}`);
    }
    
    toggleAccessibilityPanel() {
        const panel = document.getElementById('accessibilityControls');
        if (panel) {
            const isHidden = panel.classList.contains('hidden');
            if (isHidden) {
                panel.classList.remove('hidden');
                announceToScreenReader('Accessibility controls shown');
            } else {
                panel.classList.add('hidden');
                announceToScreenReader('Accessibility controls hidden');
            }
        }
    }
    
    showStartScreen() {
        this.hideLoadingScreen();
        this.startScreen?.classList.remove('hidden');
        this.gameContainer?.classList.add('hidden');
        
        // Play welcome sound
        setTimeout(() => {
            this.soundManager?.playWelcomeSound();
        }, 500);
        
        debugLog('Showing start screen');
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    startGame() {
        if (!this.isInitialized) {
            debugLog('Game not initialized yet');
            return;
        }
        
        this.isRunning = true;
        this.gameStartTime = performance.now();
        
        // Hide start screen and show game
        this.startScreen?.classList.add('hidden');
        this.gameContainer?.classList.remove('hidden');
        
        // Activate keyboard handler
        this.keyboardHandler.setGameActive(true);
        
        // Start game loop
        this.startGameLoop();
        
        // Update sound status
        this.updateSoundStatus();
        
        // Enter fullscreen on mobile if possible
        if (isTouchDevice()) {
            setTimeout(() => {
                this.requestFullscreen();
            }, 100);
        }
        
        debugLog('Game started');
        announceToScreenReader('Game started! Press any key to create colorful shapes and sounds!');
    }
    
    startGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const gameLoop = (currentTime) => {
            if (!this.isRunning || this.isPaused) {
                this.animationId = requestAnimationFrame(gameLoop);
                return;
            }
            
            const deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;
            
            // Update performance monitor
            this.performanceMonitor.update();
            
            // Update game systems
            this.update(deltaTime);
            
            // Render everything
            this.render();
            
            // Continue loop
            this.animationId = requestAnimationFrame(gameLoop);
        };
        
        this.animationId = requestAnimationFrame(gameLoop);
        debugLog('Game loop started');
    }
    
    update(deltaTime) {
        // Update shapes
        this.shapeManager.update(deltaTime);
        
        // Update particles
        this.particleSystem.update(deltaTime);
        
        // Update statistics
        this.updateStats();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render particles (behind shapes)
        this.particleSystem.render();
        
        // Render shapes
        this.shapeManager.render();
        
        // Render key displays
        this.renderKeyDisplays();
        
        // Render custom cursor
        this.renderCustomCursor();
        
        // Render debug info in development
        if (import.meta.env.DEV) {
            this.renderDebugInfo();
        }
    }
    
    renderKeyDisplays() {
        if (!this.keyDisplays || this.keyDisplays.length === 0) return;
        
        const now = performance.now();
        
        // Update and render each key display
        this.keyDisplays = this.keyDisplays.filter(display => {
            const age = now - display.createdAt;
            const progress = age / display.lifespan;
            
            if (progress >= 1) return false; // Remove expired displays
            
            // Animate scale and alpha
            if (progress < 0.2) {
                display.scale = display.maxScale * (progress / 0.2);
            } else if (progress > 0.8) {
                const fadeProgress = (progress - 0.8) / 0.2;
                display.alpha = 1 - fadeProgress;
            }
            
            // Animate upward movement
            display.y -= 0.5;
            
            // Render the key text
            this.ctx.save();
            this.ctx.globalAlpha = display.alpha;
            this.ctx.fillStyle = display.color;
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.font = `bold ${24 * display.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Add text stroke for better visibility
            this.ctx.strokeText(display.text, display.x, display.y);
            this.ctx.fillText(display.text, display.x, display.y);
            
            this.ctx.restore();
            
            return true;
        });
    }
    
    renderCustomCursor() {
        // Get mouse position from particle system
        const mouseX = this.particleSystem.mouseX;
        const mouseY = this.particleSystem.mouseY;
        
        if (mouseX === 0 && mouseY === 0) return; // No mouse movement yet
        
        this.ctx.save();
        
        // Draw a colorful cursor
        const time = performance.now() * 0.005;
        const hue = (time * 50) % 360;
        const size = 12 + Math.sin(time * 2) * 3;
        
        this.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        
        // Draw cursor as a star shape
        this.ctx.translate(mouseX, mouseY);
        
        const spikes = 6;
        const outerRadius = size;
        const innerRadius = size * 0.4;
        
        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    renderDebugInfo() {
        const fps = this.performanceMonitor.getFPS();
        const activeShapes = this.shapeManager.getActiveShapeCount();
        const activeParticles = this.particleSystem.getActiveParticleCount();
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${fps}`, 10, 20);
        this.ctx.fillText(`Shapes: ${activeShapes}`, 10, 35);
        this.ctx.fillText(`Particles: ${activeParticles}`, 10, 50);
        this.ctx.fillText(`Keys: ${this.stats.totalKeyPresses}`, 10, 65);
        this.ctx.fillText(`Canvas: ${this.canvas.width}x${this.canvas.height}`, 10, 80);
        this.ctx.fillText(`CSS: ${Math.round(this.canvas.getBoundingClientRect().width)}x${Math.round(this.canvas.getBoundingClientRect().height)}`, 10, 95);
        this.ctx.restore();
    }
    
    handleKeyPress(keyInfo) {
        if (!this.isRunning) return;
        
        // Always create a shape - ensure it's responsive
        const shape = this.shapeManager.createShape(keyInfo);
        if (shape) {
            this.stats.shapesCreated++;
            
            // Display the key that was pressed
            this.displayKeyFeedback(keyInfo, shape);
            
            // Play sound
            this.soundManager.playKeySound(keyInfo);
            this.stats.soundsPlayed++;
            
            // Create particle burst for special effects
            if (keyInfo.effect === 'explosion' || keyInfo.effect === 'fireworks') {
                this.particleSystem.createBurst(
                    shape.x, 
                    shape.y,
                    keyInfo.effect === 'explosion' ? 15 : 10
                );
            }
            
            // Update statistics
            this.stats.totalKeyPresses++;
            
            debugLog(`Key processed: ${keyInfo.key} (${keyInfo.type}, ${keyInfo.effect})`);
        }
    }
    
    displayKeyFeedback(keyInfo, shape) {
        // Create floating text to show which key was pressed
        const keyText = keyInfo.key.length === 1 ? keyInfo.key.toUpperCase() : keyInfo.code.replace('Key', '');
        
        // Store key display info for rendering
        if (!this.keyDisplays) {
            this.keyDisplays = [];
        }
        
        this.keyDisplays.push({
            text: keyText,
            x: shape.x,
            y: shape.y - 30,
            alpha: 1,
            scale: 0,
            maxScale: 1.2,
            createdAt: performance.now(),
            lifespan: 1500,
            color: shape.color || '#FFFFFF'
        });
        
        // Limit number of key displays
        if (this.keyDisplays.length > 10) {
            this.keyDisplays.shift();
        }
    }
    
    handleParentControl(action, event) {
        debugLog(`Parent control: ${action}`);
        
        switch (action) {
            case 'exit':
                this.exitGame();
                break;
                
            case 'toggleSound':
                this.toggleSound();
                break;
                
            case 'clearScreen':
                this.clearScreen();
                break;
                
            case 'showControls':
                this.toggleParentControls();
                break;
                
            default:
                debugLog(`Unknown parent control: ${action}`);
        }
    }
    
    toggleSound() {
        const isEnabled = this.soundManager.toggleMute();
        this.updateSoundStatus();
        
        const message = isEnabled ? 'Sound enabled' : 'Sound muted';
        announceToScreenReader(message);
        debugLog(message);
    }
    
    clearScreen() {
        this.shapeManager.clear();
        this.particleSystem.clear();
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        announceToScreenReader('Screen cleared');
        debugLog('Screen cleared');
    }
    
    toggleParentControls() {
        if (this.parentControls) {
            this.parentControls.classList.toggle('hidden');
            
            const isVisible = !this.parentControls.classList.contains('hidden');
            if (isVisible) {
                // Pause game while controls are shown
                this.isPaused = true;
                announceToScreenReader('Parent controls opened. Game paused.');
            } else {
                // Resume game
                this.isPaused = false;
                announceToScreenReader('Parent controls closed. Game resumed.');
            }
        }
    }
    
    exitGame() {
        this.isRunning = false;
        this.keyboardHandler.setGameActive(false);
        
        // Stop animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clear everything
        this.clearScreen();
        
        // Show start screen
        this.gameContainer?.classList.add('hidden');
        this.parentControls?.classList.add('hidden');
        this.startScreen?.classList.remove('hidden');
        
        // Exit fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {
                debugLog('Could not exit fullscreen');
            });
        }
        
        // Reset statistics
        this.resetStats();
        
        announceToScreenReader('Game ended. Returning to start screen.');
        debugLog('Game exited');
    }
    
    updateSoundStatus() {
        if (this.soundStatus) {
            const icon = this.soundStatus.querySelector('#soundIcon');
            const isEnabled = this.soundManager.isAudioEnabled();
            
            if (icon) {
                icon.textContent = isEnabled ? '🔊' : '🔇';
            }
            
            this.soundStatus.classList.toggle('muted', !isEnabled);
        }
    }
    
    handleResize() {
        this.resizeCanvas();
        
        // Update system references
        this.shapeManager?.resize(this.canvas.width, this.canvas.height);
        this.particleSystem?.resize(this.canvas.width, this.canvas.height);
        
        debugLog(`Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        // Set CSS size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            this.isPaused = true;
            debugLog('Game paused - tab not visible');
        } else if (this.isRunning) {
            this.isPaused = false;
            debugLog('Game resumed - tab visible');
        }
    }
    
    handleBeforeUnload(event) {
        if (this.isRunning) {
            // Ask for confirmation before leaving
            event.preventDefault();
            event.returnValue = '';
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.requestFullscreen();
        } else {
            document.exitFullscreen().catch(() => {
                debugLog('Could not exit fullscreen');
            });
        }
    }
    
    requestFullscreen() {
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
            element.requestFullscreen().catch(() => {
                debugLog('Could not enter fullscreen');
            });
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
    
    updateStats() {
        if (this.isRunning && this.gameStartTime > 0) {
            this.stats.totalPlayTime = performance.now() - this.gameStartTime;
        }
    }
    
    resetStats() {
        this.stats = {
            totalKeyPresses: 0,
            totalPlayTime: 0,
            shapesCreated: 0,
            particlesCreated: 0,
            soundsPlayed: 0
        };
        this.keyboardHandler?.resetStats();
    }
    
    getStats() {
        return {
            ...this.stats,
            performance: {
                fps: this.performanceMonitor.getFPS(),
                frameTime: this.performanceMonitor.getFrameTime(),
                activeShapes: this.shapeManager?.getActiveShapeCount() || 0,
                activeParticles: this.particleSystem?.getActiveParticleCount() || 0
            },
            audio: this.soundManager?.getStats() || {}
        };
    }
    
    showError(message) {
        debugLog(`Error: ${message}`);
        
        // Show error in loading screen
        if (this.loadingScreen) {
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <h2 style="color: #FF6B6B; margin-bottom: 1rem;">⚠️ Error</h2>
                <p style="color: white;">${message}</p>
                <button onclick="location.reload()" style="
                    background: #4ECDC4;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 10px;
                    font-size: 1rem;
                    margin-top: 1rem;
                    cursor: pointer;
                ">Reload Game</button>
            `;
            
            this.loadingScreen.innerHTML = '';
            this.loadingScreen.appendChild(errorDiv);
            this.loadingScreen.classList.remove('hidden');
        }
        
        announceToScreenReader(`Error: ${message}. Please reload the page.`);
    }
    
    destroy() {
        // Clean up everything
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.keyboardHandler?.destroy();
        this.particleSystem?.destroy();
        this.soundManager?.destroy();
        
        debugLog('Game destroyed');
    }
}

// Initialize game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.babyGame = new BabyKeyboardGame();
    });
} else {
    window.babyGame = new BabyKeyboardGame();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.babyGame) {
        window.babyGame.destroy();
    }
});

// Export for debugging
export default BabyKeyboardGame;