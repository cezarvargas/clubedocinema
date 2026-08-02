<<<<<<< HEAD
import { loadFromDropbox } from '../../../lib/withSheet';
import { searchAction } from '../../../lib/actions';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const currentUser = searchParams.get('user') || '';
    if (!currentUser) {
      return Response.json({ error: 'Parâmetro "user" (pessoa logada) é obrigatório.' }, { status: 400 });
    }
    const sheet = await loadFromDropbox();
    return Response.json(searchAction(sheet, { query, currentUser }));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
=======
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
>>>>>>> 7db19870b8d151410cf15ad034d7a28d6a1df671
