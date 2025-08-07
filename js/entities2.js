// === GREEN ORB SYSTEM ===
function generateGreenOrb() {
    const currentScore = Math.floor(window.score);
    const greenOrbsToSpawn = Math.floor(currentScore / GAME_CONFIG.GREEN_ORB_SPAWN_INTERVAL) - Math.floor(window.lastGreenOrbSpawnScore / GAME_CONFIG.GREEN_ORB_SPAWN_INTERVAL);
    
    if (greenOrbsToSpawn > 0) {
        window.lastGreenOrbSpawnScore = currentScore;
        
        let yPosition;
        if (window.gameState === GAME_STATES.FLYING) {
            yPosition = 60 + Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 120);
        } else {
            yPosition = GAME_CONFIG.GROUND_HEIGHT - 90 - Math.random() * 120;
        }
        
        const newGreenOrb = {
            x: GAME_CONFIG.CANVAS_WIDTH + 60,
            y: yPosition,
            width: 30,
            height: 30,
            rotation: 0,
            collected: false,
            pulseTimer: 0,
            sparkleTimer: 0
        };
        
        // Basic collision avoidance
        let validPosition = true;
        
        // Check collision with existing green orbs
        for (let existing of window.greenOrbs) {
            const dx = newGreenOrb.x - existing.x;
            const dy = newGreenOrb.y - existing.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 100) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with orange orbs
        for (let orb of window.orangeOrbs) {
            const dx = newGreenOrb.x - orb.x;
            const dy = newGreenOrb.y - orb.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 80) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with coins
        for (let coin of window.coins) {
            const dx = newGreenOrb.x - coin.x;
            const dy = newGreenOrb.y - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 70) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with obstacles in normal mode
        if (validPosition && window.gameState === GAME_STATES.NORMAL) {
            for (let obstacle of window.obstacles) {
                if (checkCollision(newGreenOrb, obstacle)) {
                    validPosition = false;
                    break;
                }
            }
            
            for (let stair of window.stairs) {
                if (checkCollision(newGreenOrb, stair)) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        if (validPosition) {
            window.greenOrbs.push(newGreenOrb);
        }
    }
}

function updateGreenOrbs() {
    window.greenOrbs.forEach(orb => {
        orb.x -= GAME_CONFIG.MOVE_SPEED;
        orb.rotation += 0.08;
        orb.pulseTimer += 0.15;
        orb.sparkleTimer += 0.2;
    });
    
    // Remove off-screen orbs
    window.greenOrbs = window.greenOrbs.filter(orb => orb.x + orb.width > 0);
}

function drawGreenOrb(ctx, orb) {
    ctx.save();
    ctx.translate(orb.x + orb.width/2, orb.y + orb.height/2);
    ctx.rotate(orb.rotation);
    
    // Pulsing effect
    const pulse = 1 + Math.sin(orb.pulseTimer) * 0.3;
    ctx.scale(pulse, pulse);
    
    // Draw green orb with gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, orb.width/2);
    gradient.addColorStop(0, '#FFFFFF'); // White center
    gradient.addColorStop(0.2, '#00FF00'); // Bright green
    gradient.addColorStop(0.6, '#00CC00'); // Medium green
    gradient.addColorStop(1, '#008800'); // Dark green edge
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, orb.width/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add intense glow effect
    ctx.shadowColor = '#00FF00';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, orb.width/2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add sparkle effects
    ctx.shadowBlur = 0;
    const sparkleOffset = Math.sin(orb.sparkleTimer) * 5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(-orb.width/4 + sparkleOffset, -orb.width/4, orb.width/8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(orb.width/4 - sparkleOffset, orb.width/4, orb.width/10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// === ASTEROID SYSTEM ===
function generateAsteroids() {
    if (window.asteroids.length === 0 || window.asteroids[window.asteroids.length - 1].x < GAME_CONFIG.CANVAS_WIDTH - 250) {
        const sizes = [30, 50, 70];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        
        // Zone-based spawning: 25% top, 50% middle, 25% bottom
        const zoneRandom = Math.random();
        let yPosition;
        
        if (zoneRandom < 0.25) {
            // Top zone (0-33% of screen)
            yPosition = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT * 0.33);
        } else if (zoneRandom < 0.75) {
            // Middle zone (33-67% of screen)
            yPosition = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT * 0.34) + GAME_CONFIG.CANVAS_HEIGHT * 0.33;
        } else {
            // Bottom zone (67-100% of screen)
            yPosition = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT * 0.33) + GAME_CONFIG.CANVAS_HEIGHT * 0.67;
        }
        
        // Ensure minimum clearance from edges
        const minClearance = size / 2 + 10;
        yPosition = Math.max(minClearance, Math.min(GAME_CONFIG.CANVAS_HEIGHT - minClearance, yPosition));
        
        const newAsteroid = {
            x: GAME_CONFIG.CANVAS_WIDTH + Math.random() * 100,
            y: yPosition,
            width: size,
            height: size,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        };
        
        // Basic collision avoidance with existing asteroids
        let validPosition = true;
        for (let existing of window.asteroids) {
            const dx = newAsteroid.x - existing.x;
            const dy = newAsteroid.y - existing.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (newAsteroid.width + existing.width) / 2 + 20;
            
            if (distance < minDistance) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            window.asteroids.push(newAsteroid);
        }
    }
}

function updateAsteroids() {
    window.asteroids.forEach(asteroid => {
        asteroid.x -= GAME_CONFIG.MOVE_SPEED;
        asteroid.rotation += asteroid.rotationSpeed;
    });
    
    // Remove off-screen asteroids
    window.asteroids = window.asteroids.filter(asteroid => asteroid.x + asteroid.width > 0);
}

function drawAsteroid(ctx, asteroid) {
    ctx.save();
    ctx.translate(asteroid.x + asteroid.width/2, asteroid.y + asteroid.height/2);
    ctx.rotate(asteroid.rotation);
    
    // Draw irregular asteroid shape
    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    const points = 8;
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radius = (asteroid.width / 2) * (0.8 + Math.random() * 0.4);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
}

// === PORTAL SYSTEM ===
function updatePortals() {
    window.portals.forEach(portal => {
        portal.x -= GAME_CONFIG.MOVE_SPEED;
        portal.rotation += 0.1;
        
        // Check collision with player
        if (checkCollision(window.player, portal) && window.gameState === GAME_STATES.NORMAL) {
            window.gameState = GAME_STATES.PORTAL_TRANSITION;
            window.flyingTimer = 0;
            // Transform player to jet
            window.player.transformToJet();
        }
    });
    
    // Remove off-screen portals
    window.portals = window.portals.filter(portal => portal.x + portal.width > 0);
}

function updateGreenPortals() {
    window.greenPortals.forEach(portal => {
        portal.x -= GAME_CONFIG.MOVE_SPEED;
        portal.rotation += 0.1;
        
        // Check collision with player
        if (checkCollision(window.player, portal) && window.gameState === GAME_STATES.NORMAL) {
            window.gameState = GAME_STATES.GREEN_PORTAL_TRANSITION;
            window.upDownTimer = 0;
            window.transitionTimer = 0;
            // Keep player as square but prepare for up-down mode
            window.playerPosition = PLAYER_POSITIONS.GROUND;
            window.player.y = GROUND_Y;
        }
    });
    
    // Remove off-screen green portals
    window.greenPortals = window.greenPortals.filter(portal => portal.x + portal.width > 0);
}

function drawPortal(ctx, portal) {
    ctx.save();
    ctx.translate(portal.x + portal.width/2, portal.y + portal.height/2);
    ctx.rotate(portal.rotation);
    
    // Draw portal circle with gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, portal.width/2);
    gradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)');
    gradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.6)');
    gradient.addColorStop(1, 'rgba(25, 25, 112, 0.4)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, portal.width/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw swirl effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, 10 + i * 10, portal.rotation + i, portal.rotation + i + Math.PI);
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawGreenPortal(ctx, portal) {
    ctx.save();
    ctx.translate(portal.x + portal.width/2, portal.y + portal.height/2);
    ctx.rotate(portal.rotation);
    
    // Draw green portal circle with gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, portal.width/2);
    gradient.addColorStop(0, 'rgba(34, 139, 34, 0.8)');
    gradient.addColorStop(0.5, 'rgba(0, 128, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 100, 0, 0.4)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, portal.width/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw swirl effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, 10 + i * 10, portal.rotation + i, portal.rotation + i + Math.PI);
        ctx.stroke();
    }
    
    ctx.restore();
}

// === CEILING SPIKES ===
function updateCeilingSpikes() {
    window.ceilingSpikes.forEach(spike => {
        spike.x -= GAME_CONFIG.MOVE_SPEED;
    });
    
    // Remove off-screen ceiling spikes
    window.ceilingSpikes = window.ceilingSpikes.filter(spike => spike.x + spike.width > 0);
}

function drawCeilingSpike(ctx, spike) {
    ctx.fillStyle = '#ff4444';
    
    // Draw upside-down spike
    ctx.beginPath();
    ctx.moveTo(spike.x, spike.y); // Top point
    ctx.lineTo(spike.x + spike.width/2, spike.y + spike.height); // Bottom middle
    ctx.lineTo(spike.x + spike.width, spike.y); // Top right
    ctx.closePath();
    ctx.fill();
    
    // Add outline
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// === SPARKLE PARTICLE SYSTEM ===
function createSparkleParticles(x, y) {
    const particles = [];
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay: 0.02
        });
    }
    return particles;
}

function updateSparkles() {
    window.sparkles.forEach(sparkle => {
        sparkle.timer += 16;
        sparkle.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vx *= 0.98; // Slow down
            particle.vy *= 0.98;
        });
        sparkle.particles = sparkle.particles.filter(p => p.life > 0);
    });
    
    // Remove expired sparkles
    window.sparkles = window.sparkles.filter(sparkle => sparkle.timer < sparkle.maxTimer && sparkle.particles.length > 0);
}

function drawSparkles(ctx) {
    window.sparkles.forEach(sparkle => {
        sparkle.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    });
}