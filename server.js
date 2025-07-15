const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

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
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('High scores will be saved to high-scores.md');
});