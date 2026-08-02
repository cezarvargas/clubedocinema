import { getKeys } from '../../../lib/withSheet';
import { loadFromDropbox } from '../../../lib/withSheet';
import { omdbLookup } from '../../../lib/omdb';
import { findDuplicate } from '../../../lib/sheet';

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, ano, tipo } = body;

    if (!nome || !tipo || !ano) {
      return Response.json({ error: 'Campos obrigatórios: nome, tipo, ano.' }, { status: 400 });
    }

    const { omdbKey } = getKeys();

    // Busca no IMDb (OMDb) - retorna 1 resultado exato ou nulo
    const found = await omdbLookup({ nome, ano, tipo, apiKey: omdbKey });

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
