// philip-backend/controllers/propertiController.js
// VERSI FINAL — SEMUA SELECT PAKAI ALIAS id UNTUK KOMPATIBILITAS FRONTEND
const pool   = require("../config/db");
const multer = require("multer");
const fs     = require("fs").promises;
const crypto = require("crypto");
const { normalizeDecimalValue, sanitizeForColumnLimits } = require("../utils/numberUtils");
const { imageFileFilter, safeImageExtension } = require("../utils/uploadValidation");

// ─── Helper ──────────────────────────────────────────────────────
const toSqlBoolean = (value) => {
  if (value === true || value === 1 || value === "1" || value === "true") return 1;
  if (value === false || value === 0 || value === "0" || value === "false") return 0;
  return null;
};

const normalizeKategori = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  const mapping = {
    rumah: "rumah",
    "rumah cluster": "rumah_cluster",
    "rumah-cluster": "rumah_cluster",
    rumah_cluster: "rumah_cluster",
    ruko: "ruko",
    tanah: "tanah",
    gudang: "gudang",
    villa: "villa",
    "rumah subsidi": "rumah_subsidi",
    "rumah-subsidi": "rumah_subsidi",
    rumah_subsidi: "rumah_subsidi",
    kios: "kios",
    kombinasi: "kombinasi",
  };
  return mapping[normalized] || null;
};

const allowedPropertyFields = [
  'no_folder', 'tanggal_listing', 'jenis_penawaran', 'harga_jual', 'harga_sewa',
  'nama_jalan', 'area_kecamatan', 'kota', 'luas_tanah', 'luas_bangunan',
  'kamar_tidur', 'kamar_mandi', 'carport', 'daya_listrik', 'sumber_air',
  'row_jalan', 'sertifikat', 'keamanan', 'daftar_bonus', 'akses_fasilitas',
  'keterangan', 'status_unit', 'latitude', 'longtitude', 'gmaps_url',
  'spanduk', 'kunci', 'feed', 'sudah_share', 'listed_by', 'id_vendor'
];

