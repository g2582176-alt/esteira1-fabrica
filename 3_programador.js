/**
 * 3_programador.js - Gerador de Modulos
 * Cria arquivos PHP, SQL, etc no local CORRETO
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');

// Template padrao PHP
const TEMPLATE_PHP = `<?php
/**
 * Modulo gerado automaticamente pela Esteira 1
 * Data: {{DATA}}
 * Modulo: {{MODULO}}
 * Submodulo: {{SUBMODULO}}
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/verificar_acesso.php';

// Verifica permissao
exigirPermissao('{{PERMISSAO}}');

// Conteudo principal
$_titulo = '{{TITULO}}';

include __DIR__ . '/../../components/header.php';
?>
<div class="container">
    <h1><?php echo htmlspecialchars($_titulo); ?></h1>
    <p>Modulo {{MODULO}} - {{SUBMODULO}}</p>
    <p>Este modulo foi gerado pela Esteira 1 do BM System.</p>
</div>
<?php
include __DIR__ . '/../../components/footer.php';
`;

function gerarSubmodulo(modKey, subKey, subNome) {
  const output = {};

  // Conteudo do index.php
  const php = TEMPLATE_PHP
    .replace('{{DATA}}', new Date().toISOString())
    .replace('{{MODULO}}', modKey)
    .replace('{{SUBMODULO}}', subKey)
    .replace('{{TITULO}}', subNome)
    .replace('{{PERMISSAO}}', modKey + '.' + subKey);

  output['index.php'] = php;

  // CSS basico
  output['style.css'] = `/* Estilo do modulo ${modKey}/${subKey} */
.container { padding: 20px; }
h1 { color: #184f59; }
`;

  // SQL basico
  output['schema.sql'] = `-- Schema do modulo ${modKey}/${subKey}
CREATE TABLE IF NOT EXISTS ${modKey}_${subKey} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

  return output;
}

function gerarEstrutura() {
  console.log('3_PROGRAMADOR: Gerando estrutura...');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Lista de modulos e submodulos para gerar
  const MODULOS = {
    sst: {
      nome: 'SST (Saude e Seguranca do Trabalho)',
      local: '/home/bmsystem/www/modulos/sst',
      submodulos: {
        acidentes: 'Acidentes de Trabalho',
        aprs: 'Analise Preliminar de Risco',
        dds: 'Dialogo Diario de Seguranca',
        epi: 'Equipamento de Protecao Individual',
        inspecoes: 'Inspecoes de Seguranca',
        prevencao_incendio: 'Prevencao de Incendio (Brigada, Extintores, etc)',
        pts: 'Permissao de Trabalho',
        visibilidade: 'Controle de Visibilidade',
        treinamentos: 'Treinamentos e Capacitacao NRs'
      }
    },
    dp: {
      nome: 'Departamento Pessoal',
      local: '/home/bmsystem/www/modulos/dp',
      submodulos: {
        armarios: 'Gestao de Armarios',
        edificacoes: 'Edificacoes e Pavimentos'
      }
    },
    terceiros: {
      nome: 'Gestao de Terceiros',
      local: '/home/bmsystem/www/modulos/terceiros',
      submodulos: {
        colaboradores: 'Colaboradores Terceiros',
        configuracoes: 'Configuracoes',
        documentos: 'Documentos',
        empresas: 'Empresas Terceiras',
        portal: 'Portal de Terceiros'
      }
    }
  };

  const resultado = {
    timestamp: new Date().toISOString(),
    arquivos_gerados: [],
    estrutura: {}
  };

  for (const [modKey, mod] of Object.entries(MODULOS)) {
    resultado.estrutura[modKey] = mod.local;
    
    if (mod.submodulos) {
      for (const [subKey, subNome] of Object.entries(mod.submodulos)) {
        // Gera arquivos para o submodulo
        const arquivos = gerarSubmodulo(modKey, subKey, subNome);
        
        // Salva na pasta output na estrutura correta
        for (const [arqName, arqContent] of Object.entries(arquivos)) {
          const outPath = path.join(OUTPUT_DIR, modKey, subKey, arqName);
          const outDir = path.dirname(outPath);
          
          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
          }
          
          fs.writeFileSync(outPath, arqContent);
          resultado.arquivos_gerados.push({
            path: outPath,
            modulo: modKey,
            submodulo: subKey,
            arquivo: arqName
          });
        }
      }
    }
  }

  console.log('3_PROGRAMADOR: ' + resultado.arquivos_gerados.length + ' arquivos gerados');
  
  // Salva relatorio
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'gerados.json'),
    JSON.stringify(resultado, null, 2)
  );

  return resultado;
}

gerarEstrutura();
