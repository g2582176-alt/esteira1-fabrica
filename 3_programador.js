/**
 * 3_programador.js
 * Gerador de Codigo PHP Completo para Modulos BMSystem
 */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'output');

function gerarIndexPHP(modulo, config) {
  const fields = config.fields.slice(0, 4);
  return '<?php\n/**
 * ' + modulo + ' - Lista
 */\n' +
    'if (session_status() === PHP_SESSION_NONE) { session_start(); }\n' +
    'require_once "../../../config/conexao.php";\n' +
    'require_once "../../../config/verificar_acesso.php";\n' +
    'exigirPermissao("sst.' + modulo + '");\n\n' +
    'require_once "services/' + config.service + '.php";\n' +
    '$svc = new ' + config.service + '($pdo);\n' +
    '$itens = $svc->listar();\n' +
    '?>\n' +
    '<!DOCTYPE html>\n<html><head><meta charset="UTF-8">\n' +
    '<title>' + config.titulo + '</title>\n' +
    '<link rel="stylesheet" href="' + modulo + '.css">\n' +
    '</head><body>\n' +
    '<div class="container">\n' +
    '<div class="header-area"><h1>' + config.titulo + '</h1>\n' +
    '<a href="criar.php" class="btn btn-primary">+ Novo</a></div>\n' +
    '<div class="card"><table class="table">\n' +
    '<thead><tr>' + fields.map(f => '<th>' + f.label + '</th>').join('') + '<th>Acoes</th></tr></thead>\n' +
    '<tbody>\n' +
    '<?php foreach($itens as $item): ?>\n' +
    '<tr>' + fields.map(f => '<td><?=htmlspecialchars($item["' + f.nome + '"]??"")?></td>').join('') + 
    '<td><a href="ver.php?id=<?=$item['id']?>">Ver</a> | <a href="editar.php?id=<?=$item['id']?>">Editar</a></td>\n' +
    '</tr>\n' +
    '<?php endforeach; ?>\n' +
    '</tbody></table></div>\n' +
    '<a href="../../painel.php" class="btn-voltar">Voltar</a>\n' +
    '</div></body></html>';
}

function gerarCriarPHP(modulo, config) {
  let form = '';
  for (const f of config.fields) {
    form += '<div class="form-group"><label>' + f.label + '</label>';
    if (f.tipo === 'select') {
      form += '<select name="' + f.nome + '" class="form-control" required><option value="">Selecione...</option>';
      for (const o of f.options) form += '<option value="' + o + '">' + o + '</option>';
      form += '</select>';
    } else if (f.tipo === 'textarea') {
      form += '<textarea name="' + f.nome + '" class="form-control" rows="4" required></textarea>';
    } else {
      form += '<input type="' + f.tipo + '" name="' + f.nome + '" class="form-control" ' + (f.required ? 'required' : '') + '>';
    }
    form += '</div>\n';
  }
  
  return '<?php\nif (session_status() === PHP_SESSION_NONE) { session_start(); }\n' +
    'require_once "../../../config/conexao.php";\n' +
    'require_once "../../../config/verificar_acesso.php";\n' +
    'exigirPermissao("sst.' + modulo + '");\n' +
    'require_once "services/' + config.service + '.php";\n' +
    '$svc = new ' + config.service + '($pdo);\n' +
    'if ($_SERVER["REQUEST_METHOD"] === "POST") {\n' +
    config.fields.map(f => '  $dados["' + f.nome + '"] = $_POST["' + f.nome + '"] ?? "";').join('\n') + '\n' +
    '  $id = $svc->criar($dados);\n' +
    '  if ($id) { header("Location: ver.php?id=$id"); exit; }\n' +
    '}\n' +
    '?>\n' +
    '<!DOCTYPE html><html><head><meta charset="UTF-8">\n' +
    '<title>Criar ' + modulo + '</title><link rel="stylesheet" href="' + modulo + '.css">\n' +
    '</head><body>\n' +
    '<div class="container"><div class="header-area"><h1>Criar ' + config.titulo + '</h1></div>\n' +
    '<form method="POST" class="card">' + form + '\n' +
    '<button type="submit" class="btn btn-primary">Salvar</button>\n' +
    '<a href="index.php" class="btn btn-secondary">Cancelar</a>\n' +
    '</form><a href="index.php" class="btn-voltar">Voltar</a></div></body></html>';
}

