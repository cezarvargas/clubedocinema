// lib/actions.js
// Orquestra sheet.js + matchTitle.js + whatsappMessage.js para cada operação
// que o app expõe. Recebe um `sheet` já carregado (ver lib/sheet.js) e as
// chaves de API — não sabe nada sobre Dropbox nem sobre HTTP, o que faz dar
// pra testar sem precisar de rede (ver tests/actions.test.js).

const { getPeopleNames, getNextNumero, searchByName, findDuplicate, addNewTitle, rateExisting, appendLog, getRecentLog } = require('./sheet');
const { matchTitle } = require('./matchTitle');
const { buildMessage, formatNota } = require('./whatsappMessage');

function weightForVotos(votos) {
  if (votos < 2) return null; // 0-1 voto: sem Média Pond. (mesma regra da planilha)
  if (votos === 2) return 0.55;
  if (votos <= 4) return 0.70;
  if (votos <= 6) return 0.80;
  if (votos <= 9) return 0.90;
  return 1.00;
}

/**
 * Média Ponderada calculada em JS, direto das notas brutas -- não depende
 * da fórmula gravada na coluna T do Excel (que só fica com valor pronto
 * depois que alguém abre o arquivo no Excel de verdade e ele recalcula;
 * o ExcelJS só ESCREVE fórmulas, não as calcula). Mesma regra de peso por
 * quantidade de votos documentada no projeto original (verificar_imdb.py).
 */
function computeMediaPond(scores, clubAverage) {
  const votos = Object.keys(scores).length;
  const weight = weightForVotos(votos);
  if (weight == null || clubAverage == null) return null;
  const pontos = Object.values(scores).reduce((a, b) => a + b, 0);
  const mediaFilme = pontos / votos;
  return 2 * (weight * mediaFilme + (1 - weight) * clubAverage);
}

/** Média geral do clube (âncora), calculada em JS a partir de TODAS as
 * linhas da planilha (não só as filtradas) -- mesmo raciocínio do W1. */
function computeClubAverage(rows) {
  let totalPontos = 0, totalVotos = 0;
  for (const r of rows) {
    totalPontos += Object.values(r.scores).reduce((a, b) => a + b, 0);
    totalVotos += Object.keys(r.scores).length;
  }
  return totalVotos > 0 ? totalPontos / totalVotos : null;
}
function peopleAction(sheet) {
  return { people: getPeopleNames(sheet) };
}

/** Busca por nome na base do clube — usado na tela "O que você viu?". */
function searchAction(sheet, { query, currentUser }) {
  const matches = searchByName(sheet, query).map(r => ({
    rowNumber: r.rowNumber,
    nome: r.nome,
    tipo: r.tipo,
    ano: r.ano,
    imdbLink: r.imdbLink,
    alreadyRatedByMe: r.scores[currentUser] != null,
    myScore: r.scores[currentUser] != null ? formatNota(r.scores[currentUser]) : null,
  }));
  return { matches };
}

/**
 * Cadastra um título novo (ou recusa se for duplicata exata nome+ano+tipo).
 * Tenta validar contra OMDb (IMDb direto). Se encontrar, registra confirmado.
 * Se não encontrar, registra como não-confirmado. Monta a mensagem do WhatsApp
 * e devolve tudo pronto pra rota gravar no Dropbox (ver app/api/register/route.js).
 */
async function registerAction(sheet, { nome, tipo, ano, ondeVer, pessoa, nota, tmdbKey, omdbKey, imdbId, imdbRating }) {
  const dup = findDuplicate(sheet, { nome, ano, tipo });
  if (dup) {
    return { error: 'duplicate', existing: { rowNumber: dup.rowNumber, nome: dup.nome, tipo: dup.tipo, ano: dup.ano } };
  }

  // Se já tem imdbId (foi validado na Tela 1), não precisa validar de novo
  let matched;
  if (imdbId) {
    // Já foi validado na Tela 1: imdbId e imdbRating já confirmados
    // Não faz mais pesquisa nenhuma
    matched = { imdbId, nome, ano, tipo, imdbRating };
  } else {
    matched = await matchTitle({ nome, ano, tipo, tmdbKey, omdbKey });
  }

  const { numero, rowNumber } = addNewTitle(sheet, { nome, tipo, ano, ondeVer, pessoa, nota, matched });

  const status = matched ? 'novo' : 'novo_nao_confirmado';
  const mensagem = buildMessage({
    pessoa,
    titulo: matched ? matched.nome : nome,
    tipo: matched ? matched.tipo : tipo,
    ano: matched ? matched.ano : ano,
    nota, status, ondeVer,
    imdbLink: matched && matched.imdbId ? `https://www.imdb.com/title/${matched.imdbId}/` : null,
    correctedFrom: matched && matched.correctedFrom ? matched.correctedFrom : null,
  });

  appendLog(sheet, { pessoa, numero, status: matched ? 'Novo' : 'Novo - não confirmado' });

  return { numero, rowNumber, mensagem, confirmado: !!matched };
}

/**
 * Registra a nota de alguém num título que já existe. Se o título estava
 * pendente (sem link), tenta confirmar de novo via OMDb e, se conseguir,
 * atualiza a linha inteira -- mas a mensagem do WhatsApp NÃO sinaliza essa
 * "confirmação retroativa" (decisão já validada com o usuário).
 */
