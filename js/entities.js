// Entity Systems: Coins, Obstacles, Orbs, Portals, etc.

// === COLLISION DETECTION ===
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function checkCoinCollision(player, coin) {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const coinCenterX = coin.x + coin.width / 2;
    const coinCenterY = coin.y + coin.height / 2;
    
    const distance = Math.sqrt(
        Math.pow(playerCenterX - coinCenterX, 2) + 
        Math.pow(playerCenterY - coinCenterY, 2)
    );
    
    const playerRadius = Math.min(player.width, player.height) / 2;
    const coinRadius = coin.width / 2;
    
    return distance <= playerRadius + coinRadius;
}

function checkOrbCollision(player, orb) {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const orbCenterX = orb.x + orb.width / 2;
    const orbCenterY = orb.y + orb.height / 2;
    
    const distance = Math.sqrt(
        Math.pow(playerCenterX - orbCenterX, 2) + 
        Math.pow(playerCenterY - orbCenterY, 2)
    );
    
    const playerRadius = Math.min(player.width, player.height) / 2;
    const orbRadius = orb.width / 2;
    
    return distance <= playerRadius + orbRadius;
}

// === STAIR COLLISION DETECTION ===
function checkStairLanding(player, stair) {
    return player.x < stair.x + stair.width &&
           player.x + player.width > stair.x &&
           player.y + player.height >= stair.y &&
           player.y + player.height <= stair.y + 15 && // Landing tolerance
           player.velocityY > 0; // Falling down
}

function checkStairSideCollision(player, stair) {
    const collision = checkCollision(player, stair);
    const landing = checkStairLanding(player, stair);
    return collision && !landing;
}

function checkStairTumble(player, stair) {
    return player.x < stair.x + stair.width &&
           player.x + player.width > stair.x &&
           player.y + player.height > stair.y + stair.height - 10 && // On top of stair
           player.velocityY >= 0;
}

