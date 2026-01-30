# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Geometry Dash clone built as a homeschool educational project. Uses HTML5 Canvas, Vanilla JavaScript, and Node.js server for high score persistence. No external dependencies or build system.

## Commands

```bash
npm start          # Start server on http://localhost:3000
node server.js     # Alternative start command
```

No automated tests - testing is done manually by playing the game in browser. Check browser console (F12) for debug output.

## Architecture

### Script Loading Order (Critical)
Scripts must load in this order due to dependencies:
1. `js/config.js` - Game constants, state enums, physics values
2. `js/player.js` - Player class with physics methods
3. `js/entities.js` - Basic obstacles (spikes, stairs, coins)
4. `js/entities2.js` - Portal entities, asteroids
5. `js/entities3.js` - Green portals, ceiling spikes
6. `js/levelManager.js` - Level loading and event timeline
7. `js/highScores.js` - High score API client
8. `js/gameController.js` - Main game loop and controller

### Game State Machine
States defined in `GAME_STATES` enum in config.js:
- `NORMAL` - Standard running/jumping
- `FLYING` - Portal flying mode (30s duration)
- `UP_DOWN_MODE` - Ceiling/ground toggle mode (25s duration)
- `PORTAL_TRANSITION` / `PORTAL_EXIT` - Flying mode transitions
- `GREEN_PORTAL_TRANSITION` - Up-down mode entry

### Global State
Major state stored on `window` object for cross-module access:
- `window.player` - Player instance
- `window.gameState` - Current game state
- `window.levelManager` - Level manager instance

### Server Routes
- `GET /` - Serves index.html
- `GET /api/levels` - All level metadata
- `GET /api/levels/{levelId}` - Specific level JSON
- `GET/POST /api/high-scores` - High score read/write (persists to high-scores.md)

### Level Configuration
Levels defined as JSON in `levels/` directory following `levels/schema.json`. Timeline events spawn entities based on screen position, not elapsed time.

## Code Style

- Variables: `const`/`let` with camelCase
- Constants: UPPER_SNAKE_CASE in `GAME_CONFIG` object
- Classes: PascalCase with `reset()`, `update()`, `draw()` methods
- Enums: UPPER_SNAKE_CASE objects (e.g., `GAME_STATES.FLYING`)

## Key Implementation Details

- Canvas is responsive - ground position calculated dynamically via `getCurrentGroundY()`
- Collision detection uses rectangle-based AABB for all entities
- Player physics differ by mode: gravity in NORMAL, thrust in FLYING, toggle in UP_DOWN_MODE
- State transitions must use proper transition states (TRANSITIONING, PORTAL_TRANSITION) for smooth animations

## Controls (for manual testing)
- Space/Up Arrow: Jump (or thrust in flying mode, toggle in up-down mode)
- R: Toggle auto-replay
- P: Pause
- 1-4: Quick level select
- E: Endless mode
- ESC: Return to menu
