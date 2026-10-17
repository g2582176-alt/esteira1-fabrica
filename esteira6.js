/**
 * ESTEIRA 6 - Criador de Agentes
 * 
 * Este agente cria outros agentes seguindo o modelo ideal:
 * - AGENTS.md (contexto)
 * - MEMORY.md (historico)
 * - Loop Perceber -> Pensar -> Agir -> Repetir
 * - Skills reutilizaveis
 */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'agentes');
const SHARED = path.join(__dirname, 'shared');

class Agente {
  constructor(nome, descricao) {
    this.nome = nome;
    this.descricao = descricao;
    this.criadoEm = new Date().toISOString();
  }
  
  async perceber() {
    console.log('[PERCEBER] Analisando contexto...');
    let contexto = {};
    try {
      const ctxFile = path.join(SHARED, 'context.json');
      if (fs.existsSync(ctxFile)) {
        contexto = JSON.parse(fs.readFileSync(ctxFile, 'utf8'));
      }
    } catch (e) {
      console.log('Aviso: Contexto global nao encontrado');
    }
    return { contexto };
  }
  
  async pensar(contexto) {
    console.log('[PENSAR] Definindo estrutura do agente...');
    const estrutura = {
      nome: this.nome,
      descricao: this.descricao,
      criadoEm: this.criadoEm,
      componentes: ['script.js', 'AGENTS.md', 'MEMORY.md', 'skills/']
    };
    return estrutura;
  }
  
  async agir(estrutura) {
    console.log('[AGIR] Criando estrutura do agente...');
    const agentePath = path.join(OUT, this.nome);
    fs.mkdirSync(agentePath, { recursive: true });
    
    const agentsContent = this.gerarAgentsMd();
    fs.writeFileSync(path.join(agentePath, 'AGENTS.md'), agentsContent);
    
    const memoryContent = this.gerarMemoryMd();
    fs.writeFileSync(path.join(agentePath, 'MEMORY.md'), memoryContent);
    
    const scriptContent = this.gerarScript();
    fs.writeFileSync(path.join(agentePath, 'script.js'), scriptContent);
    
    fs.mkdirSync(path.join(agentePath, 'skills'), { recursive: true });
    
    console.log('[AGIR] Agente criado em: ' + agentePath);
    return { path: agentePath };
  }
  
  async repetir(agente) {
    console.log('[REPETIR] Atualizando memorias...');
    const memFile = path.join(SHARED, 'memory.json');
    let memoriaGlobal = [];
    if (fs.existsSync(memFile)) {
      memoriaGlobal = JSON.parse(fs.readFileSync(memFile, 'utf8'));
    }
    memoriaGlobal.push({
      agente: this.nome,
      criadoEm: this.criadoEm,
      descricao: this.descricao
    });
    fs.writeFileSync(memFile, JSON.stringify(memoriaGlobal, null, 2));
  }
  
  gerarAgentsMd() {
    return '# Agente: ' + this.nome + '\n\n## Descricao\n' + this.descricao + '\n\n## Papel\n[Definir o papel deste agente]\n\n## Comportamento\n\n### Perceber\n[Como o agente percebe o mundo]\n\n### Pensar\n[Como o agente processa]\n\n### Agir\n[Como o agente executa]\n\n### Repetir\n[Como o agente aprende]';
  }
  
  gerarMemoryMd() {
    return '# MEMORY.md - ' + this.nome + '\n\n## Criado em\n' + this.criadoEm + '\n\n## Historico\n\n## Aprendizados\n';
  }
  
  gerarScript() {
    const nomeClasse = this.nome.replace(/[^a-zA-Z]/g, '');
    return '/**\n * ' + this.nome + '\n * ' + this.descricao + '\n */\n\nclass Agente' + nomeClasse + ' {\n  constructor() {\n    this.nome = \'' + this.nome + '\';\n  }\n\n  async executar() {\n    await this.perceber();\n    await this.pensar();\n    await this.agir();\n    await this.repetir();\n  }\n\n  async perceber() {}\n  async pensar() {}\n  async agir() {}\n  async repetir() {}\n}\nmodule.exports = Agente' + nomeClasse + ';';
  }
}

async function main() {
  console.log('===========================================');
  console.log('  ESTEIRA 6 - CRIADOR DE AGENTES');
  console.log('===========================================');
  
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(SHARED)) fs.mkdirSync(SHARED, { recursive: true });
  
  const agentesParaCriar = [
    { nome: '1_detector', descricao: 'Detector de modulos do BMSystem' },
    { nome: '2_pesquisador', descricao: 'Pesquisador de tendencias SST' },
    { nome: '3_gerador', descricao: 'Gerador de codigo PHP' },
  ];
  
  for (const agInfo of agentesParaCriar) {
    console.log('\nCriando agente: ' + agInfo.nome);
    const agente = new Agente(agInfo.nome, agInfo.descricao);
    const contexto = await agente.perceber();
    const estrutura = await agente.pensar(contexto);
    const resultado = await agente.agir(estrutura);
    await agente.repetir(resultado);
    console.log('Agente criado com sucesso!');
  }
  
  console.log('\n===========================================');
  console.log('  TODOS OS AGENTES CRIADOS!');
  console.log('===========================================');
}

main().catch(console.error);