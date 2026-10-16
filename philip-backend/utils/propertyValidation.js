const v = require('./validation');

function validatePropertyInput(data) {
  for (const [field, value] of Object.entries(data)) {
    if (value != null && !['string', 'number', 'boolean'].includes(typeof value)) throw v.badRequest(`${field} tidak valid`);
    if (typeof value === 'string' && value.length > 10000) throw v.badRequest(`${field} terlalu panjang`);
  }
  if (data.tanggal_listing !== undefined) v.date(data.tanggal_listing, 'Tanggal listing');
  for (const field of ['harga_jual', 'harga_sewa']) if (data[field] !== undefined) v.number(data[field], field, { min: 0.01 });
  for (const field of ['luas_tanah', 'luas_bangunan']) if (data[field] !== undefined) v.number(data[field], field, { max: 99999999.99 });
  for (const field of ['kamar_tidur', 'kamar_mandi']) if (data[field] !== undefined) v.number(data[field], field, { integer: true, max: 10000 });
  if (data.latitude !== undefined) v.number(data.latitude, 'Latitude', { min: -90, max: 90 });
  if (data.longtitude !== undefined) v.number(data.longtitude, 'Longitude', { min: -180, max: 180 });
  if (data.gmaps_url !== undefined) data.gmaps_url = v.mapUrl(data.gmaps_url);
  for (const field of ['spanduk', 'kunci', 'sudah_share']) {
    if (![undefined, null, '', true, false, 0, 1, '0', '1', 'true', 'false'].includes(data[field])) throw v.badRequest(`${field} tidak valid`);
  }
}

function validateColumnLengths(data, limits) {
  for (const [field, limit] of Object.entries(limits)) {
    if (typeof data[field] === 'string' && data[field].length > limit) throw v.badRequest(`${field} maksimal ${limit} karakter`);
  }
}

module.exports = { validatePropertyInput, validateColumnLengths };
