# Clube do Cinema — App

## Estado atual (terceira etapa — telas de verdade)

Agora sim: **as telas reais estão implementadas** (`app/page.js`), conectadas
às rotas de API, com a mesma identidade visual do mockup validado
(`app/globals.css`, extraído direto do protótipo). Diferença importante:
o mockup simulava uma "tela de celular" de tamanho fixo; o app de verdade
é responsivo — ocupa a tela toda no celular, e fica numa coluna central
confortável em telas maiores.

Fluxo completo implementado: login (nomes lidos da planilha) → home (com
"Últimos lançamentos" e link pro IMDb) → busca → avaliar existente OU
cadastrar novo (com os 3 cenários: confirmado / corrigido via TMDb / não
confirmado) → tela de confirmação com botão de compartilhar no WhatsApp
(`wa.me`) → planilha completa navegável, com busca/filtro/ordenação.

### Nova peça: aba "Log" na planilha
A planilha original não tem nenhuma coluna de data/hora, então não havia
como saber quais foram as "últimas" notas dadas. Resolvido com uma aba
nova, **"Log"**, criada automaticamente pelo app na primeira vez que
rodar (não precisa fazer nada manual) — cada cadastro/avaliação grava
uma linha lá (data/hora, pessoa, número, título, nota, status), e a tela
inicial lê as últimas 10 dali. Isso não mexe em nada da aba "Clube
cinema" que você já usa.

### Bugs encontrados e corrigidos ao longo do processo
Testei cada peça antes de entregar (com planilha simulada e, mais tarde,
com a planilha real via Dropbox). Bugs reais encontrados e já corrigidos:
- Cálculo do próximo Número ficava desatualizado entre duas operações seguidas
- Referência da célula-âncora da Média Ponderada apontava pra coluna errada
- SDK do Dropbox quebrava dentro do Next.js (`this.fetch is not a function`)
  — resolvido falando direto com a API HTTP do Dropbox, sem o SDK
- Títulos que já tinham link do IMDb apareciam como "[object Object]"
  (célula com hyperlink tem formato diferente de célula com texto puro)
- Regra do TMDb exigia bater o ano, o que quebraria justamente o caso
  "Duna Parte 2"/2023 → "Duna: Parte Dois"/2024 (ano também errado, mas
  resultado único) — corrigido para confiar em resultado único mesmo com
  ano diferente

## O que ainda falta / limitações conhecidas

1. **Paginação da planilha completa**: `/api/sheet` hoje devolve TODOS os
   títulos que baterem o filtro de uma vez (pode ser 2000+). Funciona,
   mas não é o ideal em conexão lenta — ainda não implementei carregar
   aos poucos (scroll infinito), que tínhamos discutido lá atrás.
2. **Refresh token do Dropbox** (permanente) — ainda usando o de curta
   duração pros testes.
3. **Publicar na Vercel** — ainda rodando só localmente (`npm run dev`).
4. As telas ainda não foram testadas rodando de verdade no navegador
   (só validei a sintaxe do JSX com o mesmo motor que o Next.js usa por
   baixo — `esbuild` —, mas não rodei o `next dev` com essas telas ainda).

## Como rodar

```
npm install
npm run dev
```
Depois acesse `http://localhost:3000` — dessa vez deve aparecer o app de
verdade, não mais a página placeholder.

## Estrutura de pastas
```
clube-cinema-app/
├── package.json
├── .env.local.example
├── app/
│   ├── layout.js
│   ├── globals.css            visual extraído do mockup validado
│   ├── page.js                TODAS as telas (componente único)
│   └── api/
│       ├── people/route.js
│       ├── search/route.js
│       ├── sheet/route.js
│       ├── recent/route.js    novo: "Últimos lançamentos"
│       ├── register/route.js
│       └── rate/route.js
└── lib/
    ├── sheet.js                núcleo: ler/escrever a planilha + aba Log
    ├── actions.js               lógica de cada operação (testada)
    ├── whatsappMessage.js        monta a mensagem final
    ├── omdb.js / tmdb.js         APIs externas
    ├── matchTitle.js             junta OMDb + TMDb + regra "nunca chutar"
    ├── withSheet.js              conecta actions.js ao Dropbox
    └── dropboxClient.js          fala direto com a API HTTP do Dropbox
```
