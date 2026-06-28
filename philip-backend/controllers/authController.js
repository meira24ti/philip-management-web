// philip-backend/controllers/authController.js
const pool    = require("../config/db");
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
 
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM user WHERE email = ? AND is_active = 1",
      [email]
    );
    if (!rows.length)
      return res.status(401).json({ message: "Email atau password salah" });
 
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Email atau password salah" });
 
    const token = jwt.sign(
      { id: user.id, nama: user.nama, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
 
    // Catat log login
    await pool.query(
      "INSERT INTO log_aktivitas (user_id, aksi, detail) VALUES (?, 'login', ?)",
      [user.id, `Login dari IP: ${req.ip}`]
    );
 
    const { password: _, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
 
exports.logout = async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO log_aktivitas (user_id, aksi) VALUES (?, 'logout')",
      [req.user.id]
    );
    res.json({ message: "Logout berhasil" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
 
exports.me = async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id,nama,email,role,foto_profil,no_hp FROM user WHERE id = ?",
    [req.user.id]
  );
  res.json(rows[0]);
};
