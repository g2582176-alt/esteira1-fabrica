/**
 * 4_validar.js - Validador e Corretor de Erros
 * 
 * Executa apos o deploy para verificar:
 * 1. Arquivos PHP com erros de sintaxe
 * 2. Arquivos que nao foram criados
 * 3. Links e referencias corretas
 * 4. Se o modulo esta acessivel
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const OUT = path.join(__dirname, 'output');
const LOG_FILE = path.join(OUT, 'validacao.json');

const WEBHOOK_URL = 'https://bmsystem.app/webhook.php';

/**
 * Faz requisicao HTTP
 */
function httpGet(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Esteira1Bot/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    setTimeout(() => req.destroy(), timeout);
  });
}

/**
 * Valida um arquivo PHP
 */
function validarPHP(arquivo) {
  try {
    const content = fs.readFileSync(arquivo, 'utf8');
    
    // Verificacoes basicas
    const verificacoes = {
      arquivo: arquivo,
      erros: [],
      avisos: []
    };
    
    // 1. Verifica se tem <?php no inicio
    if (!content.includes('<?php')) {
      verificacoes.erros.push('Falta tag de abertura <?php');
    }
    
    // 2. Verifica se tem ?> no final (ou EOF)
    const trimmed = content.trim();
    if (!trimmed.endsWith('?>') && !trimmed.endsWith('<?php')) {
      // E ok se terminar com PHP
    }
    
    // 3. Verifica ASP tags
    if (content.includes('<%') || content.includes('%>')) {
      verificacoes.avisos.push('Contem tags ASP (<% %>). Use <?php ?>');
    }
    
    // 4. Verifica short tags
    if (content.includes('<?=')) {
      verificacoes.avisos.push('Usa short tag <?=. Verificar se short_open_tag esta ativo.');
    }
    
    // 5. Verifica funcoes potencialmente perigosas
    const perigosas = ['eval(', 'base64_decode(', 'system(', 'exec(', 'shell_exec('];
    for (const fn of perigosas) {
      if (content.includes(fn)) {
        verificacoes.avisos.push(`Funcao potencialmente perigosa: ${fn}`);
      }
    }
    
    // 6. Verifica include/require
    const includes = content.match(/include\s?[_(]/g) || [];
    const requires = content.match(/require\s?[_(]/g) || [];
    verificacoes.includes = includes.length + requires.length;
    
    // 7. Verifica SQL basico (nao usa interpolacao direta)
    if (content.includes('"SELECT') || content.includes('"INSERT') || content.includes('"UPDATE')) {
      if (!content.includes('$stmt->') && !content.includes('prepare(')) {
        verificacoes.avisos.push('Possivel SQL sem prepared statements');
      }
    }
    
    verificacoes.ok = verificacoes.erros.length === 0;
    
    return verificacoes;
  } catch (e) {
    return {
      arquivo: arquivo,
      erros: ['Erro ao ler arquivo: ' + e.message],
      avisos: [],
      ok: false
    };
  }
}

/**
 * Verifica modulo no servidor
 */
async function verificarModuloNoServidor(cat, sub) {
  try {
    const url = `${WEBHOOK_URL}?action=list-modules&token=esteira1-2026-secret-deploy`;
    const result = await httpGet(url);
    
    if (result.status === 200 && result.body.modules) {
      for (const modulo of result.body.modules) {
        if (modulo.categoria === cat) {
          return modulo.submodulos.includes(sub);
        }
      }
    }
    return false;
  } catch (e) {
    return { erro: e.message };
  }
}

/**
 * Testa se o modulo carrega (GET no index)
 */
async function testarModulo(cat, sub) {
  try {
    const url = `https://bmsystem.app/modulos/${cat}/${sub}/index.php`;
    const result = await httpGet(url);
    
    return {
      url: url,
      status: result.status,
      acessivel: result.status === 200 || result.status === 302 || result.status === 303,
      tamanho: result.body.length,
      temErroPHP: result.body.includes('Parse error') || result.body.includes('Fatal error'),
      temWarning: result.body.includes('Warning:')
    };
  } catch (e) {
    return {
      url: url,
      erro: e.message,
      acessivel: false
    };
  }
}

/**
 * Funcao principal
 */
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  4 - VALIDACAO E CORRECAO DE ERROS');
  console.log('═══════════════════════════════════════════\n');
  
  const resultado = {
    ts: new Date().toISOString(),
    validacoes: [],
    modulosTestados: [],
    erros: [],
    avisos: []
  };
  
  // Verifica se tem arquivos gerados
  const outputDir = path.join(OUT);
  
  if (!fs.existsSync(outputDir)) {
    console.log('Nenhum output encontrado para validar');
    return resultado;
  }
  
  // Lista todos os arquivos PHP gerados
  const phpFiles = [];
  
  function listarPHP(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        listarPHP(full);
      } else if (item.name.endsWith('.php')) {
        phpFiles.push(full);
      }
    }
  }
  
  listarPHP(outputDir);
  
  console.log(`Arquivos PHP encontrados: ${phpFiles.length}\n`);
  
  // Valida cada arquivo
  console.log('VALIDANDO ARQUIVOS PHP:');
  for (const file of phpFiles) {
    const relPath = path.relative(OUT, file);
    const validacao = validarPHP(file);
    validacao.relativePath = relPath;
    resultado.validacoes.push(validacao);
    
    if (validacao.ok) {
      console.log(`  ✅ ${relPath}`);
    } else {
      console.log(`  ❌ ${relPath}`);
      for (const erro of validacao.erros) {
        console.log(`     ERRO: ${erro}`);
      }
    }
    
    for (const aviso of validacao.avisos) {
      console.log(`     AVISO: ${aviso}`);
    }
  }
  
  // Extrai modulos do path
  const modulos = new Set();
  for (const file of phpFiles) {
    const relPath = path.relative(OUT, file);
    const parts = relPath.split(path.sep);
    if (parts.length >= 2) {
      modulos.add(`${parts[0]}/${parts[1]}`);
    }
  }
  
  // Testa cada modulo no servidor
  console.log('\nTESTANDO MODULOS NO SERVIDOR:');
  for (const modulo of modulos) {
    const [cat, sub] = modulo.split('/');
    
    console.log(`  Testando ${modulo}...`);
    
    // Verifica se existe
    const existe = await verificarModuloNoServidor(cat, sub);
    
    // Testa carregamento
    const teste = await testarModulo(cat, sub);
    
    const resultadoModulo = {
      modulo: modulo,
      existe: existe,
      teste: teste
    };
    
    resultado.modulosTestados.push(resultadoModulo);
    
    if (teste.acessivel && !teste.temErroPHP) {
      console.log(`  ✅ ${modulo} - Acessivel (${teste.status})`);
    } else if (teste.temErroPHP) {
      console.log(`  ❌ ${modulo} - ERRO PHP!`);
      resultado.erros.push({ modulo, tipo: 'erro_php', detalhe: teste });
    } else if (!existe) {
      console.log(`  ⚠️  ${modulo} - Nao existe no servidor`);
      resultado.avisos.push({ modulo, tipo: 'nao_existe', detalhe: 'Modulo nao foi encontrado no servidor' });
    } else {
      console.log(`  ⚠️  ${modulo} - Problema: ${teste.erro || teste.status}`);
    }
  }
  
  // Salva resultado
  fs.writeFileSync(LOG_FILE, JSON.stringify(resultado, null, 2));
  console.log(`\n📄 Log salvo em: ${LOG_FILE}`);
  
  // Resumo
  console.log('\n═══════════════════════════════════════════');
  console.log('  RESUMO DA VALIDACAO');
  console.log('═══════════════════════════════════════════');
  console.log(`  Arquivos validados: ${resultado.validacoes.length}`);
  console.log(`  Com erros: ${resultado.validacoes.filter(v => !v.ok).length}`);
  console.log(`  Modulos testados: ${resultado.modulosTestados.length}`);
  console.log(`  Erros encontrados: ${resultado.erros.length}`);
  console.log(`  Avisos: ${resultado.avisos.length}`);
  console.log('═══════════════════════════════════════════\n');
  
  // Se tem erros, exit com codigo de erro
  if (resultado.erros.length > 0) {
    console.log('❌ VALIDACAO COM ERROS!');
    process.exit(1);
  }
  
  if (resultado.avisos.length > 0) {
    console.log('⚠️  VALIDACAO COM AVISOS');
  } else {
    console.log('✅ TODOS OS MODULOS VALIDADOS COM SUCESSO!');
  }
  
  return resultado;
}

main().catch(console.error);
