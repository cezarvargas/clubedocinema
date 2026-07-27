// lib/tmdb.js
// Usa o fetch nativo do Node (18+) — não precisa mais de node-fetch.

const TMDB_BASE = 'https://api.themoviedb.org/3';

/** F/FD -> /search/movie ; S/MS -> /search/tv */
function isMovie(tipo) {
  const t = tipo.trim().toUpperCase();
  if (t === 'F' || t === 'FD') return true;
  if (t === 'S' || t === 'MS') return false;
  throw new Error(`Tipo desconhecido: ${tipo}`);
}

async function tmdbSearch({ nome, tipo, apiKey }) {
  const movie = isMovie(tipo);
  const endpoint = movie ? 'search/movie' : 'search/tv';
  const url = `${TMDB_BASE}/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(nome)}&language=pt-BR`;
  const res = await fetch(url);
  const data = await res.json();
  const results = data.results || [];
  return results.map(r => ({
    tmdbId: r.id,
    title: movie ? r.title : r.name,
    originalTitle: movie ? r.original_title : r.original_name,
    year: (movie ? r.release_date : r.first_air_date || '').slice(0, 4) || null,
  }));
}

async function tmdbExternalIds({ tmdbId, tipo, apiKey }) {
  const movie = isMovie(tipo);
  const endpoint = movie ? 'movie' : 'tv';
  const url = `${TMDB_BASE}/${endpoint}/${tmdbId}/external_ids?api_key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.imdb_id || null;
}

/**
 * Busca no TMDb com a regra de segurança "nunca chutar entre homônimos":
 *  - Um ÚNICO resultado no total -> usa, mesmo que o ano digitado esteja
 *    errado (é exatamente o caso "Duna Parte 2"/2023 -> "Duna: Parte Dois"/2024,
 *    testado ao vivo com a API real durante o projeto).
 *  - Múltiplos resultados -> só usa se EXATAMENTE UM bater com o ano digitado;
 *    senão (nenhum ou mais de um) não arrisca.
 */
async function tmdbLookup({ nome, ano, tipo, apiKey }) {
  const candidates = await tmdbSearch({ nome, tipo, apiKey });
  if (candidates.length === 0) return null;

  let chosen;
  if (candidates.length === 1) {
    chosen = candidates[0];
  } else {
    const matchingYear = candidates.filter(c => String(c.year) === String(ano));
    if (matchingYear.length !== 1) return null; // ambíguo, não arrisca
    chosen = matchingYear[0];
  }

  const imdbId = await tmdbExternalIds({ tmdbId: chosen.tmdbId, tipo, apiKey });
  if (!imdbId) return null;

  return {
    imdbId,
    nome: chosen.title,
    ano: chosen.year,
    tipo,
    correctedFrom: (chosen.title !== nome || chosen.year !== ano) ? { nome, ano } : null,
  };
}

module.exports = { tmdbSearch, tmdbExternalIds, tmdbLookup, isMovie };
