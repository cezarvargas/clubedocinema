# Documentação - Clube do Cinema App

## 📋 Visão Geral

Aplicação web para gerenciar avaliações de filmes e séries do Clube do Cinema. Permite buscar títulos por IMDb, registrar avaliações, visualizar a planilha compartilhada e compartilhar filmes no WhatsApp.

**Stack:** Next.js 16 + React 19 + ExcelJS + Dropbox API  
**Site em Produção:** https://clubedocinema.vercel.app

---

## 🌐 Fluxo de Desenvolvimento e Deploy

### Workflow Correto

Todo desenvolvimento deve seguir este fluxo:

```
1. Modificações no Localhost
   ↓
2. Testes Locais (npm run dev)
   ↓
3. Git Commit + Push
   ↓
4. Vercel Deploy (automático)
   ↓
5. Produção Online
```

### 1️⃣ Desenvolvendo Localmente

```bash
# Iniciando o servidor local
npm run dev
```

Acessa em `http://localhost:3000` e faz as alterações no código.

**Sempre teste tudo localmente antes de fazer push:**
- Navegue por todas as telas
- Teste validações
- Verifique se não há erros no console
- Confirme que a planilha Dropbox está sincronizando

### 2️⃣ Commit e Push para GitHub

Depois que tudo está funcionando localmente:

```bash
# Ver o status das alterações
git status

# Adicionar todas as mudanças
git add .

# Criar commit com mensagem descritiva
git commit -m "Descrição clara da mudança"

# Enviar para o GitHub
git push origin main
```

**Exemplo de boas mensagens de commit:**
- ✅ `git commit -m "Adicionar validação de título no cadastro"`
- ✅ `git commit -m "Corrigir erro ao filtrar filmes por tipo"`
- ❌ `git commit -m "update"`

### 3️⃣ Deploy Automático no Vercel

Uma vez que você faz `git push`, o Vercel detecta automaticamente:

1. **Webhook do GitHub** → Vercel é notificado
2. **Build** → Vercel roda `npm run build`
3. **Preview** → Testa se tudo compila corretamente
4. **Deploy** → Se bem-sucedido, sobe pra produção
5. **Produção Online** → Site atualizado em https://clubedocinema.vercel.app

**Monitorar o deploy:**
- Acessa https://vercel.com/cezarvargas-1188s-projects/clubedocinema/deployments
- Vê lista de deploys recentes
- Clica em um deploy pra ver logs de build
- Status verde ✅ = sucesso
- Status vermelho ❌ = erro (verifique os logs)

### ⚠️ Boas Práticas

**NÃO faça:**
- ❌ Editar código direto no Vercel (não é possível)
- ❌ Fazer push sem testar localmente
- ❌ Commitar com `.env.local` (adicione ao `.gitignore`)
- ❌ Ignorar erros de build no console local

**SEMPRE faça:**
- ✅ Testar em localhost antes de push
- ✅ Usar mensagens de commit claras
- ✅ Verificar logs do Vercel após deploy
- ✅ Manter `.env.local` atualizado com credenciais corretas
- ✅ Sincronizar com `git pull` antes de começar a trabalhar

### Variáveis de Ambiente

**Localmente** (arquivo `.env.local`):
```
OMDB_API_KEY=...
TMDB_API_KEY=...
DROPBOX_APP_KEY=ym36yayzcaneiqk
DROPBOX_APP_SECRET=hz344iow0uijox8
DROPBOX_REFRESH_TOKEN=...
```

**No Vercel** (Settings → Environment Variables):
- As variáveis já estão configuradas automaticamente
- Se precisar atualizar uma credencial, edite em Settings → Environment Variables
- As mudanças entram em efeito no próximo deploy

### Troubleshooting de Deploy

| Problema | Solução |
|----------|---------|
| Build falha no Vercel mas funciona no localhost | Verificar se `.env.local` está em `.gitignore` e se variáveis estão em Vercel Settings |
| Alterações não aparecem no site | Esperar 1-2 minutos pra o deploy terminar; fazer refresh (Ctrl+F5) ou limpar cache (Ctrl+Shift+Delete) |
| Erro "Module not found" no Vercel | Verificar imports de módulos; alguns podem funcionar localmente mas falhar no build |
| Site antigo ainda aparecendo | Limpar cache do navegador: Ctrl+Shift+Delete |

---

**Versão Atual:** Next.js 16.2.12 + React 19  
**Última Atualização:** Agosto 2026  
**Status:** ✅ Online e operacional
