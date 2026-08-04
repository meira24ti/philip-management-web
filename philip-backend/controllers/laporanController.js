// philip-backend/controllers/laporanController.js
const pool = require("../config/db");
const puppeteer = require("puppeteer");
const crypto = require("crypto");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");

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
  try {
    let data = {};

    if (tipe === "penjualan") {
      // ✅ Gunakan id_properti sesuai schema transaksi
      const [transaksi] = await pool.query(`
        SELECT t.*, p.nama_jalan, p.kota, tp.kategori, u.nama AS dicatat_oleh_nama
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
      data = { byStatus, byTipe };

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
      data = { byStatus, byTipe, trenBulan, summary };
    }

    const judul = `Laporan ${tipe.charAt(0).toUpperCase() + tipe.slice(1)} — ${periodeStart} s/d ${periodeEnd}`;
    const html = buildLaporanHTML(judul, tipe, data, periodeStart, periodeEnd);

    const browserOptions = { headless: true };
    if (process.platform !== "win32") {
      browserOptions.args = ["--no-sandbox", "--disable-setuid-sandbox"];
    }
    const chromePath = findChromeExecutable();
    if (chromePath) {
      browserOptions.executablePath = chromePath;
    }

    const browser = await puppeteer.launch(browserOptions);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4", printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" }
    });
    await browser.close();

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
    res.status(500).json({ message: "Gagal generate laporan" });
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

// HTML template (tidak berubah dari sebelumnya — sudah benar)
function buildLaporanHTML(judul, tipe, data, dari, sampai) {
  const fmt = (n) => n ? "Rp " + Number(n).toLocaleString("id-ID") : "-";
  let body = "";

  if (tipe === "penjualan") {
    const rows = (data.transaksi || []).map(t => `
      <tr>
        <td>${t.nama_jalan}, ${t.kota}</td><td>${t.kategori || "-"}</td>
        <td>${t.jenis}</td><td>${t.tanggal_transaksi}</td>
        <td>${fmt(t.harga_aktual)}</td><td>${t.komisi_persen}%</td><td>${fmt(t.komisi_nominal)}</td>
      </tr>`).join("");
    body = `
      <div class="kpi-row">
        <div class="kpi"><div class="kv">${(data.transaksi || []).length}</div><div class="kl">Total Transaksi</div></div>
        <div class="kpi"><div class="kv">${(data.transaksi || []).filter(t => t.jenis === "terjual").length}</div><div class="kl">Terjual</div></div>
        <div class="kpi"><div class="kv">${(data.transaksi || []).filter(t => t.jenis === "tersewa").length}</div><div class="kl">Tersewa</div></div>
        <div class="kpi"><div class="kv green">${fmt(data.totalKomisi)}</div><div class="kl">Total Komisi</div></div>
      </div>
      <h2>Detail Transaksi</h2>
      <table><thead><tr><th>Properti</th><th>Tipe</th><th>Jenis</th><th>Tanggal</th><th>Harga</th><th>%</th><th>Komisi</th></tr></thead>
      <tbody>${rows}</tbody></table>`;
  } else if (tipe === "stok") {
    const s = data.byStatus || {};
    const tipeRows = (data.byTipe || []).map(t => `
      <tr><td>${t.kategori}</td><td>${t.jumlah}</td>
          <td><div class="bar" style="width:${s.total ? Math.round(t.jumlah / s.total * 100) : 0}%"></div></td>
          <td>${s.total ? Math.round(t.jumlah / s.total * 100) : 0}%</td></tr>`).join("");
    body = `
      <div class="kpi-row">
        <div class="kpi"><div class="kv">${s.total || 0}</div><div class="kl">Total</div></div>
        <div class="kpi"><div class="kv green">${s.tersedia || 0}</div><div class="kl">Tersedia</div></div>
        <div class="kpi"><div class="kv red">${s.terjual || 0}</div><div class="kl">Terjual</div></div>
        <div class="kpi"><div class="kv blue">${s.tersewa || 0}</div><div class="kl">Tersewa</div></div>
      </div>
      <h2>Distribusi per Tipe</h2>
      <table><thead><tr><th>Tipe</th><th>Jumlah</th><th>Proporsi</th><th>%</th></tr></thead>
      <tbody>${tipeRows}</tbody></table>`;
  } else {
    const summary = data.summary || {};
    const status = data.byStatus || {};
    const typeRows = (data.byTipe || []).map(t => `
      <tr><td>${t.kategori || "-"}</td><td>${t.jumlah || 0}</td>
      <td><div class="bar" style="width:${status.total_listing ? Math.round(Number(t.jumlah || 0) / Number(status.total_listing) * 100) : 0}%"></div></td></tr>`).join("");
    const trenRows = (data.trenBulan || []).map(t => `
      <tr><td>${t.bulan}</td><td>${t.total_transaksi || 0}</td><td>${fmt(t.total_komisi)}</td></tr>`).join("");
    body = `
      <div class="kpi-row">
        <div class="kpi"><div class="kv">${status.total_listing || 0}</div><div class="kl">Total Listing</div></div>
        <div class="kpi"><div class="kv green">${status.tersedia || 0}</div><div class="kl">Unit Tersedia</div></div>
        <div class="kpi"><div class="kv red">${status.terjual || 0}</div><div class="kl">Unit Terjual</div></div>
        <div class="kpi"><div class="kv blue">${status.tersewa || 0}</div><div class="kl">Unit Tersewa</div></div>
      </div>
      <div class="kpi-row">
        <div class="kpi"><div class="kv">${summary.total_transaksi || 0}</div><div class="kl">Transaksi Periode</div></div>
        <div class="kpi"><div class="kv">${fmt(summary.nilai_transaksi)}</div><div class="kl">Nilai Transaksi</div></div>
        <div class="kpi"><div class="kv green">${fmt(summary.total_komisi)}</div><div class="kl">Komisi Diperoleh</div></div>
      </div>
      <h2>Ringkasan Status Properti</h2>
      <table><thead><tr><th>Tersedia</th><th>Negosiasi</th><th>Terjual</th><th>Tersewa</th></tr></thead>
      <tbody><tr><td>${status.tersedia || 0}</td><td>${status.negosiasi || 0}</td><td>${status.terjual || 0}</td><td>${status.tersewa || 0}</td></tr></tbody></table>
      <h2>Komposisi Tipe Properti</h2>
      <table><thead><tr><th>Tipe</th><th>Jumlah</th><th>Proporsi</th></tr></thead><tbody>${typeRows || "<tr><td colspan='3'>Belum ada data</td></tr>"}</tbody></table>
      <h2>Tren Transaksi Periode</h2>
      <table><thead><tr><th>Bulan</th><th>Total Transaksi</th><th>Total Komisi</th></tr></thead><tbody>${trenRows || "<tr><td colspan='3'>Belum ada transaksi pada periode ini</td></tr>"}</tbody></table>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body{font-family:Arial,sans-serif;color:#333;font-size:12px;margin:0;padding:0}
    .header{background:linear-gradient(135deg,#7A0000,#3D0000);color:white;padding:20px 30px}
    .header h1{margin:0;font-size:20px}.header p{margin:4px 0 0;font-size:11px;opacity:.8}
    .content{padding:20px 30px}
    .kpi-row{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
    .kpi{background:#fff0f0;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;min-width:100px;text-align:center}
    .kv{font-size:22px;font-weight:700;color:#7A0000}.kl{font-size:10px;color:#666;margin-top:4px}
    .green{color:#166534}.red{color:#991b1b}.blue{color:#1e40af}
    h2{color:#7A0000;font-size:14px;border-bottom:2px solid #7A0000;padding-bottom:6px;margin-top:24px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th{background:#7A0000;color:white;padding:8px 10px;text-align:left;font-size:11px}
    td{padding:7px 10px;border-bottom:1px solid #eee;font-size:11px}
    tr:nth-child(even) td{background:#fdf8f8}
    .bar{background:#7A0000;height:10px;border-radius:4px}
    .footer{margin-top:30px;padding-top:10px;border-top:1px solid #eee;font-size:10px;color:#999;text-align:center}
  </style></head>
  <body>
    <div class="header"><h1>Philip Real Estate</h1><p>${judul}</p><p>Periode: ${dari} s/d ${sampai}</p></div>
    <div class="content">${body}
      <div class="footer">Dibuat otomatis oleh Sistem Web Management Property Philip Real Estate</div>
    </div>
  </body></html>`;
}
