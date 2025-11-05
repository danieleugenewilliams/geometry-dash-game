// === OBSTACLES AND STAIRS ===

function generateObstacles() {
    const obstacleSpawnChance = 0.008; // 0.8% chance per frame
    
    if (Math.random() < obstacleSpawnChance) {
        const obstacle = {
            x: GAME_CONFIG.CANVAS_WIDTH + 20,
            y: 0, // Will be calculated below
            width: 20,
            height: 20,
            type: 'spike'
        };
        
        // Position spike so bottom sits on ground
        obstacle.y = getCurrentGroundHeight() - obstacle.height;
        
        // Basic collision avoidance with existing obstacles
        let validPosition = true;
        for (let existing of window.obstacles) {
            if (Math.abs(obstacle.x - existing.x) < 60) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with stairs
        for (let stair of window.stairs) {
            if (Math.abs(obstacle.x - stair.x) < 80) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            window.obstacles.push(obstacle);
        }
    }
}

function generateStairs() {
    const stairSpawnChance = 0.005; // 0.5% chance per frame
    
    if (Math.random() < stairSpawnChance) {
        const heights = [30, 50, 70];
        const widths = [40, 60, 80];
        
        const stair = {
            x: GAME_CONFIG.CANVAS_WIDTH + 20,
            y: 0, // Will be calculated below
            width: widths[Math.floor(Math.random() * widths.length)],
            height: heights[Math.floor(Math.random() * heights.length)],
            type: 'stair'
        };
        
        // Position stair so bottom sits on ground
        stair.y = getCurrentGroundHeight() - stair.height;
        
        // Basic collision avoidance with existing stairs and obstacles
        let validPosition = true;
        
        // Check collision with existing stairs
        for (let existing of window.stairs) {
            if (Math.abs(stair.x - existing.x) < stair.width + 40) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with obstacles
        for (let obstacle of window.obstacles) {
            if (Math.abs(stair.x - obstacle.x) < stair.width + 40) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            window.stairs.push(stair);
        }
    }
}

function generatePortals() {
    const currentScore = Math.floor(window.score);
    const portalsToSpawn = Math.floor(currentScore / GAME_CONFIG.PORTAL_SPAWN_INTERVAL) - Math.floor(window.lastPortalSpawnScore / GAME_CONFIG.PORTAL_SPAWN_INTERVAL);
    
    if (portalsToSpawn > 0) {
        window.lastPortalSpawnScore = currentScore;
        
        const portal = {
            x: GAME_CONFIG.CANVAS_WIDTH + 100,
            y: getCurrentGroundHeight() - 120,
            width: 80,
            height: 80,
            rotation: 0,
            particles: []
        };
        
        // Basic collision avoidance
        let validPosition = true;
        
        // Check collision with existing portals
        for (let existing of window.portals) {
            if (Math.abs(portal.x - existing.x) < 200) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with green portals
        for (let existing of window.greenPortals) {
            if (Math.abs(portal.x - existing.x) < 200) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with stairs and obstacles
        for (let stair of window.stairs) {
            if (Math.abs(portal.x - stair.x) < 120) {
                validPosition = false;
                break;
            }
        }
        
        for (let obstacle of window.obstacles) {
            if (Math.abs(portal.x - obstacle.x) < 120) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            window.portals.push(portal);
        }
    }
}

function generateGreenPortals() {
    const currentScore = Math.floor(window.score);
    const greenPortalsToSpawn = Math.floor(currentScore / (GAME_CONFIG.PORTAL_SPAWN_INTERVAL * 1.5)) - Math.floor(window.lastGreenPortalSpawnScore / (GAME_CONFIG.PORTAL_SPAWN_INTERVAL * 1.5));
    
    if (greenPortalsToSpawn > 0) {
        window.lastGreenPortalSpawnScore = currentScore;
        
        const greenPortal = {
            x: GAME_CONFIG.CANVAS_WIDTH + 100,
            y: getCurrentGroundHeight() - 120,
            width: 80,
            height: 80,
            rotation: 0,
            particles: []
        };
        
        // Basic collision avoidance
        let validPosition = true;
        
        // Check collision with existing green portals
        for (let existing of window.greenPortals) {
            if (Math.abs(greenPortal.x - existing.x) < 200) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with regular portals
        for (let existing of window.portals) {
            if (Math.abs(greenPortal.x - existing.x) < 200) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with stairs and obstacles
        for (let stair of window.stairs) {
            if (Math.abs(greenPortal.x - stair.x) < 120) {
                validPosition = false;
                break;
            }
        }
        
        for (let obstacle of window.obstacles) {
            if (Math.abs(greenPortal.x - obstacle.x) < 120) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            window.greenPortals.push(greenPortal);
        }
    }
}

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
        
        // Generate obstacles and stairs in normal mode
        if (gameState === GAME_STATES.NORMAL || gameState === GAME_STATES.UP_DOWN_MODE) {
            generateObstacles();
            generateStairs();
            generatePortals();
            generateGreenPortals();
        }
    }
}