const test = require('node:test');
const assert = require('node:assert/strict');
const { matchTitle } = require('../lib/matchTitle');
const { resolveRegistrationMatch } = require('../lib/actions');
const { toOmdbType } = require('../lib/omdb');

test('validação auxiliar usa o título e ano confirmados pelo OMDb', async (t) => {
  const calls = [];
  t.mock.method(global, 'fetch', async url => {
    calls.push(url);
    return {
      json: async () => ({
        Response: 'True',
        imdbID: 'tt12908150',
        Title: 'The Life of Chuck',
        Year: '2024',
        Type: 'movie',
        imdbRating: '7.3',
      }),
    };
  });

  const result = await matchTitle({
    nome: 'A Vida de Chuck', ano: 2024, tipo: 'F', omdbKey: 'omdb', tmdbKey: 'tmdb',
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0], /omdbapi\.com/);
  assert.deepEqual(result, {
    imdbId: 'tt12908150',
    nome: 'The Life of Chuck',
    ano: 2024,
    tipo: 'F',
    imdbRating: 7.3,
  });
});

test('cadastro reaproveita a confirmação sem fazer outra busca', async (t) => {
  const fetchMock = t.mock.method(global, 'fetch', async () => {
    throw new Error('não deveria consultar a rede');
  });
  const verifiedMatch = {
    imdbId: 'tt12908150', nome: 'A Vida de Chuck', ano: 2024, tipo: 'F', imdbRating: 7.3,
  };

  const result = await resolveRegistrationMatch({ verifiedMatch });

  assert.equal(result, verifiedMatch);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('tipos documentais de série são aceitos pelo OMDb', () => {
  assert.equal(toOmdbType('SD'), 'series');
  assert.equal(toOmdbType('MSD'), 'series');
});

test('falha de rede no OMDb é tratada como ausência de resultado', async (t) => {
  t.mock.method(global, 'fetch', async () => {
    throw new Error('indisponível');
  });
  const { omdbLookup } = require('../lib/omdb');

  const result = await omdbLookup({ nome: 'Filme', ano: 2024, tipo: 'F', apiKey: 'key' });

  assert.equal(result, null);
});
