// philip-backend/seed-admin.js
const pool = require("./config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

async function seedAdmin() {
  try {
    const password = "philip2025";
    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO user (id_user, nama, email, password_hash, role, is_active, no_hp, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, "Admin Philip", "admin@philip.co.id", hash, "admin", 1, "08123456789"]
    );

    console.log("✅ Admin berhasil ditambahkan!");
    console.log(`   Email: admin@philip.co.id`);
    console.log(`   Password: ${password}`);
    process.exit(0);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      console.log("⚠️  Admin sudah ada (email sudah terdaftar).");
    } else {
      console.error("❌ Gagal seed admin:", err.message);
    }
    process.exit(1);
  }
}

seedAdmin();