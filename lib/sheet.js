// lib/sheet.js
// Núcleo de leitura/escrita da planilha "Clube cinema".
// Trabalha em cima de um Workbook do ExcelJS já carregado (ver dropboxClient.js).

const ExcelJS = require('exceljs');

const SHEET_NAME = 'Clube cinema';
const LOG_SHEET_NAME = 'Log';
const LOG_HEADERS = ['DataHora', 'Pessoa', 'Numero', 'Status'];
const COL = {
  NUMERO: 1, // A
  NOME: 2,   // B
  TIPO: 3,   // C
  ANO: 4,    // D
  ONDE_VER: 5, // E
  // F..? -> pessoas (dinâmico, ver detectPeopleColumns)
};

const HEADER_TOTAL_PONTOS = 'Total pontos';
const HEADER_TOTAL_VOTOS = 'Total Votos';
const HEADER_MEDIA = 'Média Pond.';
const HEADER_IMDB = 'IMDB';

const HYPERLINK_COLOR = 'FF0563C1'; // ARGB
const UNCONFIRMED_FONT = { color: { argb: 'FF000000' }, bold: true };

/**
 * Lê a linha 1 (cabeçalho) e descobre dinamicamente:
 *  - a lista de pessoas (colunas entre "Onde ver" e "Total pontos")
 *  - os índices das colunas R/S/T/U (podem se mover se o clube adicionar/remover pessoas)
 * Isso evita fixar "12 pessoas" ou nomes específicos no código, como decidido no projeto.
 */
function detectColumns(ws) {
  const headerRow = ws.getRow(1);
  const people = [];
  let col = COL.ONDE_VER + 1; // primeira coluna depois de "Onde ver"
  let totalPontosCol = null, totalVotosCol = null, mediaCol = null, imdbCol = null;

  while (col <= headerRow.cellCount + 5) {
    const val = (headerRow.getCell(col).value || '').toString().trim();
    if (val === HEADER_TOTAL_PONTOS) { totalPontosCol = col; break; }
    if (!val) break; // segurança: header vazio antes de achar "Total pontos" = algo mudou na planilha
    people.push({ name: val, col });
    col++;
  }
  if (totalPontosCol == null) {
    throw new Error(
      `Não encontrei a coluna "${HEADER_TOTAL_PONTOS}" no cabeçalho. ` +
      `A planilha pode ter mudado de estrutura — confira a linha 1.`
    );
  }
  totalVotosCol = totalPontosCol + 1;
  mediaCol = totalPontosCol + 2;
  imdbCol = totalPontosCol + 3;

  const votosHeader = (headerRow.getCell(totalVotosCol).value || '').toString().trim();
  const imdbHeader = (headerRow.getCell(imdbCol).value || '').toString().trim();
  if (votosHeader !== HEADER_TOTAL_VOTOS) {
    throw new Error(`Esperava "${HEADER_TOTAL_VOTOS}" na coluna depois de "Total pontos", achei "${votosHeader}".`);
  }

  return { people, totalPontosCol, totalVotosCol, mediaCol, imdbCol };
}

function normalize(s) {
  return (s || '')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim();
}

/**
 * Extrai o texto de exibição de uma célula, não importa a "forma" do valor:
 * texto puro, célula com link ({text, hyperlink}, formato que o próprio
 * addNewTitle/rateExisting gravam) ou texto formatado ({richText: [...]}).
 * Sem isso, qualquer título que já tinha link do IMDb (a maioria da
 * planilha, vindos do verificar_imdb.py) aparece como "[object Object]".
 */
function cellDisplayText(cell) {
  const v = cell.value;
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    if (typeof v.text === 'string') return v.text;
    if (v.text && Array.isArray(v.text.richText)) return v.text.richText.map(rt => rt.text).join('');
    if (Array.isArray(v.richText)) return v.richText.map(rt => rt.text).join('');
  }
  return String(v);
}

