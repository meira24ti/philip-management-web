const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeDecimalValue, sanitizeForColumnLimits } = require('../utils/numberUtils');

test('clamps values above decimal(15,2) limit', () => {
  assert.equal(normalizeDecimalValue('10000000000000000', 15, 2), 9999999999999.99);
});

test('rounds values to the requested scale', () => {
  assert.equal(normalizeDecimalValue('1234.5678', 15, 2), 1234.57);
});

test('returns null for empty values', () => {
  assert.equal(normalizeDecimalValue('', 15, 2), null);
});

test('truncates string values to the configured column limit', () => {
  const sanitized = sanitizeForColumnLimits(
    { daya_listrik: 'Lebih dari 5.500 Watt', keterangan: 'ok' },
    { daya_listrik: 20, keterangan: 10 }
  );

  assert.equal(sanitized.daya_listrik, 'Lebih dari 5.500 Wat');
  assert.equal(sanitized.keterangan, 'ok');
});