function gerarVerPHP(modulo, config) {
  let rows = '';
  for (const f of config.fields) {
    rows += '<tr><th>' + f.label + ':</th><td><?=htmlspecialchars($item["' + f.nome + '"]??"-")?></td></tr>\n';
  }
  return '<?php\nif (session_status() === PHP_SESSION_NONE) { session_start(); }\n' +
    'require_once "../../../config/conexao.php";\n' +
    'require_once "../../../config/verificar_acesso.php";\n' +
    'exigirPermissao("sst.' + modulo + '");\n' +
    'require_once "services/' + config.service + '.php";\n' +
    '$svc = new ' + config.service + '($pdo);\n' +
    '$id = (int)($_GET["id"] ?? 0);\n' +
    '$item = $svc->buscarPorId($id);\n' +
    'if (!$item) { header("Location: index.php"); exit; }\n' +
    '?>\n' +
    '<!DOCTYPE html><html><head><meta charset="UTF-8">\n' +
    '<title>Detalhes - ' + modulo + '</title><link rel="stylesheet" href="' + modulo + '.css">\n' +
    '</head><body>\n' +
    '<div class="container"><div class="header-area"><h1>Detalhes</h1>\n' +
    '<a href="editar.php?id=<?=$id?>" class="btn btn-primary">Editar</a>\n' +
    '<a href="index.php" class="btn btn-secondary">Voltar</a></div>\n' +
    '<div class="card"><table class="table table-details">\n' + rows + '\n' +
    '</table></div></div></body></html>';
}

function gerarEditarPHP(modulo, config) {
  let form = '';
  for (const f of config.fields) {
    form += '<div class="form-group"><label>' + f.label + '</label>';
    if (f.tipo === 'select') {
      form += '<select name="' + f.nome + '" class="form-control" required>';
      for (const o of f.options) {
        form += '<option value="' + o + '" <?=$item["' + f.nome + '"]=="' + o + '"?"selected":""?>>' + o + '</option>';
      }
      form += '</select>';
    } else if (f.tipo === 'textarea') {
      form += '<textarea name="' + f.nome + '" class="form-control" rows="4" required><?=htmlspecialchars($item["' + f.nome + '"]??"")?></textarea>';
    } else {
      form += '<input type="' + f.tipo + '" name="' + f.nome + '" class="form-control" value="<?=htmlspecialchars($item["' + f.nome + '"]??"")?>" ' + (f.required ? 'required' : '') + '>';
    }
    form += '</div>\n';
  }
  
  return '<?php\nif (session_status() === PHP_SESSION_NONE) { session_start(); }\n' +
    'require_once "../../../config/conexao.php";\n' +
    'require_once "../../../config/verificar_acesso.php";\n' +
    'exigirPermissao("sst.' + modulo + '");\n' +
    'require_once "services/' + config.service + '.php";\n' +
    '$svc = new ' + config.service + '($pdo);\n' +
    '$id = (int)($_GET["id"] ?? 0);\n' +
    '$item = $svc->buscarPorId($id);\n' +
    'if (!$item) { header("Location: index.php"); exit; }\n' +
    'if ($_SERVER["REQUEST_METHOD"] === "POST") {\n' +
    config.fields.map(f => '  $dados["' + f.nome + '"] = $_POST["' + f.nome + '"] ?? "";').join('\n') + '\n' +
    '  if ($svc->atualizar($id, $dados)) { header("Location: ver.php?id=$id"); exit; }\n' +
    '}\n' +
    '?>\n' +
    '<!DOCTYPE html><html><head><meta charset="UTF-8">\n' +
    '<title>Editar - ' + modulo + '</title><link rel="stylesheet" href="' + modulo + '.css">\n' +
    '</head><body>\n' +
    '<div class="container"><div class="header-area"><h1>Editar</h1></div>\n' +
    '<form method="POST" class="card">' + form + '\n' +
    '<button type="submit" class="btn btn-primary">Salvar</button>\n' +
    '<a href="index.php" class="btn btn-secondary">Cancelar</a>\n' +
    '</form><a href="index.php" class="btn-voltar">Voltar</a></div></body></html>';
}

