// Level Management System
class LevelManager {
    constructor() {
        this.currentLevel = null;
        this.levelTimer = 0;
        this.eventQueue = [];
        this.completedEvents = [];
        this.gameConstants = {};
        this.originalConstants = null;
    }
    
    async loadLevel(levelId) {
        try {
            console.log('LevelManager.loadLevel called with:', levelId);
            const response = await fetch(`/api/levels/${levelId}`);
            console.log('Fetch response:', response.status, response.ok);
            if (!response.ok) {
                throw new Error(`Failed to load level: ${response.status}`);
            }
            
            const levelData = await response.json();
            console.log('Received level data:', levelData);
            this.currentLevel = levelData;
            this.levelTimer = 0;
            this.eventQueue = [...levelData.timeline].sort((a, b) => a.time - b.time);
            this.completedEvents = [];
            console.log('Level stored in currentLevel:', this.currentLevel.name);
            
            // Apply game constants override
            this.gameConstants = levelData.gameConstants || {};
            this.applyGameConstants();
            
            console.log(`Level loaded: ${levelData.name}`, levelData);
            return levelData;
        } catch (error) {
            console.error('Error loading level:', error);
            throw error;
        }
    }
    
    applyGameConstants() {
        // Store original constants for restoration
        if (!this.originalConstants) {
            this.originalConstants = {
                PLAYER_SIZE: GAME_CONFIG.PLAYER_SIZE,
                GRAVITY: GAME_CONFIG.GRAVITY,
                JUMP_FORCE: GAME_CONFIG.JUMP_FORCE,
                MOVE_SPEED: GAME_CONFIG.MOVE_SPEED,
                PORTAL_SPAWN_INTERVAL: GAME_CONFIG.PORTAL_SPAWN_INTERVAL,
                FLYING_DURATION: GAME_CONFIG.FLYING_DURATION,
                INVINCIBILITY_DURATION: GAME_CONFIG.INVINCIBILITY_DURATION,
                SUPER_INVINCIBILITY_DURATION: GAME_CONFIG.SUPER_INVINCIBILITY_DURATION,
                ORB_SPAWN_INTERVAL: GAME_CONFIG.ORB_SPAWN_INTERVAL,
                GREEN_ORB_SPAWN_INTERVAL: GAME_CONFIG.GREEN_ORB_SPAWN_INTERVAL
            };
        }
        
        // Apply overrides to player if specified
        if (this.gameConstants.playerSize && window.player) {
            window.player.width = this.gameConstants.playerSize;
            window.player.height = this.gameConstants.playerSize;
        }
    }
    
    update(deltaTime, gameState) {
        console.log('LEVEL UPDATE ENTRY:', {
            hasCurrentLevel: !!this.currentLevel,
            gameOver: window.gameOver,
            isPaused: window.isPaused,
            levelName: this.currentLevel?.name
        });
        
        if (!this.currentLevel || window.gameOver || window.isPaused) return;
        
        this.levelTimer += deltaTime;
        console.log('LEVEL UPDATE:', {
            levelTimer: this.levelTimer,
            eventQueueLength: this.eventQueue.length,
            nextEventTime: this.eventQueue.length > 0 ? this.eventQueue[0].time : 'none'
        });
        
        // Process events - check for events that should spawn now
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue[0];
            
            // For events with x coordinates, calculate when they should spawn to appear on screen
            if (event.params && event.params.x !== undefined) {
                const screenX = this.getLevelObjectScreenX(event.params.x, this.levelTimer);
                
                // Spawn when object is about to enter the screen (with some buffer)
                if (screenX <= GAME_CONFIG.CANVAS_WIDTH + 50) {
                    console.log('SPAWNING EVENT:', event.action, 'screenX:', screenX);
                    this.eventQueue.shift();
                    this.executeEvent(event);
                    this.completedEvents.push(event);
                } else {
                    // Object not ready to spawn yet
                    console.log('EVENT NOT READY:', event.action, 'screenX:', screenX, 'needs to be <=', GAME_CONFIG.CANVAS_WIDTH + 50);
                    break;
                }
            } else {
                // Time-based event (no x coordinate)
                if (event.time <= this.levelTimer) {
                    console.log('SPAWNING TIME-BASED EVENT:', event.action);
                    this.eventQueue.shift();
                    this.executeEvent(event);
                    this.completedEvents.push(event);
                } else {
                    break;
                }
            }
        }
        
