// Browser UI audit using synthetic records and intercepted API requests only.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');

async function main() {
  const origin = 'http://127.0.0.1:5173';
  const dir = path.resolve(__dirname, '../.test-artifacts');
  await fs.mkdir(dir, { recursive: true });
  const id = '00000000-0000-4000-8000-000000000001';
  const property = { id, id_properti: id, no_folder: null, kategori: 'rumah', subkategori: '', jenis_penawaran: 'dijual', harga_jual: 725000000,
    nama_jalan: 'Jalan Bakti Nomor 123 Pekanbaru', kota: 'Pekanbaru', status_unit: 'tersedia', tanggal_listing: '2026-09-20',
    luas_tanah: 435, luas_bangunan: 300, kamar_tidur: 4, kamar_mandi: 4, sertifikat: 'SHM', listed_by: id, listed_by_nama: 'Ayu', nama_vendor: 'Vendor Uji', vendor_hp: '081234567890',
    gmaps_url: 'https://maps.app.goo.gl/test', spanduk: 1, kunci: 0,
    foto_properti: [1, 2, 3].map(i => ({ id_fotoproperti: `00000000-0000-4000-8000-00000000000${i}`, url_foto: '/brand/company-mark.jpeg', urutan: i, is_cover: i === 1 ? 1 : 0 })) };
  const browser = await puppeteer.launch({ headless: true });
  const results = []; const errors = [];
  try {
    for (const role of ['guest', 'admin', 'marketing', 'direktur']) {
      const context = await browser.createBrowserContext(); const page = await context.newPage();
      const user = { id, id_user: id, role, nama: 'Ayu Audit', email: 'audit@example.test', token: 'test-only', no_hp: '081234567890', is_active: 1 };
      if (role !== 'guest') await page.evaluateOnNewDocument(user => localStorage.setItem('user', JSON.stringify(user)), user);
      page.on('pageerror', error => errors.push({ role, url: page.url(), message: error.message }));
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = new URL(request.url());
        if ((!url.pathname.startsWith('/api/') && url.origin === origin) || url.protocol === 'data:' || url.protocol === 'blob:') return request.continue();
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let data = [];
        if (url.pathname === '/api/auth/me') data = user;
        if (url.pathname === '/api/setting') data = { company_name: 'Philip Real Estate', company_tagline: 'Jual Beli Sewa KPR' };
        if (url.pathname === '/api/properti') data = [property];
        if (url.pathname === `/api/properti/${id}`) data = property;
        if (url.pathname === '/api/properti/marketing' || url.pathname === '/api/staff') data = [{ ...user, role: 'marketing' }];
        if (url.pathname.startsWith('/api/statistik')) data = { byStatus: {}, summary: {}, byTipe: [], byPenawaran: [], byJenis: [], trenBulan: [], total_listing: 1 };
        return request.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(data) });
      });
      const routes = role === 'guest' ? ['/login', '/forgot', '/reset-password'] : ['/dashboard', '/property', `/property/${id}`, '/staff', '/settings', ...(role === 'marketing' ? [] : ['/reports', '/register'])];
      async function audit(name, width) {
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const report = await new AxePuppeteer(page).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        const violations = report.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary, html: n.html })) }));
        results.push({ role, page: name, width, overflow, violations });
        if (width === 390) await page.screenshot({ path: path.join(dir, `ui-${role}-${name.replace(/[^a-z0-9]/gi, '_')}.png`) });
        console.log(`${role} ${name} ${width}: ${violations.length} accessibility issues; overflow=${overflow}`);
      }
      for (const width of [1440, 390]) {
        await page.setViewport({ width, height: width === 390 ? 844 : 1000 });
        for (const route of routes) {
          await page.goto(origin + route, { waitUntil: 'networkidle2' });
          await audit(route, width);
          if (route === '/settings') for (const tab of ['Profil Saya', 'Keamanan']) {
            const clicked = await page.evaluate(label => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === label); button?.click(); return Boolean(button); }, tab);
            if (clicked) await audit(`/settings-${tab}`, width);
          }
          if (route === '/property' && role === 'admin') {
            await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Tambah Properti')).click());
            await page.waitForSelector('.modal-box form');
            await audit('/property-add', width);
          }
        }
      }
      await context.close();
    }
  } finally { await browser.close(); }
  await fs.writeFile(path.join(dir, 'ui-audit.json'), JSON.stringify({ results, errors }, null, 2));
  assert.equal(errors.length, 0, JSON.stringify(errors));
  if (!process.argv.includes('--collect')) assert.equal(results.filter(r => r.overflow || r.violations.length).length, 0, 'See .test-artifacts/ui-audit.json');
  console.log(`Audited ${results.length} desktop/mobile page states.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
