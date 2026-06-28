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

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
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

app.get("/", (req, res) => res.json({ status: "Philip API running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
