import { loadFromDropbox, saveToDropbox, getKeys } from '../../../lib/withSheet';
import { rateAction } from '../../../lib/actions';

export async function POST(request) {
  try {
    const body = await request.json();
    const { rowNumber, pessoa, nota } = body;
    if (!rowNumber || !pessoa || nota == null) {
      return Response.json({ error: 'Campos obrigatórios: rowNumber, pessoa, nota.' }, { status: 400 });
    }

<<<<<<< HEAD
    const { tmdbKey, omdbKey } = getKeys();
    const sheet = await loadFromDropbox();
    const result = await rateAction(sheet, { rowNumber, pessoa, nota, tmdbKey, omdbKey });
=======
    const { omdbKey, tmdbKey } = getKeys();
    const sheet = await loadFromDropbox();
    const result = await rateAction(sheet, { rowNumber, pessoa, nota, omdbKey, tmdbKey });
>>>>>>> 7db19870b8d151410cf15ad034d7a28d6a1df671

    await saveToDropbox(sheet);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
