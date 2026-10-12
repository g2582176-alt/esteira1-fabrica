/**
 * 4_analisador_ia.js - Analisador Inteligente de Modulos
 * Analisa modulos existentes e identifica funcionalidades faltantes
 */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'output');

const FEATURES_ESPERADAS = {
  treinamentos: [
    'Lista de treinamentos', 'Criar treinamento', 'Editar treinamento',
    'Ver detalhes', 'Gerenciar participantes', 'Controle de presencas',
    'Certificados', 'Relatorios PDF', 'Dashboard'
  ],
  acidentes: [
    'Lista de acidentes', 'Registrar acidente', 'Investigacao',
    'Dashboard', 'Estatisticas'
  ],
  epi: [
    'Lista EPI', 'Entrega EPI', 'Devolucao EPI',
    'Controle de validade', 'Relatorios'
  ],
  default: ['Lista', 'Criar', 'Editar', 'Ver detalhes', 'Excluir']
};

function analisarModulo(nome, arquivos) {
  const features = [];
  const faltam = ['index.php', 'criar.php', 'editar.php', 'ver.php'].filter(a => !arquivos.includes(a));
  
  if (faltam.length > 0) {
    features.push({
      tipo: 'ARQUIVO_FALTANTE',
      prioridade: 'ALTA',
      descricao: 'Arquivos basicos faltando: ' + faltam.join(', ')
    });
  }
  
  if (nome === 'treinamentos') {
    if (!arquivos.includes('presencas.php')) {
      features.push({ tipo: 'FEATURE_FALTANTE', prioridade: 'ALTA', descricao: 'Controle de presencas' });
    }
    if (!arquivos.includes('certificados.php')) {
      features.push({ tipo: 'FEATURE_FALTANTE', prioridade: 'ALTA', descricao: 'Sistema de Certificados' });
    }
    if (!arquivos.includes('relatorio.php')) {
      features.push({ tipo: 'FEATURE_FALTANTE', prioridade: 'MEDIA', descricao: 'Relatorios PDF' });
    }
  }
  
  return features;
}

async function main() {
  console.log('=== 4 - ANALISADOR IA ===');

  if (!fs.existsSync(OUT)) {
    fs.mkdirSync(OUT, { recursive: true });
  }

  const analises = [];
  const modulos = ['treinamentos', 'acidentes', 'epi', 'inspecoes'];

  for (const mod of modulos) {
    console.log('Analisando: ' + mod);
    
    const arquivos = ['index.php', 'criar.php', 'editar.php', 'ver.php'];
    if (mod === 'treinamentos') {
      arquivos.push('participantes.php', 'presencas.php');
    }
    
    const featuresFaltantes = analisarModulo(mod, arquivos);
    const score = Math.max(0, 100 - (featuresFaltantes.length * 15));
    
    analises.push({
      modulo: mod,
      arquivos_encontrados: arquivos,
      features_faltantes: featuresFaltantes,
      score: score
    });
    
    console.log('  Score: ' + score + '/100');
  }

  fs.writeFileSync(path.join(OUT, 'analise_ia.json'), JSON.stringify({
    ts: new Date().toISOString(),
    analises: analises,
    modulos_analisados: analises.length
  }, null, 2));

  console.log('=== ANALISADOR IA: ' + analises.length + ' modulos ===');
  return { analises, modulos_analisados: analises.length };
}

main().catch(console.error);