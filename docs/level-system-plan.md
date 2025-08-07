# Level System Implementation Plan

## Analysis of Current Game Mechanics

Based on my analysis, here are the key configurable elements that need to be defined in level files:

### **Core Game Elements to Configure:**

1. **Game Constants**
   - Player size, gravity, jump force, movement speed
   - Portal spawn intervals and flying duration
   - Flying physics (gravity, thrust, air resistance)
   - Invincibility durations and orb spawn intervals

2. **Obstacle Spawning**
   - Spikes: position, timing, spacing patterns
   - Stairs: height, width, position, timing
   - Asteroids: size, position, rotation speed, spawn zones

3. **Collectibles**
   - Coins: positions, spawn patterns, point values
   - Orange orbs: spawn positions, timing overrides
   - Green orbs: spawn positions, timing overrides

4. **Portal System**
   - Portal spawn timing and positions
   - Flying mode duration and triggers

5. **Level Progression**
   - Victory conditions (score thresholds, distance traveled)
   - Difficulty scaling parameters

## **Proposed Level File JSON Schema**

```json
{
  "levelId": "level-1",
  "name": "Easy Start",
  "description": "Introduction to basic jumping and coin collection",
  "difficulty": "easy",
  "duration": 60000,
  "victoryCondition": {
    "type": "survival",
    "target": 60000
  },
  "gameConstants": {
    "playerSize": 30,
    "gravity": 0.8,
    "jumpForce": -15,
    "moveSpeed": 5,
    "portalSpawnInterval": 30000,
    "flyingDuration": 30000,
    "invincibilityDuration": 5000,
    "superInvincibilityDuration": 8000,
    "orangeOrbInterval": 100,
    "greenOrbInterval": 1000
  },
  "timeline": [
    {
      "time": 0,
      "action": "spawnCoin",
      "params": { "x": 400, "y": 300, "points": 10 }
    },
    {
      "time": 5000,
      "action": "spawnSpike",
      "params": { "x": 600, "y": 330 }
    },
    {
      "time": 10000,
      "action": "spawnStair",
      "params": { "x": 800, "y": 280, "width": 60, "height": 70 }
    },
    {
      "time": 15000,
      "action": "spawnPortal",
      "params": { "x": 900, "y": 230 }
    }
  ],
  "patterns": {
    "coinRain": {
      "type": "repeating",
      "interval": 3000,
      "duration": 15000,
      "elements": [
        { "action": "spawnCoin", "params": { "x": 500, "y": 250 } },
        { "action": "spawnCoin", "params": { "x": 600, "y": 200 } },
        { "action": "spawnCoin", "params": { "x": 700, "y": 300 } }
      ]
    }
  },
  "flyingModeConfig": {
    "asteroidSpawnRate": 0.02,
    "asteroidSizes": [30, 50, 70],
    "asteroidZones": ["top", "middle", "bottom"],
    "coinSpawnRate": 0.015
  }
}
```

## **Implementation Plan & TODO**

### **Phase 1: Core Infrastructure (High Priority)**

1. **Create Level File System**
   - Design JSON schema for level configuration
   - Create `/levels/` directory structure
   - Implement level file loader with validation
   - Add error handling for malformed level files

2. **Level Management System**
   - Create `LevelManager` class to handle level loading/switching
   - Implement level progression logic
   - Add level completion detection
   - Create level selection UI

3. **Timeline System**
   - Replace random generation with timeline-based spawning
   - Implement event scheduler for precise timing
   - Add pattern system for repeating elements
   - Create configurable spawn functions

### **Phase 2: Game Integration (High Priority)**

4. **Replace Random Generation**
   - Convert obstacle spawning to use level timeline
   - Convert collectible spawning to use level data
   - Convert portal spawning to use level configuration
   - Maintain backward compatibility during transition

5. **Dynamic Configuration**
   - Allow level files to override game constants
   - Implement flying mode configuration per level
   - Add difficulty scaling within levels
   - Create victory condition system

### **Phase 3: User Experience (Medium Priority)**

6. **Level Progression UI**
   - Add level selection screen
   - Show current level progress
   - Display level completion status
   - Add level restart functionality

7. **Level Editor Support**
   - Create sample level files (1-5)
   - Add level validation tools
   - Document level file format
   - Create level testing utilities

### **Phase 4: Testing & Polish (Medium Priority)**

8. **Testing & Debugging**
   - Test each level for playability
   - Verify consistent difficulty progression
   - Test edge cases and error handling
   - Performance testing with complex levels

## **Technical Implementation Details**

### **Server-Side Changes**
- Add `/api/levels` endpoint to serve level files
- Add level file validation
- Support for level file uploads/editing

### **Client-Side Changes**
- Replace random generation with deterministic spawning
- Add level state management
- Implement timeline event system
- Add level progression tracking

### **File Structure**
```
/levels/
  ├── level-1.json (Easy introduction)
  ├── level-2.json (Basic obstacles)
  ├── level-3.json (Flying mode intro)
  ├── level-4.json (Orb mechanics)
  ├── level-5.json (Advanced patterns)
  └── schema.json (Validation schema)
```

## **Benefits of This Approach**

1. **Consistent Gameplay**: Each level plays exactly the same way every time
2. **Scalable Difficulty**: Precise control over challenge progression
3. **Editable Content**: Level designers can modify gameplay without code changes
4. **Replayability**: Players can master specific levels
5. **Community Content**: Easy for others to create custom levels

## **Next Steps**

Implementation will proceed through the phases systematically:

1. **Phase 1**: Core Infrastructure - Level file system and management
2. **Phase 2**: Game Integration - Replace random generation
3. **Phase 3**: User Experience - Level progression UI
4. **Phase 4**: Testing & Polish - Ensure quality and performance

The most critical decision point is whether to maintain the current endless/random mode alongside the level system, or fully transition to a level-based game. Both approaches can be implemented.

## **Implementation Status**

- [x] Plan created and documented
- [ ] Phase 1: Core Infrastructure
- [ ] Phase 2: Game Integration  
- [ ] Phase 3: User Experience
- [ ] Phase 4: Testing & Polish