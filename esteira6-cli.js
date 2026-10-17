/**
 * ESTEIRA 6 - Criador de Agentes (MODO INTERATIVO)
 * 
 * Execute: node esteira6-cli.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const OUT = path.join(__dirname, 'agentes');
const SHARED = path.join(__dirname, 'shared');
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function perguntar(pergunta) {
    return new Promise(resolve => rl.question(pergunta, resolve));
}

async function menuPrincipal() {
    console.clear();
    console.log('========================================');
    console.log('  ESTEIRA 6 - CRIADOR DE AGENTES');
    console.log('========================================');
    console.log('');
    console.log('  Comandos:');
    console.log('');
    console.log('  criar <nome> - Criar novo agente');
    console.log('  listar       - Listar agentes');
    console.log('  ajuda        - Mostrar ajuda');
    console.log('  sair         - Sair');
    console.log('');
    console.log('========================================');
    
    const comando = await perguntar('>>> Digite: ');
    const partes = comando.trim().split(' ');
    const cmd = partes[0].toLowerCase();
    
    if (cmd === 'sair') {
        console.log('Tchau!');
        rl.close();
        process.exit(0);
    }
    
    if (cmd === 'ajuda') {
        console.log('');
        console.log('COMANDOS:');
        console.log('criar <nome> <desc> - Ex: criar 4_testador "Executa testes"');
        console.log('listar - Lista agentes');
        console.log('sair - Sai');
        console.log('');
        await perguntar('Pressione ENTER...');
        await menuPrincipal();
        return;
    }
    
    if (cmd === 'listar') {
        console.log('');
        if (fs.existsSync(OUT)) {
            const dirs = fs.readdirSync(OUT).filter(f => fs.statSync(path.join(OUT, f)).isDirectory());
            dirs.forEach(d => console.log('  - ' + d));
            console.log('Total: ' + dirs.length);
        } else {
            console.log('Nenhum agente criado.');
        }
        await perguntar('Pressione ENTER...');
        await menuPrincipal();
        return;
    }
    
    if (cmd === 'criar') {
        const nome = partes[1];
        if (!nome) {
            console.log('Nome necessario: criar <nome>');
            await perguntar('Pressione ENTER...');
            await menuPrincipal();
            return;
        }
        
        const descricao = partes.slice(2).join(' ') || 'Novo agente';
        const papel = descricao;
        
        console.log('');
        console.log('Criando: ' + nome);
        await criarAgente({ nome, descricao, papel });
        console.log('');
        console.log('PRONTO! Agente criado!');
        await perguntar('Pressione ENTER...');
        await menuPrincipal();
        return;
    }
    
    await menuPrincipal();
}

async function criarAgente(pedido) {
    console.log('1. PERCEBER...');
    console.log('2. PENSAR...');
    console.log('3. AGIR...');
    
    const agentePath = path.join(OUT, pedido.nome);
    fs.mkdirSync(agentePath, { recursive: true });
    fs.mkdirSync(path.join(agentePath, 'skills'), { recursive: true });
    
    fs.writeFileSync(path.join(agentePath, 'AGENTS.md'), '# ' + pedido.nome + '\n\n## Papel\n' + pedido.papel);
    fs.writeFileSync(path.join(agentePath, 'MEMORY.md'), '# ' + pedido.nome + '\n\n## Criado\n' + new Date().toISOString());
    fs.writeFileSync(path.join(agentePath, 'script.js'), '// ' + pedido.nome + '\n\nclass Agente {\n  async executar() {}\n}');
    
    console.log('4. REPETIR...');
}

async function main() {
    if (process.argv.length > 2) {
        const nome = process.argv[2];
        const desc = process.argv[3] || 'Novo';
        await criarAgente({ nome, descricao: desc, papel: desc });
        console.log('Pronto!');
        rl.close();
        return;
    }
    
    await menuPrincipal();
    rl.close();
}

main().catch(e => { console.error(e); rl.close(); });
