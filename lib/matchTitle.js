// lib/matchTitle.js
<<<<<<< HEAD
// Valida um título contra TMDb.
// Retorna:
//   null                                      -> não encontrado
//   { imdbId, nome, ano, tipo }  -> encontrado

const { tmdbLookup } = require('./tmdb');

async function matchTitle({ nome, ano, tipo, tmdbKey, omdbKey }) {
  const result = await tmdbLookup({ nome, tipo, apiKey: tmdbKey, ano, omdbKey });
  return result || null;
}

module.exports = { matchTitle };
=======
// Orquestra a validação de um título (novo cadastro OU retry num título pendente):
//   1) TMDb primeiro (tolera erro leve de digitação/pontuação/ano) — fuzzy search
//   2) OMDb como fallback (busca exata, nome+ano+tipo)
//   3) Se nada bater -> não confirmado (null) — nunca chuta.
//
// Retorna:
//   null                                                -> não confirmado
//   { imdbId, imdbRating, nome, ano, tipo, correctedFrom? } -> confirmado

const { omdbLookup } = require('./omdb');
const { tmdbLookup, tmdbSearch, tmdbExternalIds } = require('./tmdb');

async function matchTitle({ nome, ano, tipo, omdbKey, tmdbKey }) {
  const tmdbResult = await tmdbLookup({ nome, ano, tipo, apiKey: tmdbKey });
  if (tmdbResult) {
    // TMDb encontrou, mas não tem rating. Busca no OMDb pelo imdbId
    const byId = await omdbLookupById(tmdbResult.imdbId, omdbKey);
    return {
      imdbId: tmdbResult.imdbId,
      imdbRating: byId ? byId.imdbRating : null,
      nome: tmdbResult.nome,
      ano: tmdbResult.ano,
      tipo: tmdbResult.tipo,
      correctedFrom: tmdbResult.correctedFrom,
    };
  }

  const omdbResult = await omdbLookup({ nome, ano, tipo, apiKey: omdbKey });
  if (!omdbResult) return null;

  // TMDb não devolve a nota do IMDb — busca de novo no OMDb, agora pelo imdbId exato,
  // só pra completar a nota (busca por ID é sempre exata, sem risco de ambiguidade).
  const byId = await omdbLookupById(tmdbResult.imdbId, omdbKey);

  return {
    imdbId: tmdbResult.imdbId,
    imdbRating: byId ? byId.imdbRating : null,
    nome: tmdbResult.nome,
    ano: tmdbResult.ano,
    tipo: tmdbResult.tipo,
    correctedFrom: tmdbResult.correctedFrom,
  };
}

async function omdbLookupById(imdbId, apiKey) {
  const res = await fetch(`http://www.omdbapi.com/?apikey=${apiKey}&i=${imdbId}`);
  const data = await res.json();
  if (data.Response === 'False') return null;
  return { imdbRating: parseFloat(data.imdbRating) || null };
}

async function getSuggestions({ nome, ano, tipo, tmdbKey }) {
  const candidates = await tmdbSearch({ nome, tipo, apiKey: tmdbKey });
  if (candidates.length === 0) return [];

  // Filtrar por ano (se digitou), depois pegar os primeiros 5 que têm IMDb
  const filtered = ano
    ? candidates.filter(c => String(c.year) === String(ano))
    : candidates;

  const withImdb = [];
  for (const c of (filtered.length > 0 ? filtered : candidates).slice(0, 5)) {
    const imdbId = await tmdbExternalIds({ tmdbId: c.tmdbId, tipo, apiKey: tmdbKey });
    if (imdbId) {
      withImdb.push({
        tmdbId: c.tmdbId,
        imdbId,
        nome: c.title,
        ano: c.year,
        tipo,
      });
    }
  }
  return withImdb;
}

module.exports = { matchTitle, getSuggestions };
>>>>>>> 7db19870b8d151410cf15ad034d7a28d6a1df671
