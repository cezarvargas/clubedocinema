import { loadFromDropbox, saveToDropbox, getKeys } from '../../../lib/withSheet';
import { rateAction } from '../../../lib/actions';

export async function POST(request) {
  try {
    const body = await request.json();
    const { rowNumber, pessoa, nota } = body;
    if (!rowNumber || !pessoa || nota == null) {
      return Response.json({ error: 'Campos obrigatórios: rowNumber, pessoa, nota.' }, { status: 400 });
    }

    const { tmdbKey, omdbKey } = getKeys();
    const sheet = await loadFromDropbox();
    const result = await rateAction(sheet, { rowNumber, pessoa, nota, tmdbKey, omdbKey });

    await saveToDropbox(sheet);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
