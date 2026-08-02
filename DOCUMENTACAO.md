# Documentação - Clube do Cinema App

## 📋 Visão Geral

Aplicação web para gerenciar avaliações de filmes e séries do Clube do Cinema. Permite buscar títulos por IMDb, registrar avaliações, visualizar a planilha compartilhada e compartilhar filmes no WhatsApp.

**Stack:** Next.js 16 + React 19 + ExcelJS + Dropbox API

---

## 🎯 Funcionalidades Principais

- **Login dinâmico** — Lista de pessoas lida da planilha
- **Busca de filmes/séries** — Integração com TMDb e OMDb para validação
- **Registro de avaliações** — Nota de 1 a 5 para filmes novos ou existentes
- **Visualização de planilha** — Ver todos os filmes, filtrar por tipo, buscar títulos
- **Compartilhamento WhatsApp** — Enviar avaliações para o grupo do Clube
- **Notas IMDb** — Exibição de ratings do IMDb (quando 2+ pessoas avaliaram)
- **Últimas avaliações** — Histórico de 10 notas mais recentes com timestamps
- **Aba Log** — Registro automático de todas as operações

---

## 🏗️ Arquitetura

### Stack Técnico
- **Frontend:** Next.js 16.2.12 + React 19 + CSS
- **Backend:** Next.js API Routes
- **Dados:** Excel (ExcelJS) sincronizado com Dropbox
- **APIs Externas:** TMDb, OMDb, Dropbox
- **Hospedagem:** Vercel (configurar após deletion)

### Estrutura de Pastas

```
clube-cinema-app/
├── app/
│   ├── page.js              (Todas as telas em 1 componente)
│   ├── layout.js            (Meta tags, service worker)
│   ├── globals.css          (Tema escuro, dourado/bordô)
│   └── api/
│       ├── people/route.js      (GET - lista nomes)
│       ├── search/route.js      (GET - busca título)
│       ├── imdb-search/route.js (GET - busca com IMDb)
│       ├── sheet/route.js       (GET - planilha completa)
│       ├── recent/route.js      (GET - últimos lançamentos)
│       ├── register/route.js    (POST - novo filme)
│       └── rate/route.js        (POST - avaliar existente)
├── lib/
│   ├── sheet.js             (Ler/escrever Excel + Log)
│   ├── actions.js           (Lógica de operações)
│   ├── whatsappMessage.js   (Formata mensagem)
│   ├── omdb.js              (Busca OMDb)
│   ├── tmdb.js              (Busca TMDb)
│   ├── matchTitle.js        (Valida e corrige título)
│   ├── dropboxClient.js     (API HTTP Dropbox)
│   └── withSheet.js         (Wrapper para conectar Dropbox)
├── public/
│   ├── favicon.jpeg
│   ├── manifest.json        (Config PWA)
│   └── sw.js                (Service Worker)
├── scripts/
│   └── get-dropbox-refresh-token.js  (Gerar token)
├── package.json
├── .env.local               (Credenciais - NÃO commitar)
└── DOCUMENTACAO.md          (Este arquivo)
```

---

## 🔐 Variáveis de Ambiente

Criar arquivo `.env.local` na raiz do projeto:

```
# APIs de busca de filmes
OMDB_API_KEY=<chave_omdb>
TMDB_API_KEY=<chave_tmdb>

# Autenticação Dropbox
DROPBOX_APP_KEY=ym36yayzcaneiqk
DROPBOX_APP_SECRET=hz344iow0uijox8
DROPBOX_REFRESH_TOKEN=<refresh_token_gerado>
```

### Gerar Refresh Token do Dropbox

```bash
node scripts/get-dropbox-refresh-token.js
```

Script abre navegador para autorização. Copie o token gerado e coloque em `.env.local`.

---

## 📊 Estrutura da Planilha (Excel)

**Localização:** `/Apps/ClubeDoCinema2/ClubeDoCinema.xlsx`

### Aba "Clube cinema" (Dados Principais)

| Col | Nome | Tipo | Descrição |
|-----|------|------|-----------|
| A | Número | Auto | Identificador sequencial (MAX + 1) |
| B | Título | Text | Nome do filme/série normalizado |
| C | Tipo | F/FD/S/MS | F=Filme, FD=Filme Documentário, S=Série, MS=Minissérie |
| D | Ano | Year | Ano de lançamento |
| E | Onde viu | Text | Plataforma/canal (Netflix, Cinema, etc) |
| F-M | Notas (pessoas) | Float | Notas individuais de cada membro (1-5) |
| N | Total Pontos | Sum | Σ de todas as notas |
| O | Total Votos | Count | Quantidade de pessoas que avaliaram |
| P | Média Simples | Avg | Média aritmética (Total Pontos / Total Votos) |
| Q | Nota IMDb | Float | Rating do IMDb (0-10) |
| R | Link IMDb | URL | Link para página IMDb |
| S | Média Ponderada | Formula | Média ponderada com âncora de 7.0 |
| T | Títulos Alt | Text | Títulos alternativos/originais |
| U | IMDb ID | Text | Identificador do IMDb (tt######) |
| V | Discutido | X/blank | Marcar com "X" se foi discutido no clube |

### Aba "Log" (Histórico)

| Col | Nome | Tipo |
|-----|------|------|
| A | DataHora | DateTime | Timestamp da operação (AAAA-MM-DD HH:MM) |
| B | Pessoa | Text | Nome da pessoa que executou |
| C | Numero | Int | ID do filme na aba principal |
| D | Status | Text | "Novo" ou "Existente" |

### Membros do Clube (Linha 1)

Nomes dinamicamente lidos da linha 1 da aba "Clube cinema" (colunas F-M).

---

## 🚀 Como Usar

### 1. Instalação Local

```bash
cd clube-cinema-app
npm install
npm run dev
```

Acessa em http://localhost:3000

### 2. Fluxo de Uso

**Tela 1: Login**
- Seleciona seu nome na lista de membros do clube

**Tela 2: Ver Filmes/Séries**
- Busca por título
- Filtra por tipo (Filmes/Séries)
- Ordena por Nota IMDb, Média Ponderada, ou Alfabético
- Abas: Todos, Discutidos, Sem nota (apenas filmes não avaliados por você)

**Tela 3: Avaliar**
- **Filme existente:** Clica e seleciona "Avaliar"
- **Novo filme:** Clica em "Novo filme" e busca no IMDb/TMDb

**Tela 4: Confirmação**
- Valida dados
- Mostra mensagem formatada
- Opção de compartilhar no WhatsApp do Clube

---

## 🔗 API Routes

### GET /api/people
Retorna lista de nomes (membros do clube).

**Response:**
```json
{
  "ok": true,
  "people": ["Carmen", "Cezar", "Chris", ...]
}
```

### GET /api/search?q=<query>&tipo=<tipo>
Busca filme/série por título (TMDb + OMDb).

**Query params:**
- `q` — Título a buscar
- `tipo` — "filme" ou "serie"

**Response:**
```json
{
  "ok": true,
  "matches": [
    {
      "title": "1917",
      "year": 2019,
      "imdbId": "tt8579674",
      "imdbRating": 8.4,
      "type": "movie"
    }
  ]
}
```

### GET /api/sheet?view=<view>&sort=<sort>&tipo=<tipo>
Retorna planilha filtrada e ordenada.

**Query params:**
- `view` — "todos", "fila", "discutidos"
- `sort` — "nome", "imdb", "media"
- `tipo` — "todos", "Filmes", "Séries"

**Response:**
```json
{
  "ok": true,
  "items": [
    {
      "rowNumber": 5,
      "numero": 1,
      "nome": "1917",
      "tipo": "F",
      "ano": 2019,
      "scores": { "Cezar": 9, "Carmen": 8 },
      "imdbRating": 8.4,
      "imdbLink": "https://www.imdb.com/title/tt8579674/",
      "discutido": false
    }
  ]
}
```

### GET /api/recent?limit=<limit>
Últimas N avaliações (padrão 10).

**Response:**
```json
{
  "ok": true,
  "items": [
    {
      "dataHora": "2026-08-02 14:30",
      "pessoa": "Cezar",
      "numero": 5,
      "status": "Novo"
    }
  ]
}
```

### POST /api/register
Registra novo filme/série.

**Body:**
```json
{
  "nome": "1917",
  "tipo": "F",
  "ano": 2019,
  "ondeVer": "Netflix",
  "pessoa": "Cezar",
  "nota": 9,
  "imdbId": "tt8579674",
  "imdbRating": 8.4
}
```

**Response:**
```json
{
  "ok": true,
  "rowNumber": 45,
  "numero": 42
}
```

### POST /api/rate
Avalia filme existente.

**Body:**
```json
{
  "numero": 5,
  "pessoa": "Cezar",
  "nota": 9
}
```

**Response:**
```json
{
  "ok": true,
  "updated": true
}
```

---

## 🔄 Fluxo de Dados

```
Frontend (React)
       ↓
   API Routes (Next.js)
       ↓
   lib/actions.js (Lógica de negócio)
       ↓
   lib/sheet.js (Ler/escrever Excel)
       ↓
   lib/dropboxClient.js (API HTTP Dropbox)
       ↓
   Dropbox API (/Apps/ClubeDoCinema2/)
```

---

## 🛠️ Componentes Principais

### app/page.js
- **HomeScreen** — Tela de login e lista de filmes
- **SearchScreen** — Busca e cadastro de novo filme
- **FormScreen** — Formulário de avaliação
- **ConfirmScreen** — Confirmação e compartilhamento WhatsApp
- **NewScreen** — Componente principal que gerencia estado e navegação

### lib/sheet.js
- `loadSheet()` — Carrega Excel do Dropbox
- `readSheet(buffer)` — Parseia Excel e retorna estrutura
- `appendLog(sheet, ...)` — Adiciona entrada no Log
- `cellDisplayText(cell)` — Extrai texto de células (com suporte a hyperlinks)

### lib/actions.js
- `browseAction()` — Filtra e ordena filmes
- `searchAction()` — Busca por título
- `registerAction()` — Registra novo filme
- `rateAction()` — Registra avaliação
- `computeMediaPond()` — Calcula média ponderada

### lib/tmdb.js
- `searchMovieTmdb(title, year, type)` — Busca TMDb
- `getTmdbImdbId(tmdbId, type)` — Obtém IMDb ID via TMDb

### lib/omdb.js
- `omdbLookupById(imdbId)` — Busca rating OMDb por IMDb ID

### lib/dropboxClient.js
- `downloadSheet()` — Baixa arquivo Dropbox
- `uploadSheet(buffer)` — Sobe arquivo Dropbox
- `getAccessToken()` — Renova access token via refresh token

---

## ⚙️ Configuração Dropbox

### Pré-requisitos
1. Conta Dropbox pessoal
2. App criado no Dropbox Developers (https://www.dropbox.com/developers/apps)
3. Arquivo Excel em `/Apps/ClubeDoCinema2/ClubeDoCinema.xlsx`

### Gerar Credenciais

1. Acessa https://www.dropbox.com/developers/apps
2. Clica "Create app"
3. Seleciona:
   - API: Scoped access
   - Access: App folder
   - Name: ClubeDoCinema2
4. Copia **App key** e **App secret**
5. Roda `node scripts/get-dropbox-refresh-token.js`
6. Autoriza no navegador
7. Copia refresh token pra `.env.local`

---

## 📱 PWA (Progressive Web App)

App funciona como PWA — pode instalar como aplicativo no celular/desktop.

**Manifestação:** `public/manifest.json`
**Service Worker:** `public/sw.js` (cache de assets)

---

## 🎨 Tema Visual

- **Paleta:** Dourado (#D4A574) e bordô (#5C0A0A) sobre fundo escuro
- **Tipografia:** Sistema de fontes padrão
- **Layout:** Mobile-first responsivo

---

## 🚨 Tratamento de Erros

Aplicação trata erros principais:
- Falha ao conectar Dropbox (409, 401, etc)
- API TMDb/OMDb indisponível
- Título não encontrado
- Validação de dados

Usuário vê mensagens amigáveis em português.

---

## 🔒 Segurança

- Credenciais em `.env.local` (nunca commitar)
- Acesso Dropbox via refresh token (sem armazenar access token)
- Validação de entrada antes de salvar
- Sem exposição de dados sensíveis nos logs

---

## 📝 Notas Importantes

1. **Planilha é a fonte da verdade** — Todas as alterações fluem por ela
2. **Sincronização Dropbox** — Arquivo pode levar alguns segundos pra sincronizar
3. **Membros do clube** — Lidos dinamicamente da linha 1 (colunas F-M)
4. **IMDb ratings** — Só exibem quando 2+ pessoas avaliaram (privacidade)
5. **Formulas Excel** — Não são recalculadas pela app, apenas lidas

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Erro 409 Dropbox | Verificar path do arquivo e permissões do refresh token |
| Títulos aparecem como [Object Object] | Verificar se células têm hyperlinks; `cellDisplayText()` trata isso |
| API TMDb retorna vazio | Verificar chave `TMDB_API_KEY` em `.env.local` |
| Planilha não atualiza | Esperar sincronização Dropbox (até 30s) |
| WhatsApp não abre | Verificar link do grupo em `lib/buildConfirm()` |

---

## 📞 Contato

Para dúvidas sobre o desenvolvimento ou manutenção da aplicação, consulte o repositório Git ou a documentação de commits.

**Versão Atual:** Compatível com Next.js 16.2.12 e React 19  
**Última Atualização:** Agosto 2026
