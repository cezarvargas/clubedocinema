// lib/matchTitle.js
// Valida um título contra OMDb apenas (IMDb direto).
// Retorna:
//   null                                      -> não encontrado
//   { imdbId, imdbRating, nome, ano, tipo }  -> encontrado

const { omdbLookup } = require('./omdb');

async function matchTitle({ nome, ano, tipo, omdbKey }) {
  const omdbResult = await omdbLookup({ nome, ano, tipo, apiKey: omdbKey });
  return omdbResult || null;
}

module.exports = { matchTitle };
