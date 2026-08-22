/**
 * Normaliza títulos para comparação na busca.
 * Pontuações usadas como separadores (hífen, dois-pontos etc.) não fazem
 * parte do nome e podem variar entre a planilha, o usuário e o TMDb.
 */
function normalizeTitle(value) {
  return (value || '')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/^(a|o|um|uma|the|an)\s+/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleSearchCandidates(value) {
  const title = (value || '').toString().trim();
  const candidates = [title];
  const mainTitle = title.split(/\s*[-–—:]\s*/, 1)[0].trim();

  if (mainTitle.length >= 3 && normalizeTitle(mainTitle) !== normalizeTitle(title)) {
    candidates.push(mainTitle);
  }

  return candidates;
}

module.exports = { normalizeTitle, titleSearchCandidates };
