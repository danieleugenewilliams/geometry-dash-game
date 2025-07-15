# 🚀 Portal & Flying Mechanics - Detailed Design Plan

## Current Game Analysis
The game currently has:
- Blue square player that jumps over spikes and stairs
- Gravity-based physics with ground collision
- Score system that increases over time
- Auto-replay and pause features

## Detailed Design Specifications

### 1. Portal System Design
**Portal Appearance:** 
- Portal spawns every 30 seconds of gameplay
- Visual: Swirling purple/blue circle with animated particles
- Position: Center-right of screen, slightly above ground
- Size: 80x80 pixels with animated rotation

**Portal Entry:**
- Player automatically enters when touching portal
- Brief transformation animation (0.5 seconds)
- Screen transition effect (fade or zoom)

### 2. Jet Sprite & Animation
**Jet Design:**
- Triangular spacecraft shape (wider at back, pointed front)
- Colors: Silver body with blue flames/exhaust
- Size: 40x20 pixels (wider than original square)
- Animation: Pulsing exhaust flames, slight rotation when moving up/down

### 3. Flying Physics System
**Movement Controls:**
- **Space Key Held:** Continuous upward thrust (acceleration-based)
- **Space Key Released:** Gradual fall with air resistance
- **Vertical Boundaries:** Top/bottom screen limits with soft bounce
- **Horizontal:** Constant forward movement (same speed as ground mode)

**Physics Constants:**
- Thrust force: -12 (upward acceleration)
- Fall gravity: 0.4 (slower than ground gravity)
- Air resistance: 0.9 (velocity dampening)
- Max vertical speed: ±8

### 4. Asteroid Obstacles
**Appearance:**
- Gray/brown rocky textures with irregular shapes
- Sizes: Small (30x30), Medium (50x50), Large (70x70)
- Floating at various heights (20% - 80% of screen height)
- Slow rotation animation for visual appeal

**Generation Pattern:**
- Spawn every 100-200 pixels horizontally
- Random vertical positions avoiding player spawn area
- Mix of sizes and heights for varied difficulty
- Move left at same speed as ground obstacles

### 5. Game State Management
**States:**
- `NORMAL`: Standard ground-based gameplay
- `PORTAL_TRANSITION`: Brief transformation period
- `FLYING`: Portal/flying mode
- `PORTAL_EXIT`: Transition back to normal

**State Transitions:**
- Timer-based portal spawning (30s intervals)
- Automatic state switching on portal contact
- 30-second flying mode duration
- Smooth transitions between modes

### 6. Implementation Architecture

**New Variables Needed:**
```javascript
let gameState = 'NORMAL';
let portalTimer = 0;
let flyingTimer = 0;
let portals = [];
let asteroids = [];
let spaceKeyPressed = false;
let jetSprite = { /* jet properties */ };
```

**Key Functions to Add:**
- `updatePortalMode()` - Handle flying physics
- `generateAsteroids()` - Create floating obstacles  
- `drawJet()` - Render jet sprite
- `drawPortal()` - Render portal with animation
- `handlePortalTransition()` - Manage state changes

### 7. Enhanced Controls
**Space Key Behavior:**
- In normal mode: Single jump (current behavior)
- In flying mode: Continuous thrust while held
- Smooth transition between control schemes

**Visual Feedback:**
- Thrust particles when space is held
- Jet tilts slightly up/down based on movement
- Portal entry/exit effects

### 8. Technical Considerations
**Performance:**
- Efficient particle systems for portal/thrust effects
- Optimized collision detection for multiple asteroids
- Smooth frame rate during transitions

**User Experience:**
- Clear visual indicators for portal availability
- Intuitive flying controls with good "feel"
- Balanced difficulty curve in both modes

## Implementation Priority
1. **Core Systems:** Game state management, portal spawning
2. **Flying Mechanics:** Physics, controls, jet sprite
3. **Obstacles:** Asteroid generation and collision
4. **Polish:** Visual effects, animations, transitions

This design creates an engaging dual-mode gameplay experience that significantly expands the original game while maintaining its core appeal. The 30-second cycles create natural rhythm and anticipation for players.

## Todo List
- [ ] Design portal appearance timing and mechanics
- [ ] Create jet sprite graphics and animation
- [ ] Design flying physics and controls
- [ ] Design floating asteroid obstacles
- [ ] Implement game state management (normal/portal)
- [ ] Implement portal spawning every 30 seconds
- [ ] Implement sprite transformation to jet
- [ ] Implement space key flying controls
- [ ] Implement floating asteroid generation
- [ ] Implement portal exit after 30 seconds
- [ ] Test complete portal system integration