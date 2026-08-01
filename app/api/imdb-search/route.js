import { getKeys } from '../../../lib/withSheet';
import { loadFromDropbox } from '../../../lib/withSheet';
import { tmdbLookup } from '../../../lib/tmdb';
import { findDuplicate } from '../../../lib/sheet';

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, ano, tipo } = body;

    if (!nome || !tipo || !ano) {
      return Response.json({ error: 'Campos obrigatórios: nome, tipo, ano.' }, { status: 400 });
    }

    const { tmdbKey, omdbKey } = getKeys();
    console.log(`[imdb-search] tmdbKey extraído:`, tmdbKey ? 'OK' : 'UNDEFINED');
    console.log(`[imdb-search] omdbKey extraído:`, omdbKey ? 'OK' : 'UNDEFINED');

    // Busca no TMDb (com fallback para OMDb)
    const found = await tmdbLookup({ nome, tipo, apiKey: tmdbKey, ano, omdbKey });

    if (!found) {
      return Response.json({ matches: [] });
    }

    // Carrega a planilha pra verificar duplicatas
    const sheet = await loadFromDropbox();

    // Se found é um array (múltiplos candidatos), processa cada um
    const foundArray = Array.isArray(found) ? found : [found];
    const matches = foundArray.map(f => {
      const existsInClub = findDuplicate(sheet, { nome: f.nome, ano: f.ano, tipo });
      return {
        imdbId: f.imdbId,
        nome: f.nome,
        ano: f.ano,
        tipo,
        existsInClub: !!existsInClub,
        rowNumber: existsInClub?.rowNumber || null,
      };
    });

    return Response.json({ matches });
  } catch (err) {
    console.error('imdb-search error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
