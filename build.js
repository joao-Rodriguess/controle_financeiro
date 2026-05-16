const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos
const templatePath = path.join(__dirname, 'js', 'firebase-config.template.js');
const outputPath = path.join(__dirname, 'js', 'firebase-config.js');

console.log('--- Iniciando Build de Configuração do Firebase ---');

try {
  let content = fs.readFileSync(templatePath, 'utf8');

  const vars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ];

  vars.forEach(v => {
    const val = process.env[v];
    if (val) {
      console.log(`Injetando variável: ${v}`);
      // Substitui todas as ocorrências da chave pelo valor real
      content = content.replace(new RegExp(v, 'g'), val);
    } else {
      console.warn(`Aviso: Variável ${v} não encontrada no ambiente.`);
    }
  });

  fs.writeFileSync(outputPath, content);
  console.log('✅ Arquivo js/firebase-config.js gerado com sucesso!');
} catch (err) {
  console.error('❌ Erro durante o build:', err);
  process.exit(1);
}
