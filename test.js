// Smoke test: the command that fails on broken code.
// 1. Every JS file must parse (catches syntax errors the browser would only show in F12).
// 2. The server must boot and answer /api/levels with valid JSON listing every level.
// Run with: npm test
const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = ['server.js', ...fs.readdirSync('js').map(f => path.join('js', f))].filter(f => f.endsWith('.js'));
for (const f of files) {
    execFileSync(process.execPath, ['--check', f], { stdio: 'inherit' });
    console.log(`syntax ok  ${f}`);
}

const port = 3900 + Math.floor(Math.random() * 100);
const server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });

async function waitForServer(tries = 50) {
    for (let i = 0; i < tries; i++) {
        try { return await fetch(`http://localhost:${port}/api/levels`); } catch { await new Promise(r => setTimeout(r, 100)); }
    }
    throw new Error(`server did not answer on port ${port}`);
}

(async () => {
    try {
        const res = await waitForServer();
        if (!res.ok) throw new Error(`/api/levels returned ${res.status}`);
        const levels = await res.json();
        const onDisk = fs.readdirSync('levels').filter(f => /^level-\d+\.json$/.test(f)).length;
        const count = Array.isArray(levels) ? levels.length : Object.keys(levels).length;
        if (count !== onDisk) throw new Error(`/api/levels lists ${count} levels, ${onDisk} on disk`);
        console.log(`server ok  /api/levels -> ${count} levels`);
        process.exitCode = 0;
    } catch (err) {
        console.error(`FAIL: ${err.message}`);
        process.exitCode = 1;
    } finally {
        server.kill();
    }
})();
