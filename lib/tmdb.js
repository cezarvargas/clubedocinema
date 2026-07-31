// lib/tmdb.js
// Busca TMDb com título, valida similaridade do nome, retorna IMDb ID

const TMDB_BASE = 'https://api.themoviedb.org/3';

function isMovie(tipo) {
  const t = tipo.trim().toUpperCase();
  return t === 'F' || t === 'FD';
}

/** Calcula similaridade entre dois strings (0-1) */
function similarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;

  // Levenshtein simplificado
  let matches = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) matches++;
    else break;
  }

  const maxLen = Math.max(s1.length, s2.length);
  return matches / maxLen;
}

async function tmdbSearch({ nome, tipo, apiKey, ano }) {
  console.log(`[tmdbSearch] Iniciando - nome="${nome}", tipo="${tipo}", ano="${ano}"`);
  const movie = isMovie(tipo);
  console.log(`[tmdbSearch] isMovie(${tipo}) = ${movie}, endpoint: ${movie ? 'search/movie' : 'search/tv'}`);
  const endpoint = movie ? 'search/movie' : 'search/tv';
  const yearParam = ano ? `&primary_release_year=${ano}` : '';
  const url = `${TMDB_BASE}/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(nome)}&language=pt-BR${yearParam}`;
  console.log(`[tmdbSearch] URL: ${url}`);

  const res = await fetch(url);
  const data = await res.json();
  const results = data.results || [];
  console.log(`[tmdbSearch] Encontrados ${results.length} resultados`);

  if (results.length === 0) return null;

  const filme = results[0];
  const filmeTitle = movie ? filme.title : filme.name;
  console.log(`[tmdbSearch] Primeiro: ${filmeTitle} (${filme.id}, ano: ${(filme.release_date || filme.first_air_date || '').slice(0, 4)})`);

  // Valida similaridade do nome (mínimo 70%)
  const sim = similarity(nome, filmeTitle);
  console.log(`[tmdbSearch] Similaridade: "${nome}" vs "${filmeTitle}" = ${(sim * 100).toFixed(1)}%`);
  if (sim < 0.7) {
    console.log(`[tmdbSearch] ❌ Nome muito diferente, rejeitando`);
    return null;
  }

  return {
    tmdbId: filme.id,
    title: filmeTitle,
    year: (movie ? filme.release_date : filme.first_air_date || '').slice(0, 4) || null,
  };
}

async function tmdbExternalIds({ tmdbId, tipo, apiKey }) {
  const movie = isMovie(tipo);
  const endpoint = movie ? 'movie' : 'tv';
  const url = `${TMDB_BASE}/${endpoint}/${tmdbId}/external_ids?api_key=${apiKey}`;
  console.log(`[tmdbExternalIds] URL: ${url}`);

  const res = await fetch(url);
  const data = await res.json();
  console.log(`[tmdbExternalIds] Dados:`, data);

  const imdbId = data.imdb_id || null;
  console.log(`[tmdbExternalIds] IMDb ID: ${imdbId}`);
  return imdbId;
}

async function tmdbLookup({ nome, tipo, apiKey, ano }) {
  console.log(`\n[tmdbLookup] ===== INICIANDO =====`);
  console.log(`[tmdbLookup] Parâmetros: nome="${nome}", tipo="${tipo}", ano="${ano}", apiKey="${apiKey ? 'OK' : 'UNDEFINED'}"`);

  const filme = await tmdbSearch({ nome, tipo, apiKey, ano });
  console.log(`[tmdbLookup] tmdbSearch retornou:`, filme);
  if (!filme) {
    console.log(`[tmdbLookup] ❌ tmdbSearch retornou null, abortando`);
    return null;
  }

  const imdbId = await tmdbExternalIds({ tmdbId: filme.tmdbId, tipo, apiKey });
  console.log(`[tmdbLookup] tmdbExternalIds retornou:`, imdbId);
  if (!imdbId) {
    console.log(`[tmdbLookup] ❌ tmdbExternalIds retornou null, abortando`);
    return null;
  }

  console.log(`[tmdbLookup] ✅ Resultado final:`, { imdbId, nome: filme.title, ano: filme.year, tipo });
  return {
    imdbId,
    nome: filme.title,
    ano: filme.year,
    tipo,
  };
}

module.exports = { tmdbSearch, tmdbExternalIds, tmdbLookup, isMovie };
