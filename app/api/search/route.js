// app/api/search/route.js - Busca SIMPLES de filmes no TMDb
import { tmdbSearch, getImdbId } from '../../../lib/tmdb';

export async function POST(request) {
  try {
    const { nome, tipo } = await request.json();

    if (!nome || !tipo) {
      return Response.json({ error: 'nome e tipo obrigatórios' }, { status: 400 });
    }

    const tmdbKey = process.env.TMDB_API_KEY;
    if (!tmdbKey) {
      return Response.json({ error: 'TMDB_API_KEY não configurada' }, { status: 500 });
    }

    // Busca no TMDb
    const resultado = await tmdbSearch({ nome, tipo, apiKey: tmdbKey });

    if (!resultado) {
      return Response.json({ encontrado: false });
    }

    // Pega IMDb ID
    const imdbId = await getImdbId({ tmdbId: resultado.tmdbId, tipo, apiKey: tmdbKey });

    return Response.json({
      encontrado: true,
      filme: {
        titulo: resultado.title,
        ano: resultado.year,
        imdbId: imdbId,
      },
    });

  } catch (err) {
    console.error('search error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
