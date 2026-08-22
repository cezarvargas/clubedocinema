// lib/matchTitle.js
// Orquestra a validação de um título (novo cadastro OU retry num título pendente):
//   1) OMDb primeiro (busca exata, nome+ano+tipo)
//   2) TMDb como fallback para descoberta de traduções e aliases
//   3) Se nada bater -> não confirmado (null) — nunca chuta.
//
// Retorna:
//   null                                                -> não confirmado
//   { imdbId, imdbRating, nome, ano, tipo, correctedFrom? } -> confirmado

const { omdbLookup, omdbLookupById } = require('./omdb');
const { tmdbLookup, tmdbSearch, tmdbExternalIds } = require('./tmdb');

async function matchTitle({ nome, ano, tipo, omdbKey, tmdbKey }) {
  const omdbResult = await omdbLookup({ nome, ano, tipo, apiKey: omdbKey });
  if (omdbResult) {
    return { ...omdbResult, tipo };
  }

  const tmdbResult = await tmdbLookup({ nome, ano, tipo, apiKey: tmdbKey, omdbKey });
  if (tmdbResult) {
    // TMDb encontrou, mas não tem rating. Busca no OMDb pelo imdbId
    const byId = await omdbLookupById({ imdbId: tmdbResult.imdbId, apiKey: omdbKey });
    if (!byId) return null;
    return {
      imdbId: tmdbResult.imdbId,
      imdbRating: byId.imdbRating,
      nome: byId.nome,
      ano: byId.ano,
      tipo: tmdbResult.tipo,
      correctedFrom: tmdbResult.correctedFrom,
    };
  }

  return null;
}

async function getSuggestions({ nome, ano, tipo, tmdbKey }) {
  const candidates = await tmdbSearch({ nome, tipo, apiKey: tmdbKey });
  if (!candidates || candidates.length === 0) return [];

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
