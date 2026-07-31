// lib/withSheet.js
const { downloadSheet, uploadSheet } = require('./dropboxClient');
const { loadSheet } = require('./sheet');

async function loadFromDropbox() {
  const buffer = await downloadSheet();
  return loadSheet(buffer);
}

async function saveToDropbox(sheet) {
  const buffer = await sheet.workbook.xlsx.writeBuffer();
  await uploadSheet(buffer);
}

/** Lê as chaves de API das variáveis de ambiente, com erro claro se faltar alguma. */
function getKeys() {
  const omdbKey = process.env.OMDB_API_KEY;
  const tmdbKey = process.env.TMDB_API_KEY;
  if (!omdbKey || !tmdbKey) {
    throw new Error('OMDB_API_KEY e/ou TMDB_API_KEY não configuradas (.env.local).');
  }
  return { omdbKey, tmdbKey };
}

module.exports = { loadFromDropbox, saveToDropbox, getKeys };
