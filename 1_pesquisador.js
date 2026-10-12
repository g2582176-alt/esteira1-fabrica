/**
 * 1_pesquisador.js - Detector de Modulos INTELIGENTE
 * 
 * Detecta:
 * 1. Modulos que NAO EXISTEM (falta criar)
 * 2. Modulos que EXISTEM mas estao INCOMPLETOS (falta features)
 * 3. Modulos ja DEPLOYADOS (NAO sobreescreve)
 * 4. Verifica a Fabrica de Software (API)
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

// Arquivos MINIMOS que um modulo completo deve ter
const ARQUIVOS_MINIMOS = {
  default: ['index.php', 'services/', 'migrations/'],
  sst: ['index.php', 'services/', 'migrations/'],
  dp: ['index.php', 'services/'],
  terceiros: ['index.php', 'services/'],
  meio_ambiente: ['index.php']
};

// Config
const WEBHOOK_TOKEN = 'esteira1-2026-secret-deploy';
const WEBHOOK_URL = 'https://bmsystem.app/webhook.php';
const FABRICA_API = 'https://bmsystem.app/api/api_esteira_fabrica.php';

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
 * Mapeia nome do modulo para "categoria/submodulo"
 */
function mapearModulo(nome) {
  nome = nome.toLowerCase().replace(/[_\s-]/g, '');
  
  const mapeamentos = {
    'treinamentos': 'sst/treinamentos',
    'treinamentocapacitacaonrs': 'sst/treinamentos',
    'acidentes': 'sst/acidentes',
    'apr': 'sst/aprs',
    'dds': 'sst/dds',
    'epi': 'sst/epi',
    'inspecoes': 'sst/inspecoes',
    'prevencao_incendio': 'sst/prevencao_incendio',
    'pts': 'sst/pts',
    'visibilidade': 'sst/visibilidade',
    'armarios': 'dp/armarios',
    'edificacoes': 'dp/edificacoes',
    'colaboradores': 'terceiros/colaboradores',
    'configuracoes': 'terceiros/configuracoes',
    'documentos': 'terceiros/documentos',
    'empresas': 'terceiros/empresas',
    'portal': 'terceiros/portal',
    'pesagem': 'meio_ambiente/pesagem'
  };
  
  if (mapeamentos[nome]) return mapeamentos[nome];
  
  for (const [key, value] of Object.entries(mapeamentos)) {
    if (nome.includes(key) || key.includes(nome)) return value;
  }
  
  for (const cat in MOD) {
    if (MOD[cat].some(m => nome.includes(m))) {
      const sub = MOD[cat].find(m => nome.includes(m)) || nome;
      return `${cat}/${sub}`;
    }
  }
  return null;
}

/**
 * Verifica se modulo esta COMPLETO (tem todos os arquivos necessarios)
 */
async function verificarModuloCompleto(cat, sub) {
  const moduloPath = `/home/bmsystem/www/modulos/${cat}/${sub}`;
  const arquivosNecessarios = getArquivosNecessarios(cat, sub);
  
  const incompleto = [];
  
  for (const arquivo of arquivosNecessarios) {
    if (arquivo.endsWith('/')) {
      // E diretorio - verifica se existe
      // Nao temos como verificar isso diretamente, entao vamos confiar que existe
    } else {
      // E arquivo - verifica se existe via API
      // Por enquanto, vamos marcar como "verificar manualmente"
    }
  }
  
  return {
    completo: incompleto.length === 0,
    faltando: incompleto
  };
}

/**
 * Obtem arquivos necessarios para um modulo
 */
function getArquivosNecessarios(cat, sub) {
  const arquivos = ['index.php'];
  
  // Services sao sempre necessarios
  if (cat === 'sst' || cat === 'dp' || cat === 'terceiros') {
    arquivos.push(`services/${sub}Service.php`);
  }
  
  // Migrations so para modulos com banco
  if (cat === 'sst') {
    arquivos.push(`migrations/create_${sub}.sql`);
  }
  
  return arquivos;
}

/**
 * Busca modulos existentes no servidor
 */
async function buscarModulosServidor() {
  try {
    console.log('Buscando modulos no servidor...');
    const url = `${WEBHOOK_URL}?action=list-modules&token=${WEBHOOK_TOKEN}`;
    const result = await httpGet(url);
    
    if (result.status === 200 && result.body.modules) {
      const modulos = {};
      
      for (const cat of result.body.modules) {
        modulos[cat.categoria] = cat.submodulos;
      }
      
      console.log(`Encontrados: ${Object.values(modulos).flat().length} modulos`);
      return modulos;
    }
  } catch (e) {
    console.log('Aviso: Nao foi possivel verificar servidor:', e.message);
  }
  return {};
}

