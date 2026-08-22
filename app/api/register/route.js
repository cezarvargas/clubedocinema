import { loadFromDropbox, saveToDropbox, getKeys } from '../../../lib/withSheet';
import { registerAction } from '../../../lib/actions';

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, tipo, ano, ondeVer, pessoa, nota, imdbId, imdbRating } = body;
    if (!nome || !tipo || !ano || !pessoa || nota == null) {
      return Response.json({ error: 'Campos obrigatórios: nome, tipo, ano, pessoa, nota.' }, { status: 400 });
    }

    const { omdbKey, tmdbKey } = getKeys();
    const sheet = await loadFromDropbox();
    const validImdbId = /^tt\d+$/.test(imdbId || '') ? imdbId : null;
    const parsedRating = Number(imdbRating);
    const verifiedMatch = validImdbId ? {
      imdbId: validImdbId,
      imdbRating: Number.isFinite(parsedRating) && parsedRating >= 0 && parsedRating <= 10 ? parsedRating : null,
      nome,
      tipo,
      ano,
    } : null;
    const result = await registerAction(sheet, {
      nome, tipo, ano, ondeVer, pessoa, nota, omdbKey, tmdbKey, verifiedMatch,
    });

    if (result.error === 'duplicate') {
      return Response.json(result, { status: 409 }); // 409 Conflict
    }

    if (result.error === 'precisa_sugerir') {
      return Response.json(result, { status: 200 }); // Retorna sugestões sem salvar
    }

    await saveToDropbox(sheet);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