/**
 * Carrega a planilha (buffer .xlsx) e devolve uma estrutura fácil de usar:
 * { workbook, worksheet, people, cols, rows }
 * `rows` é um array de objetos já "traduzidos" (não é a fonte da verdade para escrita —
 * para escrever, sempre usamos `worksheet` diretamente, célula a célula).
 */
function buildRows(ws, cols) {
  const rows = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // cabeçalho
    const nomeCell = row.getCell(COL.NOME);
    const nome = cellDisplayText(nomeCell);
    const tipo = row.getCell(COL.TIPO).value;
    if (!nome || !tipo) return; // linha reservada/vazia

    const scores = {};
    for (const p of cols.people) {
      const v = row.getCell(p.col).value;
      if (v !== null && v !== undefined && v !== '') scores[p.name] = Number(v);
    }

    rows.push({
      rowNumber,
      numero: row.getCell(COL.NUMERO).value,
      nome,
      tipo: (tipo || '').toString().trim(),
      ano: row.getCell(COL.ANO).value,
      ondeVer: row.getCell(COL.ONDE_VER).value,
      scores,
      totalPontos: row.getCell(cols.totalPontosCol).value,
      totalVotos: row.getCell(cols.totalVotosCol).value,
      mediaPond: row.getCell(cols.mediaCol).value,
      imdbNota: row.getCell(cols.imdbCol).value,
      imdbLink: row.getCell(COL.NOME).hyperlink || null,
      confirmado: !!row.getCell(COL.NOME).hyperlink,
    });
  });
  return rows;
}

async function loadSheet(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const ws = workbook.getWorksheet(SHEET_NAME);
  if (!ws) throw new Error(`Aba "${SHEET_NAME}" não encontrada no arquivo.`);

  const cols = detectColumns(ws);
  const rows = buildRows(ws, cols);

  let logWs = workbook.getWorksheet(LOG_SHEET_NAME);
  if (!logWs) {
    // Primeira vez que o app roda contra essa planilha: cria a aba de log
    // do zero, com cabeçalho. Isso nunca mexe na aba "Clube cinema".
    logWs = workbook.addWorksheet(LOG_SHEET_NAME);
    logWs.addRow(LOG_HEADERS);
  }

  return { workbook, worksheet: ws, people: cols.people, cols, rows, logWs };
}

/** Adiciona uma linha na aba "Log", sempre no fim. Nunca falha o resto da
 * operação principal se algo der errado aqui (o log é só um "extra"). */
function appendLog(sheet, { pessoa, numero, status }) {
  if (!sheet.logWs) return;
  sheet.logWs.addRow([formatDataHoraAgora(), pessoa, numero, status]);
}

/**
 * Converte o valor da célula DataHora no timestamp comparável.
 * Formato esperado (o que o app grava, e o que deve ser usado ao preencher
 * manualmente): "AAAA-MM-DD HH:MM", ex: "2026-07-26 17:30".
 * Também aceita um Date de verdade (caso o Excel converta sozinho).
 */
function parseDataHora(v) {
  if (v instanceof Date) return v.getTime();
  const s = (v || '').toString().trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (m) {
    const [, ano, mes, dia, hora, min] = m.map(Number);
    return new Date(ano, mes - 1, dia, hora, min).getTime();
  }
  const t = new Date(s).getTime(); // fallback, caso venha em outro formato
  return isNaN(t) ? 0 : t;
}

/** Formata a data/hora atual no padrão "AAAA-MM-DD HH:MM" (o mesmo que
 * parseDataHora espera), pra gravar na aba Log a cada cadastro/avaliação. */
function formatDataHoraAgora() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Lê as últimas N entradas do log, ordenadas pela DataHora de verdade
 * (não pela ordem física das linhas) — assim, linhas inseridas manualmente
 * fora de ordem (ex: populando histórico antigo) continuam corretas. */
