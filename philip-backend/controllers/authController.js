// philip-backend/controllers/authController.js
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs").promises;
const crypto = require("crypto");
const { imageFileFilter, safeImageExtension } = require("../utils/uploadValidation");
const { passwordVersion: resetTokenVersion, signAccessToken, signResetToken, verifyResetToken } = require("../utils/authTokens");
const validation = require("../utils/validation");

const getResetMailer = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    disableFileAccess: true,
    disableUrlAccess: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const getClientUrl = () => String(process.env.CLIENT_URL || "").split(",")[0].trim().replace(/\/$/, "");

// ─── LOGIN ────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const email = validation.email(req.body?.email);
    const password = req.body?.password;
    if (typeof password !== "string" || !password || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ message: "Email atau password tidak valid" });
    }
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

    const sessionId = crypto.randomUUID();
    const token = signAccessToken(user, sessionId);
    const expiresAt = new Date(jwt.decode(token).exp * 1000).toISOString().slice(0, 19).replace("T", " ");
    await pool.query("DELETE FROM auth_sessions WHERE expires_at <= UTC_TIMESTAMP()");
    await pool.query("INSERT INTO auth_sessions (id_session, id_user, password_version, expires_at) VALUES (?,?,?,?)",
      [sessionId, user.id_user, resetTokenVersion(user.password_hash), expiresAt]);

    // Catat log login
    await pool.query(
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, 'login', ?)",
      [crypto.randomUUID(), user.id_user, `Login dari IP: ${req.ip}`]
    );

    const { password_hash: _, ...userData } = user; // ✅ exclude password_hash
    res.json({ token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
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
    const token = signResetToken(user);
    const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: "Reset Password — Philip Real Estate",
      text: `Halo ${user.nama},\n\nGunakan tautan berikut untuk membuat password baru. Tautan berlaku 15 menit:\n${resetUrl}\n\nJika Anda tidak meminta reset password, abaikan email ini.`,
      html: `<p>Halo ${validation.escapeHtml(user.nama)},</p><p>Gunakan tautan berikut untuk membuat password baru. Tautan berlaku selama <strong>15 menit</strong>.</p><p><a href="${validation.escapeHtml(resetUrl)}">Reset password saya</a></p><p>Jika Anda tidak meminta reset password, abaikan email ini.</p>`,
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
  try {
    validation.password(newPassword, "Password baru");
    const payload = verifyResetToken(token);
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
    const [updated] = await pool.query(
      "UPDATE user SET password_hash = ?, updated_at = NOW() WHERE id_user = ? AND password_hash = ?",
      [passwordHash, payload.sub, rows[0].password_hash]
    );
    if (!updated.affectedRows) return res.status(400).json({ message: "Tautan reset sudah digunakan" });
    await pool.query("DELETE FROM auth_sessions WHERE id_user=?", [payload.sub]);
    await pool.query(
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, 'reset_password', 'Password direset melalui email')",
      [crypto.randomUUID(), payload.sub]
    );

    return res.json({ message: "Password berhasil direset. Silakan masuk dengan password baru." });
  } catch (error) {
    return res.status(400).json({ message: error.statusCode ? error.message : "Tautan reset tidak valid atau sudah kedaluwarsa" });
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    await pool.query("DELETE FROM auth_sessions WHERE id_session=? AND id_user=?", [req.sessionId, req.user.id]);
    await pool.query(
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, 'logout', ?)",
      [crypto.randomUUID(), req.user.id, `Logout dari IP: ${req.ip}`]
    );
    res.json({ message: "Logout berhasil" });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
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
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
  }
};

// ─── UPLOAD FOTO PROFIL ──────────────────────────────────────
const fotoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(require("path").join(__dirname, "../uploads/.tmp"), { recursive: true });
      cb(null, require("path").join(__dirname, "../uploads/.tmp"));
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) =>
    cb(null, `${req.user.id}-${crypto.randomUUID()}${safeImageExtension(file)}`)
});

exports.uploadFoto = multer({
  storage: fotoStorage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 5, parts: 6, fieldSize: 4096 },
  fileFilter: imageFileFilter,
});

// ─── UPDATE PROFIL ───────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const nama = validation.text(req.body?.nama, "Nama", { required: true, min: 2, max: 100 });
    const no_hp = validation.text(req.body?.no_hp, "Nomor HP", { max: 30 });

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
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
  }
};

// ─── UPLOAD FOTO PROFIL ──────────────────────────────────────
exports.uploadFotoProfile = async (req, res) => {
  let stored = false;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File tidak ditemukan" });
    }

    const fotoUrl = "/uploads/profil/" + req.file.filename;
    await pool.query(
      "UPDATE user SET foto_profil = ? WHERE id_user = ?",
      [fotoUrl, req.user.id]
    );
    stored = true;

    // Log aktivitas
    await pool.query(
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, 'upload_foto', ?)",
      [crypto.randomUUID(), req.user.id, `Upload foto profil: ${fotoUrl}`]
    );

    res.json({ message: "Foto berhasil diupload", fotoUrl });
  } catch (err) {
    if (!stored && req.file) await fs.unlink(req.file.path).catch(() => {});
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
  }
};

// ─── GANTI PASSWORD ──────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    validation.password(newPassword, "Password baru");
    if (typeof oldPassword !== "string" || Buffer.byteLength(oldPassword, "utf8") > 72) throw validation.badRequest("Password lama tidak valid");

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

    const hash = await bcrypt.hash(newPassword, 12);
    const [updated] = await pool.query(
      "UPDATE user SET password_hash = ?, updated_at=NOW() WHERE id_user = ? AND password_hash = ?",
      [hash, req.user.id, rows[0].password_hash]
    );
    if (!updated.affectedRows) return res.status(409).json({ message: "Password sudah berubah. Silakan login kembali." });
    await pool.query("DELETE FROM auth_sessions WHERE id_user=?", [req.user.id]);

    // Log aktivitas
    await pool.query(
      "INSERT INTO log_aktivitas (id_log, id_user, aksi, detail) VALUES (?, ?, 'ganti_password', 'Password berhasil diubah')",
      [crypto.randomUUID(), req.user.id]
    );

    res.json({ message: "Password berhasil diubah" });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
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
      ${req.user.role === "marketing" ? "AND la.aksi IN ('tambah','edit','hapus')" : ""}
      ORDER BY la.created_at DESC
      LIMIT 20`);
    res.json(rows);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
  }
};

module.exports = require("../utils/safeControllers")(module.exports);
