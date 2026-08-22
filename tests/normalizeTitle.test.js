const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTitle, titleSearchCandidates } = require('../lib/normalizeTitle');

test('trata hífen e dois-pontos como separadores equivalentes', () => {
  assert.equal(
    normalizeTitle('Margrete - Rainha do Norte'),
    normalizeTitle('Margrete: Rainha do Norte')
  );
});

test('normaliza travessões, acentos e espaços', () => {
  assert.equal(
    normalizeTitle('  A Órfã — Parte 2  '),
    normalizeTitle('Orfa: Parte 2')
  );
});

test('oferece o título principal como fallback para subtítulos não reconhecidos', () => {
  assert.deepEqual(
    titleSearchCandidates('Margrete - Rainha do Norte'),
    ['Margrete - Rainha do Norte', 'Margrete']
  );
});
