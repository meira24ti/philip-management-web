const pool = require("../config/db");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDate(value) {
  if (!DATE_PATTERN.test(String(value || ""))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function getDefaultPeriod() {
  const today = new Date();
  return {
    dari: toLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1)),
    sampai: toLocalDateString(today),
  };
}

function getPeriod(query) {
  const fallback = getDefaultPeriod();
  const dari = query.dari || query.periodeStart || fallback.dari;
  const sampai = query.sampai || query.periodeEnd || fallback.sampai;

  if (!isValidDate(dari) || !isValidDate(sampai) || dari > sampai) {
    const error = new Error("Periode statistik tidak valid");
    error.statusCode = 400;
    throw error;
  }

  const days = Math.floor(
    (new Date(`${sampai}T00:00:00Z`) - new Date(`${dari}T00:00:00Z`)) / DAY_IN_MS
  ) + 1;

  if (days > 3660) {
    const error = new Error("Periode statistik maksimal 10 tahun");
    error.statusCode = 400;
    throw error;
  }

  // Grafik harian nyaman dibaca untuk satu sampai dua bulan; setelah itu,
  // agregasi bulanan lebih bermakna dan tidak terlalu padat.
  return {
    dari,
    sampai,
    days,
    granularity: days <= 62 ? "harian" : "bulanan",
  };
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createBucketKeys(dari, sampai, granularity) {
  const start = new Date(`${dari}T00:00:00Z`);
  const end = new Date(`${sampai}T00:00:00Z`);
  const keys = [];
  const cursor = new Date(start);

  if (granularity === "bulanan") {
    cursor.setUTCDate(1);
    const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    // Batas periode API adalah 10 tahun; 122 bucket mencakup kedua bulan
    // batas pada rentang parsial tanpa memangkas bulan terakhir.
    while (cursor <= last && keys.length < 122) {
      keys.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  } else {
    while (cursor <= end && keys.length < 366) {
      keys.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  return keys;
}

function formatBucketLabel(bucket, granularity) {
  if (granularity === "bulanan") {
    const [year, month] = String(bucket).split("-").map(Number);
    return new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" })
      .format(new Date(year, month - 1, 1));
  }

  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" })
    .format(new Date(`${bucket}T00:00:00`));
}

function fillTrend(rows, period) {
  const source = new Map((rows || []).map((row) => [String(row.bucket), row]));

  return createBucketKeys(period.dari, period.sampai, period.granularity).map((bucket) => {
    const row = source.get(bucket) || {};
    return {
      bucket,
      label: formatBucketLabel(bucket, period.granularity),
      total_transaksi: number(row.total_transaksi),
      terjual: number(row.terjual),
      tersewa: number(row.tersewa),
      total_komisi: number(row.total_komisi),
      nilai_transaksi: number(row.nilai_transaksi),
    };
  });
}

async function getStatistics(req, res) {
  try {
    const period = getPeriod(req.query);
    const transactionParams = [period.dari, period.sampai];
    const listingParams = [period.dari, period.sampai];
    const bucketFormat = period.granularity === "harian" ? "%Y-%m-%d" : "%Y-%m";

    const [
      [[summaryRow]],
      [byJenis],
      [byTipe],
      [trendRows],
      [[listingStatusRow]],
      [listingByTipe],
      [listingByPenawaran],
      [[currentStockRow]],
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total_transaksi,
          COALESCE(SUM(t.jenis = 'terjual'), 0) AS total_terjual,
          COALESCE(SUM(t.jenis = 'tersewa'), 0) AS total_tersewa,
          COALESCE(SUM(t.harga_aktual), 0) AS nilai_transaksi,
          COALESCE(SUM(t.komisi_nominal), 0) AS total_komisi,
          COUNT(DISTINCT t.id_properti) AS properti_tertransaksi
        FROM transaksi t
        WHERE t.tanggal_transaksi >= ?
          AND t.tanggal_transaksi < DATE_ADD(?, INTERVAL 1 DAY)`, transactionParams),
      pool.query(`
        SELECT t.jenis, COUNT(*) AS jumlah
        FROM transaksi t
        WHERE t.tanggal_transaksi >= ?
          AND t.tanggal_transaksi < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY t.jenis
        ORDER BY jumlah DESC`, transactionParams),
      pool.query(`
        SELECT
          COALESCE(NULLIF(tp.kategori, ''), 'lainnya') AS kategori,
          COUNT(DISTINCT t.id_transaksi) AS jumlah,
          COALESCE(SUM(t.harga_aktual), 0) AS nilai_transaksi
        FROM transaksi t
        LEFT JOIN tipe_properti tp ON tp.id_properti = t.id_properti
        WHERE t.tanggal_transaksi >= ?
          AND t.tanggal_transaksi < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY COALESCE(NULLIF(tp.kategori, ''), 'lainnya')
        ORDER BY jumlah DESC, kategori ASC`, transactionParams),
      pool.query(`
        SELECT
          DATE_FORMAT(t.tanggal_transaksi, '${bucketFormat}') AS bucket,
          COUNT(*) AS total_transaksi,
          COALESCE(SUM(t.jenis = 'terjual'), 0) AS terjual,
          COALESCE(SUM(t.jenis = 'tersewa'), 0) AS tersewa,
          COALESCE(SUM(t.komisi_nominal), 0) AS total_komisi,
          COALESCE(SUM(t.harga_aktual), 0) AS nilai_transaksi
        FROM transaksi t
        WHERE t.tanggal_transaksi >= ?
          AND t.tanggal_transaksi < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY bucket
        ORDER BY bucket`, transactionParams),
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(p.status_unit = 'tersedia'), 0) AS tersedia,
          COALESCE(SUM(p.status_unit = 'terjual'), 0) AS terjual,
          COALESCE(SUM(p.status_unit = 'tersewa'), 0) AS tersewa,
          COALESCE(SUM(p.status_unit = 'negosiasi'), 0) AS negosiasi
        FROM properti p
        WHERE p.tanggal_listing >= ?
          AND p.tanggal_listing < DATE_ADD(?, INTERVAL 1 DAY)`, listingParams),
      pool.query(`
        SELECT
          COALESCE(NULLIF(tp.kategori, ''), 'lainnya') AS kategori,
          COUNT(DISTINCT p.id_properti) AS jumlah
        FROM properti p
        LEFT JOIN tipe_properti tp ON tp.id_properti = p.id_properti
        WHERE p.tanggal_listing >= ?
          AND p.tanggal_listing < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY COALESCE(NULLIF(tp.kategori, ''), 'lainnya')
        ORDER BY jumlah DESC, kategori ASC`, listingParams),
      pool.query(`
        SELECT
          COALESCE(NULLIF(p.jenis_penawaran, ''), 'lainnya') AS jenis_penawaran,
          COUNT(*) AS jumlah
        FROM properti p
        WHERE p.tanggal_listing >= ?
          AND p.tanggal_listing < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY COALESCE(NULLIF(p.jenis_penawaran, ''), 'lainnya')
        ORDER BY jumlah DESC, jenis_penawaran ASC`, listingParams),
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(status_unit = 'tersedia'), 0) AS tersedia,
          COALESCE(SUM(status_unit = 'terjual'), 0) AS terjual,
          COALESCE(SUM(status_unit = 'tersewa'), 0) AS tersewa,
          COALESCE(SUM(status_unit = 'negosiasi'), 0) AS negosiasi
        FROM properti`),
    ]);

    const summary = {
      total_transaksi: number(summaryRow.total_transaksi),
      total_terjual: number(summaryRow.total_terjual),
      total_tersewa: number(summaryRow.total_tersewa),
      nilai_transaksi: number(summaryRow.nilai_transaksi),
      total_komisi: number(summaryRow.total_komisi),
      properti_tertransaksi: number(summaryRow.properti_tertransaksi),
      rata_rata_nilai: number(summaryRow.total_transaksi)
        ? number(summaryRow.nilai_transaksi) / number(summaryRow.total_transaksi)
        : 0,
      rata_rata_komisi: number(summaryRow.total_transaksi)
        ? number(summaryRow.total_komisi) / number(summaryRow.total_transaksi)
        : 0,
      listing_baru: number(listingStatusRow.total),
    };
    const byStatus = {
      total: number(listingStatusRow.total),
      tersedia: number(listingStatusRow.tersedia),
      terjual: number(listingStatusRow.terjual),
      tersewa: number(listingStatusRow.tersewa),
      negosiasi: number(listingStatusRow.negosiasi),
    };
    const currentStock = {
      total: number(currentStockRow.total),
      tersedia: number(currentStockRow.tersedia),
      terjual: number(currentStockRow.terjual),
      tersewa: number(currentStockRow.tersewa),
      negosiasi: number(currentStockRow.negosiasi),
    };
    const trenBulan = fillTrend(trendRows, period);

    res.json({
      period: {
        dari: period.dari,
        sampai: period.sampai,
        days: period.days,
        granularity: period.granularity,
      },
      summary,
      byJenis,
      byTipe,
      byStatus,
      listingByTipe,
      byPenawaran: listingByPenawaran,
      currentStock,
      trenBulan,
      // Dipertahankan untuk klien lama yang masih memakai nama field sebelumnya.
      komisiBulanIni: summary.total_komisi,
    });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : "Server error",
    });
  }
}

// Endpoint lama tetap mengembalikan array tren agar integrasi yang sudah ada
// tidak berubah. Dashboard baru memakai GET /statistik dengan periode untuk
// memperoleh payload operasional yang lebih lengkap.
async function getTrendByPeriod(req, res) {
  try {
    const period = getPeriod(req.query);
    const [rows] = await pool.query(`
      SELECT
        DATE_FORMAT(tanggal_transaksi, '%Y-%m') AS bulan,
        SUM(jenis = 'terjual') AS terjual,
        SUM(jenis = 'tersewa') AS tersewa,
        SUM(komisi_nominal) AS total_komisi
      FROM transaksi
      WHERE tanggal_transaksi >= ?
        AND tanggal_transaksi < DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY bulan
      ORDER BY bulan`, [period.dari, period.sampai]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : "Server error",
    });
  }
}

exports.getRingkasan = getStatistics;
exports.getByPeriode = getTrendByPeriod;
