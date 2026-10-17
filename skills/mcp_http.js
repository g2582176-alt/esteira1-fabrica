/**
 * MCP: HTTP Integration
 * Ferramentas: get, post, put, delete, webhook
 */

const https = require('https');

class MCPHTTP {
    async request(url, method, data) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 443,
                path: urlObj.pathname,
                method: method,
                headers: { 'Content-Type': 'application/json' }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', c => body += c);
                res.on('end', () => resolve({ status: res.statusCode, body }));
            });
            req.on('error', reject);
            if (data) req.write(JSON.stringify(data));
            req.end();
        });
    }

    async get(url) { return this.request(url, 'GET'); }
    async post(url, data) { return this.request(url, 'POST', data); }
    async put(url, data) { return this.request(url, 'PUT', data); }
    async delete(url) { return this.request(url, 'DELETE'); }
    
    async webhook(url, payload) {
        return this.post(url, payload);
    }
}

module.exports = MCPHTTP;
