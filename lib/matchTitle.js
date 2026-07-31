// lib/matchTitle.js
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
