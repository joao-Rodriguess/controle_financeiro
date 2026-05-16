const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static(__dirname));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  🚀 Servidor rodando em http://localhost:${PORT}\n`);
});
