# AI Context File - Baby Keyboard Smashing Game

## Project Context
This document provides essential context for AI assistants working on the Baby Keyboard Smashing Game project. It includes technical decisions, code patterns, and project-specific guidelines.

## Project Structure
```
baby_keyboard_smaing_game/
├── src/
│   ├── index.html          # Main HTML file
│   ├── css/
│   │   ├── styles.css      # Main stylesheet
│   │   └── animations.css  # Animation-specific styles
│   ├── js/
│   │   ├── main.js         # Main application logic
│   │   ├── shapes.js       # Shape generation and animation
│   │   ├── sounds.js       # Audio management
│   │   ├── keyboard.js     # Keyboard input handling
│   │   └── utils.js        # Utility functions
│   └── assets/
│       ├── sounds/         # Audio files
│       └── images/         # Any image assets
├── docs/
│   ├── REQUIREMENTS.md     # Project requirements
│   └── AI_CONTEXT.md       # This file
├── tests/
│   └── (test files)
└── package.json            # Project dependencies
```

## Technical Architecture

### Core Technologies
- **HTML5**: Semantic markup, Canvas API for graphics
- **CSS3**: Flexbox/Grid layouts, CSS animations, custom properties
- **JavaScript ES6+**: Modular code with classes and modules
- **Web APIs**: Keyboard Events, Web Audio API, Fullscreen API

### Key Design Patterns

#### 1. Event-Driven Architecture
```javascript
// Use event listeners for all interactions
document.addEventListener('keydown', handleKeyPress);
window.addEventListener('resize', handleResize);
```

#### 2. Component-Based Structure
```javascript
// Each feature as a separate class/module
class ShapeRenderer {
  constructor(canvas) { /* ... */ }
  createShape(type, position) { /* ... */ }
}

class SoundManager {
  constructor() { /* ... */ }
  playSound(soundId) { /* ... */ }
}
```

#### 3. Configuration Object Pattern
```javascript
const CONFIG = {
  shapes: {
    types: ['circle', 'square', 'triangle', 'star'],
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    minSize: 50,
    maxSize: 150,
    animationDuration: 2000
  },
  audio: {
    volume: 0.7,
    sounds: ['note1', 'note2', 'chime', 'bell']
  }
};
```

## Code Style Guidelines

### JavaScript Conventions
- Use `const` and `let`, avoid `var`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Prefer async/await over Promise chains
- Use meaningful variable names suitable for baby-focused app

### CSS Conventions
- Use CSS custom properties for theming
- Mobile-first responsive design
- Use `rem` and `em` for scalable units
- Prefer CSS Grid and Flexbox for layouts
- Use CSS animations over JavaScript when possible

### HTML Conventions
- Semantic HTML5 elements
- Proper accessibility attributes
- Minimal DOM structure for performance

## Performance Considerations

### Critical Performance Areas
1. **Animation Performance**
   - Use `transform` and `opacity` for animations
   - Prefer CSS animations over JavaScript
   - Use `will-change` property carefully
   - Clean up animations and event listeners

2. **Memory Management**
   - Remove event listeners when not needed
   - Clean up canvas contexts
   - Limit number of simultaneous shapes
   - Use object pooling for frequently created objects

3. **Audio Performance**
   - Preload audio files
   - Use Web Audio API for low latency
   - Implement audio sprite technique if needed
   - Handle audio context suspension/resume

## Baby-Friendly Design Principles

### Visual Design
- **High Contrast**: Ensure shapes are easily visible
- **Large Elements**: Minimum touch target of 44px
- **Bright Colors**: Use vibrant, appealing colors
- **Smooth Motion**: 60fps animations, no jarring movements
- **Simple Shapes**: Geometric shapes babies can recognize

### Audio Design
- **Gentle Sounds**: No loud or harsh noises
- **Pleasant Tones**: Musical or nature-inspired sounds
- **Reasonable Volume**: Default to moderate levels
- **No Repetitive Loops**: Avoid sounds that could become annoying

### Interaction Design
- **Immediate Feedback**: <50ms response time
- **Any Key Response**: Every key should do something fun
- **No Wrong Moves**: Everything is a "correct" interaction
- **Forgiving Interface**: No way to break or get stuck

## Safety Implementation

### Security Measures
```javascript
// Prevent default browser shortcuts
document.addEventListener('keydown', (e) => {
  // Allow specific parent exit combinations
  if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
    exitGame();
    return;
  }
  
  // Prevent other system shortcuts
  e.preventDefault();
  handleGameInput(e);
});
```

### Parent Controls
- Exit game: `Ctrl + Shift + Escape`
- Toggle sound: `Ctrl + Shift + M`
- Clear screen: `Ctrl + Shift + C`

## Testing Strategy

### Manual Testing Checklist
- [ ] All keys produce visual feedback
- [ ] Audio plays without distortion
- [ ] Fullscreen mode works properly
- [ ] Parent exit mechanism functions
- [ ] Performance remains smooth during extended play
- [ ] No memory leaks after 10+ minutes of play

### Automated Testing Areas
- Key event handling
- Shape generation algorithms
- Audio playback functionality
- Performance benchmarks

## Common Pitfalls to Avoid

1. **Audio Context Issues**
   - Always handle autoplay policies
   - Resume audio context on user interaction
   - Provide fallbacks for audio failures

2. **Mobile Considerations**
   - Test on actual mobile devices
   - Handle screen orientation changes
   - Consider battery usage

3. **Accessibility Oversights**
   - Don't rely solely on color
   - Provide alternative feedback methods
   - Consider users with disabilities

## Development Commands

### Setup
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run test        # Run tests
```

### File Watching
```bash
npm run dev         # Auto-reload during development
```

## Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Dependencies to Consider
- **Development**: Vite, ESLint, Prettier
- **Runtime**: Minimal - prefer vanilla JavaScript
- **Audio**: Consider Howler.js if Web Audio API proves insufficient
- **Testing**: Jest, Playwright for E2E testing

## Deployment Notes
- Deploy as static site (Netlify, Vercel, GitHub Pages)
- Enable HTTPS for Web Audio API requirements
- Optimize assets for fast loading
- Consider PWA features for offline use

## Future Enhancement Ideas
- Theme system (space, ocean, farm animals)
- Simple drawing mode
- Photo backgrounds
- Multiple language sound packs
- Parent dashboard with play statistics

## Troubleshooting Common Issues

### Audio Not Playing
1. Check browser autoplay policies
2. Ensure audio context is resumed
3. Verify audio files are properly loaded
4. Check for CORS issues with audio files

### Performance Issues
1. Limit number of active animations
2. Use requestAnimationFrame for smooth updates
3. Implement shape pooling
4. Profile memory usage regularly

### Mobile Issues
1. Handle touch events alongside keyboard
2. Consider virtual keyboard behavior
3. Test fullscreen on various devices
4. Optimize for different screen sizes

This context file should be updated as the project evolves and new patterns or requirements emerge.