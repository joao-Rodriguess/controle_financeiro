# 📋 Relatório Completo — Fluxo (Controle Financeiro)

**Data:** 01/03/2026  
**Autor:** Antigravity AI  
**Projeto:** Fluxo — Gestão Financeira Inteligente

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Modelo de Dados](#3-modelo-de-dados)
4. [Módulos Funcionais (10 Views)](#4-módulos-funcionais)
5. [Sistema de Autenticação](#5-sistema-de-autenticação)
6. [Segurança — Auditoria e Correções](#6-segurança)
7. [Fluxo Financeiro Principal](#7-fluxo-financeiro-principal)
8. [Integração com IA (Gemini)](#8-integração-com-ia)
9. [PWA e Acesso Mobile](#9-pwa-e-acesso-mobile)
10. [Métricas do Código](#10-métricas-do-código)
11. [Riscos e Recomendações](#11-riscos-e-recomendações)
12. [Plano de Evolução (7 Fases)](#12-plano-de-evolução)
13. [Alterações Realizadas na Sessão](#13-alterações-realizadas)

---

## 1. Visão Geral da Arquitetura

### Diagrama de Componentes

```
┌───────────────────────────────────────────────────────────┐
│                    🖥️ BROWSER (SPA)                       │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │index.html│  │ style.css│  │  app.js  │  │ auth.js  │ │
│  │ 1164 L   │  │ 3317 L   │  │ 2997 L   │  │  ~290 L  │ │
│  │ Estrutura│  │ 5 Temas  │  │ 10 Views │  │ SHA-256  │ │
│  │ Modais   │  │ Responsiv│  │ Charts   │  │ Sessions │ │
│  │ Forms    │  │ Dark Mode│  │ IA Chat  │  │ Rate Lim │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                       │                                   │
│              ┌────────┴────────┐                         │
│              │   localStorage  │                         │
│              │ (per-user keys) │                         │
│              └─────────────────┘                         │
│                                                           │
│  ┌──────────┐                                            │
│  │  sw.js   │  Service Worker (cache-first)              │
│  └──────────┘                                            │
└───────────────────────┬───────────────────────────────────┘
                        │ HTTP
┌───────────────────────┴───────────────────────────────────┐
│                  🖧 NODE.JS SERVER                         │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ server.js (~119 linhas)                              │ │
│  │ • Serve arquivos estáticos                           │ │
│  │ • Path traversal protection                          │ │
│  │ • Security headers (CSP, X-Frame, etc.)              │ │
│  │ • Hidden file blocking (.git, .env, .agent)          │ │
│  │ • GET/HEAD only                                      │ │
│  │ • Bind 0.0.0.0 (acesso mobile na rede local)        │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
                        │ HTTPS
┌───────────────────────┴───────────────────────────────────┐
│                  ☁️ APIs EXTERNAS                          │
│                                                           │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │ Google Identity │  │ Google Gemini 2.5 Flash      │   │
│  │ Services (OAuth)│  │ • Análise financeira         │   │
│  │ • Login Google  │  │ • Chat interativo            │   │
│  └─────────────────┘  │ • OCR de notas fiscais       │   │
│                        └──────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### Características Principais

| Aspecto          | Detalhe                                     |
| ---------------- | ------------------------------------------- |
| **Tipo**         | Single Page Application (SPA)               |
| **Linguagem**    | JavaScript vanilla (ES6+), sem framework    |
| **Server**       | Node.js http nativo (zero dependências npm) |
| **Persistência** | localStorage com isolamento por usuário     |
| **PWA**          | Service Worker + manifest.json (instalável) |
| **Temas**        | 5 temas dark mode com variáveis CSS         |

---

## 2. Stack Tecnológica

| Camada           | Tecnologia               | Versão/Origem               |
| ---------------- | ------------------------ | --------------------------- |
| **Frontend**     | HTML5, CSS3, JS ES6+     | Vanilla (sem framework)     |
| **Server**       | Node.js http             | Nativo (0 dependências npm) |
| **Fonts**        | Google Fonts             | Outfit                      |
| **Icons**        | Lucide Icons             | Latest (unpkg CDN)          |
| **Charts**       | Chart.js                 | CDN                         |
| **PDF Export**   | jsPDF + AutoTable        | 2.5.2 / 3.8.4 (cdnjs)       |
| **Excel Export** | SheetJS (xlsx)           | CDN                         |
| **IA**           | Google Gemini 2.5 Flash  | REST API                    |
| **Auth Google**  | Google Identity Services | GSI Library                 |
| **UI Base**      | Bootstrap 5.3.3          | CDN (grid/utils apenas)     |
| **PWA**          | Service Worker           | Cache-first strategy        |
| **Particles**    | particles.js 2.0         | CDN (efeito visual login)   |

---

## 3. Modelo de Dados

### 3.1 Estado Global da Aplicação

```javascript
let state = {
  salary: 5000, // Salário mensal base (BRL)
  transactions: [], // Transações do mês atual
  history: [], // Snapshots de meses fechados
  goals: [], // Metas de economia
  categoryLimits: {}, // Limites orçamentários por categoria
  wallets: [], // Carteiras personalizadas
  geminiKey: null, // API key do Gemini (user-provided)
  aiPersona: "pessoal", // Persona IA ativa
  currentView: "dashboard", // View atualmente visível
};
```

### 3.2 Estrutura de uma Transação

```javascript
{
  id: 1709312345678,         // Timestamp como ID
  desc: "Supermercado Extra", // Descrição
  amount: 250.00,            // Valor em BRL
  type: "expense",           // "expense" | "income"
  expenseType: "variable",   // "variable" | "fixed" | "debt"
  category: "Alimentação",   // Uma das 7 categorias
  date: "2026-03-01",        // Data ISO
  confirmed: true,           // false = pendente (não subtrai do saldo)
  walletId: "default",       // ID da carteira associada
  installments: {            // Apenas para tipo "debt"
    current: 2,
    total: 12
  }
}
```

### 3.3 Categorias Predefinidas

| Categoria     | Ícone |
| ------------- | ----- |
| Alimentação   | 🍽️    |
| Moradia       | 🏠    |
| Transporte    | 🚗    |
| Lazer         | 🎮    |
| Saúde         | 🏥    |
| Investimentos | 📈    |
| Outros        | 📦    |

### 3.4 Estrutura de Um Usuário (auth.js)

```javascript
{
  id: "u_lx8abc123",
  name: "João Silva",
  email: "joao@email.com",
  password: "sha256_a1b2c3d4...",  // SHA-256 hash
  avatar: "data:image/jpeg;base64,...",
  phone: "(11) 99999-9999",
  birthdate: "1990-05-15",
  createdAt: 1709312345678,
  provider: "local"  // "local" | "google"
}
```

### 3.5 Isolamento de Dados no localStorage

```
Chave                              → Conteúdo
─────────────────────────────────────────────────────
fluxo_users                        → { "email": { user object } }
fluxo_session                      → { userId, loggedAt }
fluxo_login_attempts               → { "email": { count, lockedUntil } }
fluxo_theme                        → "theme-cyberpunk"
fluxo_google_client_id             → "xxx.apps.googleusercontent.com"

// Per-user (prefixo: fluxo_{userId}_)
fluxo_u_xxx_salary                 → "5000"
fluxo_u_xxx_transactions           → [array de transações]
fluxo_u_xxx_history                → [array de snapshots]
fluxo_u_xxx_goals                  → [array de metas]
fluxo_u_xxx_categoryLimits         → { categoria: valor }
fluxo_u_xxx_wallets                → [array de carteiras]
fluxo_u_xxx_geminiKey              → "AIza..."
fluxo_u_xxx_aiPersona              → "pessoal"
fluxo_u_xxx_chatConversations      → [array de conversas IA]
```

---

## 4. Módulos Funcionais

A aplicação possui **10 views/módulos** acessíveis pela sidebar de navegação:

### 4.1 Dashboard (View Principal)

| Componente               | Descrição                                            |
| ------------------------ | ---------------------------------------------------- |
| **Cards de Resumo**      | Saldo, Receita, Gastos Confirmados, Gastos Pendentes |
| **Contadores Animados**  | `animateValue()` com easing easeOutQuart             |
| **Gráfico Doughnut**     | Gastos por categoria (Chart.js)                      |
| **Gráfico Linha**        | Evolução mensal do saldo (Chart.js)                  |
| **Alertas de Orçamento** | Warning quando categoria > limite definido           |
| **Saldos por Carteira**  | Carteira Principal + carteiras customizadas          |

**Cálculos:**

```
Receita Total = Salário Base + Receitas Extras
Gastos Confirmados = Σ(transações onde type=expense E confirmed≠false)
Gastos Pendentes = Σ(transações onde type=expense E confirmed=false)
Saldo = Receita Total - Gastos Confirmados
```

### 4.2 Lançamentos (Transações)

| Feature            | Detalhe                                                 |
| ------------------ | ------------------------------------------------------- |
| CRUD completo      | Criar, editar, excluir transações                       |
| 3 tipos de despesa | Variável (único), Fixo (recorrente), Dívida (parcelada) |
| Confirmação        | Toggle pendente → confirmado                            |
| Filtros            | Por categoria, tipo, período, busca por descrição       |
| Ordenação          | Agrupamento por categoria com headers                   |

### 4.3 Exportação de Dados

| Formato  | Biblioteca        | Funcionalidade               |
| -------- | ----------------- | ---------------------------- |
| 📄 PDF   | jsPDF + AutoTable | Tabela formatada com header  |
| 📊 Excel | SheetJS (xlsx)    | Planilha com colunas tipadas |
| 📋 CSV   | Nativo (Blob)     | Download direto via link     |
| 🖨️ Print | `window.print()`  | CSS `@media print` otimizado |

### 4.4 Conselheiro IA (Gemini)

| Feature             | Detalhe                                               |
| ------------------- | ----------------------------------------------------- |
| **Análise Rápida**  | Envia resumo financeiro → 3 insights em cards         |
| **Chat Interativo** | Conversa com histórico, contexto financeiro injetado  |
| **4 Personas**      | Pessoal, Mercado, Loja, Agressivo                     |
| **OCR Scanner**     | Upload de nota fiscal → extrai desc, valor, categoria |
| **Histórico**       | Conversas salvas com título, data, preview            |

**Personas IA:**
| Persona | Comportamento |
|---------|--------------|
| `pessoal` | Consultor focado em economias familiares |
| `mercado` | Analista de investimentos e tendências |
| `loja` | Consultor de negócios e fluxo de caixa |
| `agressivo` | Cortes severos e metas rígidas |

### 4.5 Metas de Economia

- Criar meta com: nome, valor alvo, prazo, valor inicial
- Barra de progresso animada com % e cores dinâmicas
- "Guardar Dinheiro" → cria transação de investimento automaticamente
- CRUD completo (criar, editar, excluir)
- Indicador visual quando meta atinge 100%

### 4.6 Histórico Mensal

**Funcionalidade "Fechar Mês":**

```
1. Cria snapshot: { monthYear, income, expenses, balance }
2. Processa transações para o próximo mês:
   - Fixas → Copia para o novo mês (mesmo valor, data atualizada)
   - Dívidas → Avança parcela (current + 1), remove se última
   - Variáveis → Descarta (não carrega para próximo mês)
3. Salva estado e atualiza dashboard
```

### 4.7 Perfil do Usuário

| Feature     | Detalhe                                                 |
| ----------- | ------------------------------------------------------- |
| Informações | Nome, email, telefone, nascimento, membro desde         |
| Avatar      | Câmera (`getUserMedia`), upload de arquivo, foto Google |
| Edição      | Nome, telefone, nascimento com validação                |
| Senha       | Troca com verificação da senha atual                    |
| Logout      | Limpa sessão e reseta state                             |
| Badge       | Tipo de conta (Local ✉️ / Google 🔵)                    |

### 4.8 Multi-Carteiras

| Tipo           | Ícone            |
| -------------- | ---------------- |
| Cartão         | 💳 `credit-card` |
| Dinheiro       | 💵 `banknote`    |
| Poupança       | 🐷 `piggy-bank`  |
| Conta Corrente | 🏦 `landmark`    |

- Cada carteira: nome, saldo inicial, cor, tipo
- Transações associadas a qualquer carteira
- Dashboard mostra saldo separado por carteira
- Seletor de carteira no formulário de lançamento

### 4.9 Configurações

- **5 Temas:**
  - Midnight Indigo (padrão) — `#6366f1`
  - Emerald Finance — `#10b981`
  - Cyberpunk Neon — `#f43f5e`
  - Deep Ocean — `#0ea5e9`
  - Sunset Orange — `#f97316`
- Cada tema altera 9+ variáveis CSS
- Definir salário base mensal
- Configurar Google Client ID

### 4.10 Definir Salário

- Modal para definir salário base mensal
- Valor persiste em `state.salary` via localStorage
- Dashboard recalcula automaticamente ao alterar

---

## 5. Sistema de Autenticação

### 5.1 Fluxo de Login

```
                    ┌─────────────────┐
                    │  Tela de Login   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐  ┌──────────┐  ┌──────────────┐
       │Email+Senha│  │  Google  │  │  Cadastro    │
       └─────┬────┘  └─────┬────┘  └──────┬───────┘
             │             │              │
             ▼             ▼              ▼
       ┌──────────┐  ┌──────────┐  ┌──────────────┐
       │Rate Limit│  │JWT Decode│  │Valida + Hash │
       │ Check    │  │ Client   │  │  SHA-256     │
       └─────┬────┘  └─────┬────┘  └──────┬───────┘
             │             │              │
             ▼             │              │
       ┌──────────┐        │              │
       │Hash Check│        │              │
       │Legacy/256│        │              │
       └─────┬────┘        │              │
             │             │              │
             ▼             ▼              ▼
       ┌─────────────────────────────────────┐
       │         setSession(userId)          │
       │    { userId, loggedAt: Date.now() } │
       └─────────────────┬───────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  enterApp()  │
                  └──────────────┘
```

### 5.2 Tabela de Recursos

| Recurso              | Implementação                                                   |
| -------------------- | --------------------------------------------------------------- |
| **Hash de senha**    | SHA-256 via `crypto.subtle.digest` + salt fixo                  |
| **Migração de hash** | Hash antigo (`h_*`) aceito no login, auto-migra para `sha256_*` |
| **Sessão**           | 24h de duração, verificada em cada `getSession()`               |
| **Rate Limiting**    | 5 tentativas falhas por email → lockout 15 minutos              |
| **Google OAuth**     | Google Identity Services, JWT decodificado no client            |
| **Mobile**           | Google Sign-In escondido (User-Agent detection)                 |
| **Mensagens**        | Genéricas ("E-mail ou senha incorretos") — sem enumeração       |

---

## 6. Segurança — Auditoria e Correções

### 6.1 Vulnerabilidades Encontradas (OWASP 2025)

| #   | Severidade  | OWASP | Vulnerabilidade                                    | Arquivo    | Status              |
| --- | ----------- | ----- | -------------------------------------------------- | ---------- | ------------------- |
| V1  | 🔴 CRITICAL | A01   | **Path Traversal** — `req.url` sem sanitização     | server.js  | ✅ Corrigido        |
| V2  | 🔴 CRITICAL | A02   | **Sem Security Headers** (CSP, X-Frame, etc.)      | server.js  | ✅ Corrigido        |
| V3  | 🟠 HIGH     | A04   | **Hash de senha fraco** (bit-shift, ~2³¹ colisões) | auth.js    | ✅ Corrigido        |
| V4  | 🟠 HIGH     | A05   | **XSS via innerHTML** com dados do usuário         | app.js     | ✅ Corrigido        |
| V5  | 🟡 MEDIUM   | A07   | **Sessão sem expiração** (login eterno)            | auth.js    | ✅ Corrigido        |
| V6  | 🟡 MEDIUM   | A07   | **Sem rate limiting** no login                     | auth.js    | ✅ Corrigido        |
| V7  | 🟡 MEDIUM   | A04   | **API Key na URL** (Gemini em query param)         | app.js     | ⚠️ Limitação da API |
| V8  | 🟢 LOW      | A03   | **CDN sem SRI** (Subresource Integrity)            | index.html | ✅ CSP adicionado   |

### 6.2 Correções Aplicadas

**server.js:**

- Path traversal → `path.resolve()` + verificação `startsWith(ROOT_DIR)`
- Null byte injection → bloqueio de `\0` no path
- Hidden files → segmentos com `.` bloqueados com 403
- HTTP methods → apenas GET e HEAD permitidos
- Security Headers → CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy
- URL parsing → `new URL()` WHATWG API (sem deprecation warning)

**auth.js:**

- Hash → SHA-256 via Web Crypto API com salt
- Migração gradual → hash antigo aceito + auto-rehash
- Sessão → expira em 24 horas
- Rate limiting → 5 tentativas falhas → 15min lockout
- Sanitização → caracteres `<>"'&` removidos de nomes

**app.js:**

- Função `escapeHTML()` → converte `< > " ' &` em entidades HTML
- Sanitização aplicada em todas as tabelas e histórico de conversas
- 6 chamadas Auth convertidas para `async/await`
- Detecção mobile → User-Agent + maxTouchPoints

**index.html:**

- CSP meta tag como fallback de segurança

### 6.3 Modelo de Segurança Atual

| Camada       | Proteção Ativa                                                 |
| ------------ | -------------------------------------------------------------- |
| **Server**   | Path traversal blocked, hidden files blocked, GET/HEAD only    |
| **Headers**  | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy  |
| **Auth**     | SHA-256 + salt, sessão 24h, rate limiting, mensagens genéricas |
| **XSS**      | `escapeHTML()` em todos os innerHTML com dados do usuário      |
| **CSP HTML** | Meta tag fallback para ambientes sem server                    |
| **Mobile**   | Google Sign-In oculto em dispositivos móveis                   |

---

## 7. Fluxo Financeiro Principal

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   💰 SALÁRIO BASE ──────┐                      │
│                          │                      │
│   💵 RECEITAS EXTRAS ───┼──► RECEITA TOTAL     │
│                          │                      │
│                          ▼                      │
│              ┌───────────────────┐              │
│              │  RECEITA TOTAL    │              │
│              │  salary + income  │              │
│              └─────────┬─────────┘              │
│                        │                        │
│                        ▼                        │
│   ┌────────────────────────────────────┐        │
│   │  GASTOS (tipo de despesa)          │        │
│   │                                    │        │
│   │  ┌─────────┐  ┌───────┐  ┌─────┐ │        │
│   │  │ Variável│  │ Fixo  │  │Dívida│ │        │
│   │  │(único)  │  │(recor)│  │(parc)│ │        │
│   │  └────┬────┘  └───┬───┘  └──┬──┘ │        │
│   │       │           │         │     │        │
│   │       ▼           ▼         ▼     │        │
│   │  ┌────────────────────────────┐   │        │
│   │  │ confirmed?                 │   │        │
│   │  │ true → subtrai do saldo   │   │        │
│   │  │ false → pendente (não sub)│   │        │
│   │  └────────────────────────────┘   │        │
│   └────────────────────────────────────┘        │
│                        │                        │
│                        ▼                        │
│              ┌───────────────────┐              │
│              │   SALDO FINAL     │              │
│              │ receita - confirm.│              │
│              └─────────┬─────────┘              │
│                        │                        │
│                        ▼                        │
│              ┌───────────────────┐              │
│              │  FECHAR MÊS       │              │
│              │                   │              │
│              │ • Snapshot → hist  │              │
│              │ • Fixos → próx mês│              │
│              │ • Dívida parcela+1│              │
│              │ • Variáveis → ×   │              │
│              └───────────────────┘              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 8. Integração com IA (Gemini)

### 8.1 Análise Financeira Rápida

```
Dados do Usuário ──► Prompt com persona ──► Gemini API ──► 3 Insights (JSON)
                                                              │
                                                              ▼
                                                     ┌──────────────┐
                                                     │ Insight Cards │
                                                     │ badge + ícone │
                                                     │ título + desc │
                                                     └──────────────┘
```

### 8.2 Chat Interativo

- Histórico de mensagens mantido em array `chatMessages`
- Contexto financeiro injetado no system prompt a cada mensagem
- Markdown renderizado nas respostas
- Conversas salvas em localStorage com título e data
- Botão "Nova Conversa" salva a atual e inicia uma limpa

### 8.3 OCR de Notas Fiscais

```
Upload imagem ──► FileReader (Base64) ──► Gemini Vision ──► JSON { desc, amount, category }
                                                                │
                                                                ▼
                                                     Preenche formulário
                                                     de lançamento
```

---

## 9. PWA e Acesso Mobile

### 9.1 Manifest

```json
{
  "name": "FinAI - Controle Financeiro",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a"
}
```

### 9.2 Service Worker

- **Estratégia:** Cache-first (busca no cache antes da rede)
- **Assets cacheados:** index.html, style.css, app.js, CDN libs
- **Versão:** `finai-cache-v1`
- **Limpeza:** Remove caches antigos no evento `activate`

### 9.3 Acesso Mobile

| Configuração   | Valor                                      |
| -------------- | ------------------------------------------ |
| Bind address   | `0.0.0.0` (aceita conexões da rede local)  |
| IP detection   | Automático via `os.networkInterfaces()`    |
| Google Sign-In | Escondido em mobile (User-Agent detection) |
| Login mobile   | Email/senha local funciona normalmente     |

---

## 10. Métricas do Código

| Arquivo         | Linhas     | Funções  | Responsabilidade                           |
| --------------- | ---------- | -------- | ------------------------------------------ |
| `app.js`        | 2.997      | ~117     | Lógica principal, UI, IA, export           |
| `style.css`     | 3.317      | —        | Estilos + 5 temas + responsivo + animações |
| `index.html`    | 1.164      | —        | Estrutura HTML, modais, formulários        |
| `auth.js`       | ~290       | ~15      | Autenticação, perfil, dados por usuário    |
| `server.js`     | ~119       | ~3       | Servidor HTTP hardened                     |
| `sw.js`         | 50         | 3        | Service Worker                             |
| `manifest.json` | 23         | —        | Configuração PWA                           |
| **Total**       | **~7.960** | **~138** | —                                          |

### Estrutura de Arquivos

```
controle_financeiro/
├── index.html           ← HTML principal (SPA, 1164 linhas)
├── style.css            ← Estilos globais (3317 linhas, 5 temas)
├── app.js               ← Lógica da aplicação (2997 linhas)
├── auth.js              ← Sistema de autenticação (SHA-256)
├── server.js            ← Servidor Node.js (security-hardened)
├── sw.js                ← Service Worker (cache-first PWA)
├── manifest.json        ← Manifesto PWA
├── migrar_dados.html    ← Utilitário de migração de dados
├── plan.md              ← Este arquivo (relatório completo)
├── README.md            ← Documentação do projeto
└── .agent/              ← Configuração de agentes IA
```

---

## 11. Riscos e Recomendações

### 11.1 Riscos Atuais

| Risco                       | Severidade | Detalhe                              | Mitigação Atual                     |
| --------------------------- | ---------- | ------------------------------------ | ----------------------------------- |
| API Key no client           | 🟡 Médio   | Key do Gemini visível no Network tab | Sem fix sem backend proxy           |
| localStorage não encriptado | 🟡 Médio   | Dados financeiros em texto puro      | XSS prevention via CSP + escapeHTML |
| Single file ~3k linhas      | 🟡 Médio   | `app.js` concentra toda a lógica     | Funcional, mas dificulta manutenção |
| SW cache não versionado     | 🟢 Baixo   | Pode servir assets desatualizados    | Cache v1 com limpeza manual         |
| Inline `onclick`            | 🟢 Baixo   | Manutenibilidade reduzida            | Funcional, mas não ideal            |
| Sem testes automatizados    | 🟡 Médio   | Regressões não são detectadas        | Testes manuais apenas               |
| Sem backend real            | 🟡 Médio   | Dados apenas local, sem sync         | localStorage per-user               |

### 11.2 Recomendações de Evolução

| #   | Prioridade | Recomendação                              | Impacto          |
| --- | ---------- | ----------------------------------------- | ---------------- |
| 1   | 🔴 Alta    | Proxy Gemini no server (esconder API key) | Segurança        |
| 2   | 🔴 Alta    | Modularizar `app.js` em módulos ES6       | Manutenibilidade |
| 3   | 🟠 Média   | Encryption layer no localStorage          | Segurança        |
| 4   | 🟠 Média   | Versionar cache do Service Worker         | Confiabilidade   |
| 5   | 🟡 Baixa   | Migrar `onclick` → `addEventListener`     | Qualidade        |
| 6   | 🟡 Baixa   | Testes automatizados (Jest)               | Confiabilidade   |
| 7   | 🟢 Futura  | Backend real (Express + SQLite)           | Escalabilidade   |

---

## 12. Plano de Evolução (7 Fases)

### Fase 1: Quick Wins (Baixo Risco)

**1.1 — Backend Proxy para Gemini API**

- Adicionar rota POST `/api/gemini` no `server.js`
- Key armazenada via variável de ambiente
- `app.js`: substituir `fetch(url?key=...)` por `fetch('/api/gemini')`

**1.2 — Service Worker Cache Versioning**

- Atualizar `sw.js` com versão `finai-cache-v2`
- Auto-invalidar caches antigos no evento `activate`

**1.3 — Migrar onclick → addEventListener**

- Event delegation no `app.js`
- Usar atributos `data-*` para IDs de transações

### Fase 2: Security Layer

**2.1 — Encryption no localStorage**

- Novo arquivo `crypto-utils.js`
- AES-GCM via Web Crypto API
- Derive key do password via PBKDF2
- `auth.js`: encripta antes de salvar, decripta ao carregar

### Fase 3: Architecture Refactor

**3.1 — Modularizar app.js**

- `js/modules/state.js` — State management
- `js/modules/dashboard.js` — Dashboard + charts
- `js/modules/transactions.js` — CRUD + tabelas
- `js/modules/ai.js` — Gemini analysis + chat + OCR
- `js/modules/goals.js` — Metas
- `js/modules/wallets.js` — Multi-carteiras
- `js/modules/export.js` — PDF/Excel/CSV/Print
- `js/modules/profile.js` — Perfil + avatar
- `js/modules/ui.js` — Toast, animations, theme

### Fase 4: Quality Assurance

**4.1 — Testes Automatizados**

- `tests/financial-logic.test.js` — Cálculos de saldo, closing month
- `tests/auth.test.js` — Login, register, rate limiting
- `tests/sanitization.test.js` — escapeHTML, XSS prevention

### Fase 5: Backend Real

**5.1 — Express + SQLite**

- `package.json` com express, better-sqlite3, dotenv
- `database.js` com schema SQLite + migrations
- `server.js` migrado para Express com rotas REST
- Endpoints: `/api/users`, `/api/transactions`, `/api/goals`

---

## 13. Alterações Realizadas na Sessão

### Sessão de 01/03/2026

| #   | Alteração                  | Arquivo(s)   | Tipo            |
| --- | -------------------------- | ------------ | --------------- |
| 1   | Botão PDF funcional        | `index.html` | Bug fix         |
| 2   | Path traversal fix         | `server.js`  | Security        |
| 3   | Security headers           | `server.js`  | Security        |
| 4   | HTTP method restriction    | `server.js`  | Security        |
| 5   | Hidden file blocking       | `server.js`  | Security        |
| 6   | WHATWG URL API             | `server.js`  | Deprecation fix |
| 7   | SHA-256 password hash      | `auth.js`    | Security        |
| 8   | Legacy hash migration      | `auth.js`    | Security        |
| 9   | Session expiry (24h)       | `auth.js`    | Security        |
| 10  | Login rate limiting        | `auth.js`    | Security        |
| 11  | Input sanitization         | `auth.js`    | Security        |
| 12  | `escapeHTML()` utility     | `app.js`     | Security        |
| 13  | XSS sanitization (tables)  | `app.js`     | Security        |
| 14  | XSS sanitization (chat)    | `app.js`     | Security        |
| 15  | Async/await Auth calls     | `app.js`     | Refactor        |
| 16  | CSP meta tag               | `index.html` | Security        |
| 17  | Mobile access (0.0.0.0)    | `server.js`  | Feature         |
| 18  | Auto IP detection          | `server.js`  | Feature         |
| 19  | Mobile device detection    | `app.js`     | Feature         |
| 20  | Hide Google Sign-In mobile | `app.js`     | UX              |

---

> **Documento gerado por Antigravity AI — 01/03/2026**
