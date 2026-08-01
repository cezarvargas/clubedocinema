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

/** Lê as chaves de API das variáveis de ambiente. */
function getKeys() {
  const tmdbKey = process.env.TMDB_API_KEY;
  const omdbKey = process.env.OMDB_API_KEY;
  if (!tmdbKey) {
    throw new Error('TMDB_API_KEY não configurada (.env.local).');
  }
  if (!omdbKey) {
    throw new Error('OMDB_API_KEY não configurada (.env.local).');
  }
  return { tmdbKey, omdbKey };
}

module.exports = { loadFromDropbox, saveToDropbox, getKeys };