// Vendor dapat diketik langsung di form. Nama yang sudah ada dipakai ulang;
// nama baru dibuat otomatis dalam transaksi yang sama dengan properti.
const resolveVendorId = async (db, data, existingVendorId = null) => {
  const namaVendor = String(data.nama_vendor || "").trim();
  const nomorHp = String(data.vendor_hp || data.no_hp_vendor || "").trim();
  if (!namaVendor) return existingVendorId || null;
  if (!nomorHp) {
    const error = new Error("Nomor HP vendor wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const [existing] = await db.query(
    "SELECT id_vendor FROM vendor WHERE LOWER(TRIM(nama_vendor)) = LOWER(?) LIMIT 1",
    [namaVendor]
  );
  if (existing.length) return existing[0].id_vendor;

  const idVendor = crypto.randomUUID();
  await db.query(
    "INSERT INTO vendor (id_vendor, nama_vendor, no_hp) VALUES (?, ?, ?)",
    [idVendor, namaVendor, nomorHp || null]
  );
  return idVendor;
};

// ─── Upload ──────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = `uploads/properti/temp`;
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomUUID()}${safeImageExtension(file)}`)
});
exports.upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

// ─── GET /api/properti ────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { search, jenis, kota, statusUnit, ltMin, ltMax, hargaMin, hargaMax,
            listedBy, dari, sampai, kategori } = req.query;

    // ✅ ALIAS p.id_properti AS id
    let sql = `
      SELECT p.id_properti AS id, p.*,
        tp.kategori, tp.subkategori, tp.jumlah_unit,
        fp.url_foto AS cover_foto,
        v.nama_vendor, v.no_hp AS vendor_hp,
        u.nama AS listed_by_nama, u.no_hp AS listed_by_hp
      FROM properti p
      LEFT JOIN tipe_properti tp ON tp.id_properti = p.id_properti
      LEFT JOIN foto_properti fp ON fp.id_properti = p.id_properti AND fp.is_cover = 1
      LEFT JOIN vendor v ON v.id_vendor = p.id_vendor
      LEFT JOIN user u ON u.id_user = p.listed_by
      WHERE 1=1`;
    const params = [];

    if (search) {
      sql += " AND (p.no_folder LIKE ? OR p.nama_jalan LIKE ? OR p.area_kecamatan LIKE ? OR p.kota LIKE ? OR tp.kategori LIKE ? OR v.nama_vendor LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }
    if (kategori)    { sql += " AND tp.kategori = ?";       params.push(normalizeKategori(kategori)); }
    if (jenis)       { sql += " AND p.jenis_penawaran = ?"; params.push(jenis); }
    if (kota)        { sql += " AND p.kota = ?";            params.push(kota); }
    if (statusUnit)  { sql += " AND p.status_unit = ?";     params.push(statusUnit); }
    if (ltMin)       { sql += " AND p.luas_tanah >= ?";     params.push(ltMin); }
    if (ltMax)       { sql += " AND p.luas_tanah <= ?";     params.push(ltMax); }
    if (hargaMin)    { sql += " AND p.harga_jual >= ?";     params.push(hargaMin); }
    if (hargaMax)    { sql += " AND p.harga_jual <= ?";     params.push(hargaMax); }
    if (listedBy)    { sql += " AND u.nama LIKE ?";         params.push(`%${listedBy}%`); }
    if (dari)        { sql += " AND p.tanggal_listing >= ?"; params.push(dari); }
    if (sampai)      { sql += " AND p.tanggal_listing <= ?"; params.push(sampai); }

    sql += " ORDER BY p.created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── GET /api/properti/:id ────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    // ✅ ALIAS p.id_properti AS id
    const [rows] = await pool.query(`
      SELECT p.id_properti AS id, p.*,
        tp.kategori, tp.subkategori, tp.jumlah_unit, tp.jumlah_kapling,
        v.nama_vendor, v.no_hp AS vendor_hp,
        u.nama AS listed_by_nama, u.no_hp AS listed_by_hp
      FROM properti p
      LEFT JOIN tipe_properti tp ON tp.id_properti = p.id_properti
      LEFT JOIN vendor v ON v.id_vendor = p.id_vendor
      LEFT JOIN user u ON u.id_user = p.listed_by
      WHERE p.id_properti = ?`, [req.params.id]);

    if (!rows.length)
      return res.status(404).json({ message: "Properti tidak ditemukan" });

    const [fotos] = await pool.query(
      "SELECT * FROM foto_properti WHERE id_properti = ? ORDER BY urutan ASC",
      [req.params.id]
    );
    res.json({ ...rows[0], foto_properti: fotos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── GET /api/properti/vendors ───────────────────────────────
exports.getVendors = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id_vendor, nama_vendor, no_hp FROM vendor ORDER BY nama_vendor");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── POST /api/properti/vendors ──────────────────────────────
exports.createVendor = async (req, res) => {
  try {
    const { nama_vendor, no_hp } = req.body;
    const trimmedName = (nama_vendor || "").trim();
    if (!trimmedName) {
      return res.status(400).json({ message: "Nama vendor wajib diisi" });
    }
    const id_vendor = crypto.randomUUID();
    await pool.query(
      "INSERT INTO vendor (id_vendor, nama_vendor, no_hp) VALUES (?, ?, ?)",
      [id_vendor, trimmedName, no_hp ? no_hp.trim() : null]
    );
    res.status(201).json({
      message: "Vendor berhasil ditambahkan",
      vendor: { id_vendor, nama_vendor: trimmedName, no_hp: no_hp ? no_hp.trim() : null }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambahkan vendor" });
  }
};

// ─── GET /api/properti/marketing ─────────────────────────────
exports.getMarketingList = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id_user, nama FROM user WHERE role = 'marketing' AND is_active = 1 ORDER BY nama"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── POST /api/properti ───────────────────────────────────────
exports.create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const id = crypto.randomUUID();
    const { kategori, subkategori, jumlah_unit, jumlah_kapling } = req.body;
    const normalizedKategori = normalizeKategori(kategori);
    if (!normalizedKategori) {
      const error = new Error("Kategori properti tidak valid");
      error.statusCode = 400;
      throw error;
    }

    const propertiData = {};
    for (const key of allowedPropertyFields) {
      if (req.body[key] !== undefined) {
        propertiData[key] = req.body[key];
      }
    }

    const requiredFields = [
      ["no_folder", "Nomor folder"],
      ["tanggal_listing", "Tanggal listing"],
      ["nama_jalan", "Alamat properti"],
      ["kota", "Kota"],
      ["luas_tanah", "Luas tanah"],
      ["listed_by", "Marketing listing"],
    ];
    const missingField = requiredFields.find(([field]) => !String(propertiData[field] || "").trim());
    if (missingField) {
      const error = new Error(`${missingField[1]} wajib diisi`);
      error.statusCode = 400;
      throw error;
    }
    if (!["dijual", "disewa", "dijual_dan_disewa"].includes(propertiData.jenis_penawaran)) {
      const error = new Error("Jenis penawaran tidak valid");
      error.statusCode = 400;
      throw error;
    }
    if (["dijual", "dijual_dan_disewa"].includes(propertiData.jenis_penawaran) && !propertiData.harga_jual) {
      const error = new Error("Harga jual wajib diisi untuk properti yang dijual");
      error.statusCode = 400;
      throw error;
    }
    if (["disewa", "dijual_dan_disewa"].includes(propertiData.jenis_penawaran) && !propertiData.harga_sewa) {
      const error = new Error("Harga sewa wajib diisi untuk properti yang disewakan");
      error.statusCode = 400;
      throw error;
    }

    // Defensive: normalize numeric fields to valid SQL values before insert
    const numericFields = ['harga_jual', 'harga_sewa', 'luas_tanah', 'luas_bangunan',
      'kamar_tidur', 'kamar_mandi', 'latitude', 'longtitude'];
    for (const nf of numericFields) {
      if (Object.prototype.hasOwnProperty.call(propertiData, nf)) {
        if (propertiData[nf] === '' || propertiData[nf] === null || propertiData[nf] === undefined) {
          propertiData[nf] = null;
        } else if (nf === 'harga_jual' || nf === 'harga_sewa') {
          propertiData[nf] = normalizeDecimalValue(propertiData[nf], 15, 2);
        } else if (nf === 'luas_tanah' || nf === 'luas_bangunan') {
          propertiData[nf] = normalizeDecimalValue(propertiData[nf], 10, 2);
        } else {
          propertiData[nf] = Number(propertiData[nf]);
        }
      }
    }

    const boolFields = ['spanduk', 'kunci', 'feed', 'sudah_share'];
    for (const field of boolFields) {
      if (propertiData[field] !== undefined) {
        propertiData[field] = toSqlBoolean(propertiData[field]);
      }
    }

    propertiData.id_properti = id;
    propertiData.id_vendor   = await resolveVendorId(conn, req.body, propertiData.id_vendor);
    if (!propertiData.id_vendor) {
      const error = new Error("Nama vendor wajib diisi");
      error.statusCode = 400;
      throw error;
    }
    propertiData.listed_by   = propertiData.listed_by || null;
    propertiData.kota        = propertiData.kota || "";
    propertiData.nama_jalan  = propertiData.nama_jalan || "";

    const [columns] = await conn.query("SHOW COLUMNS FROM properti");
    const columnLimits = columns.reduce((acc, column) => {
      const match = column.Type.match(/varchar\((\d+)\)/i);
      if (match) acc[column.Field] = Number(match[1]);
      return acc;
    }, {});
    const safePropertiData = sanitizeForColumnLimits(propertiData, columnLimits);

    await conn.query("INSERT INTO properti SET ?", [safePropertiData]);

    await conn.query("INSERT INTO tipe_properti SET ?", [{
      id_tipeproperti: crypto.randomUUID(),
      id_properti:     id,
      kategori: normalizedKategori,
      subkategori: subkategori || "",
      jumlah_unit: jumlah_unit || 1,
      jumlah_kapling: jumlah_kapling || null,
    }]);

    if (req.files?.length) {
      const targetDir = `uploads/properti/${id}`;
      await fs.mkdir(targetDir, { recursive: true });
      for (let i = 0; i < req.files.length; i++) {
        const f = req.files[i];
        const oldPath = `uploads/properti/temp/${f.filename}`;
        const newPath = `${targetDir}/${f.filename}`;
        try { await fs.rename(oldPath, newPath); } catch {}
        await conn.query("INSERT INTO foto_properti SET ?", [{
          id_fotoproperti: crypto.randomUUID(),
          id_properti:     id,
          url_foto:        `/uploads/properti/${id}/${f.filename}`,
          is_cover:        i === 0 ? 1 : 0,
          urutan:          i + 1
        }]);
      }
    }

    await conn.query(
      "INSERT INTO log_aktivitas (id_log, id_user, id_properti, aksi, detail) VALUES (?,?,?,?,?)",
      [crypto.randomUUID(), req.user.id, id, "tambah", "Properti baru ditambahkan"]
    );

    await conn.commit();
    res.status(201).json({ message: "Properti berhasil ditambahkan", id });
  } catch (err) {
    await conn.rollback();
    console.error('ERROR in propertiController.create:', err && err.stack ? err.stack : err);
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
  } finally { conn.release(); }
};

// ─── PUT /api/properti/:id ───────────────────────────────────
exports.update = async (req, res) => {
  try {
    const propertiId = req.params.id;
    if (!propertiId || propertiId === 'undefined' || propertiId === 'null') {
      console.error('❌ ID properti tidak valid:', propertiId);
      return res.status(400).json({ message: "ID properti tidak valid" });
    }

    const updateData = {};
    for (const key of allowedPropertyFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    if (req.body.nama_vendor !== undefined) {
      updateData.id_vendor = await resolveVendorId(pool, req.body, updateData.id_vendor);
      if (!updateData.id_vendor) return res.status(400).json({ message: "Nama vendor wajib diisi" });
    }

    const numericFields = ['harga_jual', 'harga_sewa', 'luas_tanah', 'luas_bangunan',
      'kamar_tidur', 'kamar_mandi', 'latitude', 'longtitude'];
    for (const nf of numericFields) {
      if (Object.prototype.hasOwnProperty.call(updateData, nf)) {
        if (updateData[nf] === '' || updateData[nf] === null || updateData[nf] === undefined) {
          updateData[nf] = null;
        } else if (nf === 'harga_jual' || nf === 'harga_sewa') {
          updateData[nf] = normalizeDecimalValue(updateData[nf], 15, 2);
        } else if (nf === 'luas_tanah' || nf === 'luas_bangunan') {
          updateData[nf] = normalizeDecimalValue(updateData[nf], 10, 2);
        } else {
          updateData[nf] = Number(updateData[nf]);
        }
      }
    }

    const boolFields = ['spanduk', 'kunci', 'feed', 'sudah_share'];
    for (const field of boolFields) {
      if (updateData[field] !== undefined) {
        updateData[field] = toSqlBoolean(updateData[field]);
      }
    }

    updateData.updated_at = new Date();

    const [columns] = await pool.query("SHOW COLUMNS FROM properti");
    const columnLimits = columns.reduce((acc, column) => {
      const match = column.Type.match(/varchar\((\d+)\)/i);
      if (match) acc[column.Field] = Number(match[1]);
      return acc;
    }, {});
    const safeUpdateData = sanitizeForColumnLimits(updateData, columnLimits);

    const [result] = await pool.query(
      "UPDATE properti SET ? WHERE id_properti = ?",
      [safeUpdateData, propertiId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Properti tidak ditemukan" });
    }

    const { kategori, subkategori, jumlah_unit, jumlah_kapling } = req.body;
    if (kategori !== undefined || subkategori !== undefined || jumlah_unit !== undefined || jumlah_kapling !== undefined) {
      const tipeUpdates = [];
      const tipeParams = [];
      if (kategori !== undefined) {
        const normalizedKategori = normalizeKategori(kategori);
        if (!normalizedKategori) {
          return res.status(400).json({ message: "Kategori properti tidak valid" });
        }
        tipeUpdates.push("kategori=?");
        tipeParams.push(normalizedKategori);
      }
      if (subkategori !== undefined) {
        tipeUpdates.push("subkategori=?");
        tipeParams.push(subkategori || "");
      }
      if (jumlah_unit !== undefined) {
        tipeUpdates.push("jumlah_unit=?");
        tipeParams.push(jumlah_unit || 1);
      }
      if (jumlah_kapling !== undefined) {
        tipeUpdates.push("jumlah_kapling=?");
        tipeParams.push(jumlah_kapling || null);
      }
      tipeParams.push(propertiId);
      await pool.query(
        `UPDATE tipe_properti SET ${tipeUpdates.join(", ")} WHERE id_properti=?`,
        tipeParams
      );
    }

    await pool.query(
      "INSERT INTO log_aktivitas (id_log, id_user, id_properti, aksi, detail) VALUES (?,?,?,?,?)",
      [crypto.randomUUID(), req.user.id, propertiId, "edit", "Data properti diperbarui"]
    );

    res.json({ message: "Properti berhasil diperbarui" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── DELETE /api/properti/:id ────────────────────────────────
exports.remove = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const dir = `uploads/properti/${req.params.id}`;
    try { await fs.rm(dir, { recursive: true }); } catch {}

    await conn.query("DELETE FROM foto_properti  WHERE id_properti = ?", [req.params.id]);
    await conn.query("DELETE FROM tipe_properti  WHERE id_properti = ?", [req.params.id]);
    await conn.query("DELETE FROM log_aktivitas  WHERE id_properti = ?", [req.params.id]);
    await conn.query("DELETE FROM properti       WHERE id_properti = ?", [req.params.id]);

    await conn.commit();
    res.json({ message: "Properti berhasil dihapus" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally { conn.release(); }
};

// ─── GET /api/properti/:id/share ─────────────────────────────
exports.getShareText = async (req, res) => {
  try {
    // ✅ ALIAS p.id_properti AS id
    const [rows] = await pool.query(`
      SELECT p.id_properti AS id, p.*,
        tp.kategori, tp.subkategori,
        u.nama AS listed_by_nama, u.no_hp AS listed_by_hp
      FROM properti p
      LEFT JOIN tipe_properti tp ON tp.id_properti = p.id_properti
      LEFT JOIN user u ON u.id_user = p.listed_by
      WHERE p.id_properti = ?`, [req.params.id]);

    if (!rows.length) return res.status(404).json({ message: "Properti tidak ditemukan" });

    const p = rows[0];
    const fmt = (n) => n ? "Rp " + Number(n).toLocaleString("id-ID") : null;

    const text = [
      `*${(p.kategori||"PROPERTI").toUpperCase()} ${(p.jenis_penawaran||"").toUpperCase()}*`,
      `📍 ${p.nama_jalan}, ${p.kota}`,
      fmt(p.harga_jual)  ? `💰 Harga Jual: ${fmt(p.harga_jual)}` : null,
      fmt(p.harga_sewa)  ? `🏠 Sewa: ${fmt(p.harga_sewa)}/thn`   : null,
      `📐 LT: ${p.luas_tanah}m²${p.luas_bangunan ? " | LB: "+p.luas_bangunan+"m²" : ""}`,
      p.kamar_tidur ? `🛏 KT: ${p.kamar_tidur} | 🚿 KM: ${p.kamar_mandi}` : null,
      `📜 Sertifikat: ${p.sertifikat || "-"}`,
      `🏙 ${p.kota}`,
      p.gmaps_url ? `📌 Maps: ${p.gmaps_url}` : null,
      "",
      "Untuk informasi dan jadwal survei:",
      p.listed_by_nama ? "Marketing: " + p.listed_by_nama + (p.listed_by_hp ? " (" + p.listed_by_hp + ")" : "") : "Hubungi Philip Real Estate",
    ].filter(Boolean).join("\n");

    res.json({ shareText: text, waLink: `https://wa.me/?text=${encodeURIComponent(text)}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── POST /api/properti/:id/transaksi ────────────────────────
