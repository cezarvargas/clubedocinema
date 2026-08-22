const test = require('node:test');
const assert = require('node:assert/strict');
const { isAcceptedYear } = require('../lib/titleYear');

test('aceita o ano confirmado', () => {
  assert.equal(isAcceptedYear(2025, 2025, false), true);
});

test('aceita somente o ano imediatamente anterior no fallback', () => {
  assert.equal(isAcceptedYear(2024, 2025, true), true);
  assert.equal(isAcceptedYear(2024, 2025, false), false);
});

test('rejeita qualquer outro ano', () => {
  for (const year of [2021, 2022, 2023, 2026]) {
    assert.equal(isAcceptedYear(year, 2025, true), false);
  }
});
