// philip-backend/controllers/staffController.js
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs").promises;
const { imageFileFilter, safeImageExtension } = require("../utils/uploadValidation");

const roleRank = { marketing: 1, admin: 2, direktur: 3 };
const canManageRole = (actorRole, targetRole) =>
  (roleRank[actorRole] || 0) > (roleRank[targetRole] || 0);
// Admin dan Direktur dapat membuat semua jenis akun staff, termasuk akun
// Direktur. Pengelolaan akun yang sudah ada tetap mengikuti hierarki role di
// atas agar akun setara tidak dapat diubah atau dinonaktifkan sembarangan.
const canCreateRole = (actorRole, targetRole) =>
  ["admin", "direktur"].includes(actorRole) &&
  ["admin", "marketing", "direktur"].includes(targetRole);

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
    cb(null, `${Date.now()}-${crypto.randomUUID()}${safeImageExtension(file)}`)
});
exports.uploadFoto = multer({
  storage: fotoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: imageFileFilter,
});

// ─── GET /api/staff ─────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    let sql = `
      SELECT id_user, nama, email, role, is_active, foto_profil, no_hp, created_at
      FROM user
      WHERE is_active = 1
    `;
    const params = [];
    const { search, role } = req.query;

    if (search) {
      sql += " AND (nama LIKE ? OR email LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s);
    }
    if (role && role !== "Semua") {
      sql += " AND role = ?";
      params.push(role);
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
    const { nama, email, role, no_hp, password } = req.body;

    // 1. Validasi role
    const validRoles = ["admin", "marketing", "direktur"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Role tidak valid" });
    }
    if (!canCreateRole(req.user.role, role)) {
      return res.status(403).json({ message: "Tidak memiliki izin untuk membuat akun staff" });
    }

    // 2. Cek duplikasi email
    const [existing] = await pool.query("SELECT id_user FROM user WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

    // 3. Gunakan password yang diberikan admin atau generate acak
    let rawPassword = null;
    let hashedPassword;
    if (password) {
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ message: "Password minimal 6 karakter" });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      rawPassword = crypto.randomBytes(8).toString("hex"); // 16 karakter hex
      hashedPassword = await bcrypt.hash(rawPassword, 10);
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO user (id_user, nama, email, password_hash, role, no_hp, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [id, nama, email, hashedPassword, role, no_hp || null]
    );

    // 4. Catat log
    await pool.query(
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, ?, ?)",
      [crypto.randomUUID(), req.user.id, "tambah_staff", `Staff baru: ${nama} (${role})`]
    );

    const resp = { message: "Staff berhasil ditambahkan" };
    if (rawPassword) resp.defaultPassword = rawPassword; // hanya kembalikan jika dibuat otomatis
    res.status(201).json(resp);
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
    const [staff] = await pool.query("SELECT id_user, role FROM user WHERE id_user = ?", [id]);
    if (!staff.length) {
      return res.status(404).json({ message: "Staff tidak ditemukan" });
    }
    if (!canManageRole(req.user.role, staff[0].role) || !canManageRole(req.user.role, role)) {
      return res.status(403).json({ message: "Tidak boleh mengubah akun dengan role setara atau lebih tinggi" });
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
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, ?, ?)",
      [crypto.randomUUID(), req.user.id, "edit_staff", `Edit staff ID: ${id} (${email})`]
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
    const [rows] = await pool.query("SELECT nama, role FROM user WHERE id_user = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ message: "Staff tidak ditemukan" });
    }
    if (!canManageRole(req.user.role, rows[0].role)) {
      return res.status(403).json({ message: "Tidak boleh menonaktifkan akun dengan role setara atau lebih tinggi" });
    }
    const staffName = rows[0].nama;

    // 3. Nonaktifkan
    await pool.query("UPDATE user SET is_active = 0 WHERE id_user = ?", [id]);

    // 4. Catat log dengan nama staff
    await pool.query(
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, ?, ?)",
      [crypto.randomUUID(), req.user.id, "nonaktifkan_staff", `Staff ${staffName} (${id}) dinonaktifkan`]
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
    const [staff] = await pool.query("SELECT role FROM user WHERE id_user = ?", [id]);
    if (!staff.length) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ message: "Staff tidak ditemukan" });
    }
    if (!canManageRole(req.user.role, staff[0].role)) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(403).json({ message: "Tidak boleh mengubah foto akun dengan role setara atau lebih tinggi" });
    }
    const fotoUrl = "/uploads/profil/" + req.file.filename;
    await pool.query("UPDATE user SET foto_profil=? WHERE id_user=?", [fotoUrl, id]);
    res.json({ message:"Foto staff berhasil diupload", fotoUrl });
  } catch (err) {
    res.status(500).json({ message:"Server error" });
  }
};
