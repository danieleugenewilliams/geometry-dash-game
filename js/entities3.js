// === OBSTACLES AND STAIRS ===

function updateObstacles() {
    window.obstacles.forEach(obstacle => {
        obstacle.x -= GAME_CONFIG.MOVE_SPEED;
    });
    
    // Remove off-screen obstacles
    window.obstacles = window.obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
}

function updateStairs() {
    window.stairs.forEach(stair => {
        stair.x -= GAME_CONFIG.MOVE_SPEED;
    });
    
    // Remove off-screen stairs
    window.stairs = window.stairs.filter(stair => stair.x + stair.width > 0);
}

function drawObstacle(ctx, obstacle) {
    ctx.fillStyle = '#ff4444';
    
    if (obstacle.type === 'spike') {
        // Draw spike triangle
        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y); // Top point
        ctx.lineTo(obstacle.x, obstacle.y + obstacle.height); // Bottom left
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height); // Bottom right
        ctx.closePath();
        ctx.fill();
        
        // Add outline
        ctx.strokeStyle = '#cc0000';
        ctx.lineWidth = 1;
        ctx.stroke();
    } else {
        // Draw regular rectangle obstacle
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
}

function drawStair(ctx, stair) {
    // Draw brown stair
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(stair.x, stair.y, stair.width, stair.height);
    
    // Add outline
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.strokeRect(stair.x, stair.y, stair.width, stair.height);
    
    // Add wood grain effect
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 1;
    for (let i = 1; i < stair.height; i += 8) {
        ctx.beginPath();
        ctx.moveTo(stair.x, stair.y + i);
        ctx.lineTo(stair.x + stair.width, stair.y + i);
        ctx.stroke();
    }
}

// === BONUS NOTIFICATIONS ===
function updateBonusNotifications() {
    window.bonusNotifications = window.bonusNotifications.filter(notification => {
        notification.timer += 16; // Increment timer
        notification.y -= 1; // Float upward
        return notification.timer < notification.maxTimer;
    });
}

function drawBonusNotifications(ctx) {
    window.bonusNotifications.forEach(notification => {
        ctx.save();
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 3;
        ctx.fillText(notification.text, notification.x, notification.y);
        ctx.restore();
    });
}

// === ENTITY DRAWING FUNCTIONS ===
function drawAllEntities(ctx) {
    // Draw coins
    window.coins.forEach(coin => {
        if (!coin.collected) {
            drawCoin(ctx, coin);
        }
    });
    
    // Draw obstacles
    window.obstacles.forEach(obstacle => {
        drawObstacle(ctx, obstacle);
    });
    
    // Draw stairs
    window.stairs.forEach(stair => {
        drawStair(ctx, stair);
    });
    
    // Draw portals
    window.portals.forEach(portal => {
        drawPortal(ctx, portal);
    });
    
    // Draw green portals
    window.greenPortals.forEach(portal => {
        drawGreenPortal(ctx, portal);
    });
    
    // Draw asteroids (flying mode)
    window.asteroids.forEach(asteroid => {
        drawAsteroid(ctx, asteroid);
    });
    
    // Draw ceiling spikes
    window.ceilingSpikes.forEach(spike => {
        drawCeilingSpike(ctx, spike);
    });
    
    // Draw orange orbs
    window.orangeOrbs.forEach(orb => {
        if (!orb.collected) {
            drawOrangeOrb(ctx, orb);
        }
    });
    
    // Draw green orbs
    window.greenOrbs.forEach(orb => {
        if (!orb.collected) {
            drawGreenOrb(ctx, orb);
        }
    });
    
    // Draw sparkles
    drawSparkles(ctx);
    
    // Draw bonus notifications
    drawBonusNotifications(ctx);
}

// === ENTITY UPDATE FUNCTIONS ===
function updateAllEntities(gameState) {
    updateCoins();
    updateObstacles();
    updateStairs();
    updatePortals();
    updateGreenPortals();
    updateCeilingSpikes();
    updateOrangeOrbs();
    updateGreenOrbs();
    updateSparkles();
    updateBonusNotifications();
    
    if (gameState === GAME_STATES.FLYING) {
        updateAsteroids();
        generateAsteroids();
    }
    
    // Generate entities based on game mode
    if (window.gameMode === GAME_MODES.ENDLESS) {
        generateCoins(gameState);
        generateOrangeOrb();
        generateGreenOrb();
    }
}