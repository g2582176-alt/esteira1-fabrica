// 1_pesquisador.js - Detector de Modulos Faltantes
// No GitHub Actions nao temos acesso ao servidor
// Por isso sempre geramos TUDO - o servidor valida via webhook

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');

const MODULOS = {
  sst: { nome: 'SST', submodulos: ['acidentes', 'aprs', 'dds', 'epi', 'inspecoes', 'prevencao_incendio', 'pts', 'visibilidade', 'treinamentos'] },
  dp: { nome: 'DP', submodulos: ['armarios', 'edificacoes'] },
  terceiros: { nome: 'Terceiros', submodulos: ['colaboradores', 'configuracoes', 'documentos', 'empresas', 'portal'] },
  meio_ambiente: { nome: 'Meio Ambiente', submodulos: ['pesagem'] },
  gestao_acesso: { nome: 'Gestao Acesso', submodulos: [] },
  administracao: { nome: 'Administracao', submodulos: [] },
  gestao_empresas: { nome: 'Gestao Empresas', submodulos: [] },
  fabrica_software: { nome: 'Fabrica Software', submodulos: [] },
  suporte: { nome: 'Suporte', submodulos: [] },
  blog: { nome: 'Blog', submodulos: [] },
  faq: { nome: 'FAQ', submodulos: [] },
  acesso_gratis: { nome: 'Acesso Gratis', submodulos: [] },
  plano: { nome: 'Plano', submodulos: [] }
};

function detectar() {
  console.log('1_PESQUISADOR: Listando modulos...');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const relatorio = {
    timestamp: new Date().toISOString(),
    total_modulos: Object.keys(MODULOS).length,
    modulos: []
  };

  for (const [modKey, mod] of Object.entries(MODULOS)) {
    if (mod.submodulos && mod.submodulos.length > 0) {
      for (const subKey of mod.submodulos) {
        relatorio.modulos.push({
          key: modKey + '_' + subKey,
          nome: mod.nome + ' - ' + subKey,
          local: '/home/bmsystem/www/modulos/' + modKey + '/' + subKey,
          modulo: modKey,
          submodulo: subKey
        });
      }
    } else {
      relatorio.modulos.push({
        key: modKey,
        nome: mod.nome,
        local: '/home/bmsystem/www/modulos/' + modKey,
        modulo: modKey,
        submodulo: null
      });
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'modulos_faltantes.json'), JSON.stringify(relatorio, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'bd_cache.json'), JSON.stringify({
    timestamp: relatorio.timestamp,
    total: relatorio.modulos.length
  }, null, 2));

  console.log('1_PESQUISADOR: ' + relatorio.modulos.length + ' modulos a verificar');
}

detectar();
