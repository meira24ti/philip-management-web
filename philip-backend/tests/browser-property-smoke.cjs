// Run with the frontend dev server on http://127.0.0.1:5173.
// All API calls are intercepted; no database or live listing is changed.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const puppeteer = require("puppeteer");
const sharp = require("sharp");
const { watermarkPropertyPhoto } = require("../utils/propertyImages");

async function main() {
  const outputDir = path.resolve(__dirname, "../.test-artifacts");
  await fs.mkdir(outputDir, { recursive: true });
  const source = path.resolve(__dirname, "../uploads/properti/7af4139d-81ab-4854-a2d4-eadf1adf3759/1783375261128.jpeg");
  const sourcePhoto = await fs.readFile(source).catch(() => sharp({ create: { width: 1600, height: 900, channels: 3, background: "#418baa" } }).jpeg().toBuffer());
  const photo = await watermarkPropertyPhoto(sourcePhoto);
  await fs.writeFile(path.join(outputDir, "watermark.jpg"), photo);
  const portraitPath = path.join(outputDir, "portrait.png");
  await sharp({ create: { width: 800, height: 1400, channels: 3, background: "#418baa" } }).png().toFile(portraitPath);
  const user = { id: "test-user", id_user: "test-user", nama: "Ayu", role: "admin", no_hp: "08123456789", token: "test-only" };
  const property = { id: "test-property", id_properti: "test-property", kategori: "kombinasi", kategori_kombinasi_1: "rumah", kategori_kombinasi_2: "ruko",
    subkategori: "", jenis_penawaran: "dijual_dan_disewa", harga_jual: 725000000, harga_sewa: 45000000, nama_jalan: "Jalan Bakti Perumahan Taman Indah Blok A Nomor 123, Kelurahan Simpang Baru, Kecamatan Bina Widya, Kota Pekanbaru, Provinsi Riau",
    kota: "Pekanbaru", luas_tanah: 435, luas_bangunan: 300, kamar_tidur: 4, kamar_mandi: 4, daftar_bonus: "Full furnish", sumber_air: "Air sumur bor", sertifikat: "SHM",
    tanggal_listing: "2026-09-20T00:00:00.000Z", no_folder: null, status_unit: "terjual", nama_vendor: "Vendor Uji", vendor_hp: "08111", listed_by: user.id,
    foto_properti: [1, 2, 3, 4].map(index => ({ id_fotoproperti: `photo-${index}`, url_foto: `/uploads/test-${index}.jpg`, urutan: index, is_cover: index === 1 ? 1 : 0, watermark_version: 1 })) };
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.evaluateOnNewDocument(user => localStorage.setItem("user", JSON.stringify(user)), user);
    await page.setRequestInterception(true);
    page.on("request", async request => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith("/api/") && !url.pathname.startsWith("/uploads/") && url.origin === "http://127.0.0.1:5173") return request.continue();
      const headers = { "Access-Control-Allow-Origin": "http://127.0.0.1:5173", "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Headers": "authorization,content-type", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS" };
      if (request.method() === "OPTIONS") return request.respond({ status: 204, headers });
      if (url.pathname.startsWith("/uploads/") || url.pathname.endsWith("/download")) return request.respond({ status: 200, contentType: "image/jpeg", headers, body: photo });
      let data = [];
      if (url.pathname === "/api/auth/me") data = user;
      if (url.pathname === "/api/setting") data = { company_name: "Philip Real Estate", company_logo: "" };
      if (url.pathname === "/api/properti") data = [property];
      if (url.pathname === "/api/properti/test-property") data = property;
      if (url.pathname === "/api/properti/marketing") data = [user];
      return request.respond({ status: 200, contentType: "application/json", headers, body: JSON.stringify(data) });
    });
    await page.goto("http://127.0.0.1:5173/property", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.body.innerText.includes("Tambah Properti"));
    await page.evaluate(() => Array.from(document.querySelectorAll("button")).find(button => button.textContent.includes("Tambah Properti")).click());
    await page.waitForSelector('.modal-box input[placeholder="PRE-001"]');
    assert.equal(await page.$eval('.modal-box input[placeholder="PRE-001"]', input => input.required), false);
    assert.equal(await page.$eval(".modal-box form", form => /Feed Dibuat/i.test(form.textContent)), false);
    await page.select(".modal-box form select", "kombinasi");
    await page.waitForFunction(() => document.body.innerText.includes("Jenis kombinasi 2"));
    const combinationSelects = await page.$$(".modal-box form label select");
    // First select is category, second is subtype, then the two combination selectors.
    await combinationSelects[2].select("rumah");
    assert.equal(await combinationSelects[3].evaluate(select => Array.from(select.options).find(option => option.value === "rumah").disabled), true);
    await combinationSelects[3].select("ruko");
    const input = await page.$('input[aria-label="Tambah foto properti"]');
    await input.uploadFile(portraitPath);
    await page.waitForSelector("dialog[open] canvas");
    await page.waitForFunction(() => Array.from(document.querySelectorAll("dialog button")).some(button => button.textContent === "Gunakan foto" && !button.disabled));
    await page.$eval('input[aria-label="Zoom foto"]', input => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, "2");
      input.dispatchEvent(new Event("input", { bubbles: true })); input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.focus("dialog canvas"); await page.keyboard.press("ArrowRight");
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(outputDir, "crop-mobile.png") });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= 390), true);
    await page.evaluate(() => Array.from(document.querySelectorAll("dialog button")).find(button => button.textContent === "Gunakan foto").click());
    await page.waitForSelector('img[alt="Hasil crop foto 1"]');
    const cropped = await page.$eval('img[alt="Hasil crop foto 1"]', image => ({ width: image.naturalWidth, height: image.naturalHeight }));
    assert.equal(cropped.width, cropped.height); assert.ok(cropped.width > 0);
    await page.goto("http://127.0.0.1:5173/property/test-property", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('section[aria-label="Download foto properti"]');
    const detail = await page.evaluate(() => document.body.innerText);
    assert.match(detail, /20 September 2026/); assert.doesNotMatch(detail, /2026-09-20T/); assert.match(detail, /Rumah \+ Ruko/i); assert.doesNotMatch(detail, /Feed dibuat/);
    await page.evaluate(() => {
      window.testDownloads = [];
      HTMLAnchorElement.prototype.click = function () {
        if (this.download) window.testDownloads.push({ name: this.download, promise: fetch(this.href).then(response => response.arrayBuffer()).then(buffer => Array.from(new Uint8Array(buffer))) });
      };
    });
    const section = 'section[aria-label="Download foto properti"]';
    const choices = await page.$$(`${section} input[type="checkbox"]`);
    await choices[0].click(); await choices[2].click();
    await page.evaluate(selector => Array.from(document.querySelectorAll(`${selector} button`)).find(button => button.textContent.includes("Download 2 foto")).click(), section);
    await page.waitForFunction(() => window.testDownloads.length === 1);
    const zip = await page.evaluate(async () => ({ name: window.testDownloads[0].name, bytes: await window.testDownloads[0].promise }));
    const { unzipSync } = await import("../../philip-app/node_modules/fflate/esm/index.mjs");
    assert.deepEqual(Object.keys(unzipSync(new Uint8Array(zip.bytes))), ["foto-1.jpg", "foto-3.jpg"]);
    await page.screenshot({ path: path.join(outputDir, "detail-mobile.png"), fullPage: true });
    const result = await page.evaluate(async property => {
      const { generateFlyerPNG } = await import("/src/utils/generateFlyer.js");
      const text = [];
      const original = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (value, x, y) { text.push({ value, x, y, font: this.font, width: this.measureText(value).width }); return original.call(this, value, x, y); };
      try {
        const blob = await generateFlyerPNG(property, { scale: 1, actor: { nama: "Ayu", no_hp: "08123456789" } });
        return { text, image: await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); }) };
      } finally { CanvasRenderingContext2D.prototype.fillText = original; }
    }, property);
    await fs.writeFile(path.join(outputDir, "flyer.png"), Buffer.from(result.image.split(",")[1], "base64"));
    assert.ok(result.text.some(item => item.value.includes("RUMAH + RUKO")));
    assert.ok(result.text.filter(item => item.y > 1068 && item.y < 1200).map(item => item.value).join(" ").includes(property.nama_jalan));
    assert.ok(result.text.every(item => item.y > 0 && item.y < 1920 && item.width < 1000));
    assert.ok(result.text.every(item => !item.value.includes("Marketing:")));
    assert.equal(pageErrors.length, 0, pageErrors.join("\n"));
    console.log("Browser smoke passed: optional folder, combination selectors, square crop and zoom, mobile layout, date-only detail, selected ZIP download, and full flyer rendering.");
    console.log(`Preview artifacts: ${outputDir}`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
