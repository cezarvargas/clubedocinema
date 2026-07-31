// lib/matchTitle.js
// Valida um título contra TMDb.
// Retorna:
//   null                                      -> não encontrado
//   { imdbId, nome, ano, tipo }  -> encontrado

const { tmdbLookup } = require('./tmdb');

async function matchTitle({ nome, ano, tipo, tmdbKey }) {
  const tmdbResult = await tmdbLookup({ nome, tipo, apiKey: tmdbKey, ano });
  return tmdbResult || null;
}

module.exports = { matchTitle };
