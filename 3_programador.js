// 3_programador.js - Gerador de Modulos (SEM ERROS DE SINTAXE)
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'output');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, {recursive: true});

const MODS = {
  sst: ['acidentes','aprs','dds','epi','inspecoes','prevencao_incendio','pts','visibilidade','treinamentos'],
  dp: ['armarios','edificacoes'],
  terceiros: ['colaboradores','configuracoes','documentos','empresas','portal'],
  meio_ambiente: ['pesagem']
};

const TITULOS = {
  acidentes: 'Acidentes de Trabalho',
  aprs: 'Analise Preliminar de Risco',
  dds: 'Dialogo Diario de Seguranca',
  epi: 'Equipamento de Protecao Individual',
  inspecoes: 'Inspecoes de Seguranca',
  prevencao_incendio: 'Prevencao de Incendio',
  pts: 'Permissao de Trabalho',
  visibilidade: 'Controle de Visibilidade',
  treinamentos: 'Treinamentos e Capacitacao NRs',
  armarios: 'Gestao de Armarios',
  edificacoes: 'Edificacoes e Pavimentos',
  colaboradores: 'Colaboradores Terceiros',
  configuracoes: 'Configuracoes',
  documentos: 'Documentos',
  empresas: 'Empresas Terceiras',
  portal: 'Portal de Terceiros',
  pesagem: 'Pesagem de Residuos'
};

function phpContent(mod, sub, titulo) {
  const lines = [];
  lines.push('<?php');
  lines.push('/**');
  lines.push(' * Modulo: ' + mod + ' - ' + sub);
  lines.push(' * Titulo: ' + titulo);
  lines.push(' * Gerado automaticamente pela Esteira 1');
  lines.push(' * Data: ' + new Date().toISOString());
  lines.push(' */');
  lines.push('');
  lines.push('$root = $_SERVER["DOCUMENT_ROOT"] ?? "/home/bmsystem/www";');
  lines.push('');
  lines.push('require_once $root . "/config/bootstrap.php";');
  lines.push('require_once $root . "/config/verificar_acesso.php";');
  lines.push('');
  lines.push('exigirPermissao("' + mod + '.' + sub + '");');
  lines.push('');
  lines.push('$titulo = "' + titulo + '";');
  lines.push('?>');
  lines.push('<div class="container">');
  lines.push('    <h1><?php echo htmlspecialchars($titulo); ?></h1>');
  lines.push('    <p>Modulo ' + mod + ' - ' + sub + '</p>');
  lines.push('    <p>Gerado pela Esteira 1 do BM System.</p>');
  lines.push('    <p>Data: ' + new Date().toISOString() + '</p>');
  lines.push('</div>');
  lines.push('<?php include $root . "/components/footer.php";');
  return lines.join('\n');
}

let count = 0;
const out = [];
for (const m in MODS) {
  for (const s of MODS[m]) {
    const dir = path.join(OUT, m, s);
    fs.mkdirSync(dir, {recursive: true});
    const titulo = TITULOS[s] || s;
    const php = phpContent(m, s, titulo);
    const css = '.container { padding: 20px; max-width: 1200px; margin: 0 auto; }\nh1 { color: #184f59; }';
    const sql = '-- Schema do modulo ' + m + '/' + s + '\nCREATE TABLE IF NOT EXISTS ' + m + '_' + s + ' (id INT AUTO_INCREMENT PRIMARY KEY, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);\n';
    fs.writeFileSync(path.join(dir, 'index.php'), php);
    fs.writeFileSync(path.join(dir, 'style.css'), css);
    fs.writeFileSync(path.join(dir, 'schema.sql'), sql);
    out.push({m: m, s: s, l: dir});
    count++;
  }
}

const r = {ts: new Date().toISOString(), count: count, files: out};
fs.writeFileSync(path.join(OUT, 'gerados.json'), JSON.stringify(r, null, 2));
console.log('3_PROGRAMADOR: ' + count + ' submodulos gerados');
