/**
 * MCP: Manager - Coordena múltiplos MCPs
 * 
 * usage:
 * const manager = new MCPManager({
 *   github_token: process.env.GH_PAT,
 *   webhook_url: 'https://bmsystem.app/webhook.php'
 * });
 * 
 * await manager.commit('owner', 'repo', 'path', 'content', 'msg');
 * await manager.webhook('deploy', { module: 'treinamentos' });
 */

const MCPGitHub = require('./mcp_github');
const MCPHTTP = require('./mcp_http');

class MCPManager {
    constructor(config) {
        this.github = config.github_token ? new MCPGitHub(config.github_token) : null;
        this.http = new MCPHTTP();
        this.webhook_url = config.webhook_url;
    }

    async commit(owner, repo, path, content, message) {
        if (!this.github) throw Error('GitHub não configurado');
        return this.github.commitFile(owner, repo, path, content, message);
    }

    async webhook(action, data) {
        if (!this.webhook_url) throw Error('Webhook não configurado');
        const url = this.webhook_url + '?action=' + action;
        return this.http.post(url, data);
    }
}

module.exports = MCPManager;
