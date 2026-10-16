// philip-backend/controllers/laporanController.js
const pool = require("../config/db");
const puppeteer = require("puppeteer");
const crypto = require("crypto");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { buildLaporanHTML, enrichReportData } = require("../utils/reportBuilder");
const reportDirectory = path.join(__dirname, "../uploads/laporan");
let generating = false;

function findChromeExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.platform === "win32") {
    const candidates = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
    ];
    return candidates.find((p) => fsSync.existsSync(p)) || null;
  }
  return null;
}

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.id_laporan AS id, l.*, u.nama AS dibuat_oleh_nama
      FROM laporan l
      JOIN user u ON u.id_user = l.dibuat_oleh
      ORDER BY l.created_at DESC`);
    res.json(rows);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
  }
};

exports.generate = async (req, res) => {
  if (generating) return res.status(429).set("Retry-After", "30").json({ message: "Laporan sedang diproses. Silakan coba kembali sebentar lagi." });
  generating = true;
  const { tipe, periodeStart, periodeEnd } = req.body || {};
  let browser;
  let savedPath;
  try {
    const validTypes = new Set(["penjualan", "stok", "statistik"]);
    const validDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
      const parsed = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    };
    if (!validTypes.has(tipe) || !validDate(periodeStart) || !validDate(periodeEnd) || periodeStart > periodeEnd) {
      const error = new Error("Tipe laporan atau periode tidak valid");
      error.statusCode = 400;
      throw error;
    }
    const periodDays = Math.floor(
      (new Date(`${periodeEnd}T00:00:00Z`) - new Date(`${periodeStart}T00:00:00Z`)) / 86400000
    ) + 1;
    if (periodDays > 3660) {
      const error = new Error("Periode laporan maksimal 10 tahun");
      error.statusCode = 400;
      throw error;
    }
    let data = {};

    if (tipe === "penjualan") {
      // ✅ Gunakan id_properti sesuai schema transaksi
      const [transaksi] = await pool.query(`
        SELECT t.*, p.nama_jalan, p.kota, p.jenis_penawaran, tp.kategori
        FROM transaksi t
        JOIN properti p ON p.id_properti = t.id_properti
        LEFT JOIN tipe_properti tp ON tp.id_properti = t.id_properti
        WHERE t.tanggal_transaksi >= ?
          AND t.tanggal_transaksi < DATE_ADD(?, INTERVAL 1 DAY)
        ORDER BY t.tanggal_transaksi DESC`,
        [periodeStart, periodeEnd]);
      data = { transaksi, totalKomisi: transaksi.reduce((s, t) => s + Number(t.komisi_nominal || 0), 0) };

    } else if (tipe === "stok") {
      const [[byStatus]] = await pool.query(`
        SELECT COALESCE(SUM(p.status_unit='tersedia'), 0) AS tersedia,
               COALESCE(SUM(p.status_unit='terjual'), 0) AS terjual,
               COALESCE(SUM(p.status_unit='tersewa'), 0) AS tersewa,
               COALESCE(SUM(p.status_unit='negosiasi'), 0) AS negosiasi,
               COUNT(*) AS total
        FROM properti p
        WHERE p.tanggal_listing >= ?
          AND p.tanggal_listing < DATE_ADD(?, INTERVAL 1 DAY)`,
        [periodeStart, periodeEnd]);
      const [byTipe] = await pool.query(`
        SELECT COALESCE(NULLIF(tp.kategori, ''), 'lainnya') AS kategori,
               COUNT(DISTINCT p.id_properti) AS jumlah
        FROM properti p
        LEFT JOIN tipe_properti tp ON tp.id_properti = p.id_properti
        WHERE p.tanggal_listing >= ?
          AND p.tanggal_listing < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY COALESCE(NULLIF(tp.kategori, ''), 'lainnya')
        ORDER BY jumlah DESC, kategori ASC`,
        [periodeStart, periodeEnd]);
      const [byPenawaran] = await pool.query(`
        SELECT COALESCE(NULLIF(p.jenis_penawaran, ''), 'lainnya') AS jenis_penawaran,
               COUNT(*) AS jumlah
        FROM properti p
        WHERE p.tanggal_listing >= ?
          AND p.tanggal_listing < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY COALESCE(NULLIF(p.jenis_penawaran, ''), 'lainnya')
        ORDER BY jumlah DESC, jenis_penawaran ASC`,
        [periodeStart, periodeEnd]);
      data = { byStatus, byTipe, byPenawaran };

    } else {
      const [[byStatus]] = await pool.query(`
        SELECT
          COUNT(*) AS total_listing,
          COALESCE(SUM(p.status_unit='tersedia'), 0) AS tersedia,
          COALESCE(SUM(p.status_unit='terjual'), 0) AS terjual,
          COALESCE(SUM(p.status_unit='tersewa'), 0) AS tersewa,
          COALESCE(SUM(p.status_unit='negosiasi'), 0) AS negosiasi
        FROM properti p
        WHERE p.tanggal_listing >= ?
          AND p.tanggal_listing < DATE_ADD(?, INTERVAL 1 DAY)`,
        [periodeStart, periodeEnd]);
      const [byTipe] = await pool.query(`
        SELECT COALESCE(NULLIF(tp.kategori, ''), 'lainnya') AS kategori,
               COUNT(DISTINCT p.id_properti) AS jumlah
        FROM properti p
        LEFT JOIN tipe_properti tp ON tp.id_properti = p.id_properti
        WHERE p.tanggal_listing >= ?
          AND p.tanggal_listing < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY COALESCE(NULLIF(tp.kategori, ''), 'lainnya')
        ORDER BY jumlah DESC, kategori ASC`,
        [periodeStart, periodeEnd]);
      const [trenBulan] = await pool.query(`
        SELECT DATE_FORMAT(tanggal_transaksi,'%Y-%m') AS bulan,
               COUNT(*) AS total_transaksi, SUM(komisi_nominal) AS total_komisi
        FROM transaksi
        WHERE tanggal_transaksi >= ?
          AND tanggal_transaksi < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY bulan ORDER BY bulan`,
        [periodeStart, periodeEnd]);
      const [[summary]] = await pool.query(`
        SELECT
          COUNT(*) AS total_transaksi,
          SUM(jenis='terjual') AS total_terjual,
          SUM(jenis='tersewa') AS total_tersewa,
          SUM(harga_aktual) AS nilai_transaksi,
          SUM(komisi_nominal) AS total_komisi
        FROM transaksi
        WHERE tanggal_transaksi >= ?
          AND tanggal_transaksi < DATE_ADD(?, INTERVAL 1 DAY)`,
        [periodeStart, periodeEnd]);
      const [byJenis] = await pool.query(`
        SELECT jenis, COUNT(*) AS jumlah
        FROM transaksi
        WHERE tanggal_transaksi >= ?
          AND tanggal_transaksi < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY jenis
        ORDER BY jumlah DESC`,
        [periodeStart, periodeEnd]);
      const [byPenawaran] = await pool.query(`
        SELECT COALESCE(NULLIF(p.jenis_penawaran, ''), 'lainnya') AS jenis_penawaran,
               COUNT(*) AS jumlah
        FROM properti p
        WHERE p.tanggal_listing >= ?
          AND p.tanggal_listing < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY COALESCE(NULLIF(p.jenis_penawaran, ''), 'lainnya')
        ORDER BY jumlah DESC, jenis_penawaran ASC`,
        [periodeStart, periodeEnd]);
      data = { byStatus, byTipe, byPenawaran, byJenis, trenBulan, summary };
    }

    const reportLabel = { penjualan: "Penjualan", stok: "Stok Properti", statistik: "Statistik" }[tipe] || tipe;
    const judul = "Laporan " + reportLabel + " - " + periodeStart + " s/d " + periodeEnd;
    data = enrichReportData(tipe, data, periodeStart, periodeEnd);
    const html = buildLaporanHTML(judul, tipe, data, periodeStart, periodeEnd);

    const browserOptions = { headless: true, timeout: 30000 };
    if (process.env.PUPPETEER_NO_SANDBOX === "true") {
      browserOptions.args = ["--no-sandbox", "--disable-setuid-sandbox"];
    }
    const chromePath = findChromeExecutable();
    if (chromePath) {
      browserOptions.executablePath = chromePath;
    }

    browser = await puppeteer.launch(browserOptions);
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", request => request.url().startsWith("data:") ? request.continue() : request.abort());
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 });
    const pdfBuffer = await page.pdf({
      format: "A4", printBackground: true, timeout: 30000,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" }
    });
    await browser.close();
    browser = null;

    await fs.mkdir(reportDirectory, { recursive: true });
    const filename = `laporan-${tipe}-${crypto.randomUUID()}.pdf`;
    savedPath = path.join(reportDirectory, filename);
    await fs.writeFile(savedPath, pdfBuffer);

    // ✅ Gunakan id_laporan sesuai schema
    const id = crypto.randomUUID();
    await pool.query("INSERT INTO laporan SET ?", [{
      id_laporan: id,
      dibuat_oleh: req.user.id,
      judul,
      tipe,
      periode_mulai: periodeStart,
      periode_selesai: periodeEnd,
      file_pdf_url: `/uploads/laporan/${filename}`
    }]);

    savedPath = null;
    res.json({ message: "Laporan berhasil dibuat", id, downloadUrl: `/uploads/laporan/${filename}` });
  } catch (err) {
    if (savedPath) await fs.unlink(savedPath).catch(() => {});
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Gagal generate laporan" });
  } finally {
    if (browser) {
      await browser.close().catch(function (closeError) {
        console.error("Gagal menutup browser PDF:", closeError);
      });
    }
    generating = false;
  }
};

exports.download = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM laporan WHERE id_laporan = ?", [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Laporan tidak ditemukan" });

    const fileUrl = rows[0].file_pdf_url;
    if (typeof fileUrl !== "string" || !/^\/uploads\/laporan\/[a-zA-Z0-9_-]+\.pdf$/.test(fileUrl)) return res.status(404).json({ message: "File laporan tidak ditemukan" });
    const filePath = path.join(reportDirectory, path.basename(fileUrl));

    if (!(await fs.access(filePath).then(() => true).catch(() => false))) {
      return res.status(404).json({ message: "File laporan tidak ditemukan" });
    }

    res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Gagal mengunduh file laporan" });
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
  }
};

module.exports = require("../utils/safeControllers")(module.exports);
