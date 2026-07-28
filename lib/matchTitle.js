// lib/matchTitle.js
// Orquestra a validação de um título (novo cadastro OU retry num título pendente):
//   1) OMDb exato (nome+ano+tipo)
//   2) TMDb como segunda tentativa (tolera erro leve de digitação/pontuação/ano)
//   3) Se nada bater -> não confirmado (null) — nunca chuta.
//
// Retorna:
//   null                                                -> não confirmado
//   { imdbId, imdbRating, nome, ano, tipo, correctedFrom? } -> confirmado

const { omdbLookup } = require('./omdb');
const { tmdbLookup, tmdbSearch, tmdbExternalIds } = require('./tmdb');

async function matchTitle({ nome, ano, tipo, omdbKey, tmdbKey }) {
  const omdbResult = await omdbLookup({ nome, ano, tipo, apiKey: omdbKey });
  if (omdbResult) return omdbResult;

  const tmdbResult = await tmdbLookup({ nome, ano, tipo, apiKey: tmdbKey });
  if (!tmdbResult) return null;

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