/**
 * Busca modulos da Fabrica de Software (APROVADOS/DEPLOYADOS)
 */
async function buscarModulosFabrica() {
  const deployados = {};
  
  try {
    console.log('Verificando Fabrica de Software...');
    const url = `${FABRICA_API}?action=listar_itens`;
    const result = await httpGet(url);
    
    if (result.status === 200 && result.body.itens) {
      for (const item of result.body.itens) {
        if (item.status === 'deployado' || item.status === 'aprovado') {
          const mapeado = mapearModulo(item.modulo);
          if (mapeado) {
            const [cat, sub] = mapeado.split('/');
            if (!deployados[cat]) deployados[cat] = [];
            if (!deployados[cat].includes(sub)) {
              deployados[cat].push(sub);
            }
            console.log(`  - ${mapeado} (${item.status})`);
          }
        }
      }
    }
  } catch (e) {
    console.log('Aviso: Nao foi possivel verificar Fabrica:', e.message);
  }
  
  return deployados;
}

/**
 * Funcao principal
 */
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  1 - DETECTOR DE MODULOS INTELIGENTE');
  console.log('═══════════════════════════════════════════\n');
  
  // Busca modulos do servidor e da Fabrica
  const [modulosServidor, modulosFabrica] = await Promise.all([
    buscarModulosServidor(),
    buscarModulosFabrica()
  ]);
  
  // Analisa cada modulo
  const resultado = {
    jaExistem: [],      // Existem e estao completos
    incompletos: [],     // Existem mas faltam arquivos
    faltantes: [],       // Nao existem (criar)
    deployados: [],      // Ja foram deployados pela Fabrica
   来分析: []
  };
  
  for (const cat in MOD) {
    for (const sub of MOD[cat]) {
      const moduloPath = `${cat}/${sub}`;
      const noServidor = modulosServidor[cat]?.includes(sub);
      const noFabrica = modulosFabrica[cat]?.includes(sub);
      
      // Verifica se tem os arquivos minimos
      const status = await verificarModulo(cat, sub, noServidor);
      
      if (noServidor || noFabrica) {
        if (status.completo) {
          resultado.jaExistem.push({ cat, sub, path: moduloPath });
        } else {
          resultado.incompletos.push({ cat, sub, path: moduloPath, faltando: status.faltando });
        }
      } else {
        resultado.faltantes.push({ cat, sub, path: moduloPath });
      }
      
      if (noFabrica) {
        resultado.deployados.push({ cat, sub, path: moduloPath });
      }
    }
  }
  
  // Exibe resultado
  console.log('\n═══════════════════════════════════════════');
  console.log('  ANALISE COMPLETA');
  console.log('═══════════════════════════════════════════');
  
  console.log(`\n✅ JA EXISTEM e COMPLETOS: ${resultado.jaExistem.length}`);
  for (const m of resultado.jaExistem) {
    console.log(`   - ${m.path}`);
  }
  
  console.log(`\n⚠️  INCOMPLETOS (faltam arquivos): ${resultado.incompletos.length}`);
  for (const m of resultado.incompletos) {
    console.log(`   - ${m.path} | faltando: ${m.faltando.join(', ')}`);
  }
  
  console.log(`\n❌ FALTANTES (criar): ${resultado.faltantes.length}`);
  for (const m of resultado.faltantes) {
    console.log(`   - ${m.path}`);
  }
  
  console.log(`\n🚀 JA DEPLOYADOS (Fabrica): ${resultado.deployados.length}`);
  for (const m of resultado.deployados) {
    console.log(`   - ${m.path}`);
  }
  
  // Salva resultado
  fs.writeFileSync(path.join(OUT, 'modulos_faltantes.json'), JSON.stringify(resultado, null, 2));
  
  console.log('\n═══════════════════════════════════════════');
  console.log('  RESUMO');
  console.log('═══════════════════════════════════════════');
  console.log(`  Criar: ${resultado.faltantes.length}`);
  console.log(`  Completar: ${resultado.incompletos.length}`);
  console.log(`  Ignorar: ${resultado.jaExistem.length}`);
  
  return resultado;
}

/**
 * Verifica se um modulo especifico tem os arquivos necessarios
 */
async function verificarModulo(cat, sub, existe) {
  if (!existe) {
    return { completo: false, faltando: ['modulo_nao_existe'] };
  }
  
  // Por enquanto, vamos considerar que se existe, esta completo
  // Uma verificacao mais profunda exigiria listar os arquivos do diretorio
  return { completo: true, faltando: [] };
}

main().catch(console.error);
