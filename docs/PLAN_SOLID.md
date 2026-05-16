# Orquestração: Base Sólida de Persistência (Fugindo do LocalStorage)

O usuário relatou problemas críticos e inconsistências ao tentar salvar atualizações de Perfil e Metas, além de outras variáveis como limites de categorias que ficam presas localmente. Para resolver isso em definitivo, precisamos construir uma **Arquitetura Sólida focada 100% no Banco de Dados SQLite**, eliminando o conceito frágil de `localStorage` para propriedades vitais.

## 🏛️ Fase 2: Implementação (Arquitetura Proposta)

### 1. `database-architect` (Banco de Dados)

- O `database.js` precisa ser expandido para acomodar dados que hoje vivem apenas no front-end:
  - Adicionar as colunas `salary`, `ai_persona`, e `gemini_key` na tabela `users`.
  - Criar uma nova tabela `category_limits` para armazenar os limites mensais do usuário.
  - Criar uma nova tabela `history` para armazenar o fechamento de mês (`closeMonth`).
  - _Metas (Goals)_ já possuem tabela, vamos focar em persistir os perfis.

### 2. `backend-specialist` (API REST)

- Criar a rota `GET /api/auth/me` para retornar o perfil completo, incluindo `salary`, limites, preferências de IA, e a URL da foto em Base64 real time, permitindo que o App saiba o estado real sem depender de cache.
- Expandir o `PUT /api/auth/profile` para aceitar `salary`, limites, e configurações da IA.
- Criar rotas para `history` (GET/POST para fechamento do mês).
- Garantir que `routes/goals.js` está manipulando os dados corretamente com segurança.

### 3. `frontend-specialist` (App.js e Auth.js)

- Refatorar `Auth.getCurrentUser()` para sempre consumir `GET /api/auth/me` na inicialização do app (`loadAppDataAPI`).
- Destruir a lógica do `saveState()` que joga strings JSON no `localStorage`.
- Quando editar perfil, salvar limites, salvar salário, ou configurar a IA, o FRONTEND **deve obrigatóriamente** disparar um `fetch PUT` para o backend atualizar as colunas.
- Conectar o fechamento do mês (`closeMonth`) para fazer o `POST /api/history`.

### 4. `test-engineer` (Verificação)

- Executar os scripts de verificação:
  - `python .agent/skills/lint-and-validate/scripts/lint_runner.py .`
  - `python .agent/skills/database-design/scripts/schema_validator.py .` (Se aplicável)
- Validar se o salvamento de foto de perfil mantém pós reload e em guia anônima.

---

## Saída

Esta abordagem estabelece uma infraestrutura robusta de backend-first, impossibilitando dessincronização de dados.
