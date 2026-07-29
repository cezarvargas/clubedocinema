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

/** Calcula similaridade entre dois nomes (0-1) usando Levenshtein simplificado */
function nameSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;

  // Conta caracteres iguais no início
  let matches = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) matches++;
    else break;
  }

  // Similaridade baseada em comprimento e prefixo comum
  const maxLen = Math.max(s1.length, s2.length);
  const prefixScore = matches / maxLen;
  const lenScore = Math.min(s1.length, s2.length) / maxLen;

  return (prefixScore + lenScore) / 2;
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
 * Busca no TMDb com validações de similaridade:
 *  - Nome deve ser similar (mínimo 60%)
 *  - Ano no máximo 2 anos de diferença (se digitou ano)
 *  - Um ÚNICO resultado -> valida similaridade e ano
 *  - Múltiplos resultados -> só usa se EXATAMENTE UM bater com ano exato + nome similar
 */
async function tmdbLookup({ nome, ano, tipo, apiKey }) {
  const candidates = await tmdbSearch({ nome, tipo, apiKey });
  if (candidates.length === 0) return null;

  // Filtra por similaridade de nome (mínimo 60%)
  // Compara tanto com título português (title) quanto com título original (originalTitle)
  const minSimilarity = 0.6;
  const similarCandidates = candidates.filter(c => {
    const simTitle = nameSimilarity(nome, c.title);
    const simOriginal = nameSimilarity(nome, c.originalTitle);
    return Math.max(simTitle, simOriginal) >= minSimilarity;
  });
  if (similarCandidates.length === 0) return null;

  let chosen;
  if (similarCandidates.length === 1) {
    chosen = similarCandidates[0];
  } else {
    // Múltiplos: filtra por ano exato
    const matchingYear = similarCandidates.filter(c => String(c.year) === String(ano));
    if (matchingYear.length === 1) {
      chosen = matchingYear[0];
    } else {
      return null; // ambíguo, não arrisca
    }
  }

  // Valida diferença de ano (máximo 2 anos)
  if (ano) {
    const anoNum = parseInt(ano, 10);
    const chosenYear = parseInt(chosen.year, 10);
    if (Math.abs(anoNum - chosenYear) > 2) return null;
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
