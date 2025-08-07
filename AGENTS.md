# AGENTS.md - Geometry Dash Clone Development Guide

## Build & Test Commands
- `npm start` or `node server.js` - Start development server on port 3000
- `npm run dev` - Alternative start command
- No automated tests configured - testing done manually via browser

## Code Style & Standards

### File Structure
- Main game logic: `index.html` (inline JavaScript)
- Server API: `server.js` (Node.js/HTTP)
- Level data: `levels/*.json` files
- Documentation: `docs/` directory with feature specs

### JavaScript Style
- **Variables**: Use `let`/`const`, camelCase naming (e.g., `playerPosition`, `gameState`)
- **Constants**: UPPER_SNAKE_CASE for game constants (e.g., `PLAYER_SIZE`, `JUMP_FORCE`)
- **Functions**: Descriptive names, camelCase (e.g., `checkCollision`, `generateCoins`)
- **Objects**: Literal notation, consistent property naming
- **Comments**: Minimal - code should be self-documenting

### Game Architecture Patterns
- Global game state variables at top level
- Object-oriented entities: `player`, `obstacles[]`, `coins[]`
- Functional approach: separate update/draw functions for each entity type
- Event-driven input handling with `addEventListener`
- 60fps game loop using `requestAnimationFrame`

### Error Handling
- Try-catch blocks for JSON parsing and async operations
- Graceful fallbacks (e.g., empty arrays for failed API calls)
- Console logging for debugging game state

This is a homeschool educational project focusing on game physics, AI-assisted development, and iterative prototyping.