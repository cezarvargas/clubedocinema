import { getKeys } from '../../../lib/withSheet';
import { loadFromDropbox } from '../../../lib/withSheet';
import { tmdbSearch, tmdbExternalIds } from '../../../lib/tmdb';
import { findDuplicate } from '../../../lib/sheet';

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, ano, tipo } = body;

    if (!nome || !tipo || !ano) {
      return Response.json({ error: 'Campos obrigatórios: nome, tipo, ano.' }, { status: 400 });
    }

    const { tmdbKey } = getKeys();
    const candidates = await tmdbSearch({ nome, tipo, apiKey: tmdbKey });

    if (candidates.length === 0) {
      return Response.json({ matches: [] });
    }

    // Carrega a planilha pra verificar duplicatas
    const sheet = await loadFromDropbox();

    // Filtra por ano (máximo 2 anos de diferença)
    const filtered = candidates
      .filter(c => Math.abs(parseInt(c.year, 10) - ano) <= 2)
      .slice(0, 5);

    // Busca IMDb ID pra cada candidato e verifica se já existe na planilha
    const matches = [];
    for (const c of filtered) {
      const imdbId = await tmdbExternalIds({ tmdbId: c.tmdbId, tipo, apiKey: tmdbKey });
      if (imdbId) {
        // Verifica se já existe na planilha
        const existsInClub = findDuplicate(sheet, { nome: c.title, ano: c.year, tipo });

        matches.push({
          imdbId,
          nome: c.title,
          ano: c.year,
          tipo,
          existsInClub: !!existsInClub,
          rowNumber: existsInClub?.rowNumber || null,
        });
      }
    }

    return Response.json({ matches });
  } catch (err) {
    console.error('imdb-search error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
