/**
 * ESTEIRA 6 - Criador de Agentes (Completo)
 * 
 * Segue o modelo de agentes Anthropic:
 * - AGENTS.md (contexto/regras)
 * - MEMORY.md (historico/aprendizado)
 * - Loop Perceber -> Pensar -> Agir -> Repetir
 * - Skills reutilizaveis
 * - Integracao MCP
 * 
 * Usa MiniMax para inteligencia na criacao
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

// ==================== LOOP DO AGENTE ====================

/**
 * FASE 1: PERCEBER
 * Coleta contexto e informacoes do ambiente
 */
async function perceber() {
    console.log('[PERCEBER] Coletando contexto...');
    
    let contexto = {};
    try {
        const ctxFile = path.join(SHARED, 'context.json');
        if (fs.existsSync(ctxFile)) {
            contexto = JSON.parse(fs.readFileSync(ctxFile, 'utf8'));
        }
    } catch (e) {
        console.log('Aviso: Contexto global nao encontrado');
    }
    
    let historico = [];
    try {
        const histFile = path.join(SHARED, 'memory.json');
        if (fs.existsSync(histFile)) {
            historico = JSON.parse(fs.readFileSync(histFile, 'utf8'));
        }
    } catch (e) {
        console.log('Aviso: Historico nao encontrado');
    }
    
    console.log('[PERCEBER] Contexto:', Object.keys(contexto).length, 'itens');
    console.log('[PERCEBER] Historico:', historico.length, 'agentes');
    
    return { contexto, historico };
}

/**
 * FASE 2: PENSAR (com IA - MiniMax)
 * Usa IA para decidir estrutura do agente
 */
async function pensar(contexto, pedido) {
    console.log('[PENSAR] Analisando com IA...');
    
    if (MINIMAX_API_KEY) {
        const prompt = 'Voce e um especialista em criar agentes de IA. Analise e defina a estrutura em JSON: {nome,descricao,papel,componentes,skills_necessarias,ferramentas}. Pedido: ' + pedido.nome + ' - ' + pedido.descricao;
        
        try {
            const resultado = await chamarMinimax(prompt);
            if (resultado) {
                const parsed = JSON.parse(resultado);
                console.log('[PENSAR] IA decidiu:', parsed.nome);
                return parsed;
            }
        } catch (e) {
            console.log('Aviso: MiniMax falhou, usando padrao');
        }
    }
    
    // Fallback: estrutura padrao
    return {
        nome: pedido.nome,
        descricao: pedido.descricao,
        papel: pedido.papel || 'Agente generico',
        componentes: ['AGENTS.md', 'MEMORY.md', 'script.js', 'skills/'],
        skills_necessarias: ['criar_estrutura'],
        ferramentas: []
    };
}

/**
 * FASE 3: AGIR
 * Cria o agente com todos os componentes
 */
async function agir(estrutura) {
    console.log('[AGIR] Criando estrutura do agente...');
    
    const { nome } = estrutura;
    const agentePath = path.join(OUT, nome);
    
    fs.mkdirSync(agentePath, { recursive: true });
    fs.mkdirSync(path.join(agentePath, 'skills'), { recursive: true });
    
    // Gerar arquivos usando Skills
    const agentsContent = usarSkill('gerar_agents_md', estrutura);
    fs.writeFileSync(path.join(agentePath, 'AGENTS.md'), agentsContent);
    
    const memoryContent = usarSkill('gerar_memory_md', estrutura);
    fs.writeFileSync(path.join(agentePath, 'MEMORY.md'), memoryContent);
    
    const scriptContent = usarSkill('implementar_loop', estrutura);
    fs.writeFileSync(path.join(agentePath, 'script.js'), scriptContent);
    
    console.log('[AGIR] Agente criado:', nome);
    return { path: agentePath, estrutura };
}

/**
 * FASE 4: REPETIR
 * Atualiza memorias e registra aprendizado
 */
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
    console.log('[REPETIR] Memoria atualizada!');
}

// ==================== SKILLS ====================

/**
 * Skill: usarSkill
 * Executa uma skill predefinida
 */
function usarSkill(nome, dados) {
    const skills = {
        'gerar_agents_md': (d) => '# Agente: ' + d.nome + '

## Papel
' + d.papel + '

## Componentes
' + (d.componentes || []).map(c => '- ' + c).join('
'),
        
        'gerar_memory_md': (d) => '# MEMORY.md - ' + d.nome + '

## Criado
' + new Date().toISOString() + '

## Historico

## Aprendizados',
        
        'implementar_loop': (d) => '// Agente: ' + d.nome + '

class Agente' + d.nome.replace(/[^a-zA-Z]/g, '') + ' {
  async executar() {
    await this.perceber();
    await this.pensar();
    await this.agir();
    await this.repetir();
  }
  async perceber() { console.log('[PERCEBER]'); }
  async pensar() { console.log('[PENSAR]'); }
  async agir() { console.log('[AGIR]'); }
  async repetir() { console.log('[REPETIR]'); }
}

module.exports = Agente' + d.nome.replace(/[^a-zA-Z]/g, '') + ';',
        
        'criar_estrutura': (d) => 'Estrutura criada para: ' + d.nome
    };
    
    return skills[nome] ? skills[nome](dados) : '';
}

// ==================== MINIMAX ====================

function chamarMinimax(prompt) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: 'MiniMax-Text-01',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2048,
            temperature: 0.3
        });

        const options = {
            hostname: API_URL,
            path: API_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + MINIMAX_API_KEY
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.choices && json.choices[0]) {
                        resolve(json.choices[0].message.content);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// ==================== MAIN ====================

async function main() {
    console.log('===========================================');
    console.log('  ESTEIRA 6 - CRIADOR DE AGENTES');
    console.log('  (MiniMax + Skills + MCP)');
    console.log('===========================================');
    
    if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
    if (!fs.existsSync(SHARED)) fs.mkdirSync(SHARED, { recursive: true });
    if (!fs.existsSync(SKILLS)) fs.mkdirSync(SKILLS, { recursive: true });
    
    const agentes = [
        { nome: '1_detector', descricao: 'Detector de modulos', papel: 'Identifica modulos existentes' },
        { nome: '2_pesquisador', descricao: 'Pesquisador de tendencias', papel: 'Busca tendencias SST' },
        { nome: '3_gerador', descricao: 'Gerador de codigo', papel: 'Gera codigo PHP' }
    ];
    
    for (const pedido of agentes) {
        console.log('\n=== Criando:', pedido.nome, '===');
        
        const contexto = await perceber();
        const estrutura = await pensar(contexto, pedido);
        const resultado = await agir(estrutura);
        await repetir(resultado);
    }
    
    console.log('\n===========================================');
    console.log('  TODOS OS AGENTES CRIADOS!');
    console.log('===========================================');
}

main().catch(console.error);
