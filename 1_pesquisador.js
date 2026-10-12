/**
 * 1_pesquisador.js - Detector de Modulos
 * 
 * Detecta modulos que precisam ser gerados
 * Verifica modulos existentes no servidor via webhook
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

// Token do webhook
const WEBHOOK_TOKEN = 'esteira1-2026-secret-deploy';
const WEBHOOK_URL = 'https://bmsystem.app/webhook.php';

/**
 * Faz requisicao HTTP
 */
function httpGet(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Esteira1Bot/1.0',
        'Accept': 'application/json'
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
 * Funcao principal
 */
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  1 - DETECTOR DE MODULOS');
  console.log('═══════════════════════════════════════════');
  
  // Busca modulos existentes no servidor
  const existentes = await buscarModulosServidor();
  
  // Constrói lista completa de modulos
  const lista = [];
  
  for (const m in MOD) {
    if (MOD[m].length === 0) {
      lista.push({ m: m, s: null, l: '/home/bmsystem/www/modulos/' + m, existe: existentes.has(m) });
    } else {
      for (const s of MOD[m]) {
        const moduloPath = `${m}/${s}`;
        const existe = existentes.has(moduloPath);
        lista.push({ m: m, s: s, l: '/home/bmsystem/www/modulos/' + moduloPath, existe: existe });
      }
    }
  }
  
  // Separa em faltantes e existentes
  const faltantes = lista.filter(mod => !mod.existe);
  const existentesLista = lista.filter(mod => mod.existe);
  
  console.log('');
  console.log('Modulos encontrados no servidor:', existentesLista.length);
  console.log('Modulos faltantes:', faltantes.length);
  console.log('');
  
  if (faltantes.length > 0) {
    console.log('Modulos a gerar:');
    for (const f of faltantes) {
      console.log('  - ' + (f.s ? f.m + '/' + f.s : f.m));
    }
  }
  
  // Salva JSON com todos os modulos
  const r = {
    ts: new Date().toISOString(),
    t: lista.length,
    faltantes: faltantes.length,
    existentes: existentesLista.length,
    modulos: lista,
    modulos_faltantes: faltantes
  };
  
  fs.writeFileSync(path.join(OUT, 'modulos_faltantes.json'), JSON.stringify(r, null, 2));
  fs.writeFileSync(path.join(OUT, 'bd_cache.json'), JSON.stringify({ ts: r.ts, t: r.t }, null, 2));
  
  console.log('');
  console.log('1_PESQUISADOR: ' + lista.length + ' modulos catalogados');
  console.log('               ' + faltantes.length + ' precisam ser gerados');
  
  return r;
}

main().catch(console.error);
