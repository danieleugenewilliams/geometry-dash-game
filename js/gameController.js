// Main Game Controller
class GameController {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.player = null;
        this.levelManager = null;
        this.initializeGame();
    }
    
    initializeGame() {
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Make canvas responsive
        this.setupCanvasResize();
        
        // Initialize player
        this.player = new Player();
        window.player = this.player; // For compatibility with existing code
        
        // Initialize level manager
        this.levelManager = new LevelManager();
        window.levelManager = this.levelManager; // For compatibility
        
        // Initialize game state variables
        this.initializeGameState();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start game loop
        this.gameLoop();
        
        // Load initial data
        this.loadInitialData();
    }
    
    setupCanvasResize() {
        const resizeCanvas = () => {
            const scale = window.devicePixelRatio || 1;
            
            // Store display dimensions
            if (window.innerWidth <= 768) {
                this.displayWidth = window.innerWidth - 20;
                this.displayHeight = window.innerHeight * 0.5;
            } else {
                this.displayWidth = 800;
                this.displayHeight = 400;
            }
            
            // Calculate ground as a fixed ratio of canvas height
            // Keep ground at bottom 12.5% of screen (like original 50px out of 400px)
            const groundThickness = this.displayHeight * 0.125;
            this.groundHeight = this.displayHeight - groundThickness;
            
            // Update global ground values
            window.GROUND_HEIGHT = this.groundHeight;
            window.GROUND_Y = this.groundHeight - GAME_CONFIG.PLAYER_SIZE;
            
            console.log('Ground calc:', {
                displayHeight: this.displayHeight,
                groundHeight: this.groundHeight,
                groundThickness: groundThickness,
                GROUND_Y: window.GROUND_Y
            });
            
            // Set canvas display size
            this.canvas.style.width = this.displayWidth + 'px';
            this.canvas.style.height = this.displayHeight + 'px';
            
            // Set actual canvas size for high DPI displays
            this.canvas.width = this.displayWidth * scale;
            this.canvas.height = this.displayHeight * scale;
            this.ctx.scale(scale, scale);
            
            // Reset player position if game has started
            if (this.player && window.gameStarted) {
                this.player.y = getCurrentGroundY();
                console.log('Player repositioned to:', this.player.y);
            }
            
            // Reposition all existing obstacles and entities
            this.repositionExistingEntities();
        };
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas(); // Initial setup
    }
    
    initializeGameState() {
        // Game state management
        window.gameState = GAME_STATES.NORMAL;
        window.portalTimer = 0;
        window.flyingTimer = 0;
        window.upDownTimer = 0;
        window.spaceKeyPressed = false;
        window.animationFrame = 0;
        
        // Up-down mode variables
        window.playerPosition = PLAYER_POSITIONS.GROUND;
        window.transitionTimer = 0;
        window.transitionStartY = 0;
        window.transitionTargetY = 0;
        window.lastSpacePress = 0;
        
        // Entity arrays
        window.obstacles = [];
        window.stairs = [];
        window.portals = [];
        window.greenPortals = [];
        window.asteroids = [];
        window.ceilingSpikes = [];
        window.coins = [];
        window.sparkles = [];
        window.orangeOrbs = [];
        window.greenOrbs = [];
        window.bonusNotifications = [];
        
        // Power-up states
        window.isInvincible = false;
        window.invincibilityTimer = 0;
        window.lastOrbSpawnScore = 0;
        window.isSuperInvincible = false;
        window.superInvincibilityTimer = 0;
        window.lastGreenOrbSpawnScore = 0;
        window.lastPortalSpawnScore = 0;
        window.lastGreenPortalSpawnScore = 0;
        
        // Game flow
        window.gameOver = false;
        window.score = 0;
        window.highScoreShown = false;
        window.highScores = [];
        window.gameStarted = false;
        window.autoReplay = false;
        window.isPaused = false;
        window.gameOverTimer = 0;
        
        // Level system
        window.currentLevel = null;
        window.levelTimer = 0;
        window.levelEvents = [];
        window.levelComplete = false;
        window.gameMode = GAME_MODES.ENDLESS;
        window.availableLevels = [];
        window.selectedLevelId = null;
        
        // Functions for compatibility
        window.restartGame = this.restartGame.bind(this);
    }
    
    setupEventListeners() {
        // Make canvas focusable
        this.canvas.tabIndex = 0;
        this.canvas.focus();
        this.canvas.addEventListener('click', () => this.canvas.focus());
        
        // Handle keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Handle touch input for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        document.addEventListener('touchstart', (e) => this.handleDocumentTouchStart(e));
        
        // Prevent default touch behaviors
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        
        // High score popup events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.getElementById('highScorePopup').style.display === 'block') {
                window.saveHighScore();
            }
        });
    }
    
    async loadInitialData() {
        await loadHighScores();
        await loadAvailableLevels();
        showLevelSelectMenu();
    }
    
    handleKeyDown(e) {
        // Prevent default behavior for game controls to stop page scrolling
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
            e.preventDefault();
        }
        
        // Track space key for flying mode
        if (e.code === 'Space') {
            window.spaceKeyPressed = true;
        }
        
        // Jump controls (when game is running)
        if ((e.code === 'Space' || e.code === 'ArrowUp') && 
            !window.gameOver && !window.isPaused && window.gameStarted) {
            this.handleJumpInput();
        }
        
        // Toggle auto replay
        if (e.code === 'KeyR') {
            window.autoReplay = !window.autoReplay;
            console.log('Auto replay:', window.autoReplay ? 'ON' : 'OFF');
        }
        
        // Toggle pause
        if (e.code === 'KeyP' && window.gameStarted) {
            window.isPaused = !window.isPaused;
            console.log('Game', window.isPaused ? 'PAUSED' : 'UNPAUSED');
        }
        
        // Level controls (only when game is running)
        if (window.gameStarted && !window.gameOver) {
            if (e.code === 'Digit1') { loadAndStartLevel('level-1'); }
            if (e.code === 'Digit2') { loadAndStartLevel('level-2'); }
            if (e.code === 'Digit3') { loadAndStartLevel('level-3'); }
            if (e.code === 'Digit4') { loadAndStartLevel('level-4'); }
            if (e.code === 'KeyE') {
                window.gameMode = GAME_MODES.ENDLESS;
                window.selectedLevelId = null;
                this.levelManager.reset();
                this.restartGame();
                console.log('Switched to endless mode');
            }
        }
    }
    
    handleKeyUp(e) {
        if (e.code === 'Space') {
            window.spaceKeyPressed = false;
        }
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        console.log('Touch start on canvas');
        
        // Treat touch as space key press
        if (!window.spaceKeyPressed) {
            window.spaceKeyPressed = true;
            
            // Handle same logic as space key
            if (!window.gameStarted || (window.gameOver && !document.getElementById('highScorePopup').style.display === 'block')) {
                showLevelSelectMenu();
                return;
            }
            
            // Handle jumping/mode switching
            this.handleJumpInput();
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        window.spaceKeyPressed = false;
    }
    
    handleDocumentTouchStart(e) {
        // Handle touches on level selection menu
        if (document.getElementById('levelSelectMenu').style.display === 'block') {
            // Touch events on level cards are handled by onclick
            return;
        }
    }
    
    handleJumpInput() {
        const currentTime = Date.now();
        
        if (window.gameState === GAME_STATES.UP_DOWN_MODE && 
            currentTime - window.lastSpacePress > 200) {
            
            // Use the same toggle logic as handleUpDownMode
            this.togglePlayerPosition();
            window.lastSpacePress = currentTime;
            console.log('Position toggled from:', window.playerPosition === PLAYER_POSITIONS.TRANSITIONING ? 'transitioning' : window.playerPosition);
        } else if (window.gameState === GAME_STATES.NORMAL) {
            // Normal jumping
            this.player.jump();
        }
    }
    
    update() {
        // Skip update if paused or not started
        if (window.isPaused || !window.gameStarted) return;
        
        if (window.gameOver) {
            this.handleGameOver();
            return;
        }
        
        // Handle level completion
        if (window.levelComplete) {
            setTimeout(() => {
                if (window.levelComplete) {
                    showLevelSelectMenu();
                }
            }, 3000);
            return;
        }
        
        // Update game state based on current mode
        this.updateGameState();
        
        // Update player
        this.updatePlayer();
        
        // Update entities
        updateAllEntities(window.gameState);
        
        // Update level manager
        this.levelManager.update(GAME_CONFIG.FRAME_TIME, window.gameState);
        
        // Check collisions
        this.checkCollisions();
        
        // Update timers and scoring
        this.updateTimersAndScoring();
    }
    
    updateGameState() {
        // Handle different game states
        switch (window.gameState) {
            case GAME_STATES.PORTAL_TRANSITION:
                window.gameState = GAME_STATES.FLYING;
                break;
            case GAME_STATES.FLYING:
                window.flyingTimer += GAME_CONFIG.FRAME_TIME;
                if (window.flyingTimer >= GAME_CONFIG.FLYING_DURATION) {
                    window.gameState = GAME_STATES.NORMAL;
                    this.player.transformToSquare();
                    this.player.y = getCurrentGroundY();
                }
                break;
            case GAME_STATES.GREEN_PORTAL_TRANSITION:
                window.gameState = GAME_STATES.UP_DOWN_MODE;
                break;
            case GAME_STATES.UP_DOWN_MODE:
                window.upDownTimer += GAME_CONFIG.FRAME_TIME;
                if (window.upDownTimer >= GAME_CONFIG.UP_DOWN_DURATION) {
                    window.gameState = GAME_STATES.NORMAL;
                    window.playerPosition = PLAYER_POSITIONS.GROUND;
                    this.player.y = getCurrentGroundY();
                }
                break;
        }
    }
    
    updatePlayer() {
        switch (window.gameState) {
            case GAME_STATES.NORMAL:
                this.player.updateNormal();
                break;
            case GAME_STATES.FLYING:
                this.player.updateFlying(window.spaceKeyPressed);
                break;
            case GAME_STATES.UP_DOWN_MODE:
                this.handleUpDownMode();
                break;
        }
    }
    
    handleUpDownMode() {
        // Handle space key for position toggling
        if (window.spaceKeyPressed && Date.now() - window.lastSpacePress > 200) {
            this.togglePlayerPosition();
            window.lastSpacePress = Date.now();
        }
        
        // Handle position transitions
        if (window.playerPosition === PLAYER_POSITIONS.TRANSITIONING) {
            window.transitionTimer += GAME_CONFIG.FRAME_TIME;
            const progress = Math.min(window.transitionTimer / GAME_CONFIG.TRANSITION_DURATION, 1);
            
            this.player.updateUpDown(window.playerPosition, progress, 
                                   window.transitionStartY, window.transitionTargetY);
            
            // Complete transition
            if (progress >= 1) {
                this.player.y = window.transitionTargetY;
                this.player.rotation = 0;
                window.playerPosition = (window.transitionTargetY === GAME_CONFIG.CEILING_Y) ? 
                                      PLAYER_POSITIONS.CEILING : PLAYER_POSITIONS.GROUND;
                window.transitionTimer = 0;
            }
        }
        
        // Continuous scoring in up-down mode
        window.score += 0.1;
    }
    
    togglePlayerPosition() {
        if (window.playerPosition === PLAYER_POSITIONS.TRANSITIONING) return;
        
        window.transitionStartY = this.player.y;
        window.transitionTimer = 0;
        
        if (window.playerPosition === PLAYER_POSITIONS.GROUND) {
            window.transitionTargetY = GAME_CONFIG.CEILING_Y;
            window.playerPosition = PLAYER_POSITIONS.TRANSITIONING;
        } else if (window.playerPosition === PLAYER_POSITIONS.CEILING) {
            window.transitionTargetY = (window.GROUND_Y || GROUND_Y);
            window.playerPosition = PLAYER_POSITIONS.TRANSITIONING;
        }
    }
    
    checkCollisions() {
        // Check collisions with different entities based on game state
        if (window.gameState === GAME_STATES.NORMAL || window.gameState === GAME_STATES.UP_DOWN_MODE) {
            this.checkNormalModeCollisions();
        } else if (window.gameState === GAME_STATES.FLYING) {
            this.checkFlyingModeCollisions();
        }
        
        // Check coin and orb collections (all modes)
        this.checkCollectibles();
    }
    
    checkNormalModeCollisions() {
        // Check obstacle collisions (only if not invincible)
        if (!window.isInvincible && !window.isSuperInvincible) {
            for (let obstacle of window.obstacles) {
                if (checkCollision(this.player, obstacle)) {
                    this.endGame();
                    return;
                }
            }
            
            // Check stair side collisions
            for (let stair of window.stairs) {
                if (checkStairSideCollision(this.player, stair)) {
                    this.endGame();
                    return;
                }
            }
            
            // Check ceiling spike collisions (up-down mode)
            if (window.gameState === GAME_STATES.UP_DOWN_MODE) {
                for (let spike of window.ceilingSpikes) {
                    if (checkCollision(this.player, spike)) {
                        this.endGame();
                        return;
                    }
                }
            }
        }
        
        // Check stair landings (beneficial)
        for (let stair of window.stairs) {
            if (checkStairLanding(this.player, stair)) {
                this.player.y = stair.y - this.player.height;
                this.player.velocityY = 0;
                this.player.isJumping = false;
            }
        }
    }
    
    checkFlyingModeCollisions() {
        // Check asteroid collisions (only if not invincible)
        if (!window.isInvincible && !window.isSuperInvincible) {
            for (let asteroid of window.asteroids) {
                if (checkCollision(this.player, asteroid)) {
                    this.endGame();
                    return;
                }
            }
        }
        
        // Proximity bonuses for asteroids
        window.asteroids.forEach(asteroid => {
            const dx = this.player.getCenterX() - (asteroid.x + asteroid.width/2);
            const dy = this.player.getCenterY() - (asteroid.y + asteroid.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const proximityThreshold = 80;
            
            if (distance < proximityThreshold && !asteroid.bonusAwarded) {
                const bonusMultiplier = Math.max(0.1, 1 - (distance / proximityThreshold));
                const bonusPoints = bonusMultiplier * 2;
                window.score += bonusPoints;
                asteroid.bonusAwarded = true;
                
                window.bonusNotifications.push({
                    x: asteroid.x + asteroid.width/2,
                    y: asteroid.y - 20,
                    text: `+${Math.floor(bonusPoints)}`,
                    timer: 0,
                    maxTimer: 1000
                });
            }
        });
    }
    
    checkCollectibles() {
        // Check coin collections
        for (let coin of window.coins) {
            if (!coin.collected && checkCoinCollision(this.player, coin)) {
                coin.collected = true;
                window.score += 10;
                
                // Add sparkle effect
                window.sparkles.push({
                    x: coin.x + coin.width/2,
                    y: coin.y + coin.height/2,
                    particles: createSparkleParticles(coin.x + coin.width/2, coin.y + coin.height/2),
                    timer: 0,
                    maxTimer: 1000
                });
            }
        }
        
        // Check orange orb collections
        for (let orb of window.orangeOrbs) {
            if (!orb.collected && checkOrbCollision(this.player, orb)) {
                orb.collected = true;
                window.score += 25;
                window.isInvincible = true;
                window.invincibilityTimer = 0;
                console.log('Orange orb collected! Invincible for 10 seconds');
            }
        }
        
        // Check green orb collections
        for (let orb of window.greenOrbs) {
            if (!orb.collected && checkOrbCollision(this.player, orb)) {
                orb.collected = true;
                window.score += 100;
                window.isSuperInvincible = true;
                window.superInvincibilityTimer = 0;
                console.log('Green orb collected! Super invincible for 8 seconds');
            }
        }
    }
    
    updateTimersAndScoring() {
        // Update invincibility timers
        if (window.isInvincible) {
            window.invincibilityTimer += GAME_CONFIG.FRAME_TIME;
            if (window.invincibilityTimer >= GAME_CONFIG.INVINCIBILITY_DURATION) {
                window.isInvincible = false;
                window.invincibilityTimer = 0;
                console.log('Orange orb invincibility ended');
            }
        }
        
        if (window.isSuperInvincible) {
            window.superInvincibilityTimer += GAME_CONFIG.FRAME_TIME;
            if (window.superInvincibilityTimer >= GAME_CONFIG.SUPER_INVINCIBILITY_DURATION) {
                window.isSuperInvincible = false;
                window.superInvincibilityTimer = 0;
                console.log('Green orb super invincibility ended');
            }
        }
        
        // Continuous scoring based on game state
        if (window.gameState === GAME_STATES.NORMAL) {
            window.score += 0.1;
        } else if (window.gameState === GAME_STATES.FLYING) {
            window.score += 0.15;
        }
    }
    
    handleGameOver() {
        // Show high score popup if it's a high score and not shown yet
        if (!window.highScoreShown && window.isHighScore(window.score)) {
            window.showHighScorePopup();
            window.highScoreShown = true;
        }
        
        // Handle auto replay (only if popup is not shown)
        if (window.autoReplay && document.getElementById('highScorePopup').style.display !== 'block') {
            window.gameOverTimer += GAME_CONFIG.FRAME_TIME;
            if (window.gameOverTimer >= GAME_CONFIG.AUTO_REPLAY_DELAY) {
                this.restartGame();
            }
        } else if (document.getElementById('highScorePopup').style.display !== 'block') {
            // Show level select menu after game over (if no high score popup)
            setTimeout(() => {
                if (window.gameOver && document.getElementById('highScorePopup').style.display !== 'block') {
                    showLevelSelectMenu();
                }
            }, 2000);
        }
    }
    
    endGame() {
        window.gameOver = true;
        console.log('Game Over! Final Score:', Math.floor(window.score));
    }
    
    restartGame() {
        // Preserve gameStarted state during restart
        const wasGameStarted = window.gameStarted;
        
        // Reset player
        this.player.reset();
        
        // Clear all entity arrays
        window.obstacles = [];
        window.stairs = [];
        window.portals = [];
        window.greenPortals = [];
        window.asteroids = [];
        window.ceilingSpikes = [];
        window.coins = [];
        window.sparkles = [];
        window.bonusNotifications = [];
        window.orangeOrbs = [];
        window.greenOrbs = [];
        
        // Reset power-up states
        window.isInvincible = false;
        window.invincibilityTimer = 0;
        window.lastOrbSpawnScore = 0;
        window.isSuperInvincible = false;
        window.superInvincibilityTimer = 0;
        window.lastGreenOrbSpawnScore = 0;
        window.lastPortalSpawnScore = 0;
        window.lastGreenPortalSpawnScore = 0;
        
        // Reset player position and transition states
        window.playerPosition = PLAYER_POSITIONS.GROUND;
        window.transitionTimer = 0;
        window.upDownTimer = 0;
        window.lastSpacePress = 0;
        
        // Reset game flow
        window.score = 0;
        window.gameOver = false;
        window.gameOverTimer = 0;
        window.highScoreShown = false;
        window.gameState = GAME_STATES.NORMAL;
        window.portalTimer = 0;
        window.flyingTimer = 0;
        window.spaceKeyPressed = false;
        window.animationFrame = 0;
        
        // Reset level system
        if (window.gameMode === GAME_MODES.ENDLESS) {
            this.levelManager.reset();
        } else {
            // In level mode, only reset timer and events, keep the level data
            this.levelManager.levelTimer = 0;
            this.levelManager.eventQueue = this.levelManager.currentLevel ? 
                [...this.levelManager.currentLevel.timeline].sort((a, b) => a.time - b.time) : [];
            this.levelManager.completedEvents = [];
        }
        window.levelComplete = false;
        
        // Restore gameStarted state
        window.gameStarted = wasGameStarted;
        
        console.log('Game restarted!');
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
        
        // Debug: Show that we are in the draw function
        if (!window.gameStarted) {
            this.ctx.fillStyle = 'black';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Game not started - Click to select level', 50, 200);
            return;
        }
        
        // Draw background (sky)
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.displayWidth, this.groundHeight);
        
        // Draw floor/ground with pattern
        this.drawFloor();
        
        // Draw all entities
        drawAllEntities(this.ctx);
        
        // Draw player
        drawPlayer(this.ctx, this.player, window.gameState, window.isInvincible, 
                  window.isSuperInvincible, window.invincibilityTimer, 
                  window.superInvincibilityTimer);
        
        // Draw UI
        this.drawUI();
    }
    
    drawFloor() {
        // Draw main ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.groundHeight, this.displayWidth, this.displayHeight - this.groundHeight);
        
        // Draw grass line on top of ground
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.groundHeight, this.displayWidth, 3);
        
        // Draw ground texture pattern
        this.ctx.fillStyle = '#654321';
        for (let x = 0; x < this.displayWidth; x += 40) {
            for (let y = this.groundHeight + 10; y < this.displayHeight; y += 20) {
                this.ctx.fillRect(x + 5, y, 30, 2);
            }
        }
    }
    
    drawUI() {
        // Draw score
        this.ctx.fillStyle = 'black';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${Math.floor(window.score)}`, 10, 30);
        
        // Draw game state info
        this.ctx.fillText(`Mode: ${window.gameState}`, 10, 60);
        
        // Draw level progress if in level mode
        if (window.gameMode === GAME_MODES.LEVEL && this.levelManager.currentLevel) {
            const progress = this.levelManager.getProgress();
            this.ctx.fillText(`Level: ${this.levelManager.currentLevel.name}`, 10, 90);
            this.ctx.fillText(`Progress: ${Math.floor(progress)}%`, 10, 120);
        }
        
        // Draw invincibility status
        if (window.isSuperInvincible) {
            this.ctx.fillStyle = 'green';
            this.ctx.fillText('SUPER INVINCIBLE', this.displayWidth - 200, 30);
        } else if (window.isInvincible) {
            this.ctx.fillStyle = 'orange';
            this.ctx.fillText('INVINCIBLE', this.displayWidth - 150, 30);
        }
        
        // Draw pause indicator
        if (window.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
            this.ctx.fillStyle = 'white';
            
            // Responsive font size based on display width
            const pauseFontSize = Math.max(24, Math.min(48, this.displayWidth / 16));
            this.ctx.font = `${pauseFontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.displayWidth / 2, this.displayHeight / 2);
            
            // Mobile instructions
            if (this.displayWidth <= 500) {
                this.ctx.font = `${pauseFontSize * 0.4}px Arial`;
                this.ctx.fillText('Tap to resume', this.displayWidth / 2, this.displayHeight / 2 + pauseFontSize);
            }
            
            this.ctx.textAlign = 'left';
            this.ctx.font = '20px Arial';
        }
        
        // Draw game over screen
        if (window.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            
            // Responsive font sizes based on display width
            const gameOverFontSize = Math.max(24, Math.min(48, this.displayWidth / 16));
            const scoreFontSize = Math.max(16, Math.min(24, this.displayWidth / 24));
            const instructionFontSize = Math.max(12, Math.min(18, this.displayWidth / 32));
            
            this.ctx.font = `${gameOverFontSize}px Arial`;
            this.ctx.fillText('GAME OVER', this.displayWidth / 2, this.displayHeight / 2 - gameOverFontSize);
            
            this.ctx.font = `${scoreFontSize}px Arial`;
            this.ctx.fillText(`Final Score: ${Math.floor(window.score)}`, this.displayWidth / 2, this.displayHeight / 2);
            
            // Mobile instructions
            if (this.displayWidth <= 500) {
                this.ctx.font = `${instructionFontSize}px Arial`;
                this.ctx.fillText('Tap to continue', this.displayWidth / 2, this.displayHeight / 2 + scoreFontSize + 20);
            }
            
            this.ctx.textAlign = 'left';
            this.ctx.font = '20px Arial';
        }
        
        // Draw level complete screen
        if (window.levelComplete) {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            
            // Responsive font sizes based on display width
            const completeFontSize = Math.max(20, Math.min(48, this.displayWidth / 16));
            const scoreFontSize = Math.max(16, Math.min(24, this.displayWidth / 24));
            
            this.ctx.font = `${completeFontSize}px Arial`;
            this.ctx.fillText('LEVEL COMPLETE!', this.displayWidth / 2, this.displayHeight / 2 - completeFontSize);
            
            this.ctx.font = `${scoreFontSize}px Arial`;
            this.ctx.fillText(`Score: ${Math.floor(window.score)}`, this.displayWidth / 2, this.displayHeight / 2);
            
            this.ctx.textAlign = 'left';
            this.ctx.font = '20px Arial';
        }
    }
    
    repositionExistingEntities() {
        // Reposition obstacles to sit on new ground level
        if (window.obstacles) {
            window.obstacles.forEach(obstacle => {
                if (obstacle.type === 'spike') {
                    obstacle.y = window.GROUND_HEIGHT - obstacle.height;
                } else {
                    // Regular obstacles should also sit on ground
                    obstacle.y = window.GROUND_HEIGHT - obstacle.height;
                }
            });
        }
        
        // Reposition stairs
        if (window.stairs) {
            window.stairs.forEach(stair => {
                stair.y = window.GROUND_HEIGHT - stair.height;
            });
        }
        
        // Reposition coins (keep them floating above ground)
        if (window.coins) {
            window.coins.forEach(coin => {
                // Keep coins at proportional height above ground
                const coinHeight = window.GROUND_HEIGHT - 80;
                coin.y = Math.max(50, coinHeight);
            });
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameController = new GameController();
});