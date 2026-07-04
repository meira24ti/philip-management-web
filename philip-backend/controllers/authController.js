// philip-backend/controllers/authController.js
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// ─── LOGIN ────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM user WHERE email = ? AND is_active = 1",
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash); // ✅ pakai password_hash
    if (!match) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const token = jwt.sign(
      { id: user.id_user, nama: user.nama, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Catat log login
    await pool.query(
      "INSERT INTO log_aktivitas (id_user, aksi, detail) VALUES (?, 'login', ?)",
      [user.id_user, `Login dari IP: ${req.ip}`]
    );

    const { password_hash: _, ...userData } = user; // ✅ exclude password_hash
    res.json({ token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO log_aktivitas (id_user, aksi) VALUES (?, 'logout')",
      [req.user.id]
    );
    res.json({ message: "Logout berhasil" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ME ──────────────────────────────────────────────────────
exports.me = async (req, res) => {
  try {
    console.log("🔍 req.user.id:", req.user.id); // Tambahkan log
    const [rows] = await pool.query(
      "SELECT id_user as id, nama, email, role, foto_profil, no_hp FROM user WHERE id_user = ?",
      [req.user.id]
    );
    console.log("📦 rows found:", rows.length); // Tambahkan log
    if (!rows.length) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── UPLOAD FOTO PROFIL ──────────────────────────────────────
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
    cb(null, req.user.id + path.extname(file.originalname))
});

exports.uploadFoto = multer({
  storage: fotoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file gambar yang diizinkan"));
    }
  }
});

// ─── UPDATE PROFIL ───────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { nama, no_hp } = req.body;

    // Validasi
    if (!nama || nama.length < 2) {
      return res.status(400).json({ message: "Nama minimal 2 karakter" });
    }

    await pool.query(
      "UPDATE user SET nama = ?, no_hp = ?, updated_at = NOW() WHERE id_user = ?",
      [nama, no_hp || null, req.user.id]
    );

    // Log aktivitas
    await pool.query(
      "INSERT INTO log_aktivitas (id_user, aksi, detail) VALUES (?, 'update_profil', ?)",
      [req.user.id, `Update profil: ${nama}`]
    );

    const [rows] = await pool.query(
      "SELECT id_user as id, nama, email, role, foto_profil, no_hp FROM user WHERE id_user = ?",
      [req.user.id]
    );
    res.json({ message: "Profil berhasil diperbarui", user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── UPLOAD FOTO PROFIL ──────────────────────────────────────
exports.uploadFotoProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File tidak ditemukan" });
    }

    const fotoUrl = "/uploads/profil/" + req.file.filename;
    await pool.query(
      "UPDATE user SET foto_profil = ? WHERE id_user = ?",
      [fotoUrl, req.user.id]
    );

    // Log aktivitas
    await pool.query(
      "INSERT INTO log_aktivitas (id_user, aksi, detail) VALUES (?, 'upload_foto', ?)",
      [req.user.id, `Upload foto profil: ${fotoUrl}`]
    );

    res.json({ message: "Foto berhasil diupload", fotoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── GANTI PASSWORD ──────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validasi
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Password lama dan baru wajib diisi" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password baru minimal 8 karakter" });
    }

    // Ambil password_hash dari database
    const [rows] = await pool.query(
      "SELECT password_hash FROM user WHERE id_user = ?",
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const match = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!match) {
      return res.status(400).json({ message: "Password lama tidak sesuai" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE user SET password_hash = ? WHERE id_user = ?",
      [hash, req.user.id]
    );

    // Log aktivitas
    await pool.query(
      "INSERT INTO log_aktivitas (id_user, aksi, detail) VALUES (?, 'ganti_password', 'Password berhasil diubah')",
      [req.user.id]
    );

    res.json({ message: "Password berhasil diubah" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/auth/notifikasi — ambil log aktivitas terbaru untuk notifikasi
exports.getNotifikasi = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT la.aksi, la.detail, la.created_at,
        CASE la.aksi
          WHEN 'tambah'            THEN 'Properti baru ditambahkan'
          WHEN 'edit'              THEN 'Properti diperbarui'
          WHEN 'hapus'             THEN 'Properti dihapus'
          WHEN 'tambah_staff'      THEN 'Staff baru terdaftar'
          WHEN 'tambah_transaksi'  THEN 'Transaksi baru dicatat'
          WHEN 'generate_laporan'  THEN 'Laporan baru dibuat'
          WHEN 'login'            THEN 'Login ke sistem'          
          ELSE la.aksi
        END AS aksi_label
      FROM log_aktivitas la
      WHERE la.aksi NOT IN ('login','logout','update_profil','upload_foto','ganti_password')
      ORDER BY la.created_at DESC
      LIMIT 10`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
