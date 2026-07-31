// lib/tmdb.js - Busca SIMPLES no TMDb (confia no primeiro resultado)

const TMDB_BASE = 'https://api.themoviedb.org/3';

async function tmdbSearch({ nome, tipo, apiKey }) {
  const movie = tipo.toUpperCase() === 'F' || tipo.toUpperCase() === 'FD';
  const endpoint = movie ? 'search/movie' : 'search/tv';

  const url = `${TMDB_BASE}/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(nome)}&language=pt-BR`;

  const res = await fetch(url);
  const data = await res.json();
  const results = data.results || [];

  if (results.length === 0) return null;

  const primeiro = results[0];
  return {
    tmdbId: primeiro.id,
    title: movie ? primeiro.title : primeiro.name,
    year: (movie ? primeiro.release_date : primeiro.first_air_date || '').slice(0, 4) || null,
  };
}

async function getImdbId({ tmdbId, tipo, apiKey }) {
  const movie = tipo.toUpperCase() === 'F' || tipo.toUpperCase() === 'FD';
  const endpoint = movie ? 'movie' : 'tv';

  const url = `${TMDB_BASE}/${endpoint}/${tmdbId}/external_ids?api_key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  return data.imdb_id || null;
}

module.exports = { tmdbSearch, getImdbId };
