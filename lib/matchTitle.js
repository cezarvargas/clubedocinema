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
const { tmdbLookup } = require('./tmdb');

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

module.exports = { matchTitle };