function getRecentLog(sheet, limit = 10) {
  if (!sheet.logWs) return [];
  const entries = [];
  sheet.logWs.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // cabeçalho
    const [dataHora, pessoa, numero, status] = row.values.slice(1);
    if (!dataHora) return;
    entries.push({ dataHora, pessoa, numero, status, __row: rowNumber });
  });
  // Ordena por DataHora; em caso de empate (mesma DataHora, já que o formato
  // só tem precisão de minuto), desempata pela posição na planilha -- quem
  // foi escrito depois (linha maior) é sempre mais recente, mesmo empatado.
  entries.sort((a, b) => {
    const diff = parseDataHora(b.dataHora) - parseDataHora(a.dataHora);
    return diff !== 0 ? diff : b.__row - a.__row;
  });
  return entries.slice(0, limit).map(({ __row, ...rest }) => rest);
}

/** Monta o objeto `sheet` diretamente a partir de um worksheet já em mãos
 * (usado nos testes, e reaproveitável se algum dia lermos de outra fonte). */
function sheetFromWorksheet(ws, logWs) {
  const cols = detectColumns(ws);
  const rows = buildRows(ws, cols);
  return { worksheet: ws, people: cols.people, cols, rows, logWs };
}

/** Lista de nomes pra tela de login — lida dinamicamente, nunca fixa no código. */
function getPeopleNames(sheet) {
  return sheet.people.map(p => p.name);
}

/** Próximo Número disponível = MAX(coluna A) + 1 */
function getNextNumero(sheet) {
  let max = 0;
  for (const r of sheet.rows) {
    const n = Number(r.numero);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

/** Busca por nome (normalizado, tolera acento/maiúscula) na base já existente do clube. */
function searchByName(sheet, query) {
  const q = normalize(query);
  if (!q) return [];
  return sheet.rows.filter(r => normalize(r.nome).includes(q));
}

/** Duplicidade: mesmo Nome (normalizado) + mesmo Ano + mesmo Tipo. */
function findDuplicate(sheet, { nome, ano, tipo }) {
  const qNome = normalize(nome);
  return sheet.rows.find(r =>
    normalize(r.nome) === qNome &&
    String(r.ano) === String(ano) &&
    r.tipo.trim().toUpperCase() === tipo.trim().toUpperCase()
  );
}

function colLetter(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - m) / 26);
  }
  return s;
}

/**
 * Peso da Média Ponderada por faixa de votos (documentado no processo, doc 2 + doc 3).
 * 0-1 voto -> sem fórmula (célula genuinamente vazia, ver doc 2 seção 3).
 * Fórmula final é 2 * (peso*média_filme + (1-peso)*ancora), ancora = $<col>$1 (ex: $W$1).
 */
function buildWeightExpr(sCellRef) {
  return `IF(${sCellRef}=2,0.55,IF(${sCellRef}<=4,0.70,IF(${sCellRef}<=6,0.80,IF(${sCellRef}<=9,0.90,1))))`;
}
function buildMediaPondFormula({ row, totalPontosCol, totalVotosCol, anchorCellRef }) {
  const rRef = `${colLetter(totalPontosCol)}${row}`;
  const sRef = `${colLetter(totalVotosCol)}${row}`;
  const w = buildWeightExpr(sRef);
  return `=2*(${w}*(${rRef}/${sRef})+(1-(${w}))*${anchorCellRef})`;
}

/** Copia os atributos da fonte já existente na célula, trocando só o que for necessário. */
function fontWithOverrides(existingFont, overrides) {
  const base = existingFont || {};
  return {
    name: base.name, size: base.size, bold: base.bold, italic: base.italic,
    vertAlign: base.vertAlign, strike: base.strike,
    ...overrides,
  };
}

function applyConfirmedStyle(cell, imdbId) {
  cell.value = cell.value; // no-op, mantém o texto
  cell.font = fontWithOverrides(cell.font, { color: { argb: HYPERLINK_COLOR }, bold: false });
  if (imdbId) cell.value = { text: cell.value, hyperlink: `https://www.imdb.com/title/${imdbId}/` };
}
function applyUnconfirmedStyle(cell) {
  cell.font = fontWithOverrides(cell.font, UNCONFIRMED_FONT);
}