        // Check victory condition
        this.checkVictoryCondition();
    }
    
    getLevelObjectScreenX(worldX, gameTime) {
        // Calculate how far the player has "moved" through the world
        const playerWorldPosition = (gameTime / 16) * GAME_CONFIG.MOVE_SPEED;
        // Convert world position to screen position relative to player
        return worldX - playerWorldPosition + 100; // 100 is player's fixed screen x position
    }
    
    executeEvent(event) {
        console.log('LEVEL EVENT:', event.action, 'at time:', this.levelTimer, 'params:', event.params);
        
        // For level mode, convert world coordinates to screen coordinates if needed
        if (event.params && event.params.x !== undefined) {
            const screenX = this.getLevelObjectScreenX(event.params.x, this.levelTimer);
            console.log('COORDINATE CONVERSION:', {
                worldX: event.params.x,
                levelTimer: this.levelTimer,
                screenX: screenX,
                canvasWidth: GAME_CONFIG.CANVAS_WIDTH
            });
            event.params.x = screenX;
        }
        
        switch (event.action) {
            case 'spawnCoin':
                this.spawnCoin(event.params);
                break;
            case 'spawnSpike':
                this.spawnSpike(event.params);
                break;
            case 'spawnStair':
                this.spawnStair(event.params);
                break;
            case 'spawnPortal':
                this.spawnPortal(event.params);
                break;
            case 'spawnOrangeOrb':
                this.spawnOrangeOrb(event.params);
                break;
            case 'spawnGreenOrb':
                this.spawnGreenOrb(event.params);
                break;
            case 'spawnAsteroid':
                this.spawnAsteroid(event.params);
                break;
            case 'spawnGreenPortal':
                this.spawnGreenPortal(event.params);
                break;
            case 'spawnCeilingSpike':
                this.spawnCeilingSpike(event.params);
                break;
            default:
                console.warn('Unknown event action:', event.action);
        }
    }
    
    spawnCoin(params) {
        console.log('SPAWNING COIN:', params);
        const coin = {
            x: params.x || GAME_CONFIG.CANVAS_WIDTH + 20,
            y: params.y || GAME_CONFIG.GROUND_HEIGHT - 30,
            width: 20,
            height: 20,
            rotation: 0,
            collected: false,
            points: params.points || 10
        };
        window.coins.push(coin);
        console.log('COIN ADDED. Total coins:', window.coins.length);
    }
    
    spawnSpike(params) {
        console.log('SPAWNING SPIKE:', params);
        const spike = {
            x: params.x || GAME_CONFIG.CANVAS_WIDTH + 20,
            y: params.y || GAME_CONFIG.GROUND_HEIGHT - 20,
            width: 20,
            height: 20,
            type: 'spike'
        };
        window.obstacles.push(spike);
        console.log('SPIKE ADDED. Total obstacles:', window.obstacles.length);
    }
    
    spawnStair(params) {
        const stair = {
            x: params.x || GAME_CONFIG.CANVAS_WIDTH + 20,
            y: params.y || GAME_CONFIG.GROUND_HEIGHT - 50,
            width: params.width || 60,
            height: params.height || 50,
            type: 'stair'
        };
        window.stairs.push(stair);
    }
    
    spawnPortal(params) {
        const portal = {
            x: params.x || GAME_CONFIG.CANVAS_WIDTH + 20,
            y: params.y || GAME_CONFIG.GROUND_HEIGHT - 120,
            width: 80,
            height: 80,
            rotation: 0,
            particles: []
        };
        window.portals.push(portal);
    }
    
    spawnGreenPortal(params) {
        const greenPortal = {
            x: params.x || GAME_CONFIG.CANVAS_WIDTH + 20,
            y: params.y || GAME_CONFIG.GROUND_HEIGHT - 120,
            width: 80,
            height: 80,
            rotation: 0,
            particles: []
        };
        window.greenPortals.push(greenPortal);
    }
    
    spawnCeilingSpike(params) {
        const spike = {
            x: params.x || GAME_CONFIG.CANVAS_WIDTH + 20,
            y: params.y || 30,
            width: 20,
            height: 20,
            type: 'ceiling_spike'
        };
        window.ceilingSpikes.push(spike);
    }
    
    spawnOrangeOrb(params) {
        const orb = {
            x: params.x || GAME_CONFIG.CANVAS_WIDTH + 20,
            y: params.y || GAME_CONFIG.GROUND_HEIGHT - 80,
            width: 25,
            height: 25,
            rotation: 0,
            collected: false,
            pulseTimer: 0
        };
        window.orangeOrbs.push(orb);
    }
    
    spawnGreenOrb(params) {
        const orb = {
            x: params.x || GAME_CONFIG.CANVAS_WIDTH + 20,
            y: params.y || GAME_CONFIG.GROUND_HEIGHT - 90,
            width: 30,
            height: 30,
            rotation: 0,
            collected: false,
            pulseTimer: 0,
            sparkleTimer: 0
        };
        window.greenOrbs.push(orb);
    }
    
    spawnAsteroid(params) {
        const asteroid = {
            x: params.x || GAME_CONFIG.CANVAS_WIDTH + 20,
            y: params.y || 200,
            width: params.size || 50,
            height: params.size || 50,
            rotation: 0,
            rotationSpeed: params.rotationSpeed || 0.05
        };
        window.asteroids.push(asteroid);
    }
    
    checkVictoryCondition() {
        if (!this.currentLevel || window.levelComplete) return;
        
        const condition = this.currentLevel.victoryCondition;
        let victory = false;
        
        switch (condition.type) {
            case 'survival':
                victory = this.levelTimer >= condition.target;
                break;
            case 'score':
                victory = window.score >= condition.target;
                break;
            case 'distance':
                victory = this.levelTimer * GAME_CONFIG.MOVE_SPEED >= condition.target;
                break;
        }
        
        if (victory) {
            this.completeLevel();
        }
    }
    
    completeLevel() {
        window.levelComplete = true;
        console.log('Level completed!');
        
        // Add completion bonus
        window.score += 500;
        
        // Show completion notification
        window.bonusNotifications.push({
            x: GAME_CONFIG.CANVAS_WIDTH / 2,
            y: GAME_CONFIG.CANVAS_HEIGHT / 2,
            text: `LEVEL COMPLETE! +500`,
            timer: 0,
            maxTimer: 3000
        });
    }
    
    reset() {
        this.currentLevel = null;
        this.levelTimer = 0;
        this.eventQueue = [];
        this.completedEvents = [];
        window.levelComplete = false;
        
        // Restore original constants
        if (this.originalConstants && window.player) {
            // Reset player size
            window.player.width = this.originalConstants.PLAYER_SIZE;
            window.player.height = this.originalConstants.PLAYER_SIZE;
        }
    }
    
    getProgress() {
        if (!this.currentLevel) return 0;
        return Math.min(100, (this.levelTimer / this.currentLevel.duration) * 100);
    }
}

