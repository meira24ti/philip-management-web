const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const pool = require('../config/db');
const { createApp } = require('../app');
const tokens = require('../utils/authTokens');
const v = require('../utils/validation');
const { validatePropertyInput } = require('../utils/propertyValidation');
const rateLimit = require('../middleware/rateLimit');
const properties = require('../controllers/propertiController');

const response = () => ({ code: 200, status(code) { this.code = code; return this; }, set() { return this; }, json(body) { this.body = body; return this; } });

test('HTTP security: sessions, roles, uploads, CORS, input limits and error boundaries', async t => {
  process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
  const user = { id_user: crypto.randomUUID(), nama: 'Audit user', email: 'audit@example.test', role: 'admin', password_hash: await bcrypt.hash('Test-password-123', 4) };
  let active = true;
  const sessions = new Map();
  let insertedRole;
  let avatarUrl;
  const issue = () => { const id = crypto.randomUUID(); sessions.set(id, tokens.passwordVersion(user.password_hash)); return tokens.signAccessToken(user, id); };
  let token = issue();
  t.mock.method(pool, 'query', async (sql, args = []) => {
    if (sql.includes('AS session_password_version')) return [active ? [{ ...user, session_password_version: sessions.get(args[0]) }] : []];
    if (sql.startsWith('SELECT * FROM user WHERE email')) return [[{ ...user }]];
    if (sql.startsWith('SELECT id_user FROM user WHERE email')) return [[]];
    if (sql.startsWith('SELECT role FROM user')) return [[{ role: 'direktur' }]];
    if (sql.startsWith('SELECT password_hash FROM user')) return [[{ password_hash: user.password_hash }]];
    if (sql.startsWith('SELECT id_user, password_hash')) return [[{ ...user }]];
    if (sql.includes('INSERT INTO user ')) insertedRole = args[4];
    if (sql.startsWith('UPDATE user SET password_hash')) { if (args[2] !== user.password_hash) return [{ affectedRows: 0 }]; user.password_hash = args[0]; }
    if (sql.startsWith('UPDATE user SET foto_profil')) avatarUrl = args[0];
    if (sql.startsWith('DELETE FROM auth_sessions WHERE id_session')) sessions.delete(args[0]);
    if (sql.startsWith('DELETE FROM auth_sessions WHERE id_user')) sessions.clear();
    if (sql.startsWith('INSERT INTO auth_sessions')) sessions.set(args[0], args[2]);
    if (sql.includes('FROM laporan WHERE')) return [[{ file_pdf_url: '/uploads/laporan/../../.env' }]];
    if (sql.includes('FROM user WHERE id_user = ?')) return [[{ id: user.id_user, nama: user.nama, role: user.role }]];
    if (sql.trim().startsWith('SELECT')) return [[]];
    return [{ affectedRows: 1 }];
  });
  t.mock.method(pool, 'getConnection', async () => { throw Object.assign(new Error('private database path and details'), { code: 'ECONNREFUSED' }); });
  const server = createApp({ JWT_SECRET: process.env.JWT_SECRET, CLIENT_URL: 'https://philiprealestate.com', NODE_ENV: 'production' }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = (url, { auth = token, body, method = 'GET', headers = {} } = {}) => fetch(base + url, {
    method, headers: { ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });

  await t.test('requires a valid access session and never accepts reset, legacy or expired JWTs', async () => {
    for (const auth of [null, 'invalid', tokens.signResetToken(user), jwt.sign({ id: user.id_user, role: 'admin' }, process.env.JWT_SECRET), jwt.sign({ id: user.id_user, purpose: 'access' }, process.env.JWT_SECRET, { issuer: 'philip-api', audience: 'philip-web', jwtid: crypto.randomUUID(), expiresIn: -1 })]) {
      assert.equal((await call('/api/auth/me', { auth })).status, 401);
    }
    assert.equal((await call('/api/auth/me')).status, 200);
  });
  await t.test('disabled accounts, revoked sessions and changed password hashes invalidate access immediately', async () => {
    active = false; assert.equal((await call('/api/auth/me')).status, 401); active = true;
    const hash = user.password_hash; user.password_hash = 'changed'; assert.equal((await call('/api/auth/me')).status, 401); user.password_hash = hash;
    sessions.clear(); assert.equal((await call('/api/auth/me')).status, 401); token = issue();
  });
  await t.test('uses current DB role and blocks marketing access to reports and write APIs', async () => {
    user.role = 'marketing';
    for (const [url, method] of [['/api/laporan', 'GET'], ['/uploads/laporan/test.pdf', 'GET'], ['/api/staff', 'POST'], ['/api/properti', 'POST']]) assert.equal((await call(url, { method, body: method === 'POST' ? {} : undefined })).status, 403);
    user.role = 'admin';
  });
  await t.test('admin can create only marketing; directors can create all roles', async () => {
    const body = role => ({ nama: 'New user', email: 'new@example.test', role, password: 'Strong-password-123' });
    for (const role of ['admin', 'direktur']) assert.equal((await call('/api/staff', { method: 'POST', body: body(role) })).status, 403);
    assert.equal((await call('/api/staff', { method: 'POST', body: body('marketing') })).status, 201); assert.equal(insertedRole, 'marketing');
    user.role = 'direktur';
    for (const role of ['admin', 'marketing', 'direktur']) { assert.equal((await call('/api/staff', { method: 'POST', body: body(role) })).status, 201); assert.equal(insertedRole, role); }
    user.role = 'admin';
  });
  await t.test('logout revokes the exact session while other sessions remain valid', async () => {
    const second = issue();
    assert.equal((await call('/api/auth/logout', { method: 'POST' })).status, 200);
    assert.equal((await call('/api/auth/me')).status, 401);
    assert.equal((await call('/api/auth/me', { auth: second })).status, 200); token = second;
  });
  await t.test('password change revokes all sessions and reset links cannot be replayed', async () => {
    assert.equal((await call('/api/auth/password', { method: 'PUT', body: { oldPassword: 'Test-password-123', newPassword: 'Changed-password-123' } })).status, 200);
    assert.equal((await call('/api/auth/me')).status, 401);
    const reset = tokens.signResetToken(user);
    const body = { token: reset, newPassword: 'Reset-password-123' };
    assert.equal((await call('/api/auth/reset-password', { auth: null, method: 'POST', body })).status, 200);
    assert.equal((await call('/api/auth/reset-password', { auth: null, method: 'POST', body })).status, 400);
    const login = await call('/api/auth/login', { auth: null, method: 'POST', body: { email: user.email, password: 'Reset-password-123' } });
    assert.equal(login.status, 200); const data = await login.json(); assert.ok(!data.user.password_hash); token = data.token;
    assert.equal((await call('/api/auth/me')).status, 200);
  });
  await t.test('rejects disallowed origins, duplicate query parameters and path-like property IDs', async () => {
    assert.equal((await call('/', { headers: { Origin: 'https://evil.example.test' } })).status, 403);
    const allowed = await call('/', { headers: { Origin: 'https://philiprealestate.com' } });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://philiprealestate.com');
    assert.equal(allowed.headers.get('x-content-type-options'), 'nosniff'); assert.equal(allowed.headers.get('x-powered-by'), null);
    assert.equal((await call('/api/properti?search=a&search=b')).status, 400);
    assert.equal((await call('/api/properti/not-a-uuid', { method: 'DELETE' })).status, 400);
  });
  await t.test('database acquisition failures return a safe response and temporary images are inaccessible', async () => {
    const result = await call('/api/properti', { method: 'POST', body: {} });
    assert.equal(result.status, 503); assert.doesNotMatch(await result.text(), /private|database path/i);
    for (const url of ['/uploads/properti/temp/test.jpg', '/uploads/.tmp/test.png', '/uploads/profil/missing.png', '/uploads/.env']) {
      const result = await call(url, { auth: null }); assert.equal(result.status, 404); assert.doesNotMatch(await result.text(), /ENOENT|[A-Z]:\\/);
    }
    assert.equal((await call('/uploads/laporan/test.pdf', { auth: null })).status, 401);
    assert.equal((await call('/api/laporan/test/download')).status, 404);
  });
  await t.test('rejects fake images and SVG and re-encodes valid images without embedded trailing content', async () => {
    for (const [name, type, content] of [['fake.png', 'image/png', '<script>bad()</script>'], ['image.svg', 'image/svg+xml', '<svg/>']]) {
      const body = new FormData(); body.append('foto', new Blob([content], { type }), name);
      assert.equal((await call('/api/auth/upload-foto', { method: 'POST', body })).status, 400);
    }
    const source = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#880a20' } }).png().toBuffer();
    const body = new FormData(); body.append('foto', new Blob([source, Buffer.from('PRIVATE-TRAILER')], { type: 'image/png' }), 'valid.png');
    assert.equal((await call('/api/auth/upload-foto', { method: 'POST', body })).status, 200);
    const filePath = path.join(__dirname, '..', avatarUrl);
    try { const bytes = await fs.readFile(filePath); assert.ok(!bytes.includes(Buffer.from('PRIVATE-TRAILER'))); assert.equal((await sharp(bytes).metadata()).format, 'png'); }
    finally { await fs.unlink(filePath); }
  });
});

test('strict property validation rejects malformed money, coordinates, dates and unsafe links', () => {
  for (const data of [{ harga_jual: -1 }, { harga_sewa: 'NaN' }, { luas_tanah: '1e99' }, { kamar_tidur: 1.5 }, { tanggal_listing: '2026-02-30' }, { latitude: 91 }, { gmaps_url: 'javascript:alert(1)' }, { gmaps_url: 'https://google.com.evil.test/maps' }, { nama_jalan: {} }, { kunci: 'invalid' }]) assert.throws(() => validatePropertyInput(data), { statusCode: 400 });
  assert.doesNotThrow(() => validatePropertyInput({ harga_jual: '125000000.50', kamar_tidur: '0', latitude: '-0.5', gmaps_url: 'https://maps.app.goo.gl/abc', tanggal_listing: '2024-02-29' }));
  assert.throws(() => v.password('é'.repeat(37)), { statusCode: 400 });
  assert.throws(() => v.text('  ', 'Name', { required: true }), { statusCode: 400 });
});

test('independent rate limiters do not share counters and recover after their window', t => {
  let now = 1000; t.mock.method(Date, 'now', () => now);
  const a = rateLimit({ max: 1, windowMs: 1000 }); const b = rateLimit({ max: 1, windowMs: 1000 });
  let allowed = 0; const next = () => allowed++;
  a({ ip: 'test' }, response(), next); b({ ip: 'test' }, response(), next); assert.equal(allowed, 2);
  const denied = response(); a({ ip: 'test' }, denied, next); assert.equal(denied.code, 429);
  now += 1001; a({ ip: 'test' }, response(), next); assert.equal(allowed, 3);
});

test('transactions preserve zero commission, reject invalid input and prevent repeated completion', async t => {
  let state = 'tersedia'; let rollback = 0; const writes = [];
  const conn = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => rollback++, release() {}, query: async (sql, args) => {
    if (sql.startsWith('SELECT id_properti')) { assert.match(sql, /FOR UPDATE/); return [[{ status_unit: state }]]; }
    if (sql.startsWith('INSERT INTO transaksi')) writes.push(args[0]);
    if (sql.startsWith('UPDATE properti')) state = args[0];
    return [{ affectedRows: 1 }];
  } };
  t.mock.method(pool, 'getConnection', async () => conn); t.mock.method(console, 'error', () => {});
  const request = body => ({ params: { id: crypto.randomUUID() }, user: { id: 'audit' }, body });
  for (const body of [{ jenis: 'other', harga_aktual: 100 }, { jenis: 'terjual', harga_aktual: -1 }, { jenis: 'terjual', harga_aktual: 100, komisi_persen: 101 }]) { const res = response(); await properties.createTransaksi(request(body), res); assert.equal(res.code, 400); }
  const res = response(); await properties.createTransaksi(request({ jenis: 'terjual', harga_aktual: 100, komisi_persen: 0 }), res);
  assert.equal(res.code, 201); assert.equal(writes[0].komisi_nominal, 0);
  const again = response(); await properties.createTransaksi(request({ jenis: 'terjual', harga_aktual: 100 }), again); assert.equal(again.code, 409); assert.equal(writes.length, 1); assert.equal(rollback, 4);
});

test('photo reorder rejects foreign, duplicate or stale IDs and enforces one first cover', async t => {
  const writes = [];
  const conn = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {}, query: async (sql, args) => {
    if (sql.startsWith('SELECT')) return [[{ id_fotoproperti: 'a' }, { id_fotoproperti: 'b' }]];
    writes.push(args); return [{ affectedRows: 1 }];
  } };
  t.mock.method(pool, 'getConnection', async () => conn);
  for (const ids of [[], ['a'], ['a', 'a'], ['a', 'foreign']]) { const res = response(); await properties.reorderFotos({ params: { id: 'test' }, body: { orders: ids.map(id_fotoproperti => ({ id_fotoproperti })) } }, res); assert.equal(res.code, 400); }
  assert.equal(writes.length, 0);
  const res = response(); await properties.reorderFotos({ params: { id: 'test' }, body: { orders: [{ id_fotoproperti: 'b', is_cover: false, urutan: 999 }, { id_fotoproperti: 'a', is_cover: true, urutan: -1 }] } }, res);
  assert.equal(res.code, 200); assert.deepEqual(writes.map(row => row.slice(0, 3)), [[1, 1, 'b'], [2, 0, 'a']]);
});
