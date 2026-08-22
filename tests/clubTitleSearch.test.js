const test = require('node:test');
const assert = require('node:assert/strict');
const { findTitlesInClub, clubTitleResponse } = require('../lib/clubTitleSearch');

const sheet = {
  rows: [{
    rowNumber: 12,
    nome: 'A Vida de Chuck',
    ano: 2024,
    tipo: 'F',
    imdbNota: 7.3,
    imdbLink: 'https://www.imdb.com/title/tt12908150/',
  }],
};

test('encontra primeiro na planilha sem depender de acentos ou artigos', () => {
  const found = findTitlesInClub(sheet, {
    names: ['vida de chuck'], years: [2024], tipoModo: 'filme',
  });
  assert.deepEqual(found, [sheet.rows[0]]);
});

test('não mistura ano ou categoria diferentes', () => {
  assert.deepEqual(findTitlesInClub(sheet, {
    names: ['A Vida de Chuck'], years: [2025], tipoModo: 'filme',
  }), []);
  assert.deepEqual(findTitlesInClub(sheet, {
    names: ['A Vida de Chuck'], years: [2024], tipoModo: 'serie',
  }), []);
});

test('prioriza a identidade do IMDb mesmo quando título ou ano diferem', () => {
  const found = findTitlesInClub(sheet, {
    names: ['Outro título'], years: [2025], tipoModo: 'filme', imdbId: 'tt12908150',
  });
  assert.deepEqual(found, [sheet.rows[0]]);
});

test('monta resposta de avaliação a partir dos dados da planilha', () => {
  assert.deepEqual(clubTitleResponse(sheet.rows[0]), {
    imdbId: 'tt12908150',
    nome: 'A Vida de Chuck',
    ano: 2024,
    tipo: 'F',
    imdbRating: 7.3,
    existsInClub: true,
    rowNumber: 12,
  });
});