/**
 * Descobre a próxima linha livre pra escrever (logo após a última linha com filme
 * cadastrado). A planilha real tem linhas reservadas em branco depois disso — usamos
 * a primeira delas em vez de inserir uma linha nova no meio do arquivo.
 */
function getNextFreeRow(sheet) {
  let max = 1; // linha 1 é cabeçalho
  for (const r of sheet.rows) if (r.rowNumber > max) max = r.rowNumber;
  return max + 1;
}

/**
 * Cadastra um filme/série novo.
 * `matched` é o resultado da validação OMDb/TMDb (ver lib/matchTitle.js):
 *   null                                    -> não confirmado (preto/negrito, sem link)
 *   { imdbId, imdbRating, nome, ano, tipo }  -> confirmado (link + nota), usa os dados
 *                                              corrigidos do IMDb, não os digitados
 */
function addNewTitle(sheet, { nome, tipo, ano, ondeVer, pessoa, nota, matched }) {
  const { worksheet: ws, cols } = sheet;
  const numero = getNextNumero(sheet);
  const rowNumber = getNextFreeRow(sheet);
  const row = ws.getRow(rowNumber);

  const finalNome = matched ? matched.nome : nome;
  const finalTipo = matched ? matched.tipo : tipo;
  const finalAno = matched ? matched.ano : ano;

  row.getCell(COL.NUMERO).value = numero;
  row.getCell(COL.NOME).value = finalNome;
  row.getCell(COL.TIPO).value = finalTipo;
  row.getCell(COL.ANO).value = finalAno;
  row.getCell(COL.ONDE_VER).value = ondeVer || null;

  const pessoaCol = cols.people.find(p => p.name === pessoa);
  if (!pessoaCol) throw new Error(`Pessoa "${pessoa}" não encontrada nas colunas da planilha.`);
  row.getCell(pessoaCol.col).value = nota;

  const lastPersonCol = cols.people[cols.people.length - 1].col;
  row.getCell(cols.totalPontosCol).value = { formula: `SUM(F${rowNumber}:${colLetter(lastPersonCol)}${rowNumber})` };
  row.getCell(cols.totalVotosCol).value = { formula: `COUNT(F${rowNumber}:${colLetter(lastPersonCol)}${rowNumber})` };
  // Média Pond.: fica sem fórmula (0-1 voto) — é o caso de um filme recém-cadastrado.

  if (matched) {
    row.getCell(cols.imdbCol).value = matched.imdbRating ?? null;
    applyConfirmedStyle(row.getCell(COL.NOME), matched.imdbId);
  } else {
    applyUnconfirmedStyle(row.getCell(COL.NOME));
  }

  row.commit();

  // Atualiza o "retrato" em memória (sheet.rows) — importante para o caso de duas
  // chamadas seguidas usarem o mesmo objeto `sheet` sem recarregar do Dropbox
  // (senão a segunda chamada calcularia o mesmo Número de novo, colidindo).
  const scores = {};
  scores[pessoa] = nota;
  sheet.rows.push({
    rowNumber, numero, nome: finalNome, tipo: finalTipo, ano: finalAno, ondeVer: ondeVer || null,
    scores,
    totalPontos: null, totalVotos: null, mediaPond: null,
    imdbNota: matched ? (matched.imdbRating ?? null) : null,
    imdbLink: matched ? `https://www.imdb.com/title/${matched.imdbId}/` : null,
    confirmado: !!matched,
  });

  return { numero, rowNumber };
}

/**
 * Registra a nota de uma pessoa num título que já existe.
 * Se o título estava "não confirmado" e `matched` vier preenchido agora
 * (retry OMDb/TMDb bem sucedido), a linha inteira é atualizada — nome/ano/tipo
 * corrigidos, link e Nota IMDb — sem alterar o formato da mensagem do WhatsApp.
 */
