// philip-backend/controllers/staffController.js
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// ─── Upload foto profil staff ──────────────────────────────
const fotoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir("uploads/profil", { recursive: true });
      cb(null, "uploads/profil");
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
exports.uploadFoto = multer({
  storage: fotoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Hanya file gambar yang diizinkan"));
  }
});

// ─── GET /api/staff ─────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    let sql = `
      SELECT id_user, nama, email, role, is_active, foto_profil, no_hp, created_at
      FROM user
      WHERE 1=1
    `;
    const params = [];
    const { search, role, status } = req.query;

    if (search) {
      sql += " AND (nama LIKE ? OR email LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s);
    }
    if (role && role !== "Semua") {
      sql += " AND role = ?";
      params.push(role);
    }
    if (status === "Aktif") {
      sql += " AND is_active = 1";
    } else if (status === "Nonaktif") {
      sql += " AND is_active = 0";
    }

    sql += " ORDER BY FIELD(role, 'direktur', 'admin', 'marketing'), nama";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error di getAll staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── POST /api/staff ────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { nama, email, role, no_hp } = req.body;

    // 1. Validasi role
    const validRoles = ["admin", "marketing", "direktur"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Role tidak valid" });
    }

    // 2. Cek duplikasi email
    const [existing] = await pool.query("SELECT id_user FROM user WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

    // 3. Generate password acak (lebih aman)
    const rawPassword = crypto.randomBytes(8).toString("hex"); // 16 karakter hex
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO user (id_user, nama, email, password_hash, role, no_hp, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [id, nama, email, hashedPassword, role, no_hp || null]
    );

    // 4. Catat log
    await pool.query(
      "INSERT INTO log_aktivitas (id_user, aksi, detail) VALUES (?, ?, ?)",
      [req.user.id, "tambah_staff", `Staff baru: ${nama} (${role})`]
    );

    res.status(201).json({
      message: "Staff berhasil ditambahkan",
      defaultPassword: rawPassword // dikembalikan agar bisa disampaikan ke staff
    });
  } catch (err) {
    console.error("❌ Error di create staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── PUT /api/staff/:id ─────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, role, no_hp } = req.body;

    // 1. Validasi role
    const validRoles = ["admin", "marketing", "direktur"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Role tidak valid" });
    }

    // 2. Cek apakah staff dengan ID ini ada
    const [staff] = await pool.query("SELECT id_user FROM user WHERE id_user = ?", [id]);
    if (!staff.length) {
      return res.status(404).json({ message: "Staff tidak ditemukan" });
    }

    // 3. Cek duplikasi email (kecuali dirinya sendiri)
    const [existing] = await pool.query(
      "SELECT id_user FROM user WHERE email = ? AND id_user != ?",
      [email, id]
    );
    if (existing.length) {
      return res.status(409).json({ message: "Email sudah digunakan oleh staff lain" });
    }

    // 4. Update data
    await pool.query(
      "UPDATE user SET nama=?, email=?, role=?, no_hp=?, updated_at=NOW() WHERE id_user=?",
      [nama, email, role, no_hp, id]
    );


    // 5. Catat log
    await pool.query(
      "INSERT INTO log_aktivitas (id_user, aksi, detail) VALUES (?, ?, ?)",
      [req.user.id, "edit_staff", `Edit staff ID: ${id} (${email})`]
    );

    res.json({ message: "Data staff berhasil diperbarui" });
  } catch (err) {
    console.error("❌ Error di update staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── PATCH /api/staff/:id/deactivate ──────────────────────
exports.deactivate = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Tidak boleh menonaktifkan diri sendiri
    if (id === req.user.id) {
      return res.status(400).json({ message: "Tidak dapat menonaktifkan akun sendiri" });
    }

    // 2. Cek apakah staff ada dan ambil namanya
    const [rows] = await pool.query("SELECT nama FROM user WHERE id_user = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ message: "Staff tidak ditemukan" });
    }
    const staffName = rows[0].nama;

    // 3. Nonaktifkan
    await pool.query("UPDATE user SET is_active = 0 WHERE id_user = ?", [id]);

    // 4. Catat log dengan nama staff
    await pool.query(
      "INSERT INTO log_aktivitas (id_user, aksi, detail) VALUES (?, ?, ?)",
      [req.user.id, "nonaktifkan_staff", `Staff ${staffName} (${id}) dinonaktifkan`]
    );

    res.json({ message: "Staff berhasil dinonaktifkan" });
  } catch (err) {
    console.error("❌ Error di deactivate staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.uploadStaffFoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File tidak ditemukan" });
    const { id } = req.params;
    const fotoUrl = "/uploads/profil/" + req.file.filename;
    await pool.query("UPDATE user SET foto_profil=? WHERE id_user=?", [fotoUrl, id]);
    res.json({ message:"Foto staff berhasil diupload", fotoUrl });
  } catch (err) {
    res.status(500).json({ message:"Server error" });
  }
};
