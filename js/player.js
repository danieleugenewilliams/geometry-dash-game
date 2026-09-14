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
    
    // Apply rotation if in transition
    if (player.rotation !== 0) {
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        ctx.rotate(player.rotation);
        ctx.translate(-player.width/2, -player.height/2);
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, player.width, player.height);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Add invincibility outlines
    if (isSuperInvincible) {
        ctx.shadowBlur = 0;
        const flashRate = Math.floor(superInvincibilityTimer / 80) % 2;
        ctx.strokeStyle = flashRate === 0 ? '#00FF00' : '#0000FF';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        
        if (player.rotation !== 0) {
            ctx.strokeRect(0, 0, player.width, player.height);
        } else {
            ctx.strokeRect(player.x, player.y, player.width, player.height);
        }
    } else if (isInvincible) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        
        if (player.rotation !== 0) {
            ctx.strokeRect(0, 0, player.width, player.height);
        } else {
            ctx.strokeRect(player.x, player.y, player.width, player.height);
        }
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
    
    // Main body (triangle)
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width, player.y + player.height/2); // Point
    ctx.lineTo(player.x, player.y); // Top back
    ctx.lineTo(player.x, player.y + player.height); // Bottom back
    ctx.closePath();
    ctx.fill();
    
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

    // Spider body (dark red/maroon ellipse)
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, player.width / 2.5, player.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

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