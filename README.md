# 💎 Fluxo - Gestão Financeira Premium

<div align="center">
  <img alt="Fluxo Banner" src="https://via.placeholder.com/800x200/0f172a/6366f1?text=Fluxo+Financeiro+Premium" width="100%" />
</div>

<p align="center">
  <br>
  <b>O controle definitivo da sua vida financeira. Inteligente, rápido e lindamente projetado.</b>
  <br><br>
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-tecnologias">Tecnologias</a> •
  <a href="#-como-executar">Como Executar</a> •
  <a href="#-arquitetura">Arquitetura</a>
</p>

---

## 🎯 Sobre o Projeto

**Fluxo** é uma plataforma SPA (Single Page Application) focada em controle financeiro com design de altíssima qualidade (Premium/Glassmorphism). A aplicação transcende as planilhas chatas, entregando uma experiência fluida, simulações em tempo real e um Conselheiro Financeiro impulsionado por Inteligência Artificial (Google Gemini).

## ✨ Funcionalidades

- **Autenticação Segura:** Login por E-mail/Senha ou Google Account através do Firebase Authentication.
- **Dashboard Interativo:** KPIs financeiros atualizados em tempo real, com gráficos de fluxo de caixa e distribuição de despesas (via Chart.js).
- **Conselheiro Financeiro IA:** Um bot nativo integrado à API do Google Gemini que analisa o seu padrão de gastos e sugere melhorias e cenários econômicos baseados em sua rotina.
- **Múltiplas Carteiras:** Controle contas bancárias separadamente, transferindo fundos e visualizando o saldo unificado na sua carteira mestre.
- **Gestão de Metas:** Crie objetivos de vida (ex: "Carro Novo" ou "Reserva de Emergência") e acompanhe visualmente o progresso financeiro para alcançá-los.
- **Simulador de Previsões:** Brinque com variáveis de aumento de despesas ou economia e veja uma projeção realística e desenhada em gráficos para os meses futuros.
- **Fechamento de Mês & Histórico:** "Vire o mês" com facilidade. Os gastos variáveis são arquivados com o saldo daquele mês e o fluxo recomeça organizado automaticamente mantendo receitas e contas fixas.
- **Exportação Universal:** Baixe seus lançamentos perfeitamente formatados em **PDF de alto padrão**, planilhas **Excel (.xlsx)** ou **CSV**, prontos para auditorias.

## 🚀 Tecnologias

Esta plataforma foi desenvolvida buscando a máxima leveza e zero *overhead*, entregando performance máxima sem perder a capacidade de uma aplicação de alto nível.

<div align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" />
</div>

## 🔧 Como Executar Localmente

### Pré-requisitos
- Um servidor web local simples (ex: "Live Server" no VSCode)
- Suas credenciais do **Firebase** (Realtime Database e Auth) configuradas em `js/firebase-config.js`

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/joao-Rodriguess/controle_financeiro.git
```

2. Abra o diretório do projeto:
```bash
cd controle_financeiro
```

3. Inicie o servidor local ou use o Live Server para rodar o ambiente a partir do arquivo `index.html`.

> **Nota Crítica:** Por ser amplamente modular (`type="module"`), não abra o arquivo `index.html` via duplo-clique no explorador (`file:///`). O sistema exige um protocolo `http://` (ou `https://`) para lidar adequadamente com CORS e importar os módulos JS.

## 📐 Arquitetura

O sistema é construído utilizando o padrão **MVC Front-end Otimizado**:
- `app.js`: Coração da aplicação. Lida com manipulação avançada de DOM, lógicas pesadas, roteamento interno (SPA) e UI da plataforma.
- `auth.js`: Abstração blindada de segurança, lidando puramente com as políticas da Firebase Authentication.
- `firebase-config.js`: Camada de inicialização dos serviços na nuvem do Google (BaaS).
- **UI & UX:** O layout de `style.css` é mantido sem frameworks (Vanilla), valendo-se de Variáveis Raiz (CSS Variables) para sustentar a identidade de marca visual de modo modular e responsivo.

---

<p align="center">
  Feito com maestria e foco absoluto em performance corporativa. 🚀
</p>
