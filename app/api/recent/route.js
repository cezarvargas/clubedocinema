import { loadFromDropbox } from '../../../lib/withSheet';
import { recentAction } from '../../../lib/actions';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sheet = await loadFromDropbox();
    return Response.json(recentAction(sheet, { limit }));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
