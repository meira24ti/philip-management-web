// philip-backend/controllers/statistikController.js
const pool = require("../config/db");
 
exports.getRingkasan = async (req, res) => {
  try {
    const [[byStatus]] = await pool.query(`
      SELECT
        SUM(status_unit = 'tersedia')        AS tersedia,
        SUM(status_unit = 'terjual')         AS terjual,
        SUM(status_unit = 'tersewa')         AS tersewa,
        SUM(status_unit = 'dalam_negosiasi') AS negosiasi,
        COUNT(*)                             AS total
      FROM properti
    `);
 
    const [byTipe] = await pool.query(`
      SELECT kategori, COUNT(*) AS jumlah
      FROM tipe_properti GROUP BY kategori ORDER BY jumlah DESC
    `);
 
    const [trenBulan] = await pool.query(`
      SELECT
        DATE_FORMAT(tanggal_transaksi, '%Y-%m') AS bulan,
        SUM(jenis = 'terjual') AS terjual,
        SUM(jenis = 'tersewa') AS tersewa,
        SUM(komisi_nominal)    AS total_komisi
      FROM transaksi
      WHERE tanggal_transaksi >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY bulan ORDER BY bulan
    `);
 
    const [[komisiTotal]] = await pool.query(`
      SELECT SUM(komisi_nominal) AS total
      FROM transaksi
      WHERE MONTH(tanggal_transaksi) = MONTH(CURDATE())
        AND YEAR(tanggal_transaksi)  = YEAR(CURDATE())
    `);
 
    res.json({ byStatus, byTipe, trenBulan, komisiBulanIni: komisiTotal.total || 0 });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
 
exports.getByPeriode = async (req, res) => {
  const { dari, sampai } = req.query;
  try {
    const [rows] = await pool.query(`
      SELECT
        DATE_FORMAT(tanggal_transaksi, '%Y-%m') AS bulan,
        SUM(jenis = 'terjual') AS terjual,
        SUM(jenis = 'tersewa') AS tersewa,
        SUM(komisi_nominal)    AS total_komisi
      FROM transaksi
      WHERE tanggal_transaksi BETWEEN ? AND ?
      GROUP BY bulan ORDER BY bulan
    `, [dari || "2025-01-01", sampai || new Date().toISOString().slice(0,10)]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
