// philip-backend/controllers/settingController.js
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// Upload logo
const logoStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await fs.mkdir("uploads/logo", { recursive: true });
            cb(null, "uploads/logo");
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) =>
        cb(null, "logo" + path.extname(file.originalname))
});
exports.uploadLogo = multer({
    storage: logoStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Hanya file gambar yang diizinkan"));
    }
});

// GET /api/setting — ambil semua setting
exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT key_name, key_value FROM setting");
        const result = {};
        rows.forEach(r => result[r.key_name] = r.key_value);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/setting — update setting (admin only)
exports.update = async (req, res) => {
    try {
        const updates = req.body;
        for (const [key, value] of Object.entries(updates)) {
            // ✅ updated_by WAJIB diisi (NOT NULL di schema)
            await pool.query(
                "UPDATE setting SET key_value = ?, updated_by = ?, updated_at = NOW() WHERE key_name = ?",
                [value, req.user.id, key]
            );
        }
        res.json({ message: "Pengaturan berhasil disimpan" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};


// POST /api/setting/logo — upload logo perusahaan
exports.uploadLogoFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "File tidak ditemukan" });
        const logoUrl = "/uploads/logo/" + req.file.filename;
        await pool.query(
            "UPDATE setting SET key_value = ?, updated_by = ? WHERE key_name = ?",
            [logoUrl, req.user.id, "company_logo"]
        );
        res.json({ message: "Logo berhasil diupload", logoUrl });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