// Level selection and management functions
async function loadAvailableLevels() {
    try {
        const response = await fetch('/api/levels');
        if (response.ok) {
            window.availableLevels = await response.json();
            console.log('Available levels:', window.availableLevels);
        }
    } catch (error) {
        console.error('Failed to load available levels:', error);
    }
}

function showLevelSelectMenu() {
    document.getElementById('levelSelectMenu').style.display = 'block';
}

function hideLevelSelectMenu() {
    document.getElementById('levelSelectMenu').style.display = 'none';
}

function selectLevel(selection) {
    console.log('SELECT LEVEL CALLED:', selection);
    if (selection === 'endless') {
        window.gameMode = GAME_MODES.ENDLESS;
        window.selectedLevelId = null;
        window.levelManager.reset();
    } else {
        window.gameMode = GAME_MODES.LEVEL;
        window.selectedLevelId = selection;
    }
    console.log('After selectLevel - gameMode:', window.gameMode, 'selectedLevelId:', window.selectedLevelId);
    
    hideLevelSelectMenu();
    startGame();
}

function startGame() {
    console.log('START GAME CALLED - gameMode:', window.gameMode, 'selectedLevelId:', window.selectedLevelId);
    window.gameStarted = true;
    
    if (window.gameMode === GAME_MODES.LEVEL && window.selectedLevelId) {
        console.log('Calling loadAndStartLevel');
        loadAndStartLevel(window.selectedLevelId);
    } else {
        console.log('Calling restartGame from startGame');
        window.restartGame();
    }
}

async function loadAndStartLevel(levelId) {
    console.log('LOAD AND START LEVEL CALLED:', levelId);
    try {
        window.gameMode = GAME_MODES.LEVEL;
        window.selectedLevelId = levelId;
        console.log('About to load level');
        await window.levelManager.loadLevel(levelId);
        console.log('Level loaded successfully, current level:', window.levelManager.currentLevel ? window.levelManager.currentLevel.name : 'NULL');
        console.log('Level loaded, calling restartGame from loadAndStartLevel');
        window.restartGame(); // Reset game state for the new level
    } catch (error) {
        console.error('Failed to load level:', error);
        window.gameMode = GAME_MODES.ENDLESS;
        window.selectedLevelId = null;
        console.log('Error occurred, calling restartGame from loadAndStartLevel error');
        window.restartGame(); // Reset to endless mode
    }
}