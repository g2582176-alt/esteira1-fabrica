/**
 * 1_pesquisador.js - Detector de Modulos Faltantes
 * Verifica quais modulos existem no servidor
 */

// Definicao de TODOS os modulos que o sistema tem
const MODULOS = {
  sst: {
    nome: 'SST (Saude e Seguranca do Trabalho)',
    local: '/home/bmsystem/www/modulos/sst',
    tipo: 'modulo',
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
    tipo: 'modulo',
    submodulos: {
      armarios: 'Gestao de Armarios',
      edificacoes: 'Edificacoes e Pavimentos'
    }
  },
  terceiros: {
    nome: 'Gestao de Terceiros',
    local: '/home/bmsystem/www/modulos/terceiros',
    tipo: 'modulo',
    submodulos: {
      colaboradores: 'Colaboradores Terceiros',
      configuracoes: 'Configuracoes',
      documentos: 'Documentos',
      empresas: 'Empresas Terceiras',
      portal: 'Portal de Terceiros'
    }
  },
  meio_ambiente: {
    nome: 'Meio Ambiente',
    local: '/home/bmsystem/www/modulos/meio_ambiente',
    tipo: 'modulo',
    submodulos: {
      pesagem: 'Pesagem de Residuos'
    }
  },
  gestao_acesso: {
    nome: 'Gestao de Acessos',
    local: '/home/bmsystem/www/modulos/gestao_acesso',
    tipo: 'modulo',
    arquivos_esperados: ['index.php', 'cadastrar.php', 'editar.php']
  },
  administracao: {
    nome: 'Administracao',
    local: '/home/bmsystem/www/modulos/administracao',
    tipo: 'modulo',
    arquivos_esperados: ['index.php', 'dashboard.php', 'logs.php', 'manutencao.php']
  },
  gestao_empresas: {
    nome: 'Gestao de Empresas',
    local: '/home/bmsystem/www/modulos/gestao_empresas',
    tipo: 'modulo',
    arquivos_esperados: ['index.php', 'cadastrar.php', 'editar.php']
  },
  fabrica_software: {
    nome: 'Fabrica de Software',
    local: '/home/bmsystem/www/modulos/fabrica_software',
    tipo: 'modulo',
    arquivos_esperados: ['index.php', 'aprovar.php']
  },
  suporte: {
    nome: 'Suporte',
    local: '/home/bmsystem/www/modulos/suporte',
    tipo: 'modulo',
    arquivos_esperados: ['index.php', 'reportar.php']
  },
  blog: {
    nome: 'Blog',
    local: '/home/bmsystem/www/modulos/blog',
    tipo: 'modulo',
    arquivos_esperados: ['index.php']
  },
  faq: {
    nome: 'FAQ',
    local: '/home/bmsystem/www/modulos/faq',
    tipo: 'modulo',
    arquivos_esperados: ['index.php']
  },
  acesso_gratis: {
    nome: 'Acesso Gratis',
    local: '/home/bmsystem/www/modulos/acesso_gratis',
    tipo: 'modulo',
    arquivos_esperados: ['index.php']
  },
  plano: {
    nome: 'Planos',
    local: '/home/bmsystem/www/modulos/plano',
    tipo: 'modulo',
    arquivos_esperados: ['index.php', 'upgrade.php']
  }
};

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');

function detectarFaltantes() {
  console.log('1_PESQUISADOR: Analisando modulos...');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const resultado = {
    timestamp: new Date().toISOString(),
    total_modulos: Object.keys(MODULOS).length,
    status: 'ok'
  };

  // Lista de modulos a serem criados/atualizados pela esteira
  const modulos_para_criar = [];
  const submodulos_para_criar = [];

  for (const [key, mod] of Object.entries(MODULOS)) {
    // Verifica se o modulo principal existe
    if (!fs.existsSync(mod.local)) {
      modulos_para_criar.push({
        key: key,
        nome: mod.nome,
        local: mod.local,
        tipo: 'modulo_principal'
      });
    } else if (mod.submodulos) {
      // Verifica submodulos
      for (const [subKey, subNome] of Object.entries(mod.submodulos)) {
        const subPath = mod.local + '/' + subKey;
        if (!fs.existsSync(subPath)) {
          submodulos_para_criar.push({
            parent: key,
            key: subKey,
            nome: subNome,
            local: subPath,
            tipo: 'submodulo'
          });
        }
      }
    }
  }

  resultado.modulos_para_criar = modulos_para_criar;
  resultado.submodulos_para_criar = submodulos_para_criar;
  resultado.total_a_criar = modulos_para_criar.length + submodulos_para_criar.length;

  console.log('1_PESQUISADOR: ' + resultado.total_a_criar + ' itens faltantes');
  console.log('1_PESQUISADOR: Modulos faltantes: ' + modulos_para_criar.length);
  console.log('1_PESQUISADOR: Submodulos faltantes: ' + submodulos_para_criar.length);

  // Salva relatorio
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'modulos_faltantes.json'),
    JSON.stringify(resultado, null, 2)
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'bd_cache.json'),
    JSON.stringify({
      timestamp: resultado.timestamp,
      total_modulos: resultado.total_modulos,
      total_a_criar: resultado.total_a_criar
    }, null, 2)
  );

  return resultado;
}

detectarFaltantes();