exports.createTransaksi = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { jenis, harga_aktual, komisi_persen, catatan, tanggal_transaksi } = req.body;

    const [prop] = await conn.query(
      "SELECT id_properti FROM properti WHERE id_properti = ?", [req.params.id]
    );
    if (!prop.length) return res.status(404).json({ message: "Properti tidak ditemukan" });

    const kp = parseFloat(komisi_persen) || (jenis === "terjual" ? 2 : 5);
    const kn = Math.round(parseFloat(harga_aktual) * kp / 100);

    const transaksiId = crypto.randomUUID();
    await conn.query("INSERT INTO transaksi SET ?", [{
      id_transaksi:      transaksiId,
      id_properti:       req.params.id,
      dicatat_oleh:      req.user.id,
      tanggal_transaksi: tanggal_transaksi || new Date().toISOString().slice(0,10),
      jenis,
      harga_aktual:      parseFloat(harga_aktual),
      komisi_persen:     kp,
      komisi_nominal:    kn,
      catatan:           catatan || ""
    }]);

    const newStatus = jenis === "terjual" ? "terjual" : "tersewa";
    await conn.query(
      "UPDATE properti SET status_unit=?, updated_at=NOW() WHERE id_properti=?",
      [newStatus, req.params.id]
    );

    await conn.query(
      "INSERT INTO log_aktivitas (id_log, id_user, id_properti, aksi, detail) VALUES (?,?,?,?,?)",
      [crypto.randomUUID(), req.user.id, req.params.id, "tambah_transaksi",
       `Transaksi ${jenis}: Rp ${Number(harga_aktual).toLocaleString("id-ID")}`]
    );

    await conn.commit();
    res.status(201).json({ message: "Transaksi berhasil dicatat" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally { conn.release(); }
};

// ─── GET /api/properti/:id/transaksi ─────────────────────────
exports.getTransaksi = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, u.nama AS dicatat_oleh_nama
      FROM transaksi t
      JOIN user u ON u.id_user = t.dicatat_oleh
      WHERE t.id_properti = ?
      ORDER BY t.created_at DESC`, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── PUT /api/properti/:id/fotos/reorder ─────────────────────
exports.reorderFotos = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { orders } = req.body;
    for (const item of orders) {
      await conn.query(
        "UPDATE foto_properti SET urutan=?, is_cover=? WHERE id_fotoproperti=? AND id_properti=?",
        [item.urutan, item.is_cover ? 1 : 0, item.id_fotoproperti, req.params.id]
      );
    }
    await conn.commit();
    res.json({ message: "Urutan foto berhasil diperbarui" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: "Server error" });
  } finally { conn.release(); }
};

// ─── DELETE /api/properti/:id/fotos/:fotoId ──────────────────
exports.deleteFoto = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT url_foto FROM foto_properti WHERE id_fotoproperti=? AND id_properti=?",
      [req.params.fotoId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Foto tidak ditemukan" });

    const filePath = rows[0].url_foto.replace(/^\//, "");
    try { await fs.unlink(filePath); } catch {}

    await pool.query("DELETE FROM foto_properti WHERE id_fotoproperti=?", [req.params.fotoId]);
    res.json({ message: "Foto berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
