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
    PORTAL_SPAWN_INTERVAL: 500, // Every 500 points (reduced from 30000)
    FLYING_DURATION: 30000, // 30 seconds in flying mode
    FLYING_GRAVITY: 0.4,
    THRUST_FORCE: -0.5,
    AIR_RESISTANCE: 0.9,
    MAX_VERTICAL_SPEED: 8,

    // Player rotation (Geometry Dash style spin)
    CUBE_SPIN_SPEED: 0.042, // radians per frame - about a quarter turn (90°) over one jump
    JET_MAX_TILT: 25 * Math.PI / 180, // radians - ship nose tilts up to 25° with its vertical speed

    // Up-down mode constants
    TRANSITION_DURATION: 800, // milliseconds
    UP_DOWN_DURATION: 25000, // 25 seconds

    // Spider mode constants
    SPIDER_DURATION: 20000, // 20 seconds
    SPIDER_GRAVITY: 0.6,
    SPIDER_JUMP_FORCE: 12,

    // Power-up constants
    INVINCIBILITY_DURATION: 10000, // 10 seconds
    SUPER_INVINCIBILITY_DURATION: 8000, // 8 seconds
    ORB_SPAWN_INTERVAL: 100, // Every 100 points
    GREEN_ORB_SPAWN_INTERVAL: 1000, // Every 1000 points
    
    // Depth and shading (drawing only - none of these change a hitbox)
    PLAYER_BASE_COLOR: '#0000FF', // The cube's blue, written as a hex code so we can do color math on it
    SHADE_LIGHTEN: 0.45, // How much lighter the lit (top-left) side is: 0 = same, 1 = white
    SHADE_DARKEN: 0.45, // How much darker the shaded (bottom-right) side is: 0 = same, 1 = black
    SHADE_EDGE_SIZE: 0.15, // Bevel thickness as a fraction of the sprite size
    SHADOW_MAX_ALPHA: 0.35, // Shadow darkness when the player is standing on the ground
    SHADOW_MIN_ALPHA: 0.06, // Shadow darkness when the player is as high as it gets
    SHADOW_WIDTH_SCALE: 1.1, // Shadow width = player width x this, when on the ground
    SHADOW_MIN_SCALE: 0.4, // Shadow never shrinks smaller than this fraction of full size
    SHADOW_THICKNESS: 4, // Half-height of the shadow ellipse in pixels
    SHADOW_FADE_HEIGHT: 160, // Pixels above the surface at which the shadow is fully shrunk and faded
    GROUND_TILE_SIZE: 40, // Ground grid spacing in pixels (the grid scrolls at MOVE_SPEED)
    GROUND_EDGE_HEIGHT: 3, // Thickness of the lit top edge of the ground

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

// Color helpers for shading.
// A color is made of red, green and blue numbers from 0 to 255 (e.g. '#0000FF' is blue).
// Lightening mixes each number toward 255 (white); darkening mixes it toward 0 (black).
function parseHexColor(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; // '#F00' -> 'FF0000'
    }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHexColor(r, g, b) {
    const two = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return '#' + two(r) + two(g) + two(b);
}

// amount from 0 (no change) to 1 (pure white)
function lightenColor(hex, amount) {
    const [r, g, b] = parseHexColor(hex);
    return toHexColor(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

// amount from 0 (no change) to 1 (pure black)
function darkenColor(hex, amount) {
    const [r, g, b] = parseHexColor(hex);
    return toHexColor(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

// Game state enums
const GAME_STATES = {
    NORMAL: 'NORMAL',
    PORTAL_TRANSITION: 'PORTAL_TRANSITION',
    FLYING: 'FLYING',
    PORTAL_EXIT: 'PORTAL_EXIT',
    GREEN_PORTAL_TRANSITION: 'GREEN_PORTAL_TRANSITION',
    UP_DOWN_MODE: 'UP_DOWN_MODE',
    UP_DOWN_EXIT: 'UP_DOWN_EXIT',
    RED_PORTAL_TRANSITION: 'RED_PORTAL_TRANSITION',
    SPIDER_MODE: 'SPIDER_MODE',
    SPIDER_EXIT: 'SPIDER_EXIT'
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