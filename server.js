const http = require('http');
const fs = require('fs');
const path = require('path');

const START_PORT = 3000;
const MAX_PORT = 3010;

// Level validation schema (simplified for server-side)
function validateLevel(levelData) {
    const required = ['levelId', 'name', 'duration', 'victoryCondition', 'timeline'];
    for (const field of required) {
        if (!levelData[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    
    if (!levelData.levelId.match(/^level-[0-9]+$/)) {
        throw new Error('Invalid levelId format. Must be level-X where X is a number.');
    }
    
    if (typeof levelData.duration !== 'number' || levelData.duration < 1000) {
        throw new Error('Duration must be a number >= 1000');
    }
    
    if (!Array.isArray(levelData.timeline)) {
        throw new Error('Timeline must be an array');
    }
    
    return true;
}

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/api/high-scores' && req.method === 'GET') {
        // Load high scores from file
        const filePath = path.join(__dirname, 'high-scores.md');
        
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                // File doesn't exist, return empty array
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([]));
                return;
            }
            
            const lines = data.split('\n');
            const highScores = [];
            
            for (let line of lines) {
                const match = line.match(/(\d+)\.\s*([A-Z]{1,3})\s*-\s*(\d+)/);
                if (match) {
                    highScores.push({
                        name: match[2],
                        score: parseInt(match[3])
                    });
                }
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(highScores));
        });
        
    } else if (req.url === '/api/high-scores' && req.method === 'POST') {
        // Save high scores to file
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const highScores = JSON.parse(body);
                
                // Generate markdown content
                let content = '# High Scores\n\n';
                highScores.forEach((entry, index) => {
                    content += `${index + 1}. ${entry.name} - ${entry.score}\n`;
                });
                
                // Write to file
                const filePath = path.join(__dirname, 'high-scores.md');
                fs.writeFile(filePath, content, 'utf8', (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to save high scores' }));
                        return;
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                });
                
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        
    } else if (req.url === '/api/levels' && req.method === 'GET') {
        // List all available levels
        const levelsDir = path.join(__dirname, 'levels');
        
        fs.readdir(levelsDir, (err, files) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to read levels directory' }));
                return;
            }
            
            const levelFiles = files.filter(file => file.endsWith('.json') && file !== 'schema.json');
            const levels = [];
            
            let processed = 0;
            
            if (levelFiles.length === 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([]));
                return;
            }
            
            levelFiles.forEach(file => {
                const filePath = path.join(levelsDir, file);
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (!err) {
                        try {
                            const levelData = JSON.parse(data);
                            levels.push({
                                levelId: levelData.levelId,
                                name: levelData.name,
                                description: levelData.description,
                                difficulty: levelData.difficulty,
                                duration: levelData.duration
                            });
                        } catch (parseErr) {
                            console.error(`Error parsing level file ${file}:`, parseErr);
                        }
                    }
                    
                    processed++;
                    if (processed === levelFiles.length) {
                        // Sort levels by levelId
                        levels.sort((a, b) => {
                            const aNum = parseInt(a.levelId.split('-')[1]);
                            const bNum = parseInt(b.levelId.split('-')[1]);
                            return aNum - bNum;
                        });
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(levels));
                    }
                });
            });
        });
        
    } else if (req.url.startsWith('/api/levels/') && req.method === 'GET') {
        // Get specific level
        const levelId = req.url.split('/').pop();
        const filePath = path.join(__dirname, 'levels', `${levelId}.json`);
        
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Level not found' }));
                return;
            }
            
            try {
                const levelData = JSON.parse(data);
                validateLevel(levelData);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(levelData));
            } catch (parseErr) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid level file: ' + parseErr.message }));
            }
        });
        
    } else if (req.url === '/' || req.url === '/index.html') {
        // Serve the HTML file
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
        
    } else {
        // Serve static files (CSS, JS, etc.)
        const filePath = path.join(__dirname, req.url);
        const ext = path.extname(filePath);
        
        // Set content type based on file extension
        let contentType = 'text/plain';
        if (ext === '.css') contentType = 'text/css';
        else if (ext === '.js') contentType = 'application/javascript';
        else if (ext === '.json') contentType = 'application/json';
        else if (ext === '.html') contentType = 'text/html';
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    }
});

let currentPort = START_PORT;

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${currentPort} in use, trying ${currentPort + 1}...`);
        currentPort++;
        if (currentPort > MAX_PORT) {
            console.error(`Could not find available port between ${START_PORT} and ${MAX_PORT}`);
            process.exit(1);
        }
        server.listen(currentPort);
    } else {
        throw err;
    }
});

server.listen(currentPort, () => {
    console.log(`Server running at http://localhost:${currentPort}`);
    console.log('High scores will be saved to high-scores.md');
});