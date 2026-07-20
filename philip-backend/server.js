// philip-backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const pool = require("./config/db"); // <-- Tambahan

const authRoutes = require("./routes/authRoutes");
const propertiRoutes = require("./routes/propertiRoutes");
const staffRoutes = require("./routes/staffRoutes");
const statistikRoutes = require("./routes/statistikRoutes");
const laporanRoutes = require("./routes/laporanRoutes");
const settingRoutes = require("./routes/settingRoutes");

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean)
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.length === 0) return callback(null, true);
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      const isLocalhostOrigin =
        /^https?:\/\/localhost(:\d+)?$/.test(origin);

      const hasLocalhostAllowed = allowedOrigins.some((url) =>
        /^https?:\/\/localhost(:\d+)?$/.test(url)
      );

      if (isLocalhostOrigin && hasLocalhostAllowed)
        return callback(null, true);

      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder upload
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properti", propertiRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/statistik", statistikRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/setting", settingRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    status: "Philip API running",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(
    "GLOBAL ERROR HANDLER:",
    err && err.stack ? err.stack : err
  );

  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "Ukuran file melebihi batas (5MB)",
    });
  }

  if (err && err.message && err.message.includes("CORS policy")) {
    return res.status(403).json({
      message: err.message,
    });
  }

  res.status(500).json({
    message: "Server error",
  });
});

// ===============================
// CEK KONEKSI DATABASE
// ===============================
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Berhasil terhubung ke MySQL");
    conn.release();
  } catch (err) {
    console.error("❌ Gagal terhubung ke MySQL");
    console.error(err);
  }
})();

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});