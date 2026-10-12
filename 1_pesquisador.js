/**
 * 1_pesquisador.js - Detector de Modulos
 * 
 * Detecta modulos que precisam ser gerados
 * Verifica:
 * 1. Modulos existentes no servidor (via webhook)
 * 2. Modulos ja deployados na Fabrica de Software (via API)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const OUT = path.join(__dirname, 'output');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Lista de modulos que a esteira gerencia
const MOD = {
  sst: ['acidentes', 'aprs', 'dds', 'epi', 'inspecoes', 'prevencao_incendio', 'pts', 'treinamentos', 'visibilidade'],
  dp: ['armarios', 'edificacoes'],
  terceiros: ['colaboradores', 'configuracoes', 'documentos', 'empresas', 'portal'],
  meio_ambiente: ['pesagem']
};

// Config
const WEBHOOK_TOKEN = 'esteira1-2026-secret-deploy';
const WEBHOOK_URL = 'https://bmsystem.app/webhook.php';

// API da Fabrica de Software (para verificar modulos ja deployados)
const FABRICA_API = 'https://bmsystem.app/api/api_esteira_fabrica.php';

// Chave da API (vai ser configurada nos secrets do GitHub)
const API_KEY = process.env.BMSYSTEM_API_KEY || '';

/**
 * Faz requisicao HTTP
 */
function httpGet(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Esteira1Bot/1.0',
        'Accept': 'application/json',
        'X-API-Key': API_KEY
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    setTimeout(() => req.destroy(), timeout);
  });
}

/**
 * Busca modulos existentes no servidor via webhook
 */
async function buscarModulosServidor() {
  try {
    console.log('Buscando modulos existentes no servidor...');
    const url = `${WEBHOOK_URL}?action=list-modules&token=${WEBHOOK_TOKEN}`;
    const result = await httpGet(url);
    
    if (result.status === 200 && result.body.modules) {
      const modulosExistentes = new Set();
      
      for (const cat of result.body.modules) {
        for (const sub of cat.submodulos) {
          modulosExistentes.add(`${cat.categoria}/${sub}`);
        }
      }
      
      console.log(`Encontrados ${modulosExistentes.size} modulos no servidor`);
      return modulosExistentes;
    }
  } catch (e) {
    console.log('Aviso: Nao foi possivel verificar modulos no servidor:', e.message);
  }
  return new Set();
}

/**
 * Busca modulos ja deployados na Fabrica de Software
 * IMPORTANTE: Se um modulo ja foi aprovado e deployado, a esteira NAO deve sobreescrever
 */
async function buscarModulosDeployados() {
  const deployados = new Set();
  
  try {
    console.log('Verificando Fabrica de Software (modulos ja deployados)...');
    const url = `${FABRICA_API}?action=listar_itens`;
    const result = await httpGet(url);
    
    if (result.status === 200 && result.body.itens) {
      for (const item of result.body.itens) {
        if (item.status === 'deployado' || item.status === 'aprovado') {
          // Normaliza o nome do modulo para o formato "categoria/submodulo"
          const moduloNome = item.modulo.toLowerCase().trim();
          
          // Mapeia para a estrutura correta
          // Ex: "treinamentos" -> "sst/treinamentos"
          const mapeado = mapearModulo(moduloNome);
          if (mapeado) {
            deployados.add(mapeado);
            console.log(`  - ${mapeado} (${item.status}) - JA DEPLOYADO/APROVADO`);
          }
        }
      }
      
      if (deployados.size > 0) {
        console.log(`Encontrados ${deployados.size} modulos ja deployados/aprovados`);
        console.log('ATENCAO: Estes modulos NAO serao sobreescritos pela esteira!');
      }
    }
  } catch (e) {
    console.log('Aviso: Nao foi possivel verificar Fabrica de Software:', e.message);
  }
  
  return deployados;
}

/**
 * Mapeia nome do modulo para o formato "categoria/submodulo"
 */
