/**
 * Skill: criar_estrutura
 * Cria a estrutura basica de pastas e arquivos de um agente
 */

const fs = require('fs');
const path = require('path');

function criarEstrutura(agentePath, componentes) {
    if (!fs.existsSync(agentePath)) {
        fs.mkdirSync(agentePath, { recursive: true });
    }
    
    for (const comp of componentes) {
        const compPath = path.join(agentePath, comp);
        if (comp.endsWith('/')) {
            fs.mkdirSync(compPath, { recursive: true });
        } else if (!fs.existsSync(compPath)) {
            fs.writeFileSync(compPath, '');
        }
    }
    
    return true;
}

module.exports = { criarEstrutura };
