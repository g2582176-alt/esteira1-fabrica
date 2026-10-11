/**
 * 3_programador.js
 * Gera codigo para modulos SST
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');

const MODULOS = {
  treinamentos: {
    nome: 'Treinamentos',
    tabelas: ['treinamentos', 'treinamento_participantes', 'treinamento_presencas'],
    services: ['TreinamentoService', 'ParticipanteService', 'PresencaService']
  }
};

async function main() {
  console.log('3_PROGRAMADOR: Iniciando...');
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  for (const [key, mod] of Object.entries(MODULOS)) {
    console.log('Gerando:', mod.nome);
    
    const modDir = path.join(OUTPUT_DIR, 'codigo_' + key);
    fs.mkdirSync(modDir, { recursive: true });
    
    // SQL
    const sqlDir = path.join(modDir, 'migrations');
    fs.mkdirSync(sqlDir, { recursive: true });
    
    mod.tabelas.forEach(t => {
      const sql = 'CREATE TABLE IF NOT EXISTS ' + t + ' (id INT AUTO_INCREMENT PRIMARY KEY);';
      fs.writeFileSync(path.join(sqlDir, 'create_' + t + '.sql'), sql);
    });
    
    // Services
    const svcDir = path.join(modDir, 'services');
    fs.mkdirSync(svcDir, { recursive: true });
    
    mod.services.forEach(s => {
      const php = '<?php class ' + s + ' { } ?>';
      fs.writeFileSync(path.join(svcDir, s + '.php'), php);
    });
    
    fs.writeFileSync(path.join(modDir, 'README.md'), '# ' + mod.nome + '\nGerado: ' + new Date().toISOString());
    
    console.log('  OK');
  }
  
  console.log('3_PROGRAMADOR: Finalizado!');
}

main().catch(console.error);
