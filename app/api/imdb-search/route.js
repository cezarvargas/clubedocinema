import { getKeys } from '../../../lib/withSheet';
import { tmdbSearch, tmdbExternalIds } from '../../../lib/tmdb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, ano, tipo } = body;

    if (!nome || !tipo || !ano) {
      return Response.json({ error: 'Campos obrigatórios: nome, tipo, ano.' }, { status: 400 });
    }

    const { tmdbKey } = getKeys();
    const candidates = await tmdbSearch({ nome, tipo, apiKey: tmdbKey });

    if (candidates.length === 0) {
      return Response.json({ matches: [] });
    }

    // Filtra por ano (máximo 2 anos de diferença)
    const filtered = candidates
      .filter(c => Math.abs(parseInt(c.year, 10) - ano) <= 2)
      .slice(0, 5);

    // Busca IMDb ID pra cada candidato
    const matches = [];
    for (const c of filtered) {
      const imdbId = await tmdbExternalIds({ tmdbId: c.tmdbId, tipo, apiKey: tmdbKey });
      if (imdbId) {
        matches.push({
          imdbId,
          nome: c.title,
          ano: c.year,
          tipo,
        });
      }
    }

    return Response.json({ matches });
  } catch (err) {
    console.error('imdb-search error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