// === COIN SYSTEM ===
function generateCoins(gameState) {
    const coinSpawnChance = 0.01; // 1% chance per frame
    
    if (Math.random() < coinSpawnChance) {
        let yPosition;
        
        if (gameState === GAME_STATES.FLYING) {
            yPosition = 30 + Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 60);
        } else {
            const heightOptions = [
                GAME_CONFIG.GROUND_HEIGHT - 30, // Ground level
                GAME_CONFIG.GROUND_HEIGHT - 80, // Jump height
                GAME_CONFIG.GROUND_HEIGHT - 130, // High jump height
                GAME_CONFIG.GROUND_HEIGHT - 180  // Very high
            ];
            yPosition = heightOptions[Math.floor(Math.random() * heightOptions.length)];
        }
        
        const newCoin = {
            x: GAME_CONFIG.CANVAS_WIDTH + 20,
            y: yPosition,
            width: 20,
            height: 20,
            rotation: 0,
            collected: false
        };
        
        // Basic collision avoidance with obstacles and other coins
        let validPosition = true;
        
        // Check distance from other coins
        for (let existing of window.coins) {
            const dx = newCoin.x - existing.x;
            const dy = newCoin.y - existing.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 60) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with stairs/platforms in normal mode
        if (validPosition && gameState === GAME_STATES.NORMAL) {
            for (let stair of window.stairs) {
                if (checkCollision(newCoin, stair)) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        // Check collision with obstacles in normal mode
        if (validPosition && gameState === GAME_STATES.NORMAL) {
            for (let obstacle of window.obstacles) {
                if (checkCollision(newCoin, obstacle)) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        // Check collision with asteroids in flying mode
        if (validPosition && gameState === GAME_STATES.FLYING) {
            for (let asteroid of window.asteroids) {
                if (checkCollision(newCoin, asteroid)) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        if (validPosition) {
            window.coins.push(newCoin);
        }
    }
}

function updateCoins() {
    window.coins.forEach(coin => {
        coin.x -= GAME_CONFIG.MOVE_SPEED;
        coin.rotation += 0.1; // Spinning animation
    });
    
    // Remove off-screen coins
    window.coins = window.coins.filter(coin => coin.x + coin.width > 0);
}

function drawCoin(ctx, coin) {
    ctx.save();
    ctx.translate(coin.x + coin.width/2, coin.y + coin.height/2);
    ctx.rotate(coin.rotation);
    
    // Draw gold coin with gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.width/2);
    gradient.addColorStop(0, '#FFD700'); // Gold center
    gradient.addColorStop(0.7, '#FFA500'); // Orange middle
    gradient.addColorStop(1, '#B8860B'); // Dark gold edge
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, coin.width/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(-coin.width/6, -coin.width/6, coin.width/4, 0, Math.PI * 2);
    ctx.fill();
    
    // Add border
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, coin.width/2, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
}

// === ORANGE ORB SYSTEM ===
function generateOrangeOrb() {
    const currentScore = Math.floor(window.score);
    const orbsToSpawn = Math.floor(currentScore / GAME_CONFIG.ORB_SPAWN_INTERVAL) - Math.floor(window.lastOrbSpawnScore / GAME_CONFIG.ORB_SPAWN_INTERVAL);
    
    if (orbsToSpawn > 0) {
        window.lastOrbSpawnScore = currentScore;
        
        let yPosition;
        if (window.gameState === GAME_STATES.FLYING) {
            yPosition = 50 + Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 100);
        } else {
            yPosition = GAME_CONFIG.GROUND_HEIGHT - 80 - Math.random() * 100;
        }
        
        const newOrb = {
            x: GAME_CONFIG.CANVAS_WIDTH + 50,
            y: yPosition,
            width: 25,
            height: 25,
            rotation: 0,
            collected: false,
            pulseTimer: 0
        };
        
        // Basic collision avoidance
        let validPosition = true;
        
        // Check collision with existing orbs
        for (let existing of window.orangeOrbs) {
            const dx = newOrb.x - existing.x;
            const dy = newOrb.y - existing.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 80) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with coins
        for (let coin of window.coins) {
            const dx = newOrb.x - coin.x;
            const dy = newOrb.y - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 60) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with obstacles in normal mode
        if (validPosition && window.gameState === GAME_STATES.NORMAL) {
            for (let obstacle of window.obstacles) {
                if (checkCollision(newOrb, obstacle)) {
                    validPosition = false;
                    break;
                }
            }
            
            for (let stair of window.stairs) {
                if (checkCollision(newOrb, stair)) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        if (validPosition) {
            window.orangeOrbs.push(newOrb);
        }
    }
}

function updateOrangeOrbs() {
    window.orangeOrbs.forEach(orb => {
        orb.x -= GAME_CONFIG.MOVE_SPEED;
        orb.rotation += 0.05;
        orb.pulseTimer += 0.1;
    });
    
    // Remove off-screen orbs
    window.orangeOrbs = window.orangeOrbs.filter(orb => orb.x + orb.width > 0);
}

function drawOrangeOrb(ctx, orb) {
    ctx.save();
    ctx.translate(orb.x + orb.width/2, orb.y + orb.height/2);
    ctx.rotate(orb.rotation);
    
    // Pulsing effect
    const pulse = 1 + Math.sin(orb.pulseTimer) * 0.2;
    ctx.scale(pulse, pulse);
    
    // Draw orange orb with gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, orb.width/2);
    gradient.addColorStop(0, '#FFD700'); // Gold center
    gradient.addColorStop(0.3, '#FFA500'); // Orange
    gradient.addColorStop(0.7, '#FF8C00'); // Dark orange
    gradient.addColorStop(1, '#FF4500'); // Red orange edge
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, orb.width/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = '#FF8C00';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, orb.width/2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add inner sparkle
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(-orb.width/6, -orb.width/6, orb.width/6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}