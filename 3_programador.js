/**
 * 3_programador.js - Gerador de Modulos
 * 
 * Gera codigo PHP para modulos SST
 * Usa template inteligente baseado no tipo de modulo
 */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'output');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Modulos que a esteira gerencia
const MODS = {
  sst: ['acidentes', 'aprs', 'dds', 'epi', 'inspecoes', 'prevencao_incendio', 'pts', 'treinamentos', 'visibilidade'],
  dp: ['armarios', 'edificacoes'],
  terceiros: ['colaboradores', 'configuracoes', 'documentos', 'empresas', 'portal'],
  meio_ambiente: ['pesagem']
};

// Titulos humanizados
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

/**
 * Gera conteudo PHP baseado no modulo
 */
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
  lines.push('$subtitulo = "Gerenciado pelo sistema BM System";');
  lines.push('$modulo = "' + sub + '";');
  lines.push('$categoria = "' + mod + '";');
  lines.push('?>');
  lines.push('<div class="container py-4">');
  lines.push('    <div class="d-flex justify-content-between align-items-center mb-4">');
  lines.push('        <div>');
  lines.push('            <h2 class="mb-1"><i class="fas fa-' + getIcon(sub) + ' me-2"></i><?= htmlspecialchars($titulo) ?></h2>');
  lines.push('            <p class="text-muted mb-0"><?= htmlspecialchars($subtitulo) ?></p>');
  lines.push('        </div>');
  lines.push('        <div>');
  lines.push('            <span class="badge bg-primary me-2"><?= ucfirst($categoria) ?></span>');
  lines.push('            <span class="badge bg-secondary"><?= ucfirst($modulo) ?></span>');
  lines.push('        </div>');
  lines.push('    </div>');
  lines.push('');
  lines.push('    <div class="card">');
  lines.push('        <div class="card-header">');
  lines.push('            <h5 class="mb-0"><i class="fas fa-list me-2"></i>Modulo ' + sub + '</h5>');
  lines.push('        </div>');
  lines.push('        <div class="card-body text-center py-5">');
  lines.push('            <i class="fas fa-' + getIcon(sub) + ' fa-4x text-muted mb-3"></i>');
  lines.push('            <h4>Modulo ' + titulo + '</h4>');
  lines.push('            <p class="text-muted">Este modulo esta em desenvolvimento pela Esteira 1.</p>');
  lines.push('            <p class="text-muted">Gerado em: <?= date("d/m/Y H:i:s") ?></p>');
  lines.push('        </div>');
  lines.push('    </div>');
  lines.push('</div>');
  lines.push('<?php include $root . "/components/footer.php";');
  
  return lines.join('\n');
}

/**
 * Obtem icone FontAwesome baseado no modulo
 */
function getIcon(sub) {
  const icons = {
    acidentes: 'exclamation-triangle',
    aprs: 'clipboard-list',
    dds: '-comments',
    epi: 'hard-hat',
    inspecoes: 'search',
    prevencao_incendio: 'fire',
    pts: 'clipboard',
    treinamentos: 'graduation-cap',
    visibilidade: '-eye',
    armarios: 'archive',
    edificacoes: 'building',
    colaboradores: 'users',
    configuracoes: 'cog',
    documentos: 'file-alt',
    empresas: 'building',
    portal: 'globe',
    pesagem: 'weight'
  };
  return icons[sub] || 'cube';
}

/**
 * Gera CSS basico
 */
function cssContent(mod, sub) {
  return `.container { padding: 20px; max-width: 1200px; margin: 0 auto; }
h1, h2, h3 { color: #184f59; }
h1 { border-bottom: 2px solid #184f59; padding-bottom: 10px; }
.card { box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: none; }
.badge { font-size: 0.85em; }
.text-muted { color: #6c757d !important; }
`;
}

/**
 * Gera SQL basico
 */
function sqlContent(mod, sub) {
  const tableName = mod + '_' + sub;
  return `-- Schema do modulo ${mod}/${sub}
-- Gerado pela Esteira 1 em ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS ${tableName} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL COMMENT 'Nome do registro',
    descricao TEXT COMMENT 'Descricao detalhada',
    status ENUM('ativo', 'inativo', 'pendente') DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabela ${mod}/${sub}';
`;
}

/**
 * Funcao principal
 */
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  3 - GERADOR DE CODIGO');
  console.log('═══════════════════════════════════════════');
  
  // Carrega modulos_faltantes.json se existir
  let modulosFaltantes = [];
  const modulosFile = path.join(OUT, 'modulos_faltantes.json');
  
  if (fs.existsSync(modulosFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(modulosFile, 'utf8'));
      modulosFaltantes = data.modulos_faltantes || [];
      console.log('Usando lista de modulos faltantes do detector');
    } catch (e) {
      console.log('Aviso: Nao foi possivel ler modulos_faltantes.json');
    }
  }
  
  // Se nao tem lista, gera todos
  if (modulosFaltantes.length === 0) {
    console.log('Gerando todos os modulos (lista vazia)');
    for (const m in MODS) {
      for (const s of MODS[m]) {
        modulosFaltantes.push({ m: m, s: s });
      }
    }
  }
  
  console.log('Modulos a gerar: ' + modulosFaltantes.length);
  console.log('');
  
  let count = 0;
  const out = [];
  
  for (const modData of modulosFaltantes) {
    const m = modData.m;
    const s = modData.s;
    
    const dir = path.join(OUT, m, s);
    fs.mkdirSync(dir, { recursive: true });
    
    const titulo = TITULOS[s] || s;
    
    // Gera arquivos
    const php = phpContent(m, s, titulo);
    const css = cssContent(m, s);
    const sql = sqlContent(m, s);
    
    fs.writeFileSync(path.join(dir, 'index.php'), php);
    fs.writeFileSync(path.join(dir, 'style.css'), css);
    fs.writeFileSync(path.join(dir, 'schema.sql'), sql);
    
    out.push({ m: m, s: s, l: dir, titulo: titulo });
    count++;
    
    console.log('  Gerado: ' + m + '/' + s + ' -> ' + titulo);
  }
  
  const r = {
    ts: new Date().toISOString(),
    count: count,
    files: out
  };
  
  fs.writeFileSync(path.join(OUT, 'gerados.json'), JSON.stringify(r, null, 2));
  
  console.log('');
  console.log('3_PROGRAMADOR: ' + count + ' modulos gerados');
  
  return r;
}

main().catch(console.error);
