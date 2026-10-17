/**
 * MCP: GitHub Integration
 * Ferramentas: commit, create_file, list_repos
 */

const https = require('https');

class MCPGitHub {
    constructor(token) {
        this.token = token;
    }

    async commitFile(owner, repo, path, content, message, branch = 'main') {
        const url = '/repos/' + owner + '/' + repo + '/contents/' + path;
        const existing = await this.request(url + '?ref=' + branch, 'GET').catch(() => null);
        
        const data = JSON.stringify({
            message: message,
            content: Buffer.from(content).toString('base64'),
            sha: existing?.sha
        });
        
        return this.request(url, 'PUT', data);
    }

    async request(path, method, data) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                path: path,
                method: method,
                headers: {
                    'Authorization': 'Bearer ' + this.token,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', c => body += c);
                res.on('end', () => {
                    try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
                });
            });
            req.on('error', reject);
            if (data) req.write(data);
            req.end();
        });
    }
}

module.exports = MCPGitHub;
