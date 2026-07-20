function normalizeDecimalValue(value, precision = 15, scale = 2) {
  if (value === '' || value === null || value === undefined) return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  const maxValue = Number.parseFloat(`${'9'.repeat(precision - scale)}.${'9'.repeat(scale)}`);
  const factor = 10 ** scale;
  const clamped = Math.min(Math.max(parsed, 0), maxValue);
  return Number((Math.round(clamped * factor) / factor).toFixed(scale));
}

function truncateStringValue(value, maxLength) {
  if (typeof value !== 'string') return value;
  if (typeof maxLength !== 'number' || maxLength <= 0) return value;
  return value.slice(0, maxLength);
}

function sanitizeForColumnLimits(values, columnLimits = {}) {
  const sanitized = { ...values };
  Object.entries(sanitized).forEach(([column, value]) => {
    if (typeof value === 'string') {
      sanitized[column] = truncateStringValue(value, columnLimits[column]);
    }
  });
  return sanitized;
}

module.exports = { normalizeDecimalValue, truncateStringValue, sanitizeForColumnLimits };
