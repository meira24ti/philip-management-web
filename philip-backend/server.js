// philip-backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const propertiRoutes = require("./routes/propertiRoutes");
const staffRoutes = require("./routes/staffRoutes");
const statistikRoutes = require("./routes/statistikRoutes");
const laporanRoutes = require("./routes/laporanRoutes");
const settingRoutes = require("./routes/settingRoutes");

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      const isLocalhostOrigin = /^https?:\/\/localhost(:\d+)?$/.test(origin);
      const hasLocalhostAllowed = allowedOrigins.some((url) => /^https?:\/\/localhost(:\d+)?$/.test(url));
      if (isLocalhostOrigin && hasLocalhostAllowed) return callback(null, true);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder untuk foto yang diupload
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

app.get("/", (req, res) => res.json({ status: "Philip API running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
