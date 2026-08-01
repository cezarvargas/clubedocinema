// lib/tmdb.js
// Busca TMDb com título, valida similaridade do nome. Se não encontrar, fallback para OMDb.

const TMDB_BASE = 'https://api.themoviedb.org/3';
const { omdbLookup } = require('./omdb');

function isMovie(tipo) {
  const t = tipo.trim().toUpperCase();
  return t === 'F' || t === 'FD';
}

/** Verifica se dois strings são exatamente iguais (ignora case) */
function isExactMatch(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  return s1 === s2;
}

async function tmdbSearch({ nome, tipo, apiKey, ano }) {
  console.log(`[tmdbSearch] Iniciando - nome="${nome}", tipo="${tipo}", ano="${ano}"`);
  const movie = isMovie(tipo);
  console.log(`[tmdbSearch] isMovie(${tipo}) = ${movie}, endpoint: ${movie ? 'search/movie' : 'search/tv'}`);
  const endpoint = movie ? 'search/movie' : 'search/tv';
  // Para filmes usa primary_release_year, para séries usa first_air_date_year
  const yearParam = ano ? (movie ? `&primary_release_year=${ano}` : `&first_air_date_year=${ano}`) : '';
  const url = `${TMDB_BASE}/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(nome)}&language=pt-BR${yearParam}`;
  console.log(`[tmdbSearch] URL: ${url}`);

  const res = await fetch(url);
  const data = await res.json();
  const results = data.results || [];
  console.log(`[tmdbSearch] Encontrados ${results.length} resultados`);

  if (results.length === 0) return null;

  // Filtra resultados por nome EXATAMENTE IGUAL e pega até 3
  const candidatos = [];
  for (const filme of results) {
    if (candidatos.length >= 3) break; // Máximo 3 resultados

    const filmeTitle = movie ? filme.title : filme.name;
    const filmeYear = (movie ? filme.release_date : filme.first_air_date || '').slice(0, 4);
    const isExact = isExactMatch(nome, filmeTitle);

    console.log(`[tmdbSearch] Verificando: "${filmeTitle}" (${filme.id}, ${filmeYear}) - Match: ${isExact ? '✅' : '❌'}`);

    if (isExact) {
      candidatos.push({
        tmdbId: filme.id,
        title: filmeTitle,
        year: filmeYear || null,
      });
      console.log(`[tmdbSearch] ✅ Aceito: "${filmeTitle}"`);
    }
  }

  console.log(`[tmdbSearch] Total de candidatos: ${candidatos.length}`);
  return candidatos.length > 0 ? candidatos : null;
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

async function tmdbLookup({ nome, tipo, apiKey, ano, omdbKey }) {
  console.log(`\n[tmdbLookup] ===== INICIANDO =====`);
  console.log(`[tmdbLookup] Parâmetros: nome="${nome}", tipo="${tipo}", ano="${ano}", apiKey="${apiKey ? 'OK' : 'UNDEFINED'}"`);

  // Tenta TMDb primeiro
  const filmes = await tmdbSearch({ nome, tipo, apiKey, ano });
  console.log(`[tmdbLookup] tmdbSearch retornou:`, filmes);

  if (filmes && Array.isArray(filmes) && filmes.length > 0) {
    // Se encontrou múltiplos candidatos, busca IMDb ID pra cada um
    const withImdb = [];
    for (const filme of filmes) {
      const imdbId = await tmdbExternalIds({ tmdbId: filme.tmdbId, tipo, apiKey });
      if (imdbId) {
        withImdb.push({
          imdbId,
          nome: filme.title,
          ano: filme.year,
          tipo,
        });
      }
    }

    if (withImdb.length === 1) {
      // Se apenas 1 resultado válido, busca a nota do IMDb via OMDb
      console.log(`[tmdbLookup] ✅ Encontrado 1 resultado no TMDb`);
      const result = withImdb[0];

      // Busca a nota do IMDb usando o imdbId
      if (omdbKey) {
        const omdbData = await omdbLookup({ nome: result.nome, ano: result.ano, tipo: result.tipo, apiKey: omdbKey });
        if (omdbData) {
          result.imdbRating = omdbData.imdbRating;
          console.log(`[tmdbLookup] Nota do IMDb: ${result.imdbRating}`);
        }
      }
      return result;
    } else if (withImdb.length > 1) {
      // Se múltiplos resultados, busca nota pra cada um e retorna array
      console.log(`[tmdbLookup] ℹ️  Encontrados ${withImdb.length} resultados no TMDb`);

      if (omdbKey) {
        for (const result of withImdb) {
          const omdbData = await omdbLookup({ nome: result.nome, ano: result.ano, tipo: result.tipo, apiKey: omdbKey });
          if (omdbData) {
            result.imdbRating = omdbData.imdbRating;
          }
        }
      }
      return withImdb;
    }
  }

  // Fallback para OMDb se TMDb não encontrou
  console.log(`[tmdbLookup] ⚠️  TMDb não encontrou, tentando OMDb...`);
  if (!omdbKey) {
    console.log(`[tmdbLookup] ❌ omdbKey não fornecida, abortando`);
    return null;
  }

  const omdbResult = await omdbLookup({ nome, ano, tipo, apiKey: omdbKey });
  console.log(`[tmdbLookup] omdbLookup retornou:`, omdbResult);
  if (omdbResult) {
    console.log(`[tmdbLookup] ✅ Encontrado no OMDb (fallback)`);
    return omdbResult;
  }

  console.log(`[tmdbLookup] ❌ Não encontrado em TMDb nem OMDb`);
  return null;
}

module.exports = { tmdbSearch, tmdbExternalIds, tmdbLookup, isMovie };
