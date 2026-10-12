/**
 * 3_gerador_ia.js - Gerador de Codigo com Inteligencia Artificial
 * Gera novas features para modulos existentes usando templates inteligentes
 */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'output');

const MODS = {
  sst: ['acidentes', 'aprs', 'dds', 'epi', 'inspecoes', 'prevencao_incendio', 'pts', 'treinamentos', 'visibilidade'],
  dp: ['armarios', 'edificacoes'],
  terceiros: ['colaboradores', 'configuracoes', 'documentos', 'empresas', 'portal'],
  meio_ambiente: ['pesagem']
};

function gerarFeaturesInteligentes(modulo, cat, sub) {
  const features = [];
  
  if (sub === 'treinamentos') {
    features.push({
      nome: 'Certificados',
      arquivo: 'certificados.php',
      codigo: '<php
/**
 * Certificados de Treinamento
 */
if (session_status() === PHP_SESSION_NONE) { session_start(); }
require_once "../../../config/conexao.php";
require_once "../../../config/verificar_acesso.php";
exigirPermissao("sst.treinamentos");
$p_id = (int)($_GET["id"] ?? 0);
require_once "services/TreinamentoService.php";
require_once "services/ParticipanteService.php";
$treinamentoSvc = new TreinamentoService($pdo);
$participanteSvc = new ParticipanteService($pdo);
$participante = $participanteSvc->buscarPorId($p_id);
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Certificado</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
        .certificado { border: 3px solid #2c7a7b; padding: 40px; max-width: 600px; margin: 0 auto; }
        h1 { color: #2c7a7b; }
    </style>
</head>
<body>
    <div class="certificado">
        <h1>Certificado</h1>
        <p>Certificamos que o colaborador completou o treinamento.</p>
        <p><strong>Data: <?= date("d/m/Y") ?></strong></p>
    </div>
</body>
</html>'
    });
    features.push({
      nome: 'Relatorio PDF',
      arquivo: 'relatorio.php',
      codigo: '<php
/**
 * Relatorio de Treinamentos
 */
if (session_status() === PHP_SESSION_NONE) { session_start(); }
require_once "../../../config/conexao.php";
require_once "../../../config/verificar_acesso.php";
exigirPermissao("sst.treinamentos");
require_once "services/TreinamentoService.php";
$treinamentoSvc = new TreinamentoService($pdo);
$treinamentos = $treinamentoSvc->listar();
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatorio de Treinamentos</title>
    <link rel="stylesheet" href="treinamentos.css">
</head>
<body>
<a href="index.php" class="btn-voltar">Voltar</a>
<div class="header-area">
    <h1>Relatorio de Treinamentos</h1>
</div>
<div class="card">
    <table class="table">
        <thead>
            <tr><th>NR</th><th>Treinamento</th><th>Data</th><th>Participantes</th></tr>
        </thead>
        <tbody>
            <?php foreach ($treinamentos as $t): ?>
            <tr>
                <td><?= htmlspecialchars($t["nr"]) ?></td>
                <td><?= htmlspecialchars($t["nome"]) ?></td>
                <td><?= date("d/m/Y", strtotime($t["data_inicio"])) ?></td>
                <td><?= (int)($t["total_participantes"] ?? 0) ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>
</body>
</html>'
    });
  }
  
  return features;
}

async function main() {
  console.log('=== 3 - GERADOR IA ===');

  if (!fs.existsSync(OUT)) {
    fs.mkdirSync(OUT, { recursive: true });
  }

  const gerados = [];

  for (const cat in MODS) {
    for (const sub of MODS[cat]) {
      const moduloPath = path.join(OUT, cat, sub);
      console.log('Processando: ' + cat + '/' + sub);
      
      const features = gerarFeaturesInteligentes(sub, cat, sub);
      
      for (const feature of features) {
        const featurePath = path.join(moduloPath, feature.arquivo);
        
        if (!fs.existsSync(featurePath)) {
          fs.mkdirSync(path.dirname(featurePath), { recursive: true });
          fs.writeFileSync(featurePath, feature.codigo);
          gerados.push({
            modulo: cat + '/' + sub,
            feature: feature.nome,
            arquivo: feature.arquivo
          });
          console.log('  + Criado: ' + feature.arquivo);
        }
      }
    }
  }

  fs.writeFileSync(path.join(OUT, 'gerados_ia.json'), JSON.stringify({
    ts: new Date().toISOString(),
    gerados: gerados,
    total: gerados.length
  }, null, 2));

  console.log('=== GERADOR IA: ' + gerados.length + ' arquivos ===');
  return { gerados, total: gerados.length };
}

main().catch(console.error);