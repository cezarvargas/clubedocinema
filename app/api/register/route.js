import { loadFromDropbox, saveToDropbox, getKeys } from '../../../lib/withSheet';
import { registerAction } from '../../../lib/actions';

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, tipo, ano, ondeVer, pessoa, nota } = body;
    if (!nome || !tipo || !ano || !pessoa || nota == null) {
      return Response.json({ error: 'Campos obrigatórios: nome, tipo, ano, pessoa, nota.' }, { status: 400 });
    }

    const { omdbKey } = getKeys();
    const sheet = await loadFromDropbox();
    const result = await registerAction(sheet, { nome, tipo, ano, ondeVer, pessoa, nota, omdbKey });

    if (result.error === 'duplicate') {
      return Response.json(result, { status: 409 }); // 409 Conflict
    }

    await saveToDropbox(sheet);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