function rateExisting(sheet, { rowNumber, pessoa, nota, matched }) {
  const { worksheet: ws, cols } = sheet;
  const row = ws.getRow(rowNumber);

  const pessoaCol = cols.people.find(p => p.name === pessoa);
  if (!pessoaCol) throw new Error(`Pessoa "${pessoa}" não encontrada nas colunas da planilha.`);
  row.getCell(pessoaCol.col).value = nota;

  const lastPersonCol = cols.people[cols.people.length - 1].col;
  // R/S: só preenche se ainda não tinham fórmula (nunca sobrescreve, doc 3 seção 6)
  if (row.getCell(cols.totalPontosCol).value == null) {
    row.getCell(cols.totalPontosCol).value = { formula: `SUM(F${rowNumber}:${colLetter(lastPersonCol)}${rowNumber})` };
  }
  if (row.getCell(cols.totalVotosCol).value == null) {
    row.getCell(cols.totalVotosCol).value = { formula: `COUNT(F${rowNumber}:${colLetter(lastPersonCol)}${rowNumber})` };
  }

  // Média Pond.: adiciona fórmula se ainda não tinha (agora pode já ter 2+ votos).
  // OBS: a contagem exata de votos só se resolve quando o Excel recalcular a fórmula
  // de S; aqui decidimos com base nos valores já conhecidos em `sheet.rows` + a nota nova.
  const original = sheet.rows.find(r => r.rowNumber === rowNumber);
  const votosAntes = original ? Object.keys(original.scores).length : 0;
  const jaTinhaEssaPessoa = original && original.scores[pessoa] != null;
  const votosDepois = jaTinhaEssaPessoa ? votosAntes : votosAntes + 1;
  if (votosDepois >= 2 && row.getCell(cols.mediaCol).value == null) {
    // Âncora fica 2 colunas depois de IMDB: U (nota) -> V (rótulo "Ancora...") -> W (valor).
    const anchorCellRef = `$${colLetter(cols.imdbCol + 2)}$1`;
    row.getCell(cols.mediaCol).value = {
      formula: buildMediaPondFormula({ row: rowNumber, totalPontosCol: cols.totalPontosCol, totalVotosCol: cols.totalVotosCol, anchorCellRef }),
    };
  }

  if (matched && !(original && original.confirmado)) {
    if (matched.nome) row.getCell(COL.NOME).value = matched.nome;
    if (matched.tipo) row.getCell(COL.TIPO).value = matched.tipo;
    if (matched.ano) row.getCell(COL.ANO).value = matched.ano;
    row.getCell(cols.imdbCol).value = matched.imdbRating ?? null;
    applyConfirmedStyle(row.getCell(COL.NOME), matched.imdbId);
  }

  row.commit();

  // Mantém sheet.rows consistente (mesmo motivo do addNewTitle).
  if (original) {
    original.scores[pessoa] = nota;
    if (matched && !original.confirmado) {
      if (matched.nome) original.nome = matched.nome;
      if (matched.tipo) original.tipo = matched.tipo;
      if (matched.ano) original.ano = matched.ano;
      original.imdbNota = matched.imdbRating ?? null;
      original.imdbLink = `https://www.imdb.com/title/${matched.imdbId}/`;
      original.confirmado = true;
    }
  }
}

module.exports = {
  SHEET_NAME, COL, HEADER_TOTAL_PONTOS, HEADER_TOTAL_VOTOS, HEADER_MEDIA, HEADER_IMDB,
  HYPERLINK_COLOR, UNCONFIRMED_FONT,
  detectColumns, normalize, loadSheet, sheetFromWorksheet, buildRows,
  getPeopleNames, getNextNumero, searchByName, findDuplicate,
  colLetter, getNextFreeRow, addNewTitle, rateExisting,
  appendLog, getRecentLog, LOG_SHEET_NAME, LOG_HEADERS, parseDataHora, formatDataHoraAgora,
};
