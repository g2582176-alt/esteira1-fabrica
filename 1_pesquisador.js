// 1_pesquisador.js - Detector de Modulos
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'output');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, {recursive: true});

const MOD = {
  sst: ['acidentes','aprs','dds','epi','inspecoes','prevencao_incendio','pts','visibilidade','treinamentos'],
  dp: ['armarios','edificacoes'],
  terceiros: ['colaboradores','configuracoes','documentos','empresas','portal'],
  meio_ambiente: ['pesagem'],
  gestao_acesso: [],
  administracao: [],
  gestao_empresas: [],
  fabrica_software: [],
  suporte: [],
  blog: [],
  faq: [],
  acesso_gratis: [],
  plano: []
};

const lista = [];
for (const m in MOD) {
  if (MOD[m].length === 0) {
    lista.push({m: m, s: null, l: '/home/bmsystem/www/modulos/' + m});
  } else {
    for (const s of MOD[m]) {
      lista.push({m: m, s: s, l: '/home/bmsystem/www/modulos/' + m + '/' + s});
    }
  }
}

const r = {ts: new Date().toISOString(), t: lista.length, l: lista};
fs.writeFileSync(path.join(OUT, 'modulos_faltantes.json'), JSON.stringify(r, null, 2));
fs.writeFileSync(path.join(OUT, 'bd_cache.json'), JSON.stringify({ts: r.ts, t: r.t}, null, 2));
console.log('1_PESQUISADOR: ' + lista.length + ' modulos');
