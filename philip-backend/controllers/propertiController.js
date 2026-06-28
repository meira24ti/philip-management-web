// philip-backend/controllers/propertiController.js
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;   // gunakan versi promise
const crypto = require("crypto");        // untuk randomUUID

// Setup multer untuk upload foto
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = `uploads/properti/${req.params.id || "temp"}`;
        fs.mkdir(dir, { recursive: true }).then(() => cb(null, dir)).catch(cb);
    },
    filename: (req, file, cb) =>
        cb(null, Date.now() + path.extname(file.originalname))
});
exports.upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/properti — daftar semua properti dengan filter
exports.getAll = async (req, res) => {
    try {
        const { search, jenis, kota, statusUnit, ltMin, ltMax, hargaMin, hargaMax } = req.query;
        let sql = `
      SELECT p.*, 
        tp.kategori, tp.subkategori, tp.jumlah_unit,
        fp.url_foto AS cover_foto,
        v.nama_vendor, v.no_hp AS vendor_hp,
        u.nama AS listed_by_nama
      FROM properti p
      LEFT JOIN tipe_properti tp ON tp.properti_id = p.id
      LEFT JOIN foto_properti fp ON fp.properti_id = p.id AND fp.is_cover = 1
      LEFT JOIN vendor v ON v.id = p.vendor_id
      LEFT JOIN user   u ON u.id = p.listed_by
      WHERE 1=1`;
        const params = [];

        if (search) {
            sql += " AND (p.nama_jalan LIKE ? OR p.kota LIKE ? OR tp.kategori LIKE ?)";
            const s = `%${search}%`;
            params.push(s, s, s);
        }
        if (jenis) { sql += " AND p.jenis_penawaran = ?"; params.push(jenis); }
        if (kota) { sql += " AND p.kota = ?"; params.push(kota); }
        if (statusUnit) { sql += " AND p.status_unit = ?"; params.push(statusUnit); }
        if (ltMin) { sql += " AND p.luas_tanah >= ?"; params.push(ltMin); }
        if (ltMax) { sql += " AND p.luas_tanah <= ?"; params.push(ltMax); }
        if (hargaMin) { sql += " AND p.harga_jual >= ?"; params.push(hargaMin); }
        if (hargaMax) { sql += " AND p.harga_jual <= ?"; params.push(hargaMax); }

        // Filter internal — hanya admin & direktur
        if (["admin", "direktur","marketing"].includes(req.user.role)) {
            const { listedBy, dari, sampai, spanduk, kunci, feed } = req.query;
            if (listedBy) { sql += " AND u.nama LIKE ?"; params.push(`%${listedBy}%`); }
            if (dari) { sql += " AND p.tanggal_listing >= ?"; params.push(dari); }
            if (sampai) { sql += " AND p.tanggal_listing <= ?"; params.push(sampai); }
            if (spanduk !== undefined) { sql += " AND p.spanduk = ?"; params.push(spanduk); }
            if (kunci !== undefined) { sql += " AND p.kunci   = ?"; params.push(kunci); }
            if (feed !== undefined) { sql += " AND p.feed    = ?"; params.push(feed); }
        }

        sql += " ORDER BY p.created_at DESC";
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/properti/:id
exports.getById = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT p.*, tp.*, v.nama_vendor, v.no_hp AS vendor_hp, u.nama AS listed_by_nama
      FROM properti p
      LEFT JOIN tipe_properti tp ON tp.properti_id = p.id
      LEFT JOIN vendor v ON v.id = p.vendor_id
      LEFT JOIN user   u ON u.id = p.listed_by
      WHERE p.id = ?
    `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: "Properti tidak ditemukan" });

        const [fotos] = await pool.query(
            "SELECT * FROM foto_properti WHERE properti_id = ? ORDER BY urutan",
            [req.params.id]
        );
        res.json({ ...rows[0], foto_properti: fotos });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/properti (sudah diperbaiki: pindah file dari temp ke folder id)
exports.create = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { kategori, subkategori, jumlah_unit, jumlah_kapling, ...propertiData } = req.body;

        const id = crypto.randomUUID();
        await conn.query("INSERT INTO properti SET ?", [{ id, ...propertiData }]);
        await conn.query("INSERT INTO tipe_properti SET ?",
            [{ id: crypto.randomUUID(), properti_id: id, kategori, subkategori, jumlah_unit, jumlah_kapling }]
        );

        // Simpan foto-foto
        if (req.files?.length) {
            const tempDir = `uploads/properti/temp`;
            const targetDir = `uploads/properti/${id}`;
            await fs.mkdir(targetDir, { recursive: true });

            for (let i = 0; i < req.files.length; i++) {
                const f = req.files[i];
                const oldPath = `${tempDir}/${f.filename}`;
                const newPath = `${targetDir}/${f.filename}`;
                await fs.rename(oldPath, newPath); // pindahkan file
                const url = `/uploads/properti/${id}/${f.filename}`;
                await conn.query("INSERT INTO foto_properti SET ?", [{
                    id: crypto.randomUUID(),
                    properti_id: id,
                    url_foto: url,
                    is_cover: i === 0,
                    urutan: i + 1
                }]);
            }
            // Hapus folder temp jika kosong
            try { await fs.rmdir(tempDir); } catch { }
        }

        await conn.query(
            "INSERT INTO log_aktivitas (user_id, properti_id, aksi, detail) VALUES (?,?,?,?)",
            [req.user.id, id, "tambah", "Properti baru ditambahkan"]
        );
        await conn.commit();
        res.status(201).json({ message: "Properti berhasil ditambahkan", id });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ message: "Server error" });
    } finally { conn.release(); }
};

// PUT /api/properti/:id
exports.update = async (req, res) => {
    try {
        const { kategori, subkategori, jumlah_unit, jumlah_kapling, ...propertiData } = req.body;
        propertiData.updated_at = new Date();
        await pool.query("UPDATE properti SET ? WHERE id = ?", [propertiData, req.params.id]);
        await pool.query(
            "UPDATE tipe_properti SET kategori=?, subkategori=?, jumlah_unit=? WHERE properti_id=?",
            [kategori, subkategori, jumlah_unit, req.params.id]
        );
        await pool.query(
            "INSERT INTO log_aktivitas (user_id,properti_id,aksi) VALUES (?,?,?)",
            [req.user.id, req.params.id, "edit"]
        );
        res.json({ message: "Properti berhasil diperbarui" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/properti/:id
exports.remove = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        // Hapus folder foto dari disk
        const dir = `uploads/properti/${req.params.id}`;
        try { await fs.rm(dir, { recursive: true }); } catch { }

        await conn.query("DELETE FROM foto_properti  WHERE properti_id = ?", [req.params.id]);
        await conn.query("DELETE FROM tipe_properti  WHERE properti_id = ?", [req.params.id]);
        await conn.query("DELETE FROM log_aktivitas  WHERE properti_id = ?", [req.params.id]);
        await conn.query("DELETE FROM properti       WHERE id = ?", [req.params.id]);
        await conn.commit();
        res.json({ message: "Properti berhasil dihapus" });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: "Server error" });
    } finally { conn.release(); }
};

// GET /api/properti/:id/share-text
exports.getShareText = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT p.*, tp.kategori, tp.subkategori, u.nama AS listed_by_nama
      FROM properti p
      LEFT JOIN tipe_properti tp ON tp.properti_id = p.id
      LEFT JOIN user u ON u.id = p.listed_by
      WHERE p.id = ?
    `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: "Properti tidak ditemukan" });

        const p = rows[0];
        const hargaJual = p.harga_jual
            ? "Rp " + Number(p.harga_jual).toLocaleString("id-ID") : null;
        const hargaSewa = p.harga_sewa
            ? "Rp " + Number(p.harga_sewa).toLocaleString("id-ID") + "/thn" : null;

        const text = [
            `*${p.kategori?.toUpperCase()} ${p.jenis_penawaran?.toUpperCase()}*`,
            `📍 ${p.nama_jalan}, ${p.kota}`,
            hargaJual ? `💰 Harga Jual: ${hargaJual}` : null,
            hargaSewa ? `🏠 Sewa: ${hargaSewa}` : null,
            `📐 LT: ${p.luas_tanah}m²${p.luas_bangunan ? " | LB: " + p.luas_bangunan + "m²" : ""}`,
            p.kamar_tidur ? `🛏 KT: ${p.kamar_tidur} | 🚿 KM: ${p.kamar_mandi}` : null,
            `📜 Sertifikat: ${p.sertifikat || "-"}`,
            `🏙 ${p.kota}`,
            p.gmaps_url ? `📌 Maps: ${p.gmaps_url}` : null,
        ].filter(Boolean).join("\n");

        const waLink = `https://wa.me/?text=${encodeURIComponent(text)}`;
        res.json({ shareText: text, waLink });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
