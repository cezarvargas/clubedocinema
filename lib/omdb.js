// lib/omdb.js
// Usa o fetch nativo do Node (18+) — não precisa mais de node-fetch.

const OMDB_BASE = 'http://www.omdbapi.com/';

/** F/FD -> movie ; S/MS -> series (OMDb não distinguem documentário de filme, nem minissérie de série) */
function toOmdbType(tipo) {
  const t = tipo.trim().toUpperCase();
  if (t === 'F' || t === 'FD') return 'movie';
  if (t === 'S' || t === 'MS' || t === 'SD' || t === 'MSD') return 'series';
  throw new Error(`Tipo desconhecido: ${tipo}`);
}

/**
 * Remove artigos do início do título (A, O, Um, Uma, The, An)
 */
function removeLeadingArticles(title) {
  return (title || '')
    .trim()
    .replace(/^(a|o|um|uma|the|an)\s+/i, '')
    .trim();
}

/**
 * Busca por IMDb ID direto no OMDb (mais confiável que por nome/ano/tipo).
 * Retorna null se não encontrar.
 */
async function omdbLookupById({ imdbId, apiKey }) {
  const url = `${OMDB_BASE}?apikey=${apiKey}&i=${imdbId}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.Response !== 'False') {
      return {
        imdbId: data.imdbID,
        nome: data.Title,
        ano: parseInt(data.Year, 10),
        tipo: data.Type,
        imdbRating: (data.imdbRating && data.imdbRating !== 'N/A') ? parseFloat(data.imdbRating) : null,
      };
    }
  } catch (err) {
    console.error(`[omdbLookupById] Erro ao buscar ${imdbId}: ${err.message}`);
  }
  return null;
}

/**
 * Busca exata por título+ano+tipo no OMDb.
 * Tenta duas vezes:
 *   1. Com o título como digitado
 *   2. Se falhar, sem artigos do início (fallback)
 * Retorna null se não encontrar (nunca lança erro por "não achou").
 */
async function omdbLookup({ nome, ano, tipo, apiKey }) {
  const type = toOmdbType(tipo);
  try {

    // Primeira tentativa: título exato como digitado
    let url = `${OMDB_BASE}?apikey=${apiKey}&t=${encodeURIComponent(nome)}&y=${encodeURIComponent(ano)}&type=${type}`;
    let res = await fetch(url);
    let data = await res.json();
    if (data.Response !== 'False') {
      return {
        imdbId: data.imdbID,
        nome: data.Title,
        ano: parseInt(data.Year, 10) || ano,
        tipo,
        imdbRating: parseFloat(data.imdbRating) || null,
      };
    }

    // Fallback: sem artigos do início
    const nomeSemArtigos = removeLeadingArticles(nome);
    if (nomeSemArtigos !== nome) {
      url = `${OMDB_BASE}?apikey=${apiKey}&t=${encodeURIComponent(nomeSemArtigos)}&y=${encodeURIComponent(ano)}&type=${type}`;
      res = await fetch(url);
      data = await res.json();
      if (data.Response !== 'False') {
        return {
          imdbId: data.imdbID,
          nome: data.Title,
          ano: parseInt(data.Year, 10) || ano,
          tipo,
          imdbRating: parseFloat(data.imdbRating) || null,
        };
      }
    }
  } catch (err) {
    console.error(`[omdbLookup] Erro ao buscar "${nome}": ${err.message}`);
  }

  return null;
}

module.exports = { omdbLookup, omdbLookupById, toOmdbType };