const MODULOS = {
  treinamentos: {
    titulo: 'Treinamentos e Capacitacao NRs',
    service: 'TreinamentoService',
    nr: 'NR-01, NR-05, NR-06, NR-07, NR-17, NR-18, NR-35',
    fields: [
      { nome: 'nome', tipo: 'text', label: 'Nome do Treinamento', required: true },
      { nome: 'nr', tipo: 'text', label: 'Norma Regulamentadora', required: true },
      { nome: 'data_inicio', tipo: 'date', label: 'Data de Inicio', required: true },
      { nome: 'data_fim', tipo: 'date', label: 'Data de Termino', required: true },
      { nome: 'carga_horaria', tipo: 'number', label: 'Carga Horaria (horas)', required: true },
      { nome: 'instrutor', tipo: 'text', label: 'Instrutor', required: false },
      { nome: 'local', tipo: 'text', label: 'Local', required: false },
      { nome: 'status', tipo: 'select', label: 'Status', options: ['agendado', 'em_andamento', 'concluido', 'cancelado'] }
    ]
  },
  acidentes: {
    titulo: 'Acidentes de Trabalho',
    service: 'AcidenteService',
    nr: 'NR-01, NR-05',
    fields: [
      { nome: 'data_ocorrencia', tipo: 'datetime-local', label: 'Data/Ocorrencia', required: true },
      { nome: 'local', tipo: 'text', label: 'Local', required: true },
      { nome: 'descricao', tipo: 'textarea', label: 'Descricao', required: true },
      { nome: 'vitima', tipo: 'text', label: 'Vitima', required: false },
      { nome: 'gravidade', tipo: 'select', label: 'Gravidade', options: ['leve', 'grave', 'fatal'] }
    ]
  },
  epi: {
    titulo: 'Equipamento de Protecao Individual',
    service: 'EpiService',
    nr: 'NR-06',
    fields: [
      { nome: 'nome', tipo: 'text', label: 'Nome do EPI', required: true },
      { nome: 'ca', tipo: 'text', label: 'CA (Certificado de Aprovacao)', required: true },
      { nome: 'validade', tipo: 'date', label: 'Validade CA', required: false },
      { nome: 'quantidade', tipo: 'number', label: 'Quantidade em Estoque', required: false }
    ]
  },
  inspecoes: {
    titulo: 'Inspecoes de Seguranca',
    service: 'InspecaoService',
    nr: 'NR-01, NR-18',
    fields: [
      { nome: 'data', tipo: 'date', label: 'Data da Inspecao', required: true },
      { nome: 'local', tipo: 'text', label: 'Local', required: true },
      { nome: 'responsavel', tipo: 'text', label: 'Responsavel', required: true },
      { nome: 'resultado', tipo: 'textarea', label: 'Resultado/Observacoes', required: false }
    ]
  }
};

async function main() {
  console.log("=== 3 - GERADOR DE CODIGO PHP ===");

  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const gerados = [];

  for (const [mod, config] of Object.entries(MODULOS)) {
    console.log("Gerando modulo: " + mod);
    const modPath = path.join(OUT, 'sst', mod);
    fs.mkdirSync(modPath, { recursive: true });

    const paginas = {
      'index.php': gerarIndexPHP(mod, config),
      'criar.php': gerarCriarPHP(mod, config),
      'ver.php': gerarVerPHP(mod, config),
      'editar.php': gerarEditarPHP(mod, config)
    };

    for (const [nome, conteudo] of Object.entries(paginas)) {
      const filePath = path.join(modPath, nome);
      fs.writeFileSync(filePath, conteudo);
      gerados.push({ modulo: mod, arquivo: nome });
      console.log("  + " + nome);
    }
  }

  fs.writeFileSync(path.join(OUT, "paginas_geradas.json"), JSON.stringify({ ts: new Date().toISOString(), gerados, total: gerados.length }, null, 2));
  console.log("=== TOTAL: " + gerados.length + " paginas geradas ===");
  return { gerados, total: gerados.length };
}

main().catch(console.error);