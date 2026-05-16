# PLAN.md: Orquestração de Limpeza

Abaixo estão os artefatos levantados pelo agente `project-planner` para remoção ou consolidação.

## Arquivos e Pastas Obsoletos a serem Removidos (Agente: Backend-Specialist / DevOps)

O sistema agora opera via `api/*.php`. Portanto, os seguintes recursos do Node.js podem ser apagados com segurança:

### Servidor e Banco Antigo (Node/SQLite)

- [DELETE] `server.js` (Servidor Express embutido)
- [DELETE] `database.js` (Conector SQLite)
- [DELETE] `fluxo.db` (Banco de dados SQLite. _Certifique-se de que os dados já estão salvos no MySQL ou não são mais necessários_)

### Rotas Antigas (Express HTTP)

- [DELETE] `routes/` (A pasta inteira que continha `auth.js`, `transactions.js`, `history.js`, `wallets.js`)

### Dependências Node

- [DELETE] `node_modules/` (Pasta de pacotes do npm)
- [DELETE] `package.json` (Manifesto NPM)
- [DELETE] `package-lock.json` (Lockfile)

### Arquivos Opcionais / Testes Antigos

- [DELETE] `test-auth.js`
- [DELETE] `migrar_dados.html` (Assumindo que a migração de dados antigos já está resolvida no app)

## Aprovação do Usuário

Verifique as deleções acima. Você aprova a execução integral deste plano de limpeza? (Y/N)
