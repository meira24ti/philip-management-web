// Real Chromium and PDF rendering, synthetic API/SQL only. Requires Vite preview on 4173.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const puppeteer = require('puppeteer');
const pool = require('../config/db');
const reports = require('../controllers/laporanController');

async function main() {
  const origin = 'http://127.0.0.1:4173';
  const output = path.resolve(__dirname, '../.test-artifacts');
  await fs.mkdir(output, { recursive: true });
  const browser = await puppeteer.launch({ headless: true });
  try {
    for (const role of ['admin', 'direktur']) {
      const page = await browser.newPage();
      const user = { id: 'audit-user', id_user: 'audit-user', nama: 'Audit user', email: 'audit@example.test', role, token: 'test-only' };
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.evaluateOnNewDocument(user => localStorage.setItem('user', JSON.stringify(user)), user);
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = new URL(request.url());
        if (url.origin === origin) return request.continue();
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let data = [];
        if (url.pathname === '/api/auth/me') data = user;
        if (url.pathname === '/api/setting') data = { company_name: 'Philip Real Estate' };
        if (url.pathname === '/api/staff' && request.method() === 'POST') data = { defaultPassword: 'Synthetic-password-123' };
        request.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(data) });
      });
      await page.goto(origin + '/register', { waitUntil: 'networkidle2' });
      await page.waitForSelector('#register-role');
      assert.deepEqual(await page.$$eval('#register-role option', options => options.map(o => o.value)), role === 'admin' ? ['marketing'] : ['direktur', 'admin', 'marketing']);
      assert.ok(await page.$('meta[http-equiv="Content-Security-Policy"]'));
      await page.goto(origin + '/staff', { waitUntil: 'networkidle2' });
      await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Tambah Staff')).click());
      await page.waitForSelector('dialog[open] select[name="role"]');
      assert.deepEqual(await page.$$eval('dialog[open] select[name="role"] option', options => options.map(o => o.value).filter(Boolean)), role === 'admin' ? ['marketing'] : ['direktur', 'admin', 'marketing']);
      for (let i = 0; i < 15; i++) { await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => Boolean(document.activeElement.closest('dialog[open]')))); }
      await page.keyboard.press('Escape');
      assert.equal(await page.$('dialog[open]'), null);
      await page.setViewport({ width: 390, height: 844 });
      await page.click('button[aria-label="Buka menu navigasi"]');
      assert.equal(await page.$eval('#mobile-navigation', el => el.inert), false);
      await page.keyboard.press('Escape');
      assert.equal(await page.$eval('#mobile-navigation', el => el.inert), true);
      assert.deepEqual(errors, []);
      // An injected inline script must be blocked by the production policy.
      const executed = await page.evaluate(() => { const script = document.createElement('script'); script.textContent = 'window.auditInjected = true'; document.body.append(script); return window.auditInjected === true; });
      assert.equal(executed, false);
      await page.close();
    }
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', request => new URL(request.url()).origin === origin ? request.continue() : request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' }, body: '{}' }));
    await page.evaluateOnNewDocument(() => localStorage.setItem('user', '{malformed'));
    await page.goto(origin + '/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="password"]');
    assert.ok(await page.$('form')); await page.close();
    console.log('Production browser passed: role options, dialog focus/Escape, mobile navigation, malformed session recovery, CSP blocking inline script.');
  } finally { await browser.close(); }

  const originalQuery = pool.query;
  let savedUrl;
  pool.query = async (sql, args) => {
    if (sql.includes('SELECT t.*')) return [[{ nama_jalan: '<script>alert(1)</script>', kota: 'Pekanbaru', jenis: 'terjual', kategori: 'rumah', tanggal_transaksi: '2026-09-20', harga_aktual: 725000000, komisi_nominal: 14500000 }]];
    if (sql.includes('INSERT INTO laporan')) { savedUrl = args[0].file_pdf_url; return [{ affectedRows: 1 }]; }
    throw new Error('Unexpected SQL in report smoke');
  };
  const response = () => ({ code: 200, status(code) { this.code = code; return this; }, set() { return this; }, json(body) { this.body = body; } });
  try {
    const res = response();
    const request = { body: { tipe: 'penjualan', periodeStart: '2026-09-01', periodeEnd: '2026-09-30' }, user: { id: 'audit-user' } };
    const pending = reports.generate(request, res);
    const duplicate = response(); await reports.generate(request, duplicate); assert.equal(duplicate.code, 429);
    await pending;
    assert.equal(res.code, 200, JSON.stringify(res.body));
    const pdf = await fs.readFile(path.join(__dirname, '..', savedUrl));
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-'); assert.ok(pdf.length > 5000);
    await fs.writeFile(path.join(output, 'report-smoke.pdf'), pdf);
    console.log('Real PDF generation passed; concurrent generation rejected; synthetic report saved under .test-artifacts.');
  } finally { pool.query = originalQuery; if (savedUrl) await fs.unlink(path.join(__dirname, '..', savedUrl)).catch(() => {}); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