async function rateAction(sheet, { rowNumber, pessoa, nota, tmdbKey, omdbKey }) {
  const original = sheet.rows.find(r => r.rowNumber === rowNumber);
  if (!original) throw new Error(`Linha ${rowNumber} não encontrada.`);

  let matched = null;
  if (!original.confirmado) {
    matched = await matchTitle({ nome: original.nome, ano: original.ano, tipo: original.tipo, tmdbKey, omdbKey });
  }

  rateExisting(sheet, { rowNumber, pessoa, nota, matched });

  const numero = original.numero;
  const mensagem = buildMessage({
    pessoa,
    titulo: matched ? matched.nome : original.nome,
    tipo: matched ? matched.tipo : original.tipo,
    ano: matched ? matched.ano : original.ano,
    nota, status: 'existente',
    imdbLink: original.imdbLink || (matched && matched.imdbId ? `https://www.imdb.com/title/${matched.imdbId}/` : null),
  });

  appendLog(sheet, { pessoa, numero, status: 'Existente' });

  return { mensagem, confirmadoAgora: !!matched };
}

/**
 * Tela inicial: últimas N notas dadas (qualquer pessoa, título novo ou
 * antigo), lidas da aba "Log" (que só guarda DataHora/Pessoa/Numero/Status
 * -- o resto é buscado ao vivo na aba principal, via Número, pra não
 * duplicar dado). O "(N)" mostrado no app vem do status gravado no log.
 * Cada item também traz as notas de TODAS as pessoas pro título (pra tela
 * expandir ao tocar) e o link do IMDb.
 */
function recentAction(sheet, { limit = 10 } = {}) {
  const entries = getRecentLog(sheet, limit);
  return {
    items: entries.map(e => {
      const row = sheet.rows.find(r => String(r.numero) === String(e.numero));
      return {
        titulo: row ? row.nome : `(título #${e.numero} não encontrado)`,
        tipo: row ? row.tipo : null,
        ano: row ? row.ano : null,
        pessoa: e.pessoa,
        nota: row ? row.scores[e.pessoa] : null,
        isNew: (e.status || '').toLowerCase().startsWith('novo'),
        dataHora: e.dataHora,
        scores: row ? row.scores : {},
        imdbLink: row ? row.imdbLink : null,
      };
    }),
  };
}

/** Tela "Ver planilha completa" ou "Fila para avaliar": busca + filtro por tipo + ordenação. */
function browseAction(sheet, { query, tipo, sort, view, currentUser }) {
  const q = (query || '').toLowerCase();
  let rows = sheet.rows.filter(r => {
    // Se está na fila, filtra apenas filmes não avaliados pelo usuário
    if (view === 'fila') {
      if (r.scores[currentUser] !== undefined && r.scores[currentUser] !== null) return false; // Já avaliou
    }
    // Se está em discutidos, filtra apenas filmes marcados como discutidos
    if (view === 'discutidos') {
      if (!r.discutido) return false;
    }
    // Filtro por tipo
    if (tipo && tipo !== 'todos' && r.tipo.toUpperCase() !== tipo.toUpperCase()) return false;
    // Filtro por busca
    if (!q) return true;
    const nome = r.nome.toLowerCase();
    if (q.includes(' ')) {
      const regex = new RegExp(`\\b${q.replace(/\s+/g, '\\s+')}\\b`);
      return regex.test(nome);
    }
    return nome.includes(q);
  });

  // Âncora (média geral do clube) sempre calculada em cima de TODAS as
  // linhas da planilha, não só as filtradas -- senão a Média Pond. mudaria
  // de valor dependendo do filtro/busca ativos, o que não faz sentido.
  const clubAverage = computeClubAverage(sheet.rows);

  const sorters = {
    nome: (a, b) => a.nome.localeCompare(b.nome),
    imdb: (a, b) => (b.imdbNota || 0) - (a.imdbNota || 0),
    media: (a, b) =>
      (computeMediaPond(b.scores, clubAverage) || 0) - (computeMediaPond(a.scores, clubAverage) || 0),
    fila: (a, b) => {
      // Fila: primeiro filmes com múltiplos votos (que mostram nota IMDb)
      const aVotos = Object.keys(a.scores).length;
      const bVotos = Object.keys(b.scores).length;
      const aMultiple = aVotos > 1 ? 1 : 0;
      const bMultiple = bVotos > 1 ? 1 : 0;
      if (aMultiple !== bMultiple) return bMultiple - aMultiple; // múltiplos votos vêm primeiro
      // Depois ordena por nota do IMDb
      return (b.imdbNota || 0) - (a.imdbNota || 0);
    },
    discutidos: (a, b) => a.nome.localeCompare(b.nome), // Alfabético
  };
  let sorterKey = sort;
  if (view === 'fila') sorterKey = 'fila';
  else if (view === 'discutidos') sorterKey = 'discutidos';
  rows = [...rows].sort(sorters[sorterKey] || sorters.nome);

  return {
    items: rows.map(r => ({
      rowNumber: r.rowNumber,
      nome: r.nome,
      tipo: r.tipo,
      ano: r.ano,
      votos: Object.keys(r.scores).length,
      mediaPond: computeMediaPond(r.scores, clubAverage),
      imdbNota: r.imdbNota,
      imdbLink: r.imdbLink,
      confirmado: r.confirmado,
      discutido: r.discutido,
      scores: r.scores,
    })),
  };
}

module.exports = { peopleAction, searchAction, registerAction, rateAction, browseAction, recentAction };
