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
 * Busca no TMDb - SIMPLES e CONFIÁVEL:
 *
 * Estratégia: Confiar no TMDb (como funciona no script Python)
 * 1) Se usuário digitou ano → filtra por ano (±2 anos)
 * 2) Pega o PRIMEIRO resultado mais relevante (TMDb já ordena por relevância)
 * 3) Se não digitou ano → pega primeiro resultado direto
 *
 * Razão: TMDb retorna resultados já ordenados por relevância.
 * Validações muito rigorosas (como similarity) rejeitam filmes que EXISTEM.
 */
async function tmdbLookup({ nome, ano, tipo, apiKey }) {
  const candidates = await tmdbSearch({ nome, tipo, apiKey });
  if (candidates.length === 0) return null;

  let chosen;

  // Se o usuário digitou ano, tenta encontrar por ano
  if (ano) {
    const anoNum = parseInt(ano, 10);
    const byYear = candidates.filter(c => {
      const chosenYear = parseInt(c.year, 10);
      return Math.abs(anoNum - chosenYear) <= 2; // ±2 anos
    });

    if (byYear.length > 0) {
      chosen = byYear[0]; // Pega o primeiro que bate no ano
    } else {
      chosen = candidates[0]; // Se não achou por ano, pega o primeiro mesmo assim
    }
  } else {
    // Se não digitou ano, pega o primeiro resultado (TMDb já ordena por relevância)
    chosen = candidates[0];
  }

  // Busca o IMDb ID
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
