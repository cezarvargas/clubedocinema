// lib/omdb.js
// Usa o fetch nativo do Node (18+) — não precisa mais de node-fetch.

const OMDB_BASE = 'http://www.omdbapi.com/';

/** F/FD -> movie ; S/MS -> series (OMDb/TMDb não distinguem documentário/minissérie) */
function toOmdbType(tipo) {
  const t = tipo.trim().toUpperCase();
  if (t === 'F' || t === 'FD') return 'movie';
  if (t === 'S' || t === 'MS') return 'series';
  throw new Error(`Tipo desconhecido: ${tipo}`);
}

/**
 * Busca exata por título+ano+tipo no OMDb.
 * Retorna null se não encontrar (nunca lança erro por "não achou").
 */
async function omdbLookup({ nome, ano, tipo, apiKey }) {
  const type = toOmdbType(tipo);
  const url = `${OMDB_BASE}?apikey=${apiKey}&t=${encodeURIComponent(nome)}&y=${encodeURIComponent(ano)}&type=${type}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.Response === 'False') return null;
  return {
    imdbId: data.imdbID,
    nome: data.Title,
    ano: parseInt(data.Year, 10) || ano,
    tipo, // mantém o tipo original (F/FD/S/MS) — OMDb só confirma "existe", não distingue FD/MS
    imdbRating: parseFloat(data.imdbRating) || null,
  };
}

module.exports = { omdbLookup, toOmdbType };
