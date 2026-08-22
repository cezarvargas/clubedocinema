import { getKeys } from '../../../lib/withSheet';
import { loadFromDropbox } from '../../../lib/withSheet';
import { omdbLookupById } from '../../../lib/omdb';
import { normalizeTitle, titleSearchCandidates } from '../../../lib/normalizeTitle';
import { findTitlesInClub, clubTitleResponse } from '../../../lib/clubTitleSearch';
import { isAcceptedYear } from '../../../lib/titleYear';

const TMDB_BASE = 'https://api.themoviedb.org/3';

async function searchVerifiedTitles(nome, ano, tipoModo, tmdbKey, omdbKey) {
  const isFilme = tipoModo === 'filme';
  // O TMDb localiza o título em português e também confirma filme/série.
  const endpoint = isFilme ? 'search/movie' : 'search/tv';
  const yearParam = ano ? (isFilme ? `&primary_release_year=${ano}` : `&first_air_date_year=${ano}`) : '';
  try {
    let filteredResults = [];
    let usedRelaxedYear = false;
    // Alguns filmes têm ano de festival diferente do lançamento comercial no
    // TMDb. Primeiro respeita o ano informado; só então tenta sem esse filtro.
    const yearAttempts = yearParam ? [yearParam, ''] : [''];
    for (const attemptedYearParam of yearAttempts) {
      usedRelaxedYear = Boolean(yearParam) && !attemptedYearParam;
      for (const candidate of titleSearchCandidates(nome)) {
        const url = `${TMDB_BASE}/${endpoint}?api_key=${tmdbKey}&query=${encodeURIComponent(candidate)}${attemptedYearParam}&language=pt-BR`;
        const res = await fetch(url);
        const data = await res.json();
        const candidateNormalized = normalizeTitle(candidate);

        filteredResults = (data.results || []).filter(item => {
          const title = isFilme ? item.title : item.name;
          return normalizeTitle(title).includes(candidateNormalized);
        });

        if (filteredResults.length > 0) break;
      }
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
        const originalTitle = isFilme ? item.original_title : item.original_name;
        let year = usedRelaxedYear
          ? String(ano)
          : (isFilme ? (item.release_date || '').slice(0, 4) : (item.first_air_date || '').slice(0, 4));

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

        // Confirma o resultado e busca a nota pelo IMDb ID.
        let imdbRating = null;
        let omdbData = null;
        if (imdbId) {
          omdbData = await omdbLookupById({ imdbId, apiKey: omdbKey });
          if (omdbData) {
            if (omdbData.ano && !usedRelaxedYear) year = String(omdbData.ano);
            imdbRating = omdbData.imdbRating;
          }
        }
        // Sem confirmação por ID não podemos afirmar qual é o título do IMDb.
        if (omdbData) {
          if (!isAcceptedYear(ano, omdbData.ano, usedRelaxedYear)) continue;
          allItems.push({
            imdbId,
            // Usa a tradução pt-BR do TMDb. Quando ela não existe, preserva o
            // nome informado, que pode ser um título brasileiro alternativo.
            nome: normalizeTitle(title) !== normalizeTitle(originalTitle) ? title : nome.trim(),
            ano: usedRelaxedYear ? parseInt(ano, 10) : (omdbData.ano || parseInt(year) || ano),
            tipo,
            imdbRating,
            aliases: [nome, title],
          });
        }
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

    const { tmdbKey, omdbKey } = getKeys();
    const sheet = await loadFromDropbox();
    const anoInt = parseInt(ano, 10);
    const nomeDigitado = nome.trim();
    console.log(`[imdb-search] Buscando: ${nome} (${ano}) como ${tipoModo}`);

    // PASSO 1: resolve imediatamente se o título digitado já está no clube.
    const directClubMatches = findTitlesInClub(sheet, {
      names: [nomeDigitado], years: [anoInt], tipoModo,
    });
    if (directClubMatches.length > 0) {
      console.log(`[imdb-search] ${directClubMatches.length} resultado(s) encontrado(s) diretamente na planilha.`);
      return Response.json({ matches: directClubMatches.map(clubTitleResponse) });
    }

    // PASSO 2: OMDb exato; se necessário, TMDb para descoberta + OMDb por ID.
    console.log(`[imdb-search] Buscando e confirmando o título externamente...`);
    const foundItems = await searchVerifiedTitles(nome, ano, tipoModo, tmdbKey, omdbKey);

    if (foundItems.length === 0) {
      console.log(`[imdb-search] Nenhum resultado encontrado no TMDb.`);
      return Response.json({ matches: [] });
    }

    // PASSO 3: verifica novamente a planilha usando também os nomes externos.
    console.log(`[imdb-search] Verificando aliases na planilha...`);
    const matchesInClub = [];
    const matchesNotInClub = [];

    for (const found of foundItems) {
      const nomeCorreto = found.nome;
      const existingRows = findTitlesInClub(sheet, {
        names: [nomeDigitado, nomeCorreto, ...(found.aliases || [])],
        years: [anoInt, found.ano],
        tipoModo,
        imdbId: found.imdbId,
      });

      // Se encontrou na planilha, adiciona na lista de encontrados
      if (existingRows.length > 0) {
        console.log(`[imdb-search] ✅ "${nomeCorreto}" encontrado na planilha!`);
        for (const row of existingRows) {
          if (!matchesInClub.some(match => match.rowNumber === row.rowNumber)) {
            matchesInClub.push(clubTitleResponse(row));
          }
        }
      } else {
        // Não encontrou na planilha, adiciona em lista separada
        console.log(`[imdb-search] "${nomeCorreto}" não encontrado na planilha.`);
        matchesNotInClub.push({
          imdbId: found.imdbId,
          nome: found.nome,
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
