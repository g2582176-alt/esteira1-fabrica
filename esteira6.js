/**
 * ESTEIRA 6 - Criador de Agentes (Com parâmetros)
 * 
 * Uso:
 *   node esteira6.js                    # Cria agentes da lista
 *   node esteira6.js "nome" "desc"     # Cria agente específico
 *   node esteira6.js --list             # Lista agentes existentes
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT = path.join(__dirname, 'agentes');
const SHARED = path.join(__dirname, 'shared');
const SKILLS = path.join(__dirname, 'skills');

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const API_URL = 'api.minimaxi.chat';
const API_PATH = '/v1/text/chatcompletion_v2';

// ==================== ARGUMENTOS ====================

function parseArgs() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) return { modo: 'lista' };
    
    if (args[0] === '--list' || args[0] === '-l') {
        return { modo: 'listar' };
    }
    
    if (args[0] === '--help' || args[0] === '-h') {
        return { modo: 'ajuda' };
    }
    
    // node esteira6.js nome descricao papel
    return {
        modo: 'criar',
        nome: args[0],
        descricao: args[1] || 'Novo agente',
        papel: args[2] || 'Agente generico'
    };
}

function mostrarAjuda() {
    console.log(`
==========================================
  ESTEIRA 6 - CRIADOR DE AGENTES
==========================================

USO:
  node esteira6.js                    - Cria lista padrao
  node esteira6.js "nome" "desc" "papel" - Cria agente especifico
  node esteira6.js --list             - Lista agentes existentes
  node esteira6.js --help             - Mostra esta ajuda

EXEMPLOS:
  node esteira6.js "4_tester" "Executa testes" "Valida codigo"
  node esteira6.js "5_documentador" "Gera documentacao"

==========================================
`);
}

// ==================== LOOP ====================

async function perceber() {
    console.log('[PERCEBER] Coletando contexto...');
    let contexto = {};
    try {
        const ctxFile = path.join(SHARED, 'context.json');
        if (fs.existsSync(ctxFile)) {
            contexto = JSON.parse(fs.readFileSync(ctxFile, 'utf8'));
        }
    } catch (e) { console.log('Aviso: Contexto nao encontrado'); }
    
    let historico = [];
    try {
        const histFile = path.join(SHARED, 'memory.json');
        if (fs.existsSync(histFile)) {
            historico = JSON.parse(fs.readFileSync(histFile, 'utf8'));
        }
    } catch (e) { console.log('Aviso: Historico nao encontrado'); }
    
    return { contexto, historico };
}

async function pensar(contexto, pedido) {
    console.log('[PENSAR] Analisando com IA...');
    
    if (MINIMAX_API_KEY) {
        const prompt = 'Voce e um especialista. Defina estrutura em JSON: {nome,descricao,papel}. Pedido: ' + pedido.nome + ' - ' + pedido.descricao;
        
        try {
            const resultado = await chamarMinimax(prompt);
            if (resultado) return JSON.parse(resultado);
        } catch (e) { console.log('Aviso: MiniMax falhou'); }
    }
    
    return {
        nome: pedido.nome,
        descricao: pedido.descricao,
        papel: pedido.papel || 'Agente',
        componentes: ['AGENTS.md', 'MEMORY.md', 'script.js', 'skills/'],
        skills_necessarias: ['criar_estrutura'],
        ferramentas: []
    };
}

async function agir(estrutura) {
    console.log('[AGIR] Criando estrutura...');
    const { nome } = estrutura;
    const agentePath = path.join(OUT, nome);
    
    fs.mkdirSync(agentePath, { recursive: true });
    fs.mkdirSync(path.join(agentePath, 'skills'), { recursive: true });
    
    const agentsContent = usarSkill('gerar_agents_md', estrutura);
    fs.writeFileSync(path.join(agentePath, 'AGENTS.md'), agentsContent);
    
    const memoryContent = usarSkill('gerar_memory_md', estrutura);
    fs.writeFileSync(path.join(agentePath, 'MEMORY.md'), memoryContent);
    
    const scriptContent = usarSkill('implementar_loop', estrutura);
    fs.writeFileSync(path.join(agentePath, 'script.js'), scriptContent);
    
    console.log('[AGIR] Agente criado:', nome);
    return { path: agentePath, estrutura };
}

async function repetir(agente) {
    console.log('[REPETIR] Atualizando memorias...');
    const memFile = path.join(SHARED, 'memory.json');
    let memoria = [];
    if (fs.existsSync(memFile)) {
        memoria = JSON.parse(fs.readFileSync(memFile, 'utf8'));
    }
    
    memoria.push({
        agente: agente.estrutura.nome,
        criadoEm: new Date().toISOString(),
        descricao: agente.estrutura.descricao,
        sucesso: true
    });
    
    fs.writeFileSync(memFile, JSON.stringify(memoria, null, 2));
}

function usarSkill(nome, dados) {
    const skills = {
        'gerar_agents_md': (d) => '# Agente: ' + d.nome + '\n\n## Papel\n' + (d.papel || 'Agente') + '\n\n## Componentes\n' + (d.componentes || []).map(c => '- ' + c).join('\n'),
        'gerar_memory_md': (d) => '# MEMORY.md - ' + d.nome + '\n\n## Criado\n' + new Date().toISOString() + '\n\n## Historico\n',
        'implementar_loop': (d) => '// Agente: ' + d.nome + '\n\nclass Agente' + d.nome.replace(/[^a-zA-Z]/g, '') + ' {\n  async executar() {\n    await this.perceber();\n    await this.pensar();\n    await this.agir();\n    await this.repetir();\n  }\n  async perceber() {}\n  async pensar() {}\n  async agir() {}\n  async repetir() {}\n}'
    };
    return skills[nome] ? skills[nome](dados) : '';
}

function chamarMinimax(prompt) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ model: 'MiniMax-Text-01', messages: [{ role: 'user', content: prompt }], max_tokens: 2048, temperature: 0.3 });
        const options = { hostname: API_URL, path: API_PATH, method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + MINIMAX_API_KEY } };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => { try { const json = JSON.parse(body); resolve(json.choices?.[0]?.message?.content); } catch(e) { resolve(null); } });
        });
        
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function listarAgentes() {
    console.log('\n=== AGENTES CRIADOS ===\n');
    
    if (!fs.existsSync(OUT)) {
        console.log('Nenhum agente criado ainda.');
        return;
    }
    
    const dirs = fs.readdirSync(OUT).filter(f => {
        return fs.statSync(path.join(OUT, f)).isDirectory();
    });
    
    if (dirs.length === 0) {
        console.log('Nenhum agente criado ainda.');
        return;
    }
    
    dirs.forEach(d => console.log('  - ' + d));
    console.log('\nTotal:', dirs.length, 'agentes\n');
}

// ==================== MAIN ====================

async function main() {
    console.log('===========================================');
    console.log('  ESTEIRA 6 - CRIADOR DE AGENTES');
    console.log('===========================================');
    
    if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
    if (!fs.existsSync(SHARED)) fs.mkdirSync(SHARED, { recursive: true });
    if (!fs.existsSync(SKILLS)) fs.mkdirSync(SKILLS, { recursive: true });
    
    const args = parseArgs();
    
    if (args.modo === 'ajuda') {
        mostrarAjuda();
        return;
    }
    
    if (args.modo === 'listar') {
        listarAgentes();
        return;
    }
    
    let agentes = [];
    
    if (args.modo === 'criar') {
        // Criar agente específico
        agentes = [args];
        console.log('\n>>> Criando agente: ' + args.nome);
    } else {
        // Criar lista padrão
        agentes = [
            { nome: '1_detector', descricao: 'Detector de modulos', papel: 'Identifica modulos existentes' },
            { nome: '2_pesquisador', descricao: 'Pesquisador de tendencias', papel: 'Busca tendencias SST' },
            { nome: '3_gerador', descricao: 'Gerador de codigo', papel: 'Gera codigo PHP' }
        ];
    }
    
    for (const pedido of agentes) {
        console.log('\n=== Criando:', pedido.nome, '===');
        const contexto = await perceber();
        const estrutura = await pensar(contexto, pedido);
        const resultado = await agir(estrutura);
        await repetir(resultado);
    }
    
    console.log('\n===========================================');
    console.log('  AGENTE(S) CRIADO(S) COM SUCESSO!');
    console.log('===========================================');
}

main().catch(console.error);
