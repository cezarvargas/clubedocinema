import { getKeys } from '../../../lib/withSheet';
import { matchTitle } from '../../../lib/matchTitle';

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, tipo, ano } = body;
    if (!nome || !tipo || !ano) {
      return Response.json({ error: 'Campos obrigatórios: nome, tipo, ano.' }, { status: 400 });
    }

    const { omdbKey, tmdbKey } = getKeys();
    const matched = await matchTitle({ nome, ano, tipo, omdbKey, tmdbKey });

    return Response.json({
      found: !!matched,
      filme: matched ? {
        nome: matched.nome,
        tipo,
        ano: matched.ano,
        imdbId: matched.imdbId,
        imdbRating: matched.imdbRating,
      } : null,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
