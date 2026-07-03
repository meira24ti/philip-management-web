// philip-backend/controllers/laporanController.js
const pool      = require("../config/db");
const puppeteer = require("puppeteer");
const crypto    = require("crypto");
const fs        = require("fs").promises;
const path      = require("path");
 
// GET /api/laporan
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, u.nama AS dibuat_oleh_nama
      FROM laporan l
      JOIN user u ON u.id_user = l.dibuat_oleh
      ORDER BY l.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
 
// POST /api/laporan/generate
exports.generate = async (req, res) => {
  const { tipe, periodeStart, periodeEnd } = req.body;
  try {
    // 1. Ambil data sesuai tipe laporan
    let data = {};
    if (tipe === "penjualan") {
      const [transaksi] = await pool.query(`
        SELECT t.*, p.nama_jalan, p.kota, tp.kategori,
               u.nama AS dicatat_oleh_nama
        FROM transaksi t
        JOIN properti p ON p.id_properti = t.properti_id
        LEFT JOIN tipe_properti tp ON tp.properti_id = t.properti_id
        LEFT JOIN user u ON u.id_user = t.dicatat_oleh
        WHERE t.tanggal_transaksi BETWEEN ? AND ?
        ORDER BY t.tanggal_transaksi DESC`,
        [periodeStart, periodeEnd]
      );
      const totalKomisi = transaksi.reduce((s,t) => s + Number(t.komisi_nominal||0), 0);
      data = { transaksi, totalKomisi };
    } else if (tipe === "stok") {
      const [[byStatus]] = await pool.query(`
        SELECT
          SUM(status_unit='tersedia') AS tersedia,
          SUM(status_unit='terjual')  AS terjual,
          SUM(status_unit='tersewa')  AS tersewa,
          SUM(status_unit='dalam_negosiasi') AS negosiasi,
          COUNT(*) AS total
        FROM properti`
      );
      const [byTipe] = await pool.query(`
        SELECT kategori, COUNT(*) AS jumlah
        FROM tipe_properti GROUP BY kategori ORDER BY jumlah DESC`
      );
      data = { byStatus, byTipe };
    } else {
      const [trenBulan] = await pool.query(`
        SELECT DATE_FORMAT(tanggal_transaksi,'%Y-%m') AS bulan,
               COUNT(*) AS total_transaksi,
               SUM(komisi_nominal) AS total_komisi
        FROM transaksi
        WHERE tanggal_transaksi BETWEEN ? AND ?
        GROUP BY bulan ORDER BY bulan`,
        [periodeStart, periodeEnd]
      );
      data = { trenBulan };
    }
 
    // 2. Build HTML template
    const judul = `Laporan ${tipe.charAt(0).toUpperCase()+tipe.slice(1)} — ${periodeStart} s/d ${periodeEnd}`;
    const html  = buildLaporanHTML(judul, tipe, data, periodeStart, periodeEnd);
 
    // 3. Generate PDF dengan Puppeteer
    const browser = await puppeteer.launch({ args:["--no-sandbox"] });
    const page    = await browser.newPage();
    await page.setContent(html, { waitUntil:"networkidle0" });
    const pdfBuffer = await page.pdf({
      format:"A4", printBackground:true,
      margin:{ top:"20mm", right:"15mm", bottom:"20mm", left:"15mm" }
    });
    await browser.close();
 
    // 4. Simpan file PDF
    await fs.mkdir("uploads/laporan", { recursive:true });
    const filename = `laporan-${tipe}-${Date.now()}.pdf`;
    const filepath = path.join("uploads/laporan", filename);
    await fs.writeFile(filepath, pdfBuffer);
 
    // 5. Simpan metadata ke DB
    const id = crypto.randomUUID();
    await pool.query("INSERT INTO laporan SET ?", [{
      id, dibuat_oleh: req.user.id, judul,
      tipe, periode_mulai: periodeStart,
      periode_selesai: periodeEnd,
      file_pdf_url: "/uploads/laporan/" + filename
    }]);
 
    res.json({ message:"Laporan berhasil dibuat", id, downloadUrl:"/uploads/laporan/"+filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message:"Gagal generate laporan" });
  }
};
 
// GET /api/laporan/:id/download
exports.download = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM laporan WHERE id=?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message:"Laporan tidak ditemukan" });
    res.redirect(rows[0].file_pdf_url);
  } catch (err) {
    res.status(500).json({ message:"Server error" });
  }
};
 
