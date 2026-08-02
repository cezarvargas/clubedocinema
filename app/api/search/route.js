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
