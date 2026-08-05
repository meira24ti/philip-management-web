// philip-backend/controllers/laporanController.js
const pool = require("../config/db");
const puppeteer = require("puppeteer");
const crypto = require("crypto");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { buildLaporanHTML, enrichReportData } = require("../utils/reportBuilder");

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
    res.status(500).json({ message: "Server error" });
  }
};

exports.generate = async (req, res) => {
  const { tipe, periodeStart, periodeEnd } = req.body;
  let browser;
  try {
    const validTypes = new Set(["penjualan", "stok", "statistik"]);
    const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
    if (!validTypes.has(tipe) || !validDate(periodeStart) || !validDate(periodeEnd) || periodeStart > periodeEnd) {
      const error = new Error("Tipe laporan atau periode tidak valid");
      error.statusCode = 400;
      throw error;
    }
    let data = {};

    if (tipe === "penjualan") {
      // ✅ Gunakan id_properti sesuai schema transaksi
      const [transaksi] = await pool.query(`
        SELECT t.*, p.nama_jalan, p.kota, p.jenis_penawaran, tp.kategori, u.nama AS dicatat_oleh_nama
        FROM transaksi t
        JOIN properti p ON p.id_properti = t.id_properti
        LEFT JOIN tipe_properti tp ON tp.id_properti = t.id_properti
        LEFT JOIN user u ON u.id_user = t.dicatat_oleh
        WHERE t.tanggal_transaksi BETWEEN ? AND ?
        ORDER BY t.tanggal_transaksi DESC`,
        [periodeStart, periodeEnd]);
      data = { transaksi, totalKomisi: transaksi.reduce((s, t) => s + Number(t.komisi_nominal || 0), 0) };

    } else if (tipe === "stok") {
      const [[byStatus]] = await pool.query(`
        SELECT SUM(status_unit='tersedia') AS tersedia,
               SUM(status_unit='terjual') AS terjual,
               SUM(status_unit='tersewa') AS tersewa,
               SUM(status_unit='negosiasi') AS negosiasi,
               COUNT(*) AS total FROM properti`);
      const [byTipe] = await pool.query(
        "SELECT kategori, COUNT(*) AS jumlah FROM tipe_properti GROUP BY kategori ORDER BY jumlah DESC"
      );
      const [byPenawaran] = await pool.query(
        "SELECT COALESCE(jenis_penawaran, 'lainnya') AS jenis_penawaran, COUNT(*) AS jumlah FROM properti GROUP BY jenis_penawaran ORDER BY jumlah DESC"
      );
      data = { byStatus, byTipe, byPenawaran };

    } else {
      const [[byStatus]] = await pool.query(`
        SELECT
          COUNT(*) AS total_listing,
          SUM(status_unit='tersedia') AS tersedia,
          SUM(status_unit='terjual') AS terjual,
          SUM(status_unit='tersewa') AS tersewa,
          SUM(status_unit='negosiasi') AS negosiasi
        FROM properti`);
      const [byTipe] = await pool.query(`
        SELECT COALESCE(kategori, 'Lainnya') AS kategori, COUNT(*) AS jumlah
        FROM tipe_properti
        GROUP BY kategori
        ORDER BY jumlah DESC`);
      const [trenBulan] = await pool.query(`
        SELECT DATE_FORMAT(tanggal_transaksi,'%Y-%m') AS bulan,
               COUNT(*) AS total_transaksi, SUM(komisi_nominal) AS total_komisi
        FROM transaksi
        WHERE tanggal_transaksi BETWEEN ? AND ?
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
        WHERE tanggal_transaksi BETWEEN ? AND ?`,
        [periodeStart, periodeEnd]);
      const [byPenawaran] = await pool.query(
        "SELECT COALESCE(jenis_penawaran, 'lainnya') AS jenis_penawaran, COUNT(*) AS jumlah FROM properti GROUP BY jenis_penawaran ORDER BY jumlah DESC"
      );
      data = { byStatus, byTipe, byPenawaran, trenBulan, summary };
    }

    const reportLabel = { penjualan: "Penjualan", stok: "Stok Properti", statistik: "Statistik" }[tipe] || tipe;
    const judul = "Laporan " + reportLabel + " - " + periodeStart + " s/d " + periodeEnd;
    data = enrichReportData(tipe, data, periodeStart, periodeEnd);
    const html = buildLaporanHTML(judul, tipe, data, periodeStart, periodeEnd);

    const browserOptions = { headless: true };
    if (process.platform !== "win32") {
      browserOptions.args = ["--no-sandbox", "--disable-setuid-sandbox"];
    }
    const chromePath = findChromeExecutable();
    if (chromePath) {
      browserOptions.executablePath = chromePath;
    }

    browser = await puppeteer.launch(browserOptions);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4", printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" }
    });
    await browser.close();
    browser = null;

    await fs.mkdir("uploads/laporan", { recursive: true });
    const filename = `laporan-${tipe}-${Date.now()}.pdf`;
    await fs.writeFile(`uploads/laporan/${filename}`, pdfBuffer);

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

    res.json({ message: "Laporan berhasil dibuat", id, downloadUrl: `/uploads/laporan/${filename}` });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Gagal generate laporan" });
  } finally {
    if (browser) {
      await browser.close().catch(function (closeError) {
        console.error("Gagal menutup browser PDF:", closeError);
      });
    }
  }
};

exports.download = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM laporan WHERE id_laporan = ?", [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Laporan tidak ditemukan" });

    const fileUrl = rows[0].file_pdf_url;
    const relativePath = fileUrl.replace(/^\//, "");
    const filePath = path.join(__dirname, "..", relativePath);

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
    res.status(500).json({ message: "Server error" });
  }
};
