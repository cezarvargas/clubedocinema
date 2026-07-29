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

/** Lê a chave de API do OMDb (IMDb direto) das variáveis de ambiente. */
function getKeys() {
  const omdbKey = process.env.OMDB_API_KEY;
  if (!omdbKey) {
    throw new Error('OMDB_API_KEY não configurada (.env.local).');
  }
  return { omdbKey };
}

module.exports = { loadFromDropbox, saveToDropbox, getKeys };
