// Player class and mechanics
class Player {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 100;
        this.y = GROUND_Y;
        this.width = GAME_CONFIG.PLAYER_SIZE;
        this.height = GAME_CONFIG.PLAYER_SIZE;
        this.velocityY = 0;
        this.isJumping = false;
        this.rotation = 0;
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
        if (this.y >= GROUND_Y) {
            this.y = GROUND_Y;
            this.velocityY = 0;
            this.isJumping = false;
        }
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
    }
    
    transformToSquare() {
        this.width = GAME_CONFIG.PLAYER_SIZE;
        this.height = GAME_CONFIG.PLAYER_SIZE;
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