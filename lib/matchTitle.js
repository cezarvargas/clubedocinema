// lib/matchTitle.js
// Orquestra a validação de um título:
//   1) TMDb primeiro (fuzzy search - tolera erro de digitação)
//   2) Se falhar, tenta OMDb (exato)
//   3) Se nada bater -> não confirmado (null)
//
// Retorna:
//   null                                      -> não encontrado
//   { imdbId, imdbRating, nome, ano, tipo }  -> encontrado

const { omdbLookup, omdbLookupById } = require('./omdb');
const { tmdbLookup } = require('./tmdb');

async function matchTitle({ nome, ano, tipo, omdbKey, tmdbKey }) {
  // Tenta TMDb PRIMEIRO (fuzzy search - mais tolerante)
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

  // Se TMDb falhar, tenta OMDb (exato)
  const omdbResult = await omdbLookup({ nome, ano, tipo, apiKey: omdbKey });
  if (omdbResult) return omdbResult;

  return null;
}

module.exports = { matchTitle };
