import { getKeys } from '../../../lib/withSheet';
import { loadFromDropbox } from '../../../lib/withSheet';
import { tmdbLookup } from '../../../lib/tmdb';
import { findDuplicate } from '../../../lib/sheet';

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, ano, tipo } = body;

    if (!nome || !tipo || !ano) {
      return Response.json({ error: 'Campos obrigatórios: nome, tipo, ano.' }, { status: 400 });
    }

    const { tmdbKey } = getKeys();
    console.log(`[imdb-search] tmdbKey extraído:`, tmdbKey ? 'OK' : 'UNDEFINED');

    // Busca no TMDb - retorna 1 resultado exato ou nulo
    const found = await tmdbLookup({ nome, tipo, apiKey: tmdbKey, ano });

    if (!found) {
      return Response.json({ matches: [] });
    }

    // Carrega a planilha pra verificar duplicatas
    const sheet = await loadFromDropbox();
    const existsInClub = findDuplicate(sheet, { nome: found.nome, ano: found.ano, tipo });

    const matches = [{
      imdbId: found.imdbId,
      nome: found.nome,
      ano: found.ano,
      tipo,
      existsInClub: !!existsInClub,
      rowNumber: existsInClub?.rowNumber || null,
    }];

    return Response.json({ matches });
  } catch (err) {
    console.error('imdb-search error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
