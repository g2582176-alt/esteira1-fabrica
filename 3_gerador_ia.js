/**
 * 3_gerador_ia.js
 * Usa MiniMax API para gerar codigo inteligente
 */

const https = require('https');

const API_KEY = process.env.MINIMAX_API_KEY || '';
const API_URL = 'api.minimaxi.chat';
const API_PATH = '/v1/text/chatcompletion_v2';

async function chamarMinimax(prompt) {
  if (!API_KEY) {
    console.log('MINIMAX_API_KEY nao configurada - usando fallback');
    return null;
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'MiniMax-Text-01',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 4096,
      temperature: 0.3
    });

    const options = {
      hostname: API_URL,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
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
            console.log('Erro MiniMax:', JSON.stringify(json).substring(0, 200));
            resolve(null);
          }
        } catch (e) {
          console.log('Erro parsing:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', e => {
      console.log('Erro request:', e.message);
      resolve(null);
    });
    req.write(data);
    req.end();
  });
}

async function gerarCodigoIA(modulo, feature) {
  const prompt = ` Gere codigo PHP completo para a feature "${feature}" do modulo "${modulo}" no BMSystem.
  
  O codigo deve:
  1. Usar session_start() no inicio se PHP_SESSION_NONE
  2. Fazer require_once de conexao.php e verificar_acesso.php
  3. Usar classes Service existentes (se houver)
  4. Seguir o padrao HTML/CSS do BMSystem
  5. Ser completo e funcional
  
  Responda APENAS com o codigo PHP, sem explicacoes. `;

  const resultado = await chamarMinimax(prompt);
  return resultado;
}

// Script principal
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'output');

const MODULOS = ['treinamentos', 'acidentes', 'epi', 'inspecoes'];

async function main() {
  console.log('=== 3_gerador_ia.js - MiniMax ===');
  console.log('API Key:', API_KEY ? 'OK' : 'FALTA');
  
  if (!fs.existsSync(OUT)) {
    fs.mkdirSync(OUT, { recursive: true });
  }

  const gerados = [];

  for (const mod of MODULOS) {
    console.log('Processando: ' + mod);
    
    // Para cada modulo, tentar gerar features com IA
    const features = [
      { nome: 'dashboard', arquivo: 'dashboard.php' },
      { nome: 'relatorio', arquivo: 'relatorio.php' }
    ];

    for (const feat of features) {
      const filePath = path.join(OUT, mod, feat.arquivo);
      
      if (!fs.existsSync(filePath)) {
        console.log('  Gerando ' + feat.arquivo + ' com IA...');
        const codigo = await gerarCodigoIA(mod, feat.nome);
        
        if (codigo) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          fs.writeFileSync(filePath, codigo);
          gerados.push({ modulo: mod, feature: feat.nome, arquivo: feat.arquivo, ia: true });
          console.log('  OK: ' + feat.arquivo + ' (gerado por IA)');
        } else {
          console.log('  Pulando: ' + feat.arquivo + ' (sem IA)');
        }
      }
    }
  }

  fs.writeFileSync(
    path.join(OUT, 'gerados_ia.json'),
    JSON.stringify({ ts: new Date().toISOString(), gerados, total: gerados.length }, null, 2)
  );

  console.log('=== TOTAL: ' + gerados.length + ' arquivos gerados por IA ===');
  return { gerados, total: gerados.length };
}

main().catch(console.error);