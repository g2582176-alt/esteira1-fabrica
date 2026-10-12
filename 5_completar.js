/**
 * 5_completar.js - Completar Modulos Incompletos
 * 
 * Verifica modulos que existem mas estao incompletos
 * e gera os arquivos faltantes
 */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'output');

// Arquivos que cada tipo de modulo deve ter
const TEMPLATES = {
  // Template base de index.php
  index_base: (cat, sub, titulo) => `<?php
/**
 * Modulo: ${cat}/${sub}
 * Titulo: ${titulo}
 * Gerado automaticamente pela Esteira 1
 */

if (session_status() === PHP_SESSION_NONE) { session_start(); }
require_once "../../../config/conexao.php";
require_once "../../../config/verificar_acesso.php";

exigirPermissao("${cat}.${sub}");

$titulo = "${titulo}";
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($titulo) ?> | BM System</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="<?= $sub ?>.css">
</head>
<body>
<a href="../index.php" class="btn-voltar"><i class="fas fa-arrow-left"></i> Voltar</a>

<div class="header">
    <h1><i class="fas fa-cube"></i> <?= htmlspecialchars($titulo) ?></h1>
    <p>Modulo ${cat}/${sub}</p>
</div>

<div class="container">
    <p>Este modulo esta em desenvolvimento.</p>
</div>

</body>
</html>`,

  // Template de Service
  service: (cat, sub) => `<?php
/**
 * ${sub}Service - Servico do modulo ${cat}/${sub}
 * Gerado automaticamente pela Esteira 1
 */
class ${sub}Service {
    private $conn;
    
    public function __construct($conn = null) {
        $this->conn = $conn ?: ($GLOBALS['pdo'] ?? null);
    }
    
    public function listar($filtros = array()) {
        // TODO: Implementar listagem
        return array();
    }
    
    public function buscarPorId($id) {
        // TODO: Implementar busca por ID
        return null;
    }
    
    public function criar($dados) {
        // TODO: Implementar criacao
        return false;
    }
    
    public function atualizar($id, $dados) {
        // TODO: Implementar atualizacao
        return false;
    }
    
    public function excluir($id) {
        // TODO: Implementar exclusao
        return false;
    }
}`,

  // Template de CSS
  css: () => `:root {
    --primary: #2c7a7b;
    --primary-dark: #1d4e4f;
    --bg: #f4f7f6;
}
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; padding: 32px; }
.btn-voltar { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; text-decoration: none; border: 2px solid var(--primary); color: var(--primary); font-weight: 700; }
.btn-voltar:hover { background: var(--primary); color: #fff; }
.header { margin: 22px 0 28px; border-left: 6px solid var(--primary); padding-left: 16px; }
.header h1 { margin: 0 0 8px; color: var(--primary-dark); }
.container { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }`,

  // Template de Migration SQL
  migration: (cat, sub) => `-- Migration: ${cat}/${sub}
-- Gerado automaticamente pela Esteira 1

CREATE TABLE IF NOT EXISTS ${cat}_${sub} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
};

// Modulos que a esteira gerencia
const MOD = {
  sst: ['acidentes', 'aprs', 'dds', 'epi', 'inspecoes', 'prevencao_incendio', 'pts', 'treinamentos', 'visibilidade'],
  dp: ['armarios', 'edificacoes'],
  terceiros: ['colaboradores', 'configuracoes', 'documentos', 'empresas', 'portal'],
  meio_ambiente: ['pesagem']
};

// Titulos
const TITULOS = {
  acidentes: 'Acidentes de Trabalho',
  aprs: 'Analise Preliminar de Risco',
  dds: 'Dialogo Diario de Seguranca',
  epi: 'Equipamento de Protecao Individual',
  inspecoes: 'Inspecoes de Seguranca',
  prevencao_incendio: 'Prevencao de Incendio',
  pts: 'Permissao de Trabalho',
  treinamentos: 'Treinamentos e Capacitacao NRs',
  visibilidade: 'Controle de Visibilidade',
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
 * Verifica se um modulo esta completo
 */
function verificarModulo(cat, sub) {
  const dir = path.join(OUT, cat, sub);
  const faltando = [];
  
  // Verifica index.php
  if (!fs.existsSync(path.join(dir, 'index.php'))) {
    faltando.push('index.php');
  }
  
  // Para modulos SST, verifica services
  if (cat === 'sst') {
    if (!fs.existsSync(path.join(dir, 'services'))) {
      faltando.push('services/');
    } else {
      const serviceFile = path.join(dir, 'services', `${sub}Service.php`);
      if (!fs.existsSync(serviceFile)) {
        faltando.push(`services/${sub}Service.php`);
      }
    }
    
    if (!fs.existsSync(path.join(dir, 'migrations'))) {
      faltando.push('migrations/');
    }
  }
  
  // Verifica CSS
  const cssFile = path.join(dir, `${sub}.css`);
  if (!fs.existsSync(cssFile)) {
    // Tenta outro nome
    const cssFile2 = path.join(dir, 'style.css');
    if (!fs.existsSync(cssFile2)) {
      faltando.push(`${sub}.css ou style.css`);
    }
  }
  
  return faltando;
}

/**
 * Completa um modulo com os arquivos faltantes
 */
function completarModulo(cat, sub) {
  const dir = path.join(OUT, cat, sub);
  const titulo = TITULOS[sub] || sub;
  const criados = [];
  
  // Cria diretorios se necessario
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (cat === 'sst' && !fs.existsSync(path.join(dir, 'services'))) {
    fs.mkdirSync(path.join(dir, 'services'), { recursive: true });
  }
  
  if (cat === 'sst' && !fs.existsSync(path.join(dir, 'migrations'))) {
    fs.mkdirSync(path.join(dir, 'migrations'), { recursive: true });
  }
  
  // Cria index.php se nao existir
  const indexFile = path.join(dir, 'index.php');
  if (!fs.existsSync(indexFile)) {
    fs.writeFileSync(indexFile, TEMPLATES.index_base(cat, sub, titulo));
    criados.push('index.php');
  }
  
  // Cria Service se nao existir (para SST)
  if (cat === 'sst') {
    const serviceFile = path.join(dir, 'services', `${sub}Service.php`);
    if (!fs.existsSync(serviceFile)) {
      fs.writeFileSync(serviceFile, TEMPLATES.service(cat, sub));
      criados.push(`services/${sub}Service.php`);
    }
    
    // Cria Migration se nao existir
    const migFile = path.join(dir, 'migrations', `create_${sub}.sql`);
    if (!fs.existsSync(migFile)) {
      fs.writeFileSync(migFile, TEMPLATES.migration(cat, sub));
      criados.push(`migrations/create_${sub}.sql`);
    }
  }
  
  // Cria CSS se nao existir
  const cssFile = path.join(dir, `${sub}.css`);
  const cssFile2 = path.join(dir, 'style.css');
  if (!fs.existsSync(cssFile) && !fs.existsSync(cssFile2)) {
    fs.writeFileSync(cssFile, TEMPLATES.css());
    criados.push(`${sub}.css`);
  }
  
  return criados;
}

/**
 * Funcao principal
 */
function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  5 - COMPLETAR MODULOS INCOMPLETOS');
  console.log('═══════════════════════════════════════════\n');
  
  const resultado = {
    verificados: 0,
    completos: 0,
    incompletos: 0,
    completados: []
  };
  
  // Verifica cada modulo
  for (const cat in MOD) {
    for (const sub of MOD[cat]) {
      console.log(`Verificando ${cat}/${sub}...`);
      
      resultado.verificados++;
      const faltando = verificarModulo(cat, sub);
      
      if (faltando.length === 0) {
        console.log(`  ✅ Completo`);
        resultado.completos++;
      } else {
        console.log(`  ⚠️  Incompleto: ${faltando.join(', ')}`);
        resultado.incompletos++;
        
        // Completa o modulo
        console.log(`  🔧 Completando...`);
        const criados = completarModulo(cat, sub);
        
        if (criados.length > 0) {
          resultado.completados.push({
            modulo: `${cat}/${sub}`,
            criados: criados
          });
          console.log(`  ✅ Criados: ${criados.join(', ')}`);
        }
      }
    }
  }
  
  // Salva resultado
  fs.writeFileSync(path.join(OUT, 'completados.json'), JSON.stringify(resultado, null, 2));
  
  console.log('\n═══════════════════════════════════════════');
  console.log('  RESUMO');
  console.log('═══════════════════════════════════════════');
  console.log(`  Verificados: ${resultado.verificados}`);
  console.log(`  Completos: ${resultado.completos}`);
  console.log(`  Incompletos: ${resultado.incompletos}`);
  console.log(`  Arquivos criados: ${resultado.completados.reduce((acc, m) => acc + m.criados.length, 0)}`);
  console.log('═══════════════════════════════════════════\n');
  
  return resultado;
}

main();
