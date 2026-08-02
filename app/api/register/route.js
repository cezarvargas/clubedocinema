import { loadFromDropbox, saveToDropbox, getKeys } from '../../../lib/withSheet';
import { registerAction } from '../../../lib/actions';

export async function POST(request) {
  try {
    const body = await request.json();
<<<<<<< HEAD
    const { nome, tipo, ano, ondeVer, pessoa, nota } = body;
=======
    const { nome, tipo, ano, ondeVer, pessoa, nota, tmdbId } = body;
>>>>>>> 7db19870b8d151410cf15ad034d7a28d6a1df671
    if (!nome || !tipo || !ano || !pessoa || nota == null) {
      return Response.json({ error: 'Campos obrigatórios: nome, tipo, ano, pessoa, nota.' }, { status: 400 });
    }

<<<<<<< HEAD
    const { tmdbKey, omdbKey } = getKeys();
    const sheet = await loadFromDropbox();
    const result = await registerAction(sheet, { nome, tipo, ano, ondeVer, pessoa, nota, tmdbKey, omdbKey, imdbId: body.imdbId, imdbRating: body.imdbRating });
=======
    const { omdbKey, tmdbKey } = getKeys();
    const sheet = await loadFromDropbox();
    const result = await registerAction(sheet, { nome, tipo, ano, ondeVer, pessoa, nota, omdbKey, tmdbKey, tmdbId });
>>>>>>> 7db19870b8d151410cf15ad034d7a28d6a1df671

    if (result.error === 'duplicate') {
      return Response.json(result, { status: 409 }); // 409 Conflict
    }

<<<<<<< HEAD
=======
    if (result.error === 'precisa_sugerir') {
      return Response.json(result, { status: 200 }); // Retorna sugestões sem salvar
    }

>>>>>>> 7db19870b8d151410cf15ad034d7a28d6a1df671
    await saveToDropbox(sheet);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
