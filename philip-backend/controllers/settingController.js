// philip-backend/controllers/settingController.js
const pool = require("../config/db");
const multer = require("multer");
const fs = require("fs").promises;
const crypto = require("crypto");
const { imageFileFilter, safeImageExtension } = require("../utils/uploadValidation");
const validation = require("../utils/validation");

const allowedSettingKeys = new Set([
  "company_name",
  "company_tagline",
  "company_city",
  "company_phone",
  "hero_title",
  "hero_subtitle",
  "hero_desc",
]);

async function saveSettings(entries, actorId) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        for (const [key, value] of entries) {
            const [existing] = await conn.query("SELECT id_setting FROM setting WHERE key_name = ? FOR UPDATE", [key]);
            if (existing.length) {
                await conn.query("UPDATE setting SET key_value = ?, updated_by = ?, updated_at = NOW() WHERE key_name = ?", [value, actorId, key]);
            } else {
                await conn.query("INSERT INTO setting (id_setting, key_name, key_value, updated_by) VALUES (?, ?, ?, ?)", [crypto.randomUUID(), key, value, actorId]);
            }
        }
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally { conn.release(); }
}

// Upload logo
const logoStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await fs.mkdir(require("path").join(__dirname, "../uploads/.tmp"), { recursive: true });
            cb(null, require("path").join(__dirname, "../uploads/.tmp"));
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) =>
        cb(null, `logo-${Date.now()}-${crypto.randomUUID()}${safeImageExtension(file)}`)
});
exports.uploadLogo = multer({
    storage: logoStorage,
    limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 5, parts: 6, fieldSize: 4096 },
    fileFilter: imageFileFilter,
});

// GET /api/setting — ambil semua setting
exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT key_name, key_value FROM setting WHERE key_name IN (?)", [[...allowedSettingKeys, "company_logo"]]);
        const result = {};
        rows.forEach(r => result[r.key_name] = r.key_value);
        res.json(result);
    } catch (err) {
        res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
    }
};

// PUT /api/setting — update setting (admin only)
exports.update = async (req, res) => {
    try {
        const updates = Object.entries(req.body || {}).filter(([key]) => allowedSettingKeys.has(key));
        if (updates.length === 0) {
            return res.status(400).json({ message: "Tidak ada pengaturan yang valid untuk diperbarui" });
        }

        for (const [key, value] of updates) {
            validation.text(value, "Pengaturan perusahaan", { max: key === "hero_desc" ? 1000 : 255 });
        }
        await saveSettings(updates, req.user.id);
        res.json({ message: "Pengaturan berhasil disimpan" });
    } catch (err) {
        console.error(err);
        res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
    }
};


// POST /api/setting/logo — upload logo perusahaan
exports.uploadLogoFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "File tidak ditemukan" });
        const logoUrl = "/uploads/logo/" + req.file.filename;
        await saveSettings([["company_logo", logoUrl]], req.user.id);
        res.json({ message: "Logo berhasil diupload", logoUrl });
    } catch (err) {
        if (req.file) await fs.unlink(req.file.path).catch(() => {});
        res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Server error" });
    }
};

module.exports = require("../utils/safeControllers")(module.exports);
