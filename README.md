# App do Clube do Cinema

Um app web para substituir o fluxo manual de avaliações de filmes e séries do clube. Automatiza cadastro, validação e compartilhamento no WhatsApp.

## 🚀 Status: ✅ Em Produção (Vercel)

**Acesse agora:** https://clube-cinema-app.vercel.app

## 🎯 O que faz

- **Login dinâmico:** lista de pessoas lida direto da planilha
- **Cadastro de filme/série:** valida título contra IMDb (OMDb) e TMDb
- **Avaliação:** registra nota de qualquer pessoa em qualquer título
- **Compartilhamento:** gera mensagem formatada pro WhatsApp com um clique
- **Planilha navegável:** busca, filtro por tipo (filme/série), ordenação
- **Últimos lançamentos:** mostra as 10 notas mais recentes com timestamps
- **Aba Log:** automaticamente criada na planilha, nunca perde histórico

## 🔧 Rodar Localmente

```bash
npm install
cp .env.local.example .env.local
# Editar .env.local com suas chaves de API
npm run dev
```

Acesse: `http://localhost:3000`

## 📋 Variáveis de Ambiente

**Obrigatórias em `.env.local` (local) e Settings → Environment Variables (Vercel):**

```
OMDB_API_KEY=sua_chave
TMDB_API_KEY=sua_chave
DROPBOX_APP_KEY=ym36yayzcaneiqk
DROPBOX_APP_SECRET=hz344iow0uijox8
DROPBOX_REFRESH_TOKEN=seu_token_permanente
```

**Gerar novo refresh token (Windows):**
```bash
dropbox-auth.bat
```

## 📁 Estrutura

```
clube-cinema-app/
├── app/
│   ├── page.js              (todas as telas: login, home, busca, etc)
│   ├── layout.js
│   ├── globals.css          (tema escuro, dourado/bordô, responsivo)
│   └── api/
│       ├── people/route.js      (GET: lista de nomes)
│       ├── search/route.js      (GET: busca título existente)
│       ├── sheet/route.js       (GET: planilha completa)
│       ├── recent/route.js      (GET: últimos lançamentos)
│       ├── register/route.js    (POST: novo filme/série)
│       └── rate/route.js        (POST: avaliar existente)
├── lib/
│   ├── sheet.js             (ler/escrever Excel + aba Log)
│   ├── actions.js           (lógica: busca, cadastro, avaliação)
│   ├── whatsappMessage.js   (formata mensagem WhatsApp)
│   ├── omdb.js              (API do OMDb)
│   ├── tmdb.js              (API do TMDb)
│   ├── matchTitle.js        (valida e corrige título)
│   ├── dropboxClient.js     (comunica com Dropbox via API HTTP)
│   └── withSheet.js         (conecta lógica ao Dropbox)
├── package.json
├── .env.local               (não commitar!)
└── README.md                (este arquivo)
```

## 🔑 Como Funciona

**Validação:** OMDb (exato) → TMDb (tolera erro) → sem confirmação  
**Nunca bloqueia:** salva mesmo sem validação IMDb  
**Correção automática:** se TMDb encontra título diferente, corrige e avisa  
**Dados:** planilha Excel via Dropbox (acesso leitura/escrita)

## 🐛 Bugs Corrigidos

✅ Número desatualizado em operações sequenciais  
✅ Referência de célula-âncora apontava coluna errada  
✅ Hiperlinks retornavam [object Object]  
✅ TMDb exigia bater ano mesmo em resultado único  
✅ "Corrigido de" aparecia sem haver correção

## 📝 Próximos Passos (Opcional)

- Paginação/scroll infinito na planilha (hoje carrega todos os 2000+)
- Cache de token em Upstash Redis (melhoria de performance)

## 🌐 Deploy Automático

Toda mudança é automatizada:

```bash
git add .
git commit -m "sua mensagem"
git push
# → Vercel detecta e faz deploy automaticamente
```

## 👥 Membros do Clube

Login dinâmico (linha 1 da planilha):  
Carmen, Cezar, Chris, Cris, Eliane, Fernando Vera, Helena, Ivanete, João, M.Inês, Tereza, Zaninha

---

**Stack:** Next.js 16 + React 19 + ExcelJS + Dropbox API  
**Hospedagem:** Vercel  
**Status:** ✅ Operacional  
**Última atualização:** Julho 2026
