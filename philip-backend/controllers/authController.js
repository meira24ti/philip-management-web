// philip-backend/controllers/authController.js
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs").promises;
const crypto = require("crypto");
const { imageFileFilter, safeImageExtension } = require("../utils/uploadValidation");

const resetTokenVersion = (passwordHash) =>
  crypto.createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);

const getResetMailer = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const getClientUrl = () => String(process.env.CLIENT_URL || "").split(",")[0].trim().replace(/\/$/, "");

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
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    // Catat log login
    await pool.query(
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, 'login', ?)",
      [crypto.randomUUID(), user.id_user, `Login dari IP: ${req.ip}`]
    );

    const { password_hash: _, ...userData } = user; // ✅ exclude password_hash
    res.json({ token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/forgot-password
// Always returns the same response to prevent email-account enumeration.
exports.forgotPassword = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const genericResponse = {
    message: "Jika email terdaftar, tautan reset password akan segera dikirim.",
  };

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Masukkan alamat email yang valid" });
  }

  try {
    const transporter = getResetMailer();
    const clientUrl = getClientUrl();
    if (!transporter || !clientUrl) {
      console.error("Password reset is not configured: SMTP and CLIENT_URL are required");
      return res.status(503).json({ message: "Layanan reset password belum dikonfigurasi" });
    }

    const [rows] = await pool.query(
      "SELECT id_user, nama, email, password_hash FROM user WHERE email = ? AND is_active = 1",
      [email]
    );
    if (!rows.length) return res.json(genericResponse);

    const user = rows[0];
    const token = jwt.sign(
      { sub: user.id_user, purpose: "password_reset", version: resetTokenVersion(user.password_hash) },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: "Reset Password — Philip Real Estate",
      text: `Halo ${user.nama},\n\nGunakan tautan berikut untuk membuat password baru. Tautan berlaku 15 menit:\n${resetUrl}\n\nJika Anda tidak meminta reset password, abaikan email ini.`,
      html: `<p>Halo ${user.nama},</p><p>Gunakan tautan berikut untuk membuat password baru. Tautan berlaku selama <strong>15 menit</strong>.</p><p><a href="${resetUrl}">Reset password saya</a></p><p>Jika Anda tidak meminta reset password, abaikan email ini.</p>`,
    });

    await pool.query(
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, 'minta_reset_password', 'Permintaan reset password')",
      [crypto.randomUUID(), user.id_user]
    );
    return res.json(genericResponse);
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Gagal memproses permintaan reset password" });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ message: "Password baru minimal 8 karakter" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose !== "password_reset" || !payload.sub || !payload.version) {
      return res.status(400).json({ message: "Tautan reset tidak valid" });
    }

    const [rows] = await pool.query(
      "SELECT id_user, password_hash FROM user WHERE id_user = ? AND is_active = 1",
      [payload.sub]
    );
    if (!rows.length || resetTokenVersion(rows[0].password_hash) !== payload.version) {
      return res.status(400).json({ message: "Tautan reset sudah tidak berlaku" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      "UPDATE user SET password_hash = ?, updated_at = NOW() WHERE id_user = ?",
      [passwordHash, payload.sub]
    );
    await pool.query(
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, 'reset_password', 'Password direset melalui email')",
      [crypto.randomUUID(), payload.sub]
    );

    return res.json({ message: "Password berhasil direset. Silakan masuk dengan password baru." });
  } catch {
    return res.status(400).json({ message: "Tautan reset tidak valid atau sudah kedaluwarsa" });
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, 'logout', ?)",
      [crypto.randomUUID(), req.user.id, `Logout dari IP: ${req.ip}`]
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
    const [rows] = await pool.query(
      "SELECT id_user as id, nama, email, role, foto_profil, no_hp FROM user WHERE id_user = ?",
      [req.user.id]
    );
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
    cb(null, `${req.user.id}-${crypto.randomUUID()}${safeImageExtension(file)}`)
});

exports.uploadFoto = multer({
  storage: fotoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFileFilter,
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
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, 'update_profil', ?)",
      [crypto.randomUUID(), req.user.id, `Update profil: ${nama}`]
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
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, 'upload_foto', ?)",
      [crypto.randomUUID(), req.user.id, `Upload foto profil: ${fotoUrl}`]
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
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, 'ganti_password', 'Password berhasil diubah')",
      [crypto.randomUUID(), req.user.id]
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
      SELECT la.id_log, la.aksi, la.detail, la.created_at,
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
      WHERE la.aksi NOT IN ('login','logout','update_profil','upload_foto','ganti_password','minta_reset_password','reset_password')
      ORDER BY la.created_at DESC
      LIMIT 20`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
