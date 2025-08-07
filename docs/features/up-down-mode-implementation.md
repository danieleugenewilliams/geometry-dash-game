# Up-Down Mode Implementation Plan

## Overview
This document outlines the implementation of a new up-down mode where the player can toggle between ground and ceiling positions using the space bar. The player enters this mode through green portals and must avoid obstacles (spikes) that can appear on either surface.

## Current Codebase Analysis

### Existing Architecture
- **Game States**: `'NORMAL'`, `'PORTAL_TRANSITION'`, `'FLYING'`, `'PORTAL_EXIT'`
- **Portal System**: Blue/purple portals that trigger flying mode transformation
- **Level System**: JSON-based timeline events with actions like `spawnPortal`, `spawnCoin`, etc.
- **Physics**: Ground-based gravity system + flying mode with thrust controls
- **Collision Detection**: Rectangle-based collision system for all game objects

### Current Game Elements
- **Portals**: Blue/purple swirling circles that transform player to jet mode
- **Obstacles**: Spikes (ground), Asteroids (flying mode), Stairs
- **Collectibles**: Coins, Orange Orbs (invincibility), Green Orbs (super invincibility)
- **Player Forms**: Square (normal) → Jet (flying mode)

## Up-Down Mode Design

### 1. New Game Architecture

**New Game States to Add:**
- `'UP_DOWN_MODE'` - The main up-down gameplay state
- `'GREEN_PORTAL_TRANSITION'` - Transition into up-down mode
- `'UP_DOWN_EXIT'` - Transition back to normal mode

**New Portal Type:**
- Green portals that trigger up-down mode (similar to current blue portals for flying)

### 2. Up-Down Mode Mechanics

**Core Gameplay:**
- Player sprite can stick to either ground (bottom) or ceiling (top)
- Space bar toggles between ground and ceiling positions
- Smooth transition animation between positions (0.5-1 second)
- Obstacles (spikes) randomly spawn on either ground or ceiling
- Player must toggle to avoid obstacles

**Physics System:**
- **Position States**: `'GROUND'`, `'CEILING'`, `'TRANSITIONING'`
- **Toggle Mechanism**: Space key press initiates position swap
- **Transition**: Smooth arc movement between ground and ceiling
- **Speed**: Constant horizontal movement (same as normal mode)

### 3. Visual Design

**Player Sprite:**
- **Ground Mode**: Normal blue square (existing)
- **Ceiling Mode**: Inverted/rotated blue square or different color (red/orange)
- **Transition**: Rotation animation during swap

**Obstacles:**
- **Ceiling Spikes**: Upside-down spikes hanging from ceiling
- **Ground Spikes**: Normal spikes on ground (existing)
- **Random Placement**: Each spike randomly assigned to ground or ceiling

**Environment:**
- **Ceiling Line**: Visual indicator of ceiling boundary
- **Transition Arc**: Visual trail showing player movement path

### 4. Level Schema Extensions

**New Actions for Timeline:**
```json
{
  "action": "spawnGreenPortal",
  "params": { "x": 2400, "y": 230 }
},
{
  "action": "spawnCeilingSpike", 
  "params": { "x": 800, "y": 50 }
},
{
  "action": "spawnGroundSpike",
  "params": { "x": 900, "y": 330 }
}
```

**New Config Section:**
```json
"upDownModeConfig": {
  "duration": 25000,
  "transitionTime": 800,
  "spikeSpawnRate": 0.02,
  "coinSpawnRate": 0.015,
  "groundCeilingRatio": 0.5
}
```

## Implementation Plan & TODO

### Phase 1: Core Mechanics (2-3 hours)
1. **Add new game states** to existing state machine
2. **Create green portal system** (copy/modify existing portal logic)
3. **Implement up-down position tracking** (`playerPosition: 'GROUND'|'CEILING'|'TRANSITIONING'`)
4. **Add space key toggle logic** for position switching
5. **Create smooth transition animation** between ground/ceiling

### Phase 2: Obstacle System (2-3 hours)
1. **Create ceiling spike objects** (modify existing spike logic)
2. **Add random spike placement** (ground vs ceiling assignment)
3. **Implement ceiling collision detection**
4. **Update existing collision system** for up-down mode
5. **Add ceiling boundary physics**

### Phase 3: Visual Polish (1-2 hours)
1. **Design ceiling spike sprites** (upside-down spikes)
2. **Add player rotation animation** during transitions
3. **Create ceiling visual indicator**
4. **Add transition trail effects**
5. **Update HUD** for up-down mode indication

### Phase 4: Level Design (1 hour)
1. **Create level-4.json** with up-down mode progression
2. **Design obstacle patterns** that require strategic toggling
3. **Balance difficulty curve** from ground → up-down → back to ground
4. **Add coin placement** that rewards good timing

### Phase 5: Schema & Integration (30 mins)
1. **Update schema.json** with new actions and config
2. **Add level loader support** for green portals
3. **Test level progression** and state transitions

## Level 4 Design Concept

**"Toggle Challenge" - Level 4**
- **Duration**: 50 seconds
- **Progression**: 
  - 0-15s: Normal ground mode with regular obstacles
  - 15-40s: Up-down mode with increasing spike frequency
  - 40-50s: Return to normal mode with final challenge
- **Difficulty**: Medium-Hard
- **Victory**: Survive 50 seconds

**Key Challenges:**
- Learn toggle timing with simple patterns
- Navigate complex ceiling/ground spike combinations
- Quick reactions to random spike placements
- Strategic coin collection requiring position switches

## Technical Considerations

**Collision Detection:**
- Ceiling spikes: `y = 0` to `y = 50` (top area)
- Player ceiling position: `y = 50` (bottom of ceiling area)
- Transition path: Bezier curve or arc between positions

**Performance:**
- Reuse existing collision detection functions
- Minimal new rendering code (just rotated/repositioned sprites)
- Efficient state machine with clear transitions

**Testing Strategy:**
- Start with basic toggle functionality
- Add obstacles gradually
- Test edge cases (multiple rapid toggles, collision during transition)
- Ensure smooth integration with existing level system

## Implementation Files to Modify

1. **index.html** - Main game logic, state machine, collision detection
2. **levels/schema.json** - Add new action types and config options
3. **levels/level-4.json** - New level design file
4. **docs/** - Update documentation

## Key Variables and Functions to Add

**New Variables:**
- `playerPosition` - Current position state
- `transitionTimer` - Animation timing
- `upDownModeTimer` - Mode duration tracking
- `greenPortals` - Array of green portal objects
- `ceilingSpikes` - Array of ceiling spike objects

**New Functions:**
- `spawnGreenPortal()` - Create green portal
- `updateUpDownMode()` - Handle up-down physics
- `togglePlayerPosition()` - Switch between ground/ceiling
- `updateGreenPortals()` - Manage green portal lifecycle
- `drawCeilingSpike()` - Render upside-down spikes
- `checkCeilingCollision()` - Ceiling-specific collision detection

This implementation plan provides a comprehensive roadmap for adding the up-down mode while maintaining consistency with the existing codebase architecture.
