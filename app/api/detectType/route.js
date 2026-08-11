import { getKeys } from '../../../lib/withSheet';

const TMDB_BASE = 'https://api.themoviedb.org/3';

async function detectFilmType(nome, ano, omdbKey, tmdbKey) {
  // Busca no TMDb como filme
  const url = `${TMDB_BASE}/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(nome)}${ano ? `&primary_release_year=${ano}` : ''}&language=pt-BR`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const results = data.results || [];

    if (results.length === 0) {
      return { found: false };
    }

    const filme = results[0];
    const filmeTitle = filme.title;
    const filmeYear = (filme.release_date || '').slice(0, 4);
    const imdbId = filme.external_id?.imdb_id;

    // Busca detalhes no TMDb (genres)
    const detailsUrl = `${TMDB_BASE}/movie/${filme.id}?api_key=${tmdbKey}&language=pt-BR`;
    const detailsRes = await fetch(detailsUrl);
    const details = await detailsRes.json();

    const genres = (details.genres || []).map(g => (g.name || '').toLowerCase());
    const isDocumentary = genres.some(g =>
      g.includes('documentary') ||
      g.includes('documentário') ||
      g.includes('documental') ||
      g.includes('realidade') ||
      g.includes('reality') ||
      g === 'doc' ||
      g === 'documentary film'
    );

    const tipo = isDocumentary ? 'FD' : 'F';

    return {
      found: true,
      tipo,
      nome: filmeTitle,
      ano: parseInt(filmeYear) || ano,
      imdbId: imdbId || filme.imdb_id,
    };
  } catch (err) {
    console.error('[detectFilmType]', err);
    return { found: false };
  }
}

async function detectSeriesType(nome, ano, omdbKey, tmdbKey) {
  // Busca no TMDb como série
  const url = `${TMDB_BASE}/search/tv?api_key=${tmdbKey}&query=${encodeURIComponent(nome)}${ano ? `&first_air_date_year=${ano}` : ''}&language=pt-BR`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const results = data.results || [];

    if (results.length === 0) {
      return { found: false };
    }

    const serie = results[0];
    const serieTitle = serie.name;
    const serieYear = (serie.first_air_date || '').slice(0, 4);
    const serieId = serie.id;

    // Busca detalhes (episódios, genres)
    const detailsUrl = `${TMDB_BASE}/tv/${serieId}?api_key=${tmdbKey}&language=pt-BR`;
    const detailsRes = await fetch(detailsUrl);
    const details = await detailsRes.json();

    const episodios = details.number_of_episodes || 0;
    const genres = (details.genres || []).map(g => (g.name || '').toLowerCase());
    const isDocumentary = genres.some(g =>
      g.includes('documentary') ||
      g.includes('documentário') ||
      g.includes('documental') ||
      g.includes('realidade') ||
      g.includes('reality') ||
      g === 'doc' ||
      g === 'documentary film'
    );

    // Classificar: ≤10 episódios = MS/MSD, ≥11 = S/SD
    let tipo;
    if (episodios <= 10) {
      tipo = isDocumentary ? 'MSD' : 'MS';
    } else {
      tipo = isDocumentary ? 'SD' : 'S';
    }

    // Busca IMDb ID
    const externalIdsUrl = `${TMDB_BASE}/tv/${serieId}/external_ids?api_key=${tmdbKey}`;
    const externalRes = await fetch(externalIdsUrl);
    const external = await externalRes.json();
    const imdbId = external.imdb_id;

    return {
      found: true,
      tipo,
      nome: serieTitle,
      ano: parseInt(serieYear) || ano,
      imdbId,
      episodios,
      isDocumentary,
    };
  } catch (err) {
    console.error('[detectSeriesType]', err);
    return { found: false };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, tipoModo, ano } = body;

    if (!nome || !tipoModo) {
      return Response.json({ error: 'Campos obrigatórios: nome, tipoModo.' }, { status: 400 });
    }

    const { omdbKey, tmdbKey } = getKeys();

    let result;
    if (tipoModo === 'filme') {
      result = await detectFilmType(nome, ano, omdbKey, tmdbKey);
    } else if (tipoModo === 'serie') {
      result = await detectSeriesType(nome, ano, omdbKey, tmdbKey);
    } else {
      return Response.json({ error: 'tipoModo deve ser "filme" ou "serie".' }, { status: 400 });
    }

    return Response.json(result);
  } catch (err) {
    console.error('[detectType API]', err);
    return Response.json({ error: err.message, found: false }, { status: 500 });
  }
}
