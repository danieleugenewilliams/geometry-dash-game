// High Score Management System

// High Score Management
async function loadHighScores() {
    try {
        const response = await fetch('/api/high-scores');
        if (response.ok) {
            window.highScores = await response.json();
            console.log('High scores loaded:', window.highScores);
        } else {
            console.log('Failed to load high scores, starting fresh');
            window.highScores = [];
        }
    } catch (error) {
        console.log('Error loading high scores:', error);
        window.highScores = [];
    }
}

async function saveHighScoresToFile() {
    try {
        const response = await fetch('/api/high-scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(window.highScores)
        });
        
        if (response.ok) {
            console.log('High scores saved successfully');
        } else {
            console.error('Failed to save high scores');
        }
    } catch (error) {
        console.error('Error saving high scores:', error);
    }
}

function isHighScore(currentScore) {
    return window.highScores.length < 10 || currentScore > window.highScores[window.highScores.length - 1].score;
}

function showHighScorePopup() {
    document.getElementById('finalScore').textContent = Math.floor(window.score);
    document.getElementById('highScorePopup').style.display = 'block';
    document.getElementById('playerName').focus();
}

function saveHighScore() {
    const playerName = document.getElementById('playerName').value.trim().toUpperCase();
    if (playerName.length === 0) {
        alert('Please enter your name or initials!');
        return;
    }
    
    const newEntry = {
        name: playerName,
        score: Math.floor(window.score)
    };
    
    window.highScores.push(newEntry);
    window.highScores.sort((a, b) => b.score - a.score);
    window.highScores = window.highScores.slice(0, 10); // Keep only top 10
    
    saveHighScoresToFile();
    hideHighScorePopup();
}

function skipHighScore() {
    hideHighScorePopup();
}

function hideHighScorePopup() {
    document.getElementById('highScorePopup').style.display = 'none';
    document.getElementById('playerName').value = '';
    
    // Show level select menu after closing high score popup
    if (window.gameOver || window.levelComplete) {
        showLevelSelectMenu();
    }
}

// Expose functions to global scope for compatibility
window.loadHighScores = loadHighScores;
window.saveHighScoresToFile = saveHighScoresToFile;
window.isHighScore = isHighScore;
window.showHighScorePopup = showHighScorePopup;
window.saveHighScore = saveHighScore;
window.skipHighScore = skipHighScore;
window.hideHighScorePopup = hideHighScorePopup;