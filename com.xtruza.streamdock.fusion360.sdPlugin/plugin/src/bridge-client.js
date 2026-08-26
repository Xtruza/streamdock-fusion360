const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const BRIDGE_FILE = path.join(os.homedir(), '.xtruza', 'streamdock-fusion360', 'bridge.json');

function readBridgeConfig() {
    const config = JSON.parse(fs.readFileSync(BRIDGE_FILE, 'utf8'));
    if (!Number.isInteger(config.port) || !config.token) throw new Error('Invalid bridge configuration');
    return config;
}

function requestBridge(method, endpoint, body, timeout = 900) {
    return new Promise((resolve, reject) => {
        let config;
        try { config = readBridgeConfig(); } catch (_) { return reject(new Error('Fusion API bridge is not running')); }
        const payload = body ? JSON.stringify(body) : '';
        const request = http.request({
            host: '127.0.0.1', port: config.port, path: endpoint, method,
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'X-Xtruza-Token': config.token },
            timeout
        }, response => {
            let data = '';
            response.setEncoding('utf8');
            response.on('data', chunk => { data += chunk; });
            response.on('end', () => {
                let parsed = {};
                try { parsed = data ? JSON.parse(data) : {}; } catch (_) { return reject(new Error('Invalid bridge response')); }
                if (response.statusCode >= 200 && response.statusCode < 300) return resolve(parsed);
                reject(new Error(parsed.error || `Bridge returned ${response.statusCode}`));
            });
        });
        request.on('timeout', () => request.destroy(new Error('Fusion API bridge timed out')));
        request.on('error', reject);
        request.end(payload);
    });
}

async function checkBridge() {
    try {
        const result = await requestBridge('GET', '/v1/health');
        return { ok: result.status === 'ok', ...result };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

module.exports = { BRIDGE_FILE, requestBridge, checkBridge, readBridgeConfig };