// ── HTML template laporan ────────────────────────────────────────────────────────
function buildLaporanHTML(judul, tipe, data, dari, sampai) {
  const fmt = (n) => n ? "Rp "+Number(n).toLocaleString("id-ID") : "-";
  let body = "";
 
  if (tipe === "penjualan") {
    const rows = data.transaksi.map(t => `
      <tr>
        <td>${t.nama_jalan}, ${t.kota}</td>
        <td>${t.kategori||"-"}</td>
        <td>${t.jenis}</td>
        <td>${t.tanggal_transaksi}</td>
        <td>${fmt(t.harga_aktual)}</td>
        <td>${t.komisi_persen}%</td>
        <td>${fmt(t.komisi_nominal)}</td>
      </tr>`).join("");
    body = `
      <div class="summary-box">
        <div class="kpi"><div class="kpi-val">${data.transaksi.length}</div><div class="kpi-label">Total Transaksi</div></div>
        <div class="kpi"><div class="kpi-val">${data.transaksi.filter(t=>t.jenis==="terjual").length}</div><div class="kpi-label">Terjual</div></div>
        <div class="kpi"><div class="kpi-val">${data.transaksi.filter(t=>t.jenis==="tersewa").length}</div><div class="kpi-label">Tersewa</div></div>
        <div class="kpi"><div class="kpi-val kpi-green">${fmt(data.totalKomisi)}</div><div class="kpi-label">Total Komisi</div></div>
      </div>
      <h2>Detail Transaksi</h2>
      <table>
        <thead><tr><th>Properti</th><th>Tipe</th><th>Jenis</th><th>Tanggal</th><th>Harga Aktual</th><th>Komisi%</th><th>Komisi Rp</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  } else if (tipe === "stok") {
    const s = data.byStatus;
    const tipeRows = data.byTipe.map(t => `
      <tr><td>${t.kategori}</td><td>${t.jumlah}</td>
          <td><div class="bar" style="width:${Math.round(t.jumlah/s.total*100)}%"></div></td>
          <td>${Math.round(t.jumlah/s.total*100)}%</td></tr>`).join("");
    body = `
      <div class="summary-box">
        <div class="kpi"><div class="kpi-val">${s.total}</div><div class="kpi-label">Total Listing</div></div>
        <div class="kpi"><div class="kpi-val kpi-green">${s.tersedia}</div><div class="kpi-label">Tersedia</div></div>
        <div class="kpi"><div class="kpi-val kpi-red">${s.terjual}</div><div class="kpi-label">Terjual</div></div>
        <div class="kpi"><div class="kpi-val kpi-blue">${s.tersewa}</div><div class="kpi-label">Tersewa</div></div>
        <div class="kpi"><div class="kpi-val kpi-yellow">${s.negosiasi}</div><div class="kpi-label">Negosiasi</div></div>
      </div>
      <h2>Distribusi per Tipe Properti</h2>
      <table>
        <thead><tr><th>Tipe</th><th>Jumlah</th><th>Proporsi</th><th>%</th></tr></thead>
        <tbody>${tipeRows}</tbody>
      </table>`;
  } else {
    const trenRows = (data.trenBulan||[]).map(t => `
      <tr><td>${t.bulan}</td><td>${t.total_transaksi}</td><td>${fmt(t.total_komisi)}</td></tr>`).join("");
    body = `
      <h2>Tren Transaksi per Bulan</h2>
      <table>
        <thead><tr><th>Bulan</th><th>Total Transaksi</th><th>Total Komisi</th></tr></thead>
        <tbody>${trenRows}</tbody>
      </table>`;
  }
 
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body { font-family:Arial,sans-serif; color:#333; margin:0; padding:0; font-size:12px; }
    .header { background:linear-gradient(135deg,#7A0000,#3D0000); color:white; padding:20px 30px; }
    .header h1 { margin:0; font-size:20px; }
    .header p  { margin:4px 0 0; font-size:11px; opacity:.8; }
    .content   { padding:20px 30px; }
    .summary-box { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
    .kpi       { background:#fff0f0; border:1px solid #fca5a5; border-radius:8px;
                 padding:12px 16px; min-width:100px; text-align:center; }
    .kpi-val   { font-size:22px; font-weight:700; color:#7A0000; }
    .kpi-label { font-size:10px; color:#666; margin-top:4px; }
    .kpi-green { color:#166534; }
    .kpi-red   { color:#991b1b; }
    .kpi-blue  { color:#1e40af; }
    .kpi-yellow{ color:#92400e; }
    h2 { color:#7A0000; font-size:14px; border-bottom:2px solid #7A0000;
         padding-bottom:6px; margin-top:24px; }
    table { width:100%; border-collapse:collapse; margin-top:10px; }
    th    { background:#7A0000; color:white; padding:8px 10px;
            text-align:left; font-size:11px; }
    td    { padding:7px 10px; border-bottom:1px solid #eee; font-size:11px; }
    tr:nth-child(even) td { background:#fdf8f8; }
    .bar  { background:#7A0000; height:10px; border-radius:4px; }
    .footer { margin-top:30px; padding-top:10px; border-top:1px solid #eee;
              font-size:10px; color:#999; text-align:center; }
  </style></head>
  <body>
    <div class="header">
      <h1>Philip Real Estate</h1>
      <p>${judul}</p>
      <p>Periode: ${dari} s/d ${sampai}</p>
    </div>
    <div class="content">
      ${body}
      <div class="footer">Laporan ini dibuat otomatis oleh Sistem Web Management Property Philip Real Estate</div>
    </div>
  </body></html>`;
}
