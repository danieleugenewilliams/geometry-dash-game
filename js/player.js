// Player class and mechanics
class Player {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 100;
        this.y = getCurrentGroundY();
        this.width = GAME_CONFIG.PLAYER_SIZE;
        this.height = GAME_CONFIG.PLAYER_SIZE;
        this.velocityY = 0;
        this.isJumping = false;
        this.rotation = 0;
        this.gravityFlipped = false; // Spider mode: false = gravity pulls down
    }
    
    jump() {
        if (!this.isJumping) {
            this.velocityY = GAME_CONFIG.JUMP_FORCE;
            this.isJumping = true;
        }
    }
    
    updateNormal() {
        // Apply gravity
        this.velocityY += GAME_CONFIG.GRAVITY;
        this.y += this.velocityY;
        
        // Ground collision
        const groundY = getCurrentGroundY();
        if (this.y >= groundY) {
            this.y = groundY;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // Spin while in the air, land square on the ground (or a stair)
        if (this.isJumping) {
            this.rotation += GAME_CONFIG.CUBE_SPIN_SPEED;
        } else {
            this.snapRotation();
        }
    }

    // Snap rotation to the nearest quarter turn (90°) so the cube sits flat
    snapRotation() {
        const quarterTurn = Math.PI / 2;
        this.rotation = Math.round(this.rotation / quarterTurn) * quarterTurn;
        this.rotation %= Math.PI * 2; // Keep the angle small after many spins
    }
    
    updateFlying(spaceKeyPressed) {
        if (spaceKeyPressed) {
            this.velocityY += GAME_CONFIG.THRUST_FORCE;
        } else {
            this.velocityY += GAME_CONFIG.FLYING_GRAVITY;
        }
        
        // Apply air resistance
        this.velocityY *= GAME_CONFIG.AIR_RESISTANCE;
        
        // Limit vertical speed
        this.velocityY = Math.max(-GAME_CONFIG.MAX_VERTICAL_SPEED,
                                 Math.min(GAME_CONFIG.MAX_VERTICAL_SPEED, this.velocityY));

        // Tilt the ship with its vertical speed (nose up when rising, down when falling)
        const tilt = (this.velocityY / GAME_CONFIG.MAX_VERTICAL_SPEED) * GAME_CONFIG.JET_MAX_TILT;
        this.rotation = Math.max(-GAME_CONFIG.JET_MAX_TILT, Math.min(GAME_CONFIG.JET_MAX_TILT, tilt));

        // Update position
        this.y += this.velocityY;
        
        // Screen boundaries
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }
        if (this.y + this.height > GAME_CONFIG.CANVAS_HEIGHT) {
            this.y = GAME_CONFIG.CANVAS_HEIGHT - this.height;
            this.velocityY = 0;
        }
    }
    
    updateUpDown(playerPosition, transitionProgress, transitionStartY, transitionTargetY) {
        if (playerPosition === PLAYER_POSITIONS.TRANSITIONING) {
            // Smooth easing function (ease-in-out)
            const easeProgress = 0.5 * (1 - Math.cos(transitionProgress * Math.PI));
            
            // Calculate current position along arc
            this.y = transitionStartY + (transitionTargetY - transitionStartY) * easeProgress;
            
            // Add slight rotation during transition
            this.rotation = Math.sin(transitionProgress * Math.PI) * 0.5;
        } else {
            this.rotation = 0;
        }
    }
    
    transformToJet() {
        this.width = 40;
        this.height = 20;
        this.y = GAME_CONFIG.CANVAS_HEIGHT / 2; // Center vertically
        this.rotation = 0;
        // You always jump into a portal, so forget the jump speed - otherwise
        // the ship shoots up (or dives) the moment flying mode starts
        this.velocityY = 0;
        this.isJumping = false;
    }

    transformToSquare() {
        this.width = GAME_CONFIG.PLAYER_SIZE;
        this.height = GAME_CONFIG.PLAYER_SIZE;
        this.rotation = 0; // Drop any leftover flying tilt
    }

    transformToSpider() {
        this.width = 35;
        this.height = 25;
        this.gravityFlipped = false;
        // Forget the jump that carried us into the red portal, so the spider
        // starts by falling to the floor instead of launching into the air
        this.velocityY = 0;
        this.isJumping = false;
    }

    updateSpider() {
        const gravity = this.gravityFlipped ? -GAME_CONFIG.SPIDER_GRAVITY : GAME_CONFIG.SPIDER_GRAVITY;
        this.velocityY += gravity;
        this.y += this.velocityY;

        // Ground collision (walking on floor)
        // The spider is shorter than the cube, so rest its own bottom edge on the
        // floor instead of using the cube's GROUND_Y (which would float it 5px up)
        const groundY = getCurrentGroundHeight() - this.height;
        if (!this.gravityFlipped && this.y >= groundY) {
            this.y = groundY;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // Ceiling collision (walking on ceiling)
        if (this.gravityFlipped && this.y <= GAME_CONFIG.CEILING_Y) {
            this.y = GAME_CONFIG.CEILING_Y;
            this.velocityY = 0;
            this.isJumping = false;
        }
    }

    flipGravity() {
        if (!this.isJumping) {
            this.gravityFlipped = !this.gravityFlipped;
            this.velocityY = this.gravityFlipped ? -GAME_CONFIG.SPIDER_JUMP_FORCE : GAME_CONFIG.SPIDER_JUMP_FORCE;
            this.isJumping = true;
        }
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    getCenterX() {
        return this.x + this.width / 2;
    }
    
    getCenterY() {
        return this.y + this.height / 2;
    }
}

// Player drawing functions

// Soft shadow on the surface under (or above) the player.
// Drawn separately from the sprite so it sits under the obstacles too.
// A shadow tells your eye how far something is from the ground: big and dark
// means "touching", small and faint means "way up in the air".
// floorY is the surface the shadow lands on in NORMAL/spider/up-down mode.
function drawPlayerShadow(ctx, player, gameState, floorY) {
    const playerTop = player.y;
    const playerBottom = player.y + player.height;

    // Pick the surface: the floor, or the ceiling if the player is closer to it
    // (up-down mode on the ceiling, or the spider walking upside down)
    let surfaceY = floorY;
    let onCeiling = false;
    const canUseCeiling = gameState === GAME_STATES.UP_DOWN_MODE ||
                          gameState === GAME_STATES.SPIDER_MODE ||
                          gameState === GAME_STATES.UP_DOWN_EXIT ||
                          gameState === GAME_STATES.SPIDER_EXIT;
    if (canUseCeiling) {
        const distanceToFloor = floorY - playerBottom;
        const distanceToCeiling = playerTop - GAME_CONFIG.CEILING_Y;
        if (distanceToCeiling < distanceToFloor) {
            surfaceY = GAME_CONFIG.CEILING_Y;
            onCeiling = true;
        }
    }

    // How high is the player above the surface? 0 = touching, 1 = far away
    const gap = onCeiling ? (playerTop - surfaceY) : (surfaceY - playerBottom);
    const height = Math.max(0, Math.min(1, gap / GAME_CONFIG.SHADOW_FADE_HEIGHT));

    // Higher = smaller and fainter
    const scale = 1 - (1 - GAME_CONFIG.SHADOW_MIN_SCALE) * height;
    const alpha = GAME_CONFIG.SHADOW_MAX_ALPHA - (GAME_CONFIG.SHADOW_MAX_ALPHA - GAME_CONFIG.SHADOW_MIN_ALPHA) * height;

    const radiusX = (player.width * GAME_CONFIG.SHADOW_WIDTH_SCALE / 2) * scale;
    const radiusY = GAME_CONFIG.SHADOW_THICKNESS * scale;
    // Nudge the shadow into the surface so a standing player's shadow peeks out
    // around its feet instead of floating on the surface line
    const centerY = onCeiling ? surfaceY + radiusY / 2 : surfaceY - radiusY / 2;

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(player.getCenterX(), centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawPlayer(ctx, player, gameState, isInvincible, isSuperInvincible, invincibilityTimer, superInvincibilityTimer) {
    if (gameState === GAME_STATES.FLYING) {
        drawJet(ctx, player, isInvincible, isSuperInvincible, invincibilityTimer, superInvincibilityTimer);
    } else if (gameState === GAME_STATES.SPIDER_MODE) {
        drawSpider(ctx, player, isInvincible, isSuperInvincible, invincibilityTimer, superInvincibilityTimer);
    } else {
        drawSquare(ctx, player, isInvincible, isSuperInvincible, invincibilityTimer, superInvincibilityTimer);
    }
}

function drawSquare(ctx, player, isInvincible, isSuperInvincible, invincibilityTimer, superInvincibilityTimer) {
    ctx.save();

    // Add invincibility glow effects
    if (isSuperInvincible) {
        // Green and blue flashing for super invincibility
        const flashRate = Math.floor(superInvincibilityTimer / 80) % 2;
        ctx.shadowColor = flashRate === 0 ? '#00FF00' : '#0000FF';
        ctx.shadowBlur = 20;

        if (flashRate === 0) {
            ctx.globalAlpha = 0.9;
        }
    } else if (isInvincible) {
        // Orange orb invincibility effect
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 15;

        const flashRate = Math.floor(invincibilityTimer / 100) % 2;
        if (flashRate === 0) {
            ctx.globalAlpha = 0.8;
        }
    }

    // Spin the whole drawing around the cube's center (drawing only - the hitbox
    // stays an upright square). With rotation 0 this is the same as drawing at (x, y).
    // From here on, (0, 0) is the cube's top-left corner.
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    ctx.rotate(player.rotation);
    ctx.translate(-player.width/2, -player.height/2);

    const w = player.width;
    const h = player.height;
    const base = GAME_CONFIG.PLAYER_BASE_COLOR;
    const light = lightenColor(base, GAME_CONFIG.SHADE_LIGHTEN);
    const dark = darkenColor(base, GAME_CONFIG.SHADE_DARKEN);
    const edge = Math.max(2, Math.round(w * GAME_CONFIG.SHADE_EDGE_SIZE));

    // Face: a gradient from light (top-left, where the light is) to dark (bottom-right)
    const faceGradient = ctx.createLinearGradient(0, 0, w, h);
    faceGradient.addColorStop(0, lightenColor(base, GAME_CONFIG.SHADE_LIGHTEN / 2));
    faceGradient.addColorStop(0.5, base);
    faceGradient.addColorStop(1, darkenColor(base, GAME_CONFIG.SHADE_DARKEN / 2));
    ctx.fillStyle = faceGradient;
    ctx.fillRect(0, 0, w, h);

    // Bevels: light strips on the top and left edges, dark strips on the bottom and right.
    // These are what make a flat square look like a block with thickness.
    ctx.shadowBlur = 0; // Only the main face casts the invincibility glow
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, edge); // Top
    ctx.fillRect(0, 0, edge, h); // Left
    ctx.fillStyle = dark;
    ctx.fillRect(0, h - edge, w, edge); // Bottom
    ctx.fillRect(w - edge, 0, edge, h); // Right
    // Corners where light and dark strips meet: cut them diagonally
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(w - edge, 0); ctx.lineTo(w, 0); ctx.lineTo(w - edge, edge); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, h - edge); ctx.lineTo(edge, h - edge); ctx.lineTo(0, h); ctx.closePath();
    ctx.fill();

    // Small highlight: a little bright spot near the top-left corner, like a shiny block
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillRect(edge + 2, edge + 2, Math.max(2, edge - 1), Math.max(2, edge - 1));

    // Thin dark outline so the cube stands out from the background
    ctx.strokeStyle = darkenColor(base, 0.7);
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // Add invincibility outlines
    if (isSuperInvincible) {
        const flashRate = Math.floor(superInvincibilityTimer / 80) % 2;
        ctx.strokeStyle = flashRate === 0 ? '#00FF00' : '#0000FF';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        ctx.strokeRect(0, 0, w, h);
    } else if (isInvincible) {
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.strokeRect(0, 0, w, h);
    }

    ctx.restore();
}

function drawJet(ctx, player, isInvincible, isSuperInvincible, invincibilityTimer, superInvincibilityTimer, spaceKeyPressed) {
    ctx.save();

    // Tilt the whole ship around its center (drawing only - the hitbox stays the same)
    ctx.translate(player.getCenterX(), player.getCenterY());
    ctx.rotate(player.rotation);
    ctx.translate(-player.getCenterX(), -player.getCenterY());

    // Add invincibility glow effects
    if (isSuperInvincible) {
        // Green and blue flashing for super invincibility
        const flashRate = Math.floor(superInvincibilityTimer / 80) % 2;
        ctx.shadowColor = flashRate === 0 ? '#00FF00' : '#0000FF';
        ctx.shadowBlur = 20;
        
        if (flashRate === 0) {
            ctx.globalAlpha = 0.9;
        }
    } else if (isInvincible) {
        // Orange orb invincibility effect
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 15;
        
        const flashRate = Math.floor(invincibilityTimer / 100) % 2;
        if (flashRate === 0) {
            ctx.globalAlpha = 0.8;
        }
    }
    
    // Main body (triangle), lit from the top: lighter on top, darker underneath
    const hullColor = '#C0C0C0';
    const hullGradient = ctx.createLinearGradient(0, player.y, 0, player.y + player.height);
    hullGradient.addColorStop(0, lightenColor(hullColor, GAME_CONFIG.SHADE_LIGHTEN / 2));
    hullGradient.addColorStop(0.5, hullColor);
    hullGradient.addColorStop(1, darkenColor(hullColor, GAME_CONFIG.SHADE_DARKEN));
    ctx.fillStyle = hullGradient;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width, player.y + player.height/2); // Point
    ctx.lineTo(player.x, player.y); // Top back
    ctx.lineTo(player.x, player.y + player.height); // Bottom back
    ctx.closePath();
    ctx.fill();

    // Dark line along the underside of the hull (the side facing away from the light)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = darkenColor(hullColor, GAME_CONFIG.SHADE_DARKEN);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height/2);
    ctx.stroke();
    
    // Exhaust flames
    ctx.fillStyle = spaceKeyPressed ? '#00BFFF' : '#4169E1';
    ctx.beginPath();
    ctx.ellipse(player.x - 10, player.y + player.height/2, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wing details
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(player.x + player.width/3, player.y - 2, player.width/3, 2);
    ctx.fillRect(player.x + player.width/3, player.y + player.height, player.width/3, 2);
    
    // Add invincibility outlines
    if (isSuperInvincible) {
        ctx.shadowBlur = 0;
        const flashRate = Math.floor(superInvincibilityTimer / 80) % 2;
        ctx.strokeStyle = flashRate === 0 ? '#00FF00' : '#0000FF';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        
        ctx.beginPath();
        ctx.moveTo(player.x + player.width, player.y + player.height/2);
        ctx.lineTo(player.x, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.closePath();
        ctx.stroke();
    } else if (isInvincible) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.moveTo(player.x + player.width, player.y + player.height/2);
        ctx.lineTo(player.x, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.closePath();
        ctx.stroke();
    }

    ctx.restore();
}

function drawSpider(ctx, player, isInvincible, isSuperInvincible, invincibilityTimer, superInvincibilityTimer) {
    ctx.save();

    // Add invincibility glow effects
    if (isSuperInvincible) {
        const flashRate = Math.floor(superInvincibilityTimer / 80) % 2;
        ctx.shadowColor = flashRate === 0 ? '#00FF00' : '#0000FF';
        ctx.shadowBlur = 20;
        if (flashRate === 0) {
            ctx.globalAlpha = 0.9;
        }
    } else if (isInvincible) {
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 15;
        const flashRate = Math.floor(invincibilityTimer / 100) % 2;
        if (flashRate === 0) {
            ctx.globalAlpha = 0.8;
        }
    }

    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    const flipped = player.gravityFlipped;

    // Spider body (dark red/maroon ellipse), lit from the top-left so it looks round
    const bodyColor = '#8B0000';
    const bodyGradient = ctx.createRadialGradient(
        centerX - player.width / 8, centerY - player.height / 5, 2,
        centerX, centerY, player.width / 2.5
    );
    bodyGradient.addColorStop(0, lightenColor(bodyColor, GAME_CONFIG.SHADE_LIGHTEN));
    bodyGradient.addColorStop(0.6, bodyColor);
    bodyGradient.addColorStop(1, darkenColor(bodyColor, GAME_CONFIG.SHADE_DARKEN));
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, player.width / 2.5, player.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // Only the body casts the invincibility glow

    // Spider head (smaller circle)
    const headOffset = flipped ? player.height / 3 : -player.height / 3;
    ctx.fillStyle = '#660000';
    ctx.beginPath();
    ctx.arc(centerX, centerY + headOffset, player.width / 5, 0, Math.PI * 2);
    ctx.fill();

    // Spider eyes (two small red dots)
    ctx.fillStyle = '#FF0000';
    const eyeY = centerY + headOffset + (flipped ? 3 : -3);
    ctx.beginPath();
    ctx.arc(centerX - 4, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 4, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Spider legs (8 legs, 4 on each side)
    ctx.strokeStyle = '#4A0000';
    ctx.lineWidth = 2;

    const legAngles = [0.3, 0.6, 0.9, 1.2];
    const legLength = 15;

    // Animate legs
    const legWiggle = Math.sin(Date.now() / 100) * 0.1;

    for (let i = 0; i < legAngles.length; i++) {
        const angle = legAngles[i] + legWiggle;
        const yDir = flipped ? -1 : 1;

        // Left legs
        ctx.beginPath();
        ctx.moveTo(centerX - 5, centerY);
        ctx.lineTo(centerX - 5 - Math.cos(angle) * legLength, centerY + yDir * Math.sin(angle) * legLength);
        ctx.stroke();

        // Right legs
        ctx.beginPath();
        ctx.moveTo(centerX + 5, centerY);
        ctx.lineTo(centerX + 5 + Math.cos(angle) * legLength, centerY + yDir * Math.sin(angle) * legLength);
        ctx.stroke();
    }

    // Add invincibility outlines
    if (isSuperInvincible) {
        ctx.shadowBlur = 0;
        const flashRate = Math.floor(superInvincibilityTimer / 80) % 2;
        ctx.strokeStyle = flashRate === 0 ? '#00FF00' : '#0000FF';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, player.width / 2.5, player.height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
    } else if (isInvincible) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, player.width / 2.5, player.height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}