# Documentação Completa - App Clube do Cinema

## 📋 Resumo Executivo

App web para gerenciar avaliações de filmes/séries do clube. Substitui fluxo manual (WhatsApp + planilha) por app com validação automática via IMDb, sincronização com Dropbox e compartilhamento direto no WhatsApp.

**Status:** ✅ Em produção na Vercel (https://clube-cinema-app.vercel.app)

---

## 🎯 Funcionalidades

- **Login dinâmico:** lista de pessoas lida da planilha
- **Cadastro de filme/série:** valida contra OMDb (exato) e TMDb (fuzzy)
- **Avaliação:** registra nota de qualquer pessoa em qualquer título
- **Compartilhamento WhatsApp:** gera mensagem formatada com link wa.me
- **Planilha navegável:** busca, filtro por tipo, ordenação
- **Últimos lançamentos:** mostra 10 notas mais recentes com timestamps
- **Aba Log:** histórico automático de todas as operações

---

## 🏗️ Arquitetura

```
Stack: Next.js 16 + React 19 + ExcelJS + Dropbox API HTTP
Hospedagem: Vercel (deploy automático via Git)
Dados: Dropbox (planilha Excel)
APIs externas: OMDb, TMDb
```

### Estrutura de pastas

```
clube-cinema-app/
├── app/
│   ├── page.js              (todas as telas em 1 componente)
│   ├── layout.js            (meta tags, service worker)
│   ├── globals.css          (tema escuro, dourado/bordô)
│   └── api/
│       ├── people/route.js      (GET - lista nomes)
│       ├── search/route.js      (GET - busca título)
│       ├── sheet/route.js       (GET - planilha completa)
│       ├── recent/route.js      (GET - últimos lançamentos)
│       ├── register/route.js    (POST - novo filme)
│       └── rate/route.js        (POST - avaliar existente)
├── lib/
│   ├── sheet.js             (ler/escrever Excel + Log)
│   ├── actions.js           (lógica de operações)
│   ├── whatsappMessage.js   (formata mensagem)
│   ├── omdb.js              (busca OMDb)
│   ├── tmdb.js              (busca TMDb)
│   ├── matchTitle.js        (valida e corrige título)
│   ├── dropboxClient.js     (comunica com Dropbox)
│   └── withSheet.js         (conecta lógica ao Dropbox)
├── public/
│   ├── favicon.jpeg         (ícone câmera + poltronas)
│   ├── favicon.ico          (favicon alternativo)
│   ├── manifest.json        (config PWA)
│   └── sw.js                (service worker)
├── package.json
├── .env.local               (credenciais - NÃO commita)
└── README.md
```

---

## 🔐 Variáveis de Ambiente

**Arquivo:** `.env.local`

```
OMDB_API_KEY=<sua_chave>
TMDB_API_KEY=<sua_chave>
DROPBOX_APP_KEY=ym36yayzcaneiqk
DROPBOX_APP_SECRET=hz344iow0uijox8
DROPBOX_REFRESH_TOKEN=<seu_refresh_token>
```

### Gerar novo Dropbox refresh token (Windows):
```bash
dropbox-auth.bat
```

Script localizado em `scripts/get-dropbox-refresh-token.js`

---

## 🚀 Deploy

### Automático (recomendado)
```bash
git add .
git commit -m "sua mensagem"
git push
# Vercel detecta e faz deploy automaticamente
```

### Manual
1. Dashboard Vercel → Deployments → Redeploy

---

## 🎬 Como Usar Localmente

```bash
npm install
cp .env.local.example .env.local
# Editar .env.local com suas chaves
npm run dev
```

Acessa: `http://localhost:3000`

---

## 📊 Fluxo de Dados

### Cadastro de novo filme/série

1. Usuário digita título + tipo + ano + onde viu + nota
2. App valida:
   - Verifica se é duplicata (nome + ano + tipo)
   - Busca OMDb (exato)
   - Se falhar, busca TMDb (tolera erro leve)
   - Se falhar, salva como "não confirmado"
3. App salva na planilha + aba Log
4. Gera mensagem WhatsApp (wa.me)
5. Retorna mensagem pronta pra compartilhar

### Avaliação de título existente

1. Usuário procura e seleciona título
2. Se título estava "não confirmado", tenta confirmar via APIs
3. Se confirmar, atualiza linha inteira
4. Registra nota + gera mensagem WhatsApp
5. Adiciona registro à aba Log

---

## 🐛 Problemas Conhecidos & Soluções

### PWA no Android - INVESTIGAÇÃO COMPLETA

**Problema:** App não instala como PWA no Android (Galaxy S25)

**Tentativas realizadas:**

1. **Manifest.json + Favicon (PNG/JPEG)**
   - Chrome oferecia "Instalar" mas não instalava
   - Resultado: falha silenciosa

2. **Service Worker básico**
   - Chrome ofereceu "Instalar" uma vez
   - Depois parou de oferecer
   - Resultado: falha

3. **Múltiplas configurações PWA**
   - Meta tags completas
   - Manifest simplificado
   - Ícones em vários formatos (.ico, .jpeg, .png)
   - Resultado: nenhuma funcionou

4. **Teste comparativo**
   - Squoosh (PWA funcional) instala perfeitamente no S25
   - Nosso app: Chrome não oferece opção
   - Conclusão: problema específico de nossa config ou app

**Causa provável:**
- Chrome cacheia decisão de "falha de instalação" das tentativas anteriores
- Sem manifest.json/service worker, Chrome não reconhece como PWA
- Pode haver algo no app que Chrome detecta como problema

**Solução final adotada:**
- ❌ Remover PWA completamente (manifest.json, sw.js)
- ❌ Remover ícones customizados
- ✅ App web simples e funcional
- ✅ Sem complicações de PWA
- ✅ **Funciona 100% via navegador**

### Como criar atalho manualmente

**No Chrome:**
1. Acessa: https://clube-cinema-app.vercel.app
2. Toca em **⋮ (menu)**
3. Procura: "Adicionar à tela inicial" / "Instalar app"
4. Se não achar, tenta **⋮ → Compartilhar**

**Problema encontrado:**
- Chrome oferece essa opção para qualquer site
- **EXCETO para este app específico**
- Causa: cache negativo de tentativas anteriores de PWA

**Soluções:**
1. **Limpar cache do Chrome:**
   - Configurações → Apps → Chrome → Armazenamento → Limpar cache
   - Força parada do Chrome
   - Reabra e tente novamente

2. **Modo anônimo:**
   - Chrome → ⋮ → Nova aba anônimo
   - Acessa: https://clube-cinema-app.vercel.app
   - Tenta adicionar atalho

3. **Outro navegador:**
   - Firefox → ⋮ → Instalar app

**Status:**
- App funciona perfeitamente via navegador ✅
- Atalho é apenas conveniência visual
- Recomendação: usar via navegador (não é limitação funcional)

---

## 🔧 Validação de Títulos

### Regras OMDb
- Busca exata (nome + ano + tipo)
- Se encontra, confirma imediatamente

### Regras TMDb
- Busca fuzzy (tolera erro de digitação/pontuação)
- 1 resultado único → aceita (mesmo com ano diferente)
- Múltiplos resultados → só aceita se 1 bater com ano
- Nunca "chuta" entre homônimos ambíguos

### Status possíveis
- **Confirmado:** validado em OMDb ou TMDb
- **Novo - não confirmado:** não achou em nenhuma API
- **Corrigido:** TMDb corrigiu nome/ano do usuário

---

## 📝 Planilha Excel (Dropbox)

### Localização
`/Apps/ClubeDoCinema2/Clube_do_Cinema_com_IMDb.xlsx`

### Abas
- **Clube cinema:** dados principais (13 colunas: A-M)
- **Log:** histórico de operações (4 colunas: DataHora, Pessoa, Numero, Status)

### Colunas principais (aba Clube cinema)
| Col | Nome | Tipo | Notas |
|-----|------|------|-------|
| A | Número | Auto | MAX + 1 |
| B | Título | Text | Normalizado |
| C | Tipo | F/FD/S/MS | Movie/Series |
| D | Ano | Year | Ano lançamento |
| E | Onde viu | Text | Como usuário digitou |
| F-M | Notas pessoas | Float | 1-5 |
| N | Total Pontos | Sum | Σ notas |
| O | Total Votos | Count | Count não-vazios |
| P | Média Simples | Avg | P/O |
| Q | Nota IMDb | Float | Do IMDb |
| R | Link IMDb | URL | Se confirmado |
| S | Média Ponderada | Formula | Ponderada por votos + âncora |

### Aba Log
- **DataHora:** "AAAA-MM-DD HH:MM"
- **Pessoa:** nome exato
- **Numero:** do título na aba principal
- **Status:** "Novo" ou "Existente"

---

## 📱 Membros do Clube

Login dinâmico (linha 1 da planilha):
Carmen, Cezar, Chris, Cris, Eliane, Fernando Vera, Helena, Ivanete, João, M.Inês, Tereza, Zaninha

---

## ✅ Testes Realizados

- ✅ Lógica backend (sheet.js + actions.js) com mock
- ✅ Todas as rotas de API contra Dropbox real
- ✅ Tela de login
- ✅ Cadastro novo + avaliação existente
- ✅ Geração de mensagem WhatsApp
- ✅ Planilha navegável (busca, filtro, ordenação)
- ✅ Deploy na Vercel
- ✅ Sincronização com Dropbox

---

## 🔄 Deploy Automático

Sempre que fizer `git push`:
1. GitHub detecta mudança
2. Vercel roda build
3. Se sucesso, deploya para https://clube-cinema-app.vercel.app
4. Se erro, notifica via GitHub

Ver logs: Vercel Dashboard → Deployments

---

## 🚫 Limitações Atuais

- Paginação da planilha: carrega todos os títulos de uma vez (2000+)
  - Solução: implementar scroll infinito/paginação
- PWA no Android: não funciona com configuração atual
  - Solução: usar app via navegador ou tentar Lovable
- Cache de token: renova toda vez (não persiste entre chamadas na Vercel)
  - Solução: usar Upstash Redis (grátis)

---

## ❌ O Que NÃO Foi Possível Fazer

### PWA Funcional no Android
**Tentativas:** 5+ configurações diferentes testadas

1. Manifest.json + Favicon (PNG/JPEG)
   - Chrome oferecia "Instalar" mas não instalava
   - Resultado: falha silenciosa

2. Service Worker básico
   - Chrome ofereceu "Instalar" uma vez
   - Depois parou de oferecer
   - Resultado: falha

3. Múltiplas configurações PWA
   - Meta tags completas
   - Manifest simplificado
   - Ícones em vários formatos (.ico, .jpeg, .png, .svg)
   - Resultado: nenhuma funcionou

4. Teste comparativo
   - Squoosh (PWA funcional) instala perfeitamente no Galaxy S25
   - Nosso app: Chrome não oferece opção
   - Conclusão: problema específico de nossa config ou app

**Causa provável:**
- Chrome cacheia decisão de "falha de instalação" das tentativas anteriores
- Sem manifest.json/service worker, Chrome não reconhece como PWA
- Pode haver algo no app que Chrome detecta como problema

**Impacto:**
- ⚠️ App não funciona como PWA instalável
- ✅ Mas funciona 100% via navegador (sem limitações funcionais)

### Ícone Customizado no Atalho
**Tentativas:** favicon.png, favicon.jpeg, favicon.ico, favicon.svg

- Android/Chrome não reconhecia as imagens
- Nenhum formato funcionou
- **Impacto:** Atalho (se conseguir criar) aparece com ícone genérico

### Chrome Bloqueando Este App
**Problema:** 
- Chrome oferece "Adicionar à tela inicial" para qualquer outro site
- **APENAS ESTE APP** não oferece a opção
- Provavelmente cache negativo das tentativas anteriores

**Impacto:**
- Usuário não consegue criar atalho manualmente
- Solução parcial: usar outro navegador ou limpar cache

### Service Worker Instável
- Criei service worker
- Chrome detectou mas depois rejeitou
- Nunca se registrou corretamente
- **Impacto:** App não tem cache offline

---

## ✅ O Que FOI Possível Fazer

- ✅ App 100% funcional (todas as features)
- ✅ Integração Dropbox perfeita
- ✅ Deploy automático Vercel
- ✅ Validação de títulos (OMDb + TMDb)
- ✅ Mensagens WhatsApp
- ✅ Documentação completa

---

**Conclusão:** O app funciona perfeitamente via navegador. PWA é apenas conveniência visual - não é crítico.

---

## 📖 Referências Documentação

- `PROCESSO_App_Clube_Cinema_1.txt` - visão geral completa
- `PROCESSO_Producao_Vercel_1.txt` - setup Vercel + troubleshooting
- `README.md` - documentação técnica

---

## 🎯 Próximos Passos (Opcionais)

1. **Paginação:** implementar scroll infinito na planilha
2. **PWA:** resolver instalação no Android (refatorar manifest/SW ou usar Lovable)
3. **Performance:** cache de token em Upstash Redis
4. **Analytics:** integrar Vercel Analytics

---

## 📞 Contato & Links

- **App:** https://clube-cinema-app.vercel.app
- **GitHub:** https://github.com/cezarvargas/clube-cinema-app
- **Vercel:** https://vercel.com/dashboard
- **Dropbox App:** https://www.dropbox.com/developers/apps

---

## 📅 Histórico

- **Julho 2026:** Deploy inicial na Vercel, todas as features funcionando
- **Pendente:** PWA no Android (investigação em andamento)

---

**Gerado:** Julho 2026
**Versão:** 1.0 (Produção)
