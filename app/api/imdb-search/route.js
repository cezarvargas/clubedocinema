import { getKeys } from '../../../lib/withSheet';
import { loadFromDropbox } from '../../../lib/withSheet';
import { tmdbLookup } from '../../../lib/tmdb';
import { findDuplicate } from '../../../lib/sheet';

const TMDB_BASE = 'https://api.themoviedb.org/3';

async function detectCompleteType(nome, ano, tipoModo, tmdbKey) {
  // Busca no TMDb e faz auto-detecção completa (F, FD, S, MS, SD, MSD)
  const isFilme = tipoModo === 'filme';
  const endpoint = isFilme ? 'search/movie' : 'search/tv';
  const yearParam = ano ? (isFilme ? `&primary_release_year=${ano}` : `&first_air_date_year=${ano}`) : '';
  const url = `${TMDB_BASE}/${endpoint}?api_key=${tmdbKey}&query=${encodeURIComponent(nome)}${yearParam}&language=pt-BR`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const results = data.results || [];

    if (results.length === 0) return null;

    const item = results[0];
    const itemId = item.id;
    const title = isFilme ? item.title : item.name;
    const year = isFilme ? (item.release_date || '').slice(0, 4) : (item.first_air_date || '').slice(0, 4);

    // Busca detalhes
    const detailsEndpoint = isFilme ? 'movie' : 'tv';
    const detailsUrl = `${TMDB_BASE}/${detailsEndpoint}/${itemId}?api_key=${tmdbKey}&language=pt-BR`;
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

    let tipo;
    if (isFilme) {
      tipo = isDocumentary ? 'FD' : 'F';
    } else {
      const episodios = details.number_of_episodes || 0;
      if (episodios <= 10) {
        tipo = isDocumentary ? 'MSD' : 'MS';
      } else {
        tipo = isDocumentary ? 'SD' : 'S';
      }
    }

    // Busca IMDb ID
    const externalUrl = `${TMDB_BASE}/${detailsEndpoint}/${itemId}/external_ids?api_key=${tmdbKey}`;
    const externalRes = await fetch(externalUrl);
    const external = await externalRes.json();
    const imdbId = external.imdb_id;

    // Busca nota do IMDb
    let imdbRating = null;
    if (imdbId) {
      const omdbUrl = `http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${imdbId}`;
      try {
        const omdbRes = await fetch(omdbUrl);
        const omdbData = await omdbRes.json();
        if (omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
          imdbRating = parseFloat(omdbData.imdbRating);
        }
      } catch (e) {
        // Falha ao buscar rating, continua sem
      }
    }

    return {
      imdbId,
      nome: title,
      ano: parseInt(year) || ano,
      tipo,
      imdbRating,
    };
  } catch (err) {
    console.error('[detectCompleteType]', err);
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, ano, tipoModo } = body;

    if (!nome || !ano || !tipoModo) {
      return Response.json({ error: 'Campos obrigatórios: nome, ano, tipoModo.' }, { status: 400 });
    }

    const { tmdbKey } = getKeys();
    console.log(`[imdb-search] Buscando: ${nome} (${ano}) como ${tipoModo}`);

    // Normaliza nome: remove acentos, artigos, lowercase, e pontuação extra
    function normalize(s) {
      return (s || '')
        .toString()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '') // remove acentos
        .toLowerCase()
        .trim()
        .replace(/^(a|o|um|uma|the|an)\s+/i, '') // remove artigos do início
        .replace(/:\s+/g, ' ') // substitui ": " por espaço único
        .replace(/\s+/g, ' ') // normaliza múltiplos espaços
        .trim();
    }

    // PASSO 1: Busca no TMDb PRIMEIRO para obter o nome correto e completo
    console.log(`[imdb-search] Passo 1: Buscando nome correto no TMDb...`);
    const found = await detectCompleteType(nome, ano, tipoModo, tmdbKey);

    // PASSO 2: Se encontrou no TMDb, usa o nome correto dele para buscar na planilha
    if (found) {
      const nomeCorreto = found.nome;
      const anoInt = parseInt(ano, 10);
      const nomeCorretoNorm = normalize(nomeCorreto);

      console.log(`[imdb-search] Passo 2: Nome correto do TMDb: "${nomeCorreto}" (normalizado="${nomeCorretoNorm}")`);

      const sheet = await loadFromDropbox();

      // Procura na planilha usando o nome CORRETO do TMDb
      let existsInClub = null;

      if (tipoModo === 'filme') {
        // Procura por F ou FD (filmes)
        existsInClub = sheet.rows.find(r => {
          const rNomeNorm = normalize(r.nome);
          const match = rNomeNorm === nomeCorretoNorm && String(r.ano) === String(anoInt) && ['F', 'FD'].includes(r.tipo.trim().toUpperCase());
          if (match) {
            console.log(`[DEBUG] ✅ ENCONTRADO NA PLANILHA: "${r.nome}" (normalizado="${rNomeNorm}")`);
          }
          return match;
        });
      } else {
        // Procura por S, MS, SD, MSD (séries)
        existsInClub = sheet.rows.find(r => {
          const rNomeNorm = normalize(r.nome);
          const match = rNomeNorm === nomeCorretoNorm && String(r.ano) === String(anoInt) && ['S', 'MS', 'SD', 'MSD'].includes(r.tipo.trim().toUpperCase());
          if (match) {
            console.log(`[DEBUG] ✅ ENCONTRADO NA PLANILHA: "${r.nome}" (normalizado="${rNomeNorm}")`);
          }
          return match;
        });
      }

      // Se encontrou na planilha, retorna com o tipo da planilha
      if (existsInClub) {
        console.log(`[imdb-search] ✅ Encontrado na planilha com nome correto do TMDb!`);
        const matches = [
          {
            imdbId: existsInClub.imdbLink ? existsInClub.imdbLink.split('/title/')[1]?.split('/')[0] : null,
            nome: existsInClub.nome,
            ano: existsInClub.ano,
            tipo: existsInClub.tipo, // Tipo da planilha
            imdbRating: existsInClub.imdbNota || null,
            existsInClub: true,
            rowNumber: existsInClub.rowNumber,
          },
        ];
        return Response.json({ matches });
      }

      // Se não encontrou na planilha, retorna o resultado do TMDb com auto-detecção
      console.log(`[imdb-search] Não encontrado na planilha. Retornando resultado do TMDb com tipo auto-detectado.`);
      const matches = [
        {
          imdbId: found.imdbId,
          nome: found.nome,
          ano: found.ano,
          tipo: found.tipo, // Tipo detectado automaticamente
          imdbRating: found.imdbRating || null,
          existsInClub: false,
          rowNumber: null,
        },
      ];
      return Response.json({ matches });
    }

    // Se TMDb não encontrou nada, retorna vazio
    console.log(`[imdb-search] Nenhum resultado encontrado no TMDb.`);
    return Response.json({ matches: [] });
  } catch (err) {
    console.error('imdb-search error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
