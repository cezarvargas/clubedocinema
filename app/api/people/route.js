import { loadFromDropbox } from '../../../lib/withSheet';
import { peopleAction } from '../../../lib/actions';

export async function GET() {
  try {
    const sheet = await loadFromDropbox();
    return Response.json(peopleAction(sheet));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
