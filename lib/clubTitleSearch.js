const { normalizeTitle } = require('./normalizeTitle');

function imdbIdFromLink(link) {
  return link ? link.split('/title/')[1]?.split('/')[0] || null : null;
}

function findTitlesInClub(sheet, { names = [], years = [], tipoModo, imdbId = null }) {
  const normalizedNames = new Set(
    names.map(normalizeTitle).filter(Boolean)
  );
  const acceptedYears = new Set(years.map(String));
  const allowedTypes = tipoModo === 'filme'
    ? new Set(['F', 'FD'])
    : new Set(['S', 'MS', 'MSD']);

  return sheet.rows.filter(row => {
    if (!allowedTypes.has((row.tipo || '').trim().toUpperCase())) return false;
    if (imdbId && imdbIdFromLink(row.imdbLink) === imdbId) return true;
    return normalizedNames.has(normalizeTitle(row.nome)) && acceptedYears.has(String(row.ano));
  });
}

function clubTitleResponse(row) {
  return {
    imdbId: imdbIdFromLink(row.imdbLink),
    nome: row.nome,
    ano: row.ano,
    tipo: row.tipo,
    imdbRating: row.imdbNota || null,
    existsInClub: true,
    rowNumber: row.rowNumber,
  };
}

module.exports = { findTitlesInClub, clubTitleResponse };
