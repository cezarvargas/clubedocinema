# OMDb Fallback - Remoção de Artigos

## 📋 Problema

Quando um usuário digita um título com artigo no início (A, O, The, etc), e no IMDb o título está registrado SEM artigo, a busca exata falha.

**Exemplo:**
- Usuário digita: **"O Candelabro italiano"** (1962, Filme)
- IMDb tem: **"Candelabro Italiano"** (1962, Filme)
- Resultado: ❌ Não encontra

## ✅ Solução Implementada

**Arquivo:** `lib/omdb.js`

### Estratégia: 2 tentativas

```
Tentativa 1: Busca exata
  ├─ Procura: "O Candelabro italiano"
  └─ Se encontrar → Retorna resultado

Se falhar, Tentativa 2: Sem artigos
  ├─ Remove artigos do início (A, O, Um, Uma, The, An)
  ├─ Procura: "Candelabro italiano"
  └─ Se encontrar → Retorna resultado do IMDb
```

### Artigos suportados
- **Português:** A, O, Um, Uma
- **Inglês:** The, A, An

Regex: `^(a|o|um|uma|the|an)\s+`

---

## 🧪 Exemplos de Teste

Quando a app estiver em produção, teste digitando:

| Campo | Valor | Tipo | Ano | Esperado |
|-------|-------|------|-----|----------|
| Título | **O** Candelabro italiano | F | 1962 | Candelabro Italiano |
| Título | Mamma Mia! **O** filme | F | 2008 | Mamma Mia! |
| Título | **O** som da esperança | F | 2023 | Som da Esperança: A História de Possum Trot |
| Título | **Um** Espetáculo de Natal | F | 2023 | I'm Glad It's Christmas |
| Título | Saneamento Básico | F | 1989 | Saneamento Básico, **O** Filme |
| Título | Vítima Número 8 | F | 2023 | La víctima número 8 |

### Como testar

1. **Abra o app:** https://clube-cinema-app.vercel.app
2. **Tela "O que você viu?"**
3. **Digite um dos exemplos acima**
4. **Clique em "Verificar no IMDb"**
5. **Veja se aparece o nome correto do IMDb**

---

## 🔧 Implementação Técnica

### Função: `removeLeadingArticles()`

```javascript
function removeLeadingArticles(title) {
  return (title || '')
    .trim()
    .replace(/^(a|o|um|uma|the|an)\s+/i, '')
    .trim();
}
```

**Exemplo:**
- Input: `"O Candelabro italiano"`
- Output: `"Candelabro italiano"`

### Função: `omdbLookup()`

Agora tenta 2 vezes:

```javascript
async function omdbLookup({ nome, ano, tipo, apiKey }) {
  // Tentativa 1: Exato
  const result1 = await buscarNoOMDb(nome, ano, tipo);
  if (result1) return result1;

  // Tentativa 2: Sem artigos (fallback)
  const nomeSemArtigos = removeLeadingArticles(nome);
  if (nomeSemArtigos !== nome) {
    const result2 = await buscarNoOMDb(nomeSemArtigos, ano, tipo);
    if (result2) return result2;
  }

  return null;
}
```

---

## 📊 Fluxo Visual

```
Usuario digita:
"O Candelabro italiano" (1962, Filme)
        ↓
    OMDb.lookup()
        ↓
    Tentativa 1 (exato)
    ├─ Procura: "O Candelabro italiano"
    ├─ Resultado: NOT FOUND ❌
    ↓
    Tentativa 2 (fallback)
    ├─ Remove artigo: "Candelabro italiano"
    ├─ Procura: "Candelabro italiano"
    ├─ Resultado: FOUND ✅
    ↓
Retorna para o usuário:
✅ "Candelabro Italiano" (IMDb oficial)
```

---

## 🎯 Comportamento Final

### Cenário 1: Título existe com artigo
- Digita: `"O Candelabro italiano"` (1962)
- OMDb encontra: `"Candelabro Italiano"`
- **Resultado:** ✅ Confirmado

### Cenário 2: Título não existe
- Digita: `"Filme Inexistente XYZ"` (1999)
- OMDb não encontra (nem com nem sem artigos)
- **Resultado:** ⚠️ Não confirmado (salva mesmo assim)

### Cenário 3: Título sem artigo (normal)
- Digita: `"Candelabro italiano"` (1962)
- OMDb encontra na primeira tentativa
- **Resultado:** ✅ Confirmado (rápido)

---

## 🚀 Deploy

**Commits prontos:**
- `6e5864a` - Remover TMDb completamente
- `31f5a72` - Artigos removidos na normalização (sheet.js)
- `2b4400a` - **OMDb fallback sem artigos**

**Status:** ⏳ Aguardando push pra GitHub

---

## 📝 Notas

- A função `removeLeadingArticles()` é **específica do OMDb**
- A normalização em `sheet.js` também remove artigos (para comparação de duplicatas)
- Se o título no IMDb começar com um número ou caractere especial, funciona normal
- O fallback **não afeta performance** (só tenta 2x se a primeira falhar)

---

**Data:** Julho 2026  
**Versão:** App v1.1 (OMDb Fallback)
