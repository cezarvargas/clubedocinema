import { getKeys } from '../../../lib/withSheet';
import { loadFromDropbox } from '../../../lib/withSheet';
import { tmdbLookup } from '../../../lib/tmdb';
import { findDuplicate } from '../../../lib/sheet';
import { normalizeTitle, titleSearchCandidates } from '../../../lib/normalizeTitle';

const TMDB_BASE = 'https://api.themoviedb.org/3';

async function detectCompleteType(nome, ano, tipoModo, tmdbKey) {
  // Busca no TMDb e retorna TODOS os resultados com auto-detecção completa (F, FD, S, MS, SD, MSD)
  const isFilme = tipoModo === 'filme';
  const endpoint = isFilme ? 'search/movie' : 'search/tv';
  const yearParam = ano ? (isFilme ? `&primary_release_year=${ano}` : `&first_air_date_year=${ano}`) : '';
  try {
    let filteredResults = [];
    for (const candidate of titleSearchCandidates(nome)) {
      const url = `${TMDB_BASE}/${endpoint}?api_key=${tmdbKey}&query=${encodeURIComponent(candidate)}${yearParam}&language=pt-BR`;
      const res = await fetch(url);
      const data = await res.json();
      const candidateNormalized = normalizeTitle(candidate);

      filteredResults = (data.results || []).filter(item => {
        const title = isFilme ? item.title : item.name;
        return normalizeTitle(title).includes(candidateNormalized);
      });

      if (filteredResults.length > 0) break;
    }

    if (filteredResults.length === 0) {
      console.log(`[detectCompleteType] Nenhum resultado após filtro por nome: "${nome}"`);
      return [];
    }

    // Processa os resultados FILTRADOS
    const allItems = [];
    for (const item of filteredResults) {
      try {
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

        allItems.push({
          imdbId,
          nome: title,
          ano: parseInt(year) || ano,
          tipo,
          imdbRating,
        });
      } catch (itemErr) {
        console.error('[detectCompleteType] Erro processando item:', itemErr);
      }
    }

    return allItems;
  } catch (err) {
    console.error('[detectCompleteType]', err);
    return [];
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

    // PASSO 1: Busca no TMDb PRIMEIRO para obter o nome correto e completo
    console.log(`[imdb-search] Passo 1: Buscando resultados no TMDb...`);
    const foundItems = await detectCompleteType(nome, ano, tipoModo, tmdbKey);

    if (foundItems.length === 0) {
      console.log(`[imdb-search] Nenhum resultado encontrado no TMDb.`);
      return Response.json({ matches: [] });
    }

    // PASSO 2: Para cada resultado do TMDb, procura na planilha
    console.log(`[imdb-search] Passo 2: Procurando na planilha...`);
    const sheet = await loadFromDropbox();
    const anoInt = parseInt(ano, 10);
    const nomeDigitado = nome.trim();
    const nomeDigitadoNorm = normalizeTitle(nomeDigitado);
    const matchesInClub = [];
    const matchesNotInClub = [];

    for (const found of foundItems) {
      const nomeCorreto = found.nome;
      const nomeCorretoNorm = normalizeTitle(nomeCorreto);

      console.log(`[imdb-search] Verificando: "${nomeCorreto}" (normalizado="${nomeCorretoNorm}")`);

      // Procura na planilha usando o nome CORRETO do TMDb
      let existsInClub = null;

      if (tipoModo === 'filme') {
        // Procura por F ou FD (filmes)
        existsInClub = sheet.rows.find(r => {
          const rNomeNorm = normalizeTitle(r.nome);
          const match = (rNomeNorm === nomeCorretoNorm || rNomeNorm === nomeDigitadoNorm) && String(r.ano) === String(anoInt) && ['F', 'FD'].includes(r.tipo.trim().toUpperCase());
          if (match) {
            console.log(`[DEBUG] ✅ ENCONTRADO NA PLANILHA: "${r.nome}" (normalizado="${rNomeNorm}")`);
          }
          return match;
        });
      } else {
        // Procura por S, MS, SD, MSD (séries)
        existsInClub = sheet.rows.find(r => {
          const rNomeNorm = normalizeTitle(r.nome);
          const match = (rNomeNorm === nomeCorretoNorm || rNomeNorm === nomeDigitadoNorm) && String(r.ano) === String(anoInt) && ['S', 'MS', 'SD', 'MSD'].includes(r.tipo.trim().toUpperCase());
          if (match) {
            console.log(`[DEBUG] ✅ ENCONTRADO NA PLANILHA: "${r.nome}" (normalizado="${rNomeNorm}")`);
          }
          return match;
        });
      }

      // Se encontrou na planilha, adiciona na lista de encontrados
      if (existsInClub) {
        console.log(`[imdb-search] ✅ "${nomeCorreto}" encontrado na planilha!`);
        matchesInClub.push({
          imdbId: existsInClub.imdbLink ? existsInClub.imdbLink.split('/title/')[1]?.split('/')[0] : null,
          nome: existsInClub.nome,
          ano: existsInClub.ano,
          tipo: existsInClub.tipo, // Tipo da planilha
          imdbRating: existsInClub.imdbNota || null,
          existsInClub: true,
          rowNumber: existsInClub.rowNumber,
        });
      } else {
        // Não encontrou na planilha, adiciona em lista separada
        console.log(`[imdb-search] "${nomeCorreto}" não encontrado na planilha.`);
        matchesNotInClub.push({
          imdbId: found.imdbId,
          nome: nomeDigitado,
          ano: found.ano,
          tipo: found.tipo, // Tipo detectado automaticamente
          imdbRating: found.imdbRating || null,
          existsInClub: false,
          rowNumber: null,
        });
      }
    }

    // PASSO 3: Decidir o que retornar
    // Se encontrou ALGUM na planilha, retorna SÓ os da planilha
    // Se NÃO encontrou na planilha, retorna os resultados do TMDb
    const matches = matchesInClub.length > 0 ? matchesInClub : matchesNotInClub;

    console.log(`[imdb-search] ✅ Retornando ${matches.length} resultado(s). (${matchesInClub.length} no clube, ${matchesNotInClub.length} novos)`);
    return Response.json({ matches });
  } catch (err) {
    console.error('imdb-search error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
