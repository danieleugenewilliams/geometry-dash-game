# AGENTS.md - Geometry Dash Clone Development Guide

## Build & Test Commands
- `npm start` or `node server.js` - Start development server on port 3000
- `npm run dev` - Alternative start command
- No automated tests - testing done manually via browser at http://localhost:3000
- Check browser console for errors and debugging output

## Code Style & Standards

### File Structure & Module Loading
- Modular JS files in `js/` directory loaded in dependency order via script tags
- Config constants in `js/config.js` - always import first
- Classes: `Player` class in `js/player.js`, entity classes in `js/entities*.js`
- Level data: JSON files in `levels/` directory following `schema.json`

### JavaScript Style
- **Variables**: `const`/`let` only, camelCase (e.g., `playerPosition`, `gameState`)
- **Constants**: UPPER_SNAKE_CASE in GAME_CONFIG object (e.g., `GAME_CONFIG.PLAYER_SIZE`)
- **Classes**: PascalCase with constructor/methods (e.g., `class Player`, `updateNormal()`)
- **Functions**: camelCase, descriptive names (e.g., `checkCollision`, `getCurrentGroundY`)
- **Enums**: UPPER_SNAKE_CASE objects (e.g., `GAME_STATES.FLYING`, `PLAYER_POSITIONS.GROUND`)

### Game Architecture Patterns
- ES6 classes for entities with `reset()`, `update()`, `draw()` methods
- Configuration centralized in `GAME_CONFIG` object
- State management via global variables and enum constants
- Canvas 2D rendering with `requestAnimationFrame` game loop
- Modular entity system: separate files for different entity types

### Error Handling & Debugging
- Try-catch for JSON parsing and async operations (server API calls)
- Console logging for game state debugging and error tracking
- Graceful fallbacks for failed API calls (return empty arrays/default values)

## Local Memory

Proactively use local-memory MCP to store, retrieve, update, and analyze memories to maintain context and build expertise over time. Store key insights including lessons learned, architectural decisions, development strategies, and project outcomes. Use semantic search and relationship mapping to find relevant memories across all projects and sessions.

### Native MCP (via jsonrpc)

Connect to Local Memory via jsonrpc by using echo directly to:

./bin/local-memory --mcp

Or

local-memory --mcp

### REST API

Connect to Local Memory via REST API at:

http://localhost:3002/api/v1

This is a homeschool educational project focusing on game physics and iterative development.