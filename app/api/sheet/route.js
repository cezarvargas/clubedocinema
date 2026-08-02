import { loadFromDropbox } from '../../../lib/withSheet';
import { browseAction } from '../../../lib/actions';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const tipo = searchParams.get('tipo') || 'todos';
    const sort = searchParams.get('sort') || 'nome';
    const view = searchParams.get('view') || 'todos';
    const currentUser = searchParams.get('currentUser') || '';
    const sheet = await loadFromDropbox();
    return Response.json(browseAction(sheet, { query, tipo, sort, view, currentUser }));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
