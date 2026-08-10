# 📚 Documentação Completa - Clube do Cinema App

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Configuração Local (Localhost)](#configuração-local-localhost)
3. [Implantação no Vercel](#implantação-no-vercel)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [APIs e Endpoints](#apis-e-endpoints)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)
7. [Fluxo de Dados](#fluxo-de-dados)
8. [Troubleshooting](#troubleshooting)
9. [Desenvolvimento](#desenvolvimento)
10. [Segurança](#segurança)

---

## Visão Geral

**Clube do Cinema App** é uma aplicação web desenvolvida em **Next.js 16** que automatiza o fluxo de avaliações de filmes e séries de um clube.

### Stack Tecnológico

| Componente | Versão |
|-----------|--------|
| **Next.js** | 16.2.12 |
| **React** | 19.2.0 |
| **ExcelJS** | 4.4.0 |
| **Node.js** | 18+ (recomendado) |
| **Hospedagem** | Vercel |
| **Banco de Dados** | Excel (Dropbox) |

### Funcionalidades Principais

✅ **Login Dinâmico** - Lista de pessoas lida da planilha em tempo real  
✅ **Cadastro de Títulos** - Validação contra IMDb (OMDb) e TMDb  
✅ **Avaliação** - Registra notas em escala 0-10  
✅ **Compartilhamento WhatsApp** - Mensagem formatada com um clique  
✅ **Busca e Filtros** - Por tipo (Filme/Série), ordenação alfabética  
✅ **Últimos Lançamentos** - Mostra 10 notas mais recentes com timestamps  
✅ **Aba Log** - Histórico automático na planilha  

### Status em Produção

🌐 **URL:** https://clube-cinema-app.vercel.app  
✅ **Status:** Operacional  
📅 **Última Atualização:** Agosto 2026

---

## Configuração Local (Localhost)

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18.17+ ([download](https://nodejs.org))
- **npm** 9+ (vem com Node.js)
- **Git** ([download](https://git-scm.com))
- **Editor de código** (VS Code recomendado)

### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/clube-cinema-app.git
cd clube-cinema-app
```

### Passo 2: Instalar Dependências

```bash
npm install
```

Isso vai baixar todos os pacotes necessários listados em `package.json`.

### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
cp .env.local.example .env.local
```

Ou crie manualmente com o conteúdo:

```env
# APIs de Validação
OMDB_API_KEY=sua_chave_omdb_aqui
TMDB_API_KEY=sua_chave_tmdb_aqui

# Dropbox (para acesso à planilha)
DROPBOX_APP_KEY=ym36yayzcaneiqk
DROPBOX_APP_SECRET=hz344iow0uijox8
DROPBOX_REFRESH_TOKEN=seu_refresh_token_aqui

# Configurações Opcionais
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

**⚠️ Importante:** Nunca commite `.env.local` no Git. Está no `.gitignore` por segurança.

### Passo 4: Obter as Chaves de API

#### 🔑 OMDb API (IMDb)

1. Acesse https://www.omdbapi.com/apikey.aspx
2. Escolha o plano gratuito (1.000 requisições/dia)
3. Confirme seu email
4. Copie a chave para `OMDB_API_KEY`

#### 🔑 TMDb API

1. Acesse https://www.themoviedb.org/settings/api
2. Faça login ou crie uma conta
3. Crie um novo projeto "developer"
4. Copie a API Key para `TMDB_API_KEY`

#### 🔑 Dropbox Refresh Token

O app já possui `DROPBOX_APP_KEY` e `DROPBOX_APP_SECRET` configurados. Para obter o `DROPBOX_REFRESH_TOKEN`:

**Opção 1: Usar o Script (Windows)**
```bash
dropbox-auth.bat
```

Este script:
1. Abre o navegador para autorizar o app no Dropbox
2. Você aceita a permissão
3. O script salva automaticamente o token em `.env.local`

**Opção 2: Manual (Qualquer SO)**

Use o script Python em `scripts/dropbox-auth.py`:
```bash
python scripts/dropbox-auth.py
```

Ou use cURL:
```bash
curl -X POST https://www.dropbox.com/oauth2/authorize?client_id=ym36yayzcaneiqk&response_type=code&token_access_type=offline
```

### Passo 5: Rodar o Servidor de Desenvolvimento

```bash
npm run dev
```

Saída esperada:
```
> clube-cinema-app@0.1.0 dev
> next dev

> Local:        http://localhost:3000
> Environments: .env.local
```

### Passo 6: Acessar a Aplicação

Abra no navegador:

```
http://localhost:3000
```

Você deve ver a tela de login com a lista de pessoas.

### Cmdos Úteis do Localhost

```bash
# Build de produção local
npm run build
npm start

# Rodar testes
npm test

# Limpar cache Next.js
rm -rf .next

# Ver logs detalhados
NEXT_DEBUG=true npm run dev
```

---

## Implantação no Vercel

### O que é Vercel?

**Vercel** é uma plataforma de cloud hosting otimizada para aplicações Next.js. Oferece:

✅ Deploy automático via Git  
✅ Escalabilidade automática  
✅ HTTPS gratuito  
✅ CDN global  
✅ Variáveis de ambiente seguras  
✅ Logs e monitoramento  

### Pré-requisitos para Deploy

- Conta Vercel (https://vercel.com)
- Repositório GitHub/GitLab/Bitbucket
- Código commitado no repositório

### Passo 1: Preparar o Repositório

```bash
# Certifique-se de estar na branch main
git checkout main

# Commit final
git add .
git commit -m "Pronto para deploy"

# Push para o repositório
git push origin main
```

### Passo 2: Conectar ao Vercel

#### Opção A: CLI Vercel (Recomendado)

```bash
# Instalar CLI Vercel globalmente
npm install -g vercel

# Fazer login
vercel login

# Deploy
vercel
```

#### Opção B: Dashboard Vercel (Web)

1. Acesse https://vercel.com/dashboard
2. Clique em **"Add New..."** → **"Project"**
3. Selecione seu repositório Git
4. Clique em **"Import"**

### Passo 3: Configurar Variáveis de Ambiente no Vercel

Após o import, configure as variáveis:

1. No dashboard Vercel, vá para **Settings** → **Environment Variables**
2. Adicione cada variável:

```
OMDB_API_KEY = sua_chave_omdb
TMDB_API_KEY = sua_chave_tmdb
DROPBOX_APP_KEY = ym36yayzcaneiqk
DROPBOX_APP_SECRET = hz344iow0uijox8
DROPBOX_REFRESH_TOKEN = seu_refresh_token
```

**⚠️ Importante:** Adicione ao escopo apropriado:
- **Production** - usada em prod (https://clube-cinema-app.vercel.app)
- **Preview** - usada em PRs
- **Development** - usada localmente

### Passo 4: Disparar o Deploy

O deploy acontece automaticamente quando:

```bash
git push origin main
```

Você pode acompanhar em tempo real:
- Dashboard Vercel: https://vercel.com/deployments
- Clique no commit para ver logs detalhados

### Passo 5: Verificar o Deploy

1. Acesse https://clube-cinema-app.vercel.app
2. Teste o login com qualquer pessoa
3. Tente cadastrar um título teste
4. Verifique se os dados aparecem na planilha

### Domínio Customizado (Opcional)

1. Em Vercel Dashboard, vá para **Settings** → **Domains**
2. Adicione seu domínio customizado
3. Siga as instruções para apontar DNS

Exemplo:
```
cinema.exemplo.com.br → clube-cinema-app.vercel.app
```

### Rollback (Voltar para Deploy Anterior)

1. No dashboard Vercel, vá para **Deployments**
2. Encontre o deploy anterior que funcionava
3. Clique em **"Promote to Production"**

---

## Estrutura do Projeto

```
clube-cinema-app/
│
├── 📁 app/                          # Aplicação Next.js (App Router)
│   ├── page.js                      # Componente principal (todas as telas)
│   ├── layout.js                    # Layout base
│   ├── globals.css                  # Estilos globais (tema escuro, dourado/bordô)
│   │
│   └── 📁 api/                      # API Routes (Backend)
│       ├── people/route.js          # GET /api/people - Lista de nomes
│       ├── search/route.js          # GET /api/search?q=titulo - Busca título
│       ├── sheet/route.js           # GET /api/sheet - Planilha completa
│       ├── recent/route.js          # GET /api/recent - Últimas 10 notas
│       ├── register/route.js        # POST /api/register - Novo filme/série
│       └── rate/route.js            # POST /api/rate - Avaliar existente
│
├── 📁 lib/                          # Lógica de negócio
│   ├── sheet.js                     # Leitura/escrita Excel via ExcelJS
│   ├── actions.js                   # Validação, busca, cadastro, avaliação
│   ├── whatsappMessage.js           # Formatação de mensagem WhatsApp
│   ├── omdb.js                      # Cliente OMDb API
│   ├── tmdb.js                      # Cliente TMDb API
│   ├── matchTitle.js                # Validação e correção de títulos
│   ├── dropboxClient.js             # Cliente Dropbox (HTTP API)
│   └── withSheet.js                 # Middleware de acesso à planilha
│
├── 📁 scripts/                      # Scripts utilitários
│   └── dropbox-auth.py              # Gerar DROPBOX_REFRESH_TOKEN
│
├── 📁 public/                       # Arquivos estáticos (CSS, imagens)
│   └── (servidos em /)
│
├── 📄 package.json                  # Dependências do projeto
├── 📄 next.config.js                # Configuração Next.js
├── 📄 .env.local.example            # Exemplo de variáveis
├── 📄 .gitignore                    # Arquivos ignorados pelo Git
├── 📄 README.md                     # README rápido
└── 📄 DOCUMENTACAO_COMPLETA.md      # Este arquivo
```

### Detalhamento de Arquivos-chave

#### `app/page.js` (2000+ linhas)
Componente React monolítico que contém:
- **Tela de Login:** Seleção de pessoa
- **Tela Home:** Menu principal, busca, formulário
- **Tela de Búsqueda:** Busca em títulos existentes
- **Tela de Cadastro:** Novo filme/série com validação
- **Tela de Avaliação:** Registro de nota (0-10)
- **Tela de Confirmação:** Gera link WhatsApp
- **Tela de Planilha:** Visualização de todos os títulos
- **Tela de Últimos:** Últimas 10 notas

#### `lib/sheet.js` (400+ linhas)
Responsável por:
- Ler planilha Excel via Dropbox
- Parsed dados em estrutura JS
- Validar integridade de dados
- Escrever novas linhas
- Criar aba "Log" automaticamente

#### `lib/actions.js` (300+ linhas)
Contém funções:
- `findPeople()` - Lista pessoas da planilha
- `searchTitle()` - Busca título existente
- `validateNewTitle()` - Valida contra OMDb/TMDb
- `computeMediaPond()` - Calcula média ponderada
- `logAction()` - Registra ação na aba Log

---

## APIs e Endpoints

### 1. GET `/api/people`

**Descrição:** Retorna lista de pessoas do clube

**Sem parâmetros**

**Resposta:**
```json
{
  "people": ["Carmen", "Cezar", "Chris", "Cris", "Eliane", ...]
}
```

**Status:**
- `200` - Sucesso
- `500` - Erro ao ler planilha

**Exemplo:**
```javascript
const res = await fetch('/api/people');
const { people } = await res.json();
```

---

### 2. GET `/api/search`

**Descrição:** Busca título existente na planilha

**Parâmetros:**
- `q` (query string, obrigatório) - Título a buscar

**Resposta:**
```json
{
  "found": true,
  "titulo": "(500) Dias com Ela",
  "ano": 2009,
  "tipo": "F",
  "mediaPond": 8.2,
  "totalVotos": 12,
  "notas": {
    "Carmen": 8,
    "Cezar": 8.5,
    ...
  }
}
```

**Status:**
- `200` - Título encontrado
- `404` - Título não encontrado
- `500` - Erro

**Exemplo:**
```javascript
const res = await fetch('/api/search?q=Oppenheimer');
const data = await res.json();
```

---

### 3. GET `/api/sheet`

**Descrição:** Retorna planilha completa com todos os títulos

**Sem parâmetros**

**Resposta:**
```json
{
  "total": 2511,
  "items": [
    {
      "titulo": "(500) Dias com Ela",
      "ano": 2009,
      "tipo": "F",
      "mediaPond": 8.2,
      "totalVotos": 12,
      "notas": { ... }
    },
    ...
  ]
}
```

**Status:**
- `200` - Sucesso
- `500` - Erro

**Nota:** Pode ser lento em localhost (2000+ filmes)

---

### 4. GET `/api/recent`

**Descrição:** Retorna últimas 10 notas (com timestamp)

**Sem parâmetros**

**Resposta:**
```json
{
  "recent": [
    {
      "titulo": "Oppenheimer",
      "pessoa": "Cezar",
      "nota": 9.5,
      "timestamp": "2026-08-01 14:30:22",
      "tipo": "F"
    },
    ...
  ]
}
```

**Status:**
- `200` - Sucesso
- `500` - Erro

---

### 5. POST `/api/register`

**Descrição:** Registra novo filme/série

**Body (JSON):**
```json
{
  "titulo": "Dune: Part Two",
  "ano": 2024,
  "tipo": "F",
  "nota": 8.5,
  "pessoa": "Cezar",
  "imdbId": "tt15239678"
}
```

**Resposta (sucesso):**
```json
{
  "success": true,
  "message": "Filme registrado",
  "novoNumero": 2512
}
```

**Resposta (erro - título já existe):**
```json
{
  "error": "Título já existe na planilha",
  "existente": { ... }
}
```

**Status:**
- `201` - Criado
- `409` - Conflito (título existe)
- `400` - Dados inválidos
- `500` - Erro

---

### 6. POST `/api/rate`

**Descrição:** Registra avaliação para título existente

**Body (JSON):**
```json
{
  "titulo": "(500) Dias com Ela",
  "pessoa": "Cezar",
  "nota": 8.5
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Nota registrada",
  "novaMediaPond": 8.3
}
```

**Status:**
- `200` - Sucesso
- `404` - Título não encontrado
- `400` - Dados inválidos
- `500` - Erro

---

## Variáveis de Ambiente

### Obrigatórias

| Variável | Descrição | Onde Obter |
|----------|-----------|-----------|
| `OMDB_API_KEY` | Chave da API OMDb | https://www.omdbapi.com/apikey.aspx |
| `TMDB_API_KEY` | Chave da API TMDb | https://www.themoviedb.org/settings/api |
| `DROPBOX_REFRESH_TOKEN` | Token de acesso Dropbox | Script `dropbox-auth.py` |

### Pré-configuradas (não alterar)

| Variável | Valor |
|----------|-------|
| `DROPBOX_APP_KEY` | `ym36yayzcaneiqk` |
| `DROPBOX_APP_SECRET` | `hz344iow0uijox8` |

### Opcionais

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3000` | URL base da API (dev) |
| `LOG_LEVEL` | `info` | Nível de logs (debug, info, warn, error) |

### Configurar no Vercel

1. Dashboard Vercel → Projeto
2. **Settings** → **Environment Variables**
3. Adicionar cada variável com escopo (Production/Preview/Development)

**Exemplo:**
```
Name: OMDB_API_KEY
Value: [sua chave]
Environments: ✓ Production ✓ Preview ✓ Development
```

---

## Fluxo de Dados

### Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────┐
│                    NAVEGADOR DO USUÁRIO                 │
│  (React Component em app/page.js)                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Requisições HTTP
                  │ (fetch, POST, GET)
                  ▼
┌─────────────────────────────────────────────────────────┐
│              VERCEL / LOCALHOST (PORT 3000)             │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Next.js API Routes (app/api/*)                    │ │
│  │ - Validação de entrada                            │ │
│  │ - Chamadas a APIs externas (OMDb, TMDb)           │ │
│  │ - Orquestração de lógica                          │ │
│  └─────────┬──────────────────────┬──────────────────┘ │
│            │                      │                    │
│            ▼                      ▼                    │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ lib/actions.js   │  │ lib/sheet.js             │  │
│  │ - Busca          │  │ - Parse Excel            │  │
│  │ - Validação      │  │ - Escrita de dados       │  │
│  │ - Cálculos       │  │ - Gerenciar aba Log      │  │
│  └──────────┬───────┘  └──────────┬───────────────┘  │
│             │                     │                   │
│             └─────────┬───────────┘                   │
│                       │                               │
│              ┌────────▼──────────┐                    │
│              │ lib/dropboxClient │                    │
│              │ HTTP API Dropbox  │                    │
│              └────────┬──────────┘                    │
└───────────────────────┼──────────────────────────────┘
                        │
                        │ HTTPS
                        │
                        ▼
           ┌─────────────────────────────┐
           │  DROPBOX API (nuvem)        │
           │  Arquivo: ClubeDoCinema.xlsx│
           └─────────────────────────────┘
```

### Fluxo de Cadastro de Novo Filme

1. **Usuário entra no app** → Tela de login
2. **Seleciona seu nome** → Vai para Home
3. **Clica "Novo"** → Tela de Cadastro
4. **Digita título** → Frontend envia para backend
5. **Backend valida:**
   - Busca em OMDb (exato)
   - Se não encontrar, busca em TMDb
   - Se encontrar em TMDb, sugere correção
6. **Se validado:**
   - Calcula Média Ponderada com fórmula específica
   - Escreve nova linha na planilha
   - Registra ação em aba Log
7. **Retorna para frontend:**
   - Gera mensagem WhatsApp formatada
   - Oferece link para compartilhar

### Fluxo de Avaliação (Título Existente)

1. **Usuário busca título** → Lista títulos da planilha
2. **Clica no título** → Vai para Avaliação
3. **Entra com nota (0-10)** → Clica "Confirmar"
4. **Backend:**
   - Valida se título existe
   - Insere nota na coluna da pessoa
   - Recalcula Média Ponderada
   - Registra no Log
5. **Frontend mostra:**
   - Nova Média Ponderada
   - Mensagem WhatsApp
   - Link para compartilhar

---

## Troubleshooting

### ❌ "Cannot find module 'next'"

**Solução:**
```bash
npm install
```

Certifique-se de que `node_modules/` foi criado.

---

### ❌ "ENOENT: no such file or directory, open '.env.local'"

**Solução:**
```bash
cp .env.local.example .env.local
# Edite .env.local com suas chaves
```

---

### ❌ "OMDB_API_KEY is required"

**Solução:**
1. Gere a chave em https://www.omdbapi.com/apikey.aspx
2. Adicione em `.env.local`:
   ```
   OMDB_API_KEY=sua_chave_aqui
   ```
3. Reinicie o servidor: `npm run dev`

---

### ❌ "Dropbox API error: invalid_grant"

**Solução:**
O refresh token expirou ou é inválido.

Regenere usando:
```bash
python scripts/dropbox-auth.py
```

---

### ❌ "Port 3000 is already in use"

**Solução:**
Use outra porta:
```bash
npm run dev -- -p 3001
```

Ou mate o processo:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

---

### ❌ "Build fails on Vercel"

**Solução:**

1. Verifique os logs em Vercel Dashboard
2. Comum: variáveis de ambiente faltando
3. Adicione variáveis em Settings → Environment Variables
4. Repush o código ou recrie o deploy

```bash
git add .
git commit -m "Fix env vars"
git push origin main
```

---

### ❌ "Aplicação lenta no Vercel"

**Causas comuns:**
- Arquivo Excel muito grande (2000+ filmes)
- Sem cache de dados
- Múltiplas chamadas à Dropbox

**Soluções:**
1. Implementar cache em Redis (Upstash)
2. Paginação na planilha
3. Índice de busca

---

### ❌ "Título aparece em escala 0-5 em vez de 0-10"

**Verificação:**
Os dados no Excel estão sempre em escala 0-10. Se aparecem em 0-5:
1. Pode ser um bug de renderização
2. Ou a fórmula foi alterada

**Solução:**
Verificar `lib/sheet.js` linha 126 - não deve haver `* 2` ou `/ 2`

---

## Desenvolvimento

### Estrutura de Commits

```bash
# Feature nova
git checkout -b feature/nova-funcionalidade

# Fazer mudanças
git add .
git commit -m "feat: adiciona nova funcionalidade"

# Abrir PR para review
git push origin feature/nova-funcionalidade
```

### Padrão de Commit

```
<tipo>: <descrição curta>

<descrição longa opcional>

Fixes #123
```

Tipos:
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Estilos CSS
- `refactor:` Refatoração de código
- `perf:` Performance
- `test:` Testes

### Testing Local

```bash
# Rodar testes
npm test

# Com cobertura
npm test -- --coverage
```

### Build de Produção Local

```bash
# Gera build otimizado
npm run build

# Simula produção
npm start
```

Acesse http://localhost:3000

---

## Segurança

### Proteção de Dados Sensíveis

✅ `.env.local` no `.gitignore` - Nunca commite credenciais  
✅ Use variáveis de ambiente no Vercel  
✅ Tokens de API rotacionados periodicamente  
✅ HTTPS enforçado em produção  

### Validação de Entrada

✅ Todos os endpoints validam entrada  
✅ Títulos são sanitizados  
✅ Notas validadas (0-10)  
✅ Nomes de pessoa verificados contra planilha  

### Acesso ao Dropbox

O app usa OAuth2 com escopo limitado:
- Leitura/escrita apenas em `/Aplicativos/ClubeDoCinema2`
- Não acessa outras pastas do Dropbox
- Token refresh automático

### Rate Limiting

Considerar implementar em produção:
- Limite de requisições por IP
- Cache de APIs externas
- Timeout para chamadas Dropbox

---

## Checklist de Deploy

Antes de fazer deploy em produção:

- [ ] Todos os testes passam (`npm test`)
- [ ] Não há logs de erro em localhost
- [ ] `.env.local` não está commitado
- [ ] Variáveis de ambiente estão configuradas no Vercel
- [ ] OMDB_API_KEY e TMDB_API_KEY são válidas
- [ ] DROPBOX_REFRESH_TOKEN é válido (menos de 6 meses)
- [ ] README está atualizado
- [ ] Documentação está atualizada
- [ ] Testes com usuário real foram feitos
- [ ] Planilha está com backup

---

## Contato e Suporte

Para dúvidas ou issues:

1. Verificar [Troubleshooting](#troubleshooting)
2. Consultar GitHub Issues
3. Revisar logs do Vercel Dashboard
4. Contatar administrador do clube

---

## Histórico de Versões

| Versão | Data | Mudanças |
|--------|------|----------|
| 0.1.0 | Ago 2026 | Versão inicial com suporte completo |

---

**Última Atualização:** Agosto 2026  
**Mantido por:** Clube do Cinema  
**Status:** ✅ Em Produção
