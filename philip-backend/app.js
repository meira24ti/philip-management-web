const express = require("express");
const cors = require("cors");
const path = require("path");
const auth = require("./middleware/auth");
const rbac = require("./middleware/rbac");

function createApp(env = process.env) {
  const app = express();
  const production = env.NODE_ENV === "production";
  const allowedOrigins = env.CLIENT_URL?.split(",").map(url => url.trim().replace(/\/$/, "")).filter(Boolean)
    || (production ? [] : ["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173", "http://127.0.0.1:4173"]);
  if (production && !allowedOrigins.length) throw new Error("CLIENT_URL wajib diatur pada environment production");
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET wajib diatur dan minimal 32 karakter");
  if (env.TRUST_PROXY) {
    if (env.TRUST_PROXY === "true") throw new Error("TRUST_PROXY harus berupa jumlah proxy tepercaya atau daftar IP, bukan true");
    app.set("trust proxy", /^\d+$/.test(env.TRUST_PROXY) ? Number(env.TRUST_PROXY) : env.TRUST_PROXY.split(",").map(value => value.trim()));
  }
  app.disable("x-powered-by");
  app.set("query parser", "simple");
  app.use((req, res, next) => {
    res.set({ "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'" });
    if (production && req.secure) res.set("Strict-Transport-Security", "max-age=31536000");
    next();
  });
  app.use(cors({ origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(Object.assign(new Error("Origin tidak diizinkan"), { statusCode: 403 }));
  }, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb", parameterLimit: 100 }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (Object.values(req.query).some(value => typeof value !== "string" || value.length > 1000)) return res.status(400).json({ message: "Parameter pencarian tidak valid" });
    next();
  });

  const uploads = path.join(__dirname, "uploads");
  // Report paths always end here; they can never fall through to a public static mount.
  app.use("/uploads/laporan", auth, rbac("direktur", "admin"), express.static(path.join(uploads, "laporan"), { fallthrough: false, dotfiles: "deny" }));
  for (const folder of ["logo", "profil", "properti"]) {
    app.use(`/uploads/${folder}`, (req, res, next) => {
      let decoded;
      try { decoded = decodeURIComponent(req.path); } catch { return res.sendStatus(400); }
      if (!/^\/(?:[a-zA-Z0-9_-]+\/)?[a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp)$/i.test(decoded) || /(?:^|\/)temp(?:\/|$)/i.test(decoded)) return res.sendStatus(404);
      next();
    }, express.static(path.join(uploads, folder), { fallthrough: false, dotfiles: "deny", maxAge: "1h" }));
  }
  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/properti", require("./routes/propertiRoutes"));
  app.use("/api/staff", require("./routes/staffRoutes"));
  app.use("/api/statistik", require("./routes/statistikRoutes"));
  app.use("/api/laporan", require("./routes/laporanRoutes"));
  app.use("/api/setting", require("./routes/settingRoutes"));
  app.get("/", (req, res) => res.json({ status: "Philip API running" }));
  app.use((req, res) => res.status(404).json({ message: "Endpoint tidak ditemukan" }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.code?.startsWith("LIMIT_")) return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Ukuran file melebihi batas upload" : "Jumlah file atau kolom upload melebihi batas" });
    const status = error.statusCode || error.status || (["ECONNREFUSED", "ETIMEDOUT", "PROTOCOL_CONNECTION_LOST"].includes(error.code) ? 503 : 500);
    if (status >= 500) console.error("Request gagal:", error.code || error.name);
    res.status(status).json({ message: status >= 500 ? "Layanan sedang tidak tersedia. Silakan coba lagi." : status === 404 ? "File atau endpoint tidak ditemukan" : (error.type === "entity.parse.failed" ? "Format JSON tidak valid" : error.message) });
  });
  return app;
}
module.exports = { createApp };