function mapearModulo(nome) {
  // Normaliza o nome
  nome = nome.toLowerCase().replace(/[_\s-]/g, '');
  
  // Mapeamentos manuais para modulos conhecidos
  const mapeamentos = {
    'treinamentos': 'sst/treinamentos',
    'treinamentocapacitacaonrs': 'sst/treinamentos',
    'acidentes': 'sst/acidentes',
    'acidentedetrabalho': 'sst/acidentes',
    'apr': 'sst/aprs',
    'analisepreliminardorisco': 'sst/aprs',
    'dds': 'sst/dds',
    'dialogodiarioseguranca': 'sst/dds',
    'epi': 'sst/epi',
    'equipamentoprotecao': 'sst/epi',
    'inspecoes': 'sst/inspecoes',
    'inspecaodeseguranca': 'sst/inspecoes',
    'prevencao': 'sst/prevencao_incendio',
    'prevencao_incendio': 'sst/prevencao_incendio',
    'incendio': 'sst/prevencao_incendio',
    'pts': 'sst/pts',
    'permissaotrabalho': 'sst/pts',
    'visibilidade': 'sst/visibilidade',
    'controlevisibilidade': 'sst/visibilidade',
    'armarios': 'dp/armarios',
    'edificacoes': 'dp/edificacoes',
    'colaboradores': 'terceiros/colaboradores',
    'configuracoes': 'terceiros/configuracoes',
    'documentos': 'terceiros/documentos',
    'empresas': 'terceiros/empresas',
    'portal': 'terceiros/portal',
    'pesagem': 'meio_ambiente/pesagem'
  };
  
  // Primeiro tenta mapeamento direto
  if (mapeamentos[nome]) {
    return mapeamentos[nome];
  }
  
  // Tenta encontrar qualquer chave que contenha o nome
  for (const [key, value] of Object.entries(mapeamentos)) {
    if (nome.includes(key) || key.includes(nome)) {
      return value;
    }
  }
  
  // Se nao encontrar, tenta deduzir pela primeira parte
  // Ex: "treinamentos" -> "sst/treinamentos"
  for (const cat in MOD) {
    if (MOD[cat].includes(nome) || MOD[cat].some(m => nome.includes(m))) {
      const sub = MOD[cat].find(m => nome.includes(m)) || nome;
      return `${cat}/${sub}`;
    }
  }
  
  return null;
}

/**
 * Funcao principal
 */
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  1 - DETECTOR DE MODULOS');
  console.log('═══════════════════════════════════════════');
  
  // Busca modulos ja deployados na Fabrica de Software
  const deployados = await buscarModulosDeployados();
  
  // Busca modulos existentes no servidor
  const existentes = await buscarModulosServidor();
  
  // Constroi lista completa de modulos
  const lista = [];
  const faltantes = [];
  
  for (const m in MOD) {
    if (MOD[m].length === 0) {
      lista.push({ m: m, s: null, l: '/home/bmsystem/www/modulos/' + m, existe: existentes.has(m) || deployados.has(m) });
    } else {
      for (const s of MOD[m]) {
        const moduloPath = `${m}/${s}`;
        const jaDeployado = deployados.has(moduloPath);
        const jaExiste = existentes.has(moduloPath);
        lista.push({ 
          m: m, 
          s: s, 
          l: '/home/bmsystem/www/modulos/' + moduloPath, 
          existe: jaExiste || jaDeployado,
          jaDeployado: jaDeployado
        });
        
        if (!jaExiste && !jaDeployado) {
          faltantes.push({ m, s });
        }
      }
    }
  }
  
  console.log('');
  console.log('RESUMO:');
  console.log('  Modulos ja deployados (Fabrica): ' + [...deployados].length);
  console.log('  Modulos existentes no servidor: ' + existentes.size);
  console.log('  Modulos faltantes (gerar): ' + faltantes.length);
  console.log('');
  
  if (faltantes.length > 0) {
    console.log('Modulos a gerar:');
    for (const f of faltantes) {
      console.log('  - ' + f.m + '/' + f.s);
    }
  } else {
    console.log('NENHUM modulo faltante! Todos ja existem ou foram deployados.');
  }
  
  // Salva JSON com todos os modulos
  const r = {
    ts: new Date().toISOString(),
    t: lista.length,
    deployados: [...deployados],
    existentes: [...existentes],
    faltantes: faltantes,
    modulos: lista
  };
  
  fs.writeFileSync(path.join(OUT, 'modulos_faltantes.json'), JSON.stringify(r, null, 2));
  fs.writeFileSync(path.join(OUT, 'bd_cache.json'), JSON.stringify({ ts: r.ts, t: r.t }, null, 2));
  
  console.log('');
  console.log('1_PESQUISADOR: ' + lista.length + ' modulos catalogados');
  console.log('               ' + faltantes.length + ' precisam ser gerados');
  
  return r;
}

main().catch(console.error);
