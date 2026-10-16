// Real MySQL + HTTP + browser acceptance. Copies SCHEMA ONLY to a disposable
// local database; never changes records in the configured development database.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
require('dotenv').config();

const artifacts = path.resolve(__dirname, '../.test-artifacts/local-acceptance');
const results = [];
async function main() {
  assert(['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST), 'Only local MySQL is permitted');
  const source = process.env.DB_NAME;
  const testName = `philip_test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  assert(/^philip_test_\d+_[a-f0-9]{8}$/.test(testName));
  const db = await mysql.createConnection({ host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: source });
  let pool, server, vite, browser, lastPage, created = false;
  const files = new Set();
  await fs.mkdir(artifacts, { recursive: true });
  try {
    await db.query('CREATE DATABASE ?? CHARACTER SET utf8mb4', [testName]); created = true;
    const [tables] = await db.query('SHOW TABLES');
    const definitions = [];
    for (const table of tables.map(Object.values).flat()) {
      const [rows] = await db.query('SHOW CREATE TABLE ??', [table]);
      definitions.push(rows[0]['Create Table']);
    }
    await db.query('USE ??', [testName]);
    await db.query('SET FOREIGN_KEY_CHECKS=0');
    for (const ddl of definitions) await db.query(ddl);
    await db.query('SET FOREIGN_KEY_CHECKS=1');
    process.env.DB_NAME = testName;
    process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
    process.env.CLIENT_URL = 'http://127.0.0.1:5175,http://localhost:5175';
    pool = require('../config/db');
    await require('../migrations/runMigrations').runMigrations();
    // Check migrations are repeatable on the same database.
    await require('../migrations/runMigrations').runMigrations();
    const password = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(password, 10);
    const users = {};
    for (const role of ['admin', 'marketing', 'direktur']) {
      const id = crypto.randomUUID(); users[role] = { id, email: `${role}@acceptance.example.test`, nama: `Tim Uji ${role}`, role, no_hp: '081234567890' };
      await db.query('INSERT INTO user SET ?', { id_user: id, email: users[role].email, nama: users[role].nama, role, no_hp: '081234567890', password_hash: passwordHash, is_active: 1 });
    }
    for (const [key, value] of Object.entries({ company_name: 'PHILIP REAL ESTATE', company_tagline: 'JUAL | BELI | SEWA | KPR', company_city: 'Pekanbaru', company_phone: '081234567890', hero_title: 'Temukan properti pilihan', hero_subtitle: 'bersama kami', hero_desc: 'Rumah, tanah, dan ruang usaha di Pekanbaru.', company_logo: '' })) {
      await db.query('INSERT INTO setting (id_setting,key_name,key_value,updated_by) VALUES (?,?,?,?)', [crypto.randomUUID(), key, value, users.admin.id]);
    }
    server = require('../app').createApp().listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const apiOrigin = `http://127.0.0.1:${server.address().port}`;
    async function api(route, { role = 'admin', method = 'GET', body, status = 200, binary = false } = {}) {
      const headers = users[role]?.token ? { Authorization: `Bearer ${users[role].token}` } : {};
      if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
      const res = await fetch(apiOrigin + '/api' + route, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
      const data = binary ? Buffer.from(await res.arrayBuffer()) : await res.json();
      assert.equal(res.status, status, `${method} ${route}: ${JSON.stringify(data).slice(0, 300)}`);
      results.push(`${method} ${route}: ${status}`); return data;
    }
    for (const role of Object.keys(users)) {
      const login = await api('/auth/login', { role, method: 'POST', body: { email: users[role].email, password } });
      users[role] = { ...users[role], ...login.user, token: login.token };
      assert(users[role].token, 'Login returns token');
    }
    await api('/staff', { method: 'POST', body: { nama: 'Tidak Diizinkan', email: 'blocked@example.test', role: 'direktur' }, status: 403 });
    await api('/staff', { method: 'POST', body: { nama: 'Tidak Diizinkan', email: 'blocked@example.test', role: 'admin' }, status: 403 });
    await api('/staff', { method: 'POST', body: { nama: 'Staff Tambahan', email: 'new@example.test', role: 'marketing', no_hp: '081234567890' }, status: 201 });
    await api('/staff', { role: 'marketing', method: 'POST', body: {}, status: 403 });
    const property = { tanggal_listing: '2026-10-16', jenis_penawaran: 'dijual_dan_disewa', harga_jual: '725000000', harga_sewa: '30000000', nama_jalan: 'Jalan Bakti Nomor 123, Perumahan Taman Indah Blok A Dekat Simpang Utama Pekanbaru', kota: 'Pekanbaru', nama_vendor: 'Pemilik Uji', vendor_hp: '081234567890', listed_by: users.marketing.id, status_unit: 'tersedia', kategori: 'kombinasi', kategori_kombinasi_1: 'rumah', kategori_kombinasi_2: 'ruko', luas_bangunan: '', area_kecamatan: '', sertifikat: '' };
    const createdProperty = await api('/properti', { method: 'POST', body: property, status: 201 });
    const id = createdProperty.id;
    await api(`/properti/${id}`, { method: 'PUT', body: { nama_vendor: 'Pemilik Uji', vendor_hp: '081298765432' } });
    const initial = await api(`/properti/${id}`);
    assert.equal(initial.vendor_hp, '081298765432');
    assert.equal(initial.no_folder, null); assert.equal(initial.luas_bangunan, null); assert.equal(initial.tanggal_listing, '2026-10-16'); assert(!('feed' in initial));
    const safe = await api(`/properti/${id}`, { role: 'marketing' }); assert(!('vendor_hp' in safe));
    await api(`/properti/${id}`, { role: 'marketing', method: 'PUT', body: { harga_jual: 1 }, status: 403 });
    await api(`/properti/${id}`, { method: 'PUT', body: { luas_tanah: 435, luas_bangunan: 300, kamar_tidur: 4, kamar_mandi: 4, sertifikat: 'SHM', sumber_air: 'Sumur Bor', daftar_bonus: 'Full furnish', spanduk: true, kunci: true } });
    const fixture = path.join(artifacts, 'landscape.jpg');
    await sharp({ create: { width: 1200, height: 700, channels: 3, background: '#3d8099' } }).composite([{ input: Buffer.from('<svg width="1200" height="700"><rect x="80" y="80" width="420" height="500" fill="#d3a247"/><circle cx="850" cy="350" r="180" fill="#8c2438"/></svg>') }]).jpeg().toFile(fixture);
    const jpeg = await fs.readFile(fixture);
    const photoBody = new FormData(); photoBody.append('fotos', new Blob([jpeg], { type: 'image/jpeg' }), 'landscape.jpg');
    photoBody.append('fotos', new Blob([jpeg], { type: 'image/jpeg' }), 'landscape2.jpg');
    await api(`/properti/${id}`, { method: 'PUT', body: photoBody });
    let detail = await api(`/properti/${id}`); assert.equal(detail.foto_properti.length, 2);
    for (const photo of detail.foto_properti) { files.add(photo.url_foto); assert.equal(photo.watermark_version, 1); }
    const bytes = await api(`/properti/${id}/fotos/${detail.foto_properti[0].id_fotoproperti}/download`, { binary: true });
    assert.equal((await sharp(bytes).metadata()).format, 'jpeg'); assert(!bytes.equals(jpeg));
    const share = await api(`/properti/${id}/share`); assert.match(share.shareText, /RUMAH.*RUKO/); assert(!/Marketing:/i.test(share.shareText));
    for (const route of ['/properti', '/staff', '/statistik', '/statistik/by-periode?dari=2026-01-01&sampai=2026-12-31', '/auth/notifikasi', '/laporan', '/setting']) await api(route);
    await api('/laporan', { role: 'marketing', status: 403 });
    await db.query('DELETE FROM setting WHERE key_name = ?', ['hero_title']);
    await api('/setting', { method: 'PUT', body: { hero_title: 'Temukan properti pilihan' } });
    assert.equal((await api('/setting')).hero_title, 'Temukan properti pilihan');
    const profileBody = new FormData();
    profileBody.append('foto', new Blob([await sharp(jpeg).resize(500, 500, { fit: 'cover' }).jpeg().toBuffer()], { type: 'image/jpeg' }), 'profile.jpg');
    const uploadedProfile = await api('/auth/upload-foto', { method: 'POST', body: profileBody }); files.add(uploadedProfile.fotoUrl);
    const updatedProfile = await api('/auth/profile', { method: 'PUT', body: { nama: 'Admin Profil Uji', no_hp: '081234567891' } });
    assert.equal(updatedProfile.user.foto_profil, uploadedProfile.fotoUrl);
    assert.equal((await api('/auth/me')).foto_profil, uploadedProfile.fotoUrl);
    // Launch an isolated frontend pointing at this API. The user's servers keep running.
    if (!process.argv.includes('--api-only')) {
    vite = spawn(process.execPath, [path.resolve(__dirname, '../../philip-app/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5175', '--strictPort'], { cwd: path.resolve(__dirname, '../../philip-app'), env: { ...process.env, VITE_API_URL: '/api', LOCAL_API_TARGET: apiOrigin }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let viteOutput = ''; vite.stdout.on('data', b => { viteOutput += b; }); vite.stderr.on('data', b => { viteOutput += b; });
    for (let i = 0; i < 100; i++) { try { if ((await fetch('http://127.0.0.1:5175')).ok) break; } catch {} await new Promise(r => setTimeout(r, 200)); if (i === 99) throw Error(viteOutput); }
    const puppeteer = require('puppeteer'); browser = await puppeteer.launch({ headless: process.argv.includes('--shell') ? 'shell' : true, timeout: 10000 });
    const context = await browser.createBrowserContext(); const page = await context.newPage(); lastPage = page;
    page.on("response", r => { if (r.url().includes("/api/") && r.request().method() !== "GET") console.log("Browser request", r.request().method(), new URL(r.url()).pathname, r.status()); });
    const browserErrors = []; page.on('pageerror', e => browserErrors.push(e.message));
    const origin = 'http://127.0.0.1:5175';
    await page.evaluateOnNewDocument(user => localStorage.setItem('user', JSON.stringify(user)), users.admin);
    async function clickText(text) { await page.waitForFunction(text => [...document.querySelectorAll('button')].some(e => e.textContent.trim() === text && !e.disabled), {}, text); const clicked = await page.evaluate(text => { const el = [...document.querySelectorAll('button')].find(e => e.textContent.trim() === text); el?.click(); return !!el; }, text); assert(clicked, `Button ${text}`); }
    async function audit(name, width) {
      const { AxePuppeteer } = require('@axe-core/puppeteer');
      await page.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, 150));
      const report = await new AxePuppeteer(page).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      const issues = report.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      await page.screenshot({ path: path.join(artifacts, `${name}-${width}.png`), fullPage: true });
      await fs.writeFile(path.join(artifacts, `${name}-${width}.json`), JSON.stringify({ issues, overflow }, null, 2));
      assert(!overflow, `${name} overflow at ${width}`); assert.equal(issues.length, 0, `${name} accessibility: ${JSON.stringify(issues)}`);
      results.push(`UI ${name} ${width}px`); console.log(`UI ${name} ${width}px passed`);
    }
    for (const width of [1440, 390, 320]) {
      await page.setViewport({ width, height: width > 600 ? 1000 : 844 });
      for (const route of ['dashboard', 'property', `property/${id}`, 'staff', 'settings', 'reports', 'register']) {
        await page.goto(origin + '/' + route, { waitUntil: 'networkidle0' });
        await audit(route.startsWith('property/') ? 'detail' : route, width);
        if (route === 'property') { await clickText('Tambah Properti'); await page.waitForSelector('.property-form'); await audit('property-form', width); }
        if (route === 'settings') {
          await clickText('Profil Saya'); await audit('profile', width);
          const picker = await page.$('input[type=file]'); await picker.uploadFile(fixture);
          await page.waitForSelector('.crop-stage canvas'); await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Gunakan foto' && !b.disabled));
          await page.$eval('[aria-label="Zoom foto"]', el => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(el, '1.8'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
          const canvas = await page.$('.crop-stage canvas'); await canvas.focus(); await page.keyboard.press('ArrowRight');
          await audit('profile-crop', width); await clickText('Gunakan foto'); await page.waitForSelector('.crop-stage', { hidden: true });
          const upload = page.waitForResponse(r => r.url().endsWith('/auth/upload-foto') && r.request().method() === 'POST');
          await clickText('Simpan Profil'); const saved = await upload; assert.equal(saved.status(), 200); const savedPhoto = await saved.json(); files.add(savedPhoto.fotoUrl);
          await page.waitForFunction(() => document.body.textContent.includes('Profil berhasil diperbarui'));
          const profileImage = await fetch(apiOrigin + savedPhoto.fotoUrl).then(r => r.arrayBuffer());
          const metadata = await sharp(Buffer.from(profileImage)).metadata(); assert.equal(metadata.width, metadata.height);
          await clickText('Keamanan'); await audit('password', width);
        }
      }
    }
    await page.goto(origin + '/staff', { waitUntil: 'networkidle0' });
    const editButtons = await page.$$('button[aria-label^="Edit "]');
    assert(editButtons.length > 0, "Staff edit must be tested"); { await editButtons[0].click(); await audit('staff-edit', 320); const picker = await page.$('dialog[open] input[type=file]'); await picker.uploadFile(fixture); await page.waitForSelector('.crop-stage canvas'); await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Gunakan foto' && !b.disabled)); await clickText('Gunakan foto'); await page.waitForSelector('.crop-stage', { hidden: true }); await clickText('Update Staff'); await page.waitForFunction(() => document.body.textContent.includes('Data staff berhasil diperbarui')); }
    assert.equal(browserErrors.length, 0, browserErrors.join('\n'));
    }
    // Real renderer + real SQL catches report title limits and JOIN/schema errors.
    for (const tipe of (process.argv.includes('--api-only') || process.argv.includes('--skip-pdf')) ? [] : ['stok', 'statistik', 'penjualan']) {
      const report = await api('/laporan/generate', { method: 'POST', body: { tipe, periodeStart: '2026-01-01', periodeEnd: '2026-12-31' }, status: 200 });
      if (report.downloadUrl) files.add(report.downloadUrl);
    }
    await api(`/properti/${id}/transaksi`, { method: 'POST', body: { jenis: 'terjual', harga_aktual: 725000000, komisi_persen: 2, tanggal_transaksi: '2026-10-16' }, status: 201 });
    await api(`/properti/${id}/transaksi`, { method: 'POST', body: { jenis: 'terjual', harga_aktual: 725000000 }, status: 409 });
    await api(`/properti/${id}`, { method: 'DELETE', status: 409 });
    await api('/auth/logout', { method: 'POST' }); await api('/auth/me', { status: 401 });
    await fs.writeFile(path.join(artifacts, 'results.json'), JSON.stringify({ database: 'isolated local MySQL', results, browserTested: !process.argv.includes('--api-only') }, null, 2));
    console.log(`PASS: ${results.length} checks; real MySQL + HTTP (see results.json for browser coverage).`);
  } catch (error) {
    if (lastPage) { await lastPage.screenshot({ path: path.join(artifacts, 'failure.png'), fullPage: true }).catch(() => {}); await fs.writeFile(path.join(artifacts, 'failure.txt'), await lastPage.evaluate(() => document.body.innerText).catch(() => 'Page closed')); }
    throw error;
  } finally {
    if (browser) await browser.close();
    if (vite) vite.kill();
    if (server) await new Promise(resolve => server.close(resolve));
    if (created) {
      // Only delete paths referenced by the disposable database, never fixtures
      // or existing company assets. All seeded records start without file paths.
      for (const sql of ['SELECT url_foto AS file FROM foto_properti', 'SELECT foto_profil AS file FROM user', 'SELECT file_pdf_url AS file FROM laporan']) {
        try { const [rows] = await db.query(sql); rows.forEach(r => { if (r.file) files.add(r.file); }); } catch {}
      }
      for (const file of files) {
        if (!/^\/uploads\/(?:profil|properti|laporan)\/[a-zA-Z0-9_./-]+$/.test(file)) continue;
        const root = path.resolve(__dirname, '../uploads'); const target = path.resolve(__dirname, '..', '.' + file);
        if (!target.startsWith(root + path.sep)) throw Error('Cleanup outside uploads rejected');
        await fs.unlink(target).catch(e => { if (e.code !== 'ENOENT') throw e; });
      }
    }
    if (pool) await pool.end();
    if (created && testName !== source && /^philip_test_\d+_[a-f0-9]{8}$/.test(testName)) await db.query('DROP DATABASE ??', [testName]);
    await db.end();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
