// Game constants and configuration
const GAME_CONFIG = {
    // Canvas and display
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 400,
    
    // Player properties
    PLAYER_SIZE: 30,
    GRAVITY: 0.8,
    JUMP_FORCE: -15,
    MOVE_SPEED: 5,
    
    // World dimensions - these will be updated dynamically
    GROUND_HEIGHT: 350, // canvas.height - 50
    CEILING_Y: 50,
    
    // Portal and flying constants
    PORTAL_SPAWN_INTERVAL: 30000, // 30 seconds in milliseconds
    FLYING_DURATION: 30000, // 30 seconds in flying mode
    FLYING_GRAVITY: 0.4,
    THRUST_FORCE: -0.5,
    AIR_RESISTANCE: 0.9,
    MAX_VERTICAL_SPEED: 8,
    
    // Up-down mode constants
    TRANSITION_DURATION: 800, // milliseconds
    UP_DOWN_DURATION: 25000, // 25 seconds
    
    // Power-up constants
    INVINCIBILITY_DURATION: 10000, // 10 seconds
    SUPER_INVINCIBILITY_DURATION: 8000, // 8 seconds
    ORB_SPAWN_INTERVAL: 100, // Every 100 points
    GREEN_ORB_SPAWN_INTERVAL: 1000, // Every 1000 points
    
    // Auto replay
    AUTO_REPLAY_DELAY: 1000, // 1 second delay before auto restart
    
    // Frame rate
    TARGET_FPS: 60,
    FRAME_TIME: 16 // ~60fps
};

// Helper function to get current ground height
function getCurrentGroundHeight() {
    return window.GROUND_HEIGHT || GAME_CONFIG.GROUND_HEIGHT;
}

// Helper function to get current ground Y (where player sits)
function getCurrentGroundY() {
    return window.GROUND_Y || (GAME_CONFIG.GROUND_HEIGHT - GAME_CONFIG.PLAYER_SIZE);
}

// Game state enums
const GAME_STATES = {
    NORMAL: 'NORMAL',
    PORTAL_TRANSITION: 'PORTAL_TRANSITION',
    FLYING: 'FLYING',
    PORTAL_EXIT: 'PORTAL_EXIT',
    GREEN_PORTAL_TRANSITION: 'GREEN_PORTAL_TRANSITION',
    UP_DOWN_MODE: 'UP_DOWN_MODE',
    UP_DOWN_EXIT: 'UP_DOWN_EXIT'
};

const PLAYER_POSITIONS = {
    GROUND: 'GROUND',
    CEILING: 'CEILING',
    TRANSITIONING: 'TRANSITIONING'
};

const GAME_MODES = {
    ENDLESS: 'endless',
    LEVEL: 'level'
};

// Calculated constants
const GROUND_Y = GAME_CONFIG.GROUND_HEIGHT - GAME_CONFIG.PLAYER_SIZE;