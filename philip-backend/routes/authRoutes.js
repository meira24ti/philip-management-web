// philip-backend/routes/authRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/authController");
const auth = require("../middleware/auth");
const loginRateLimit = require("../middleware/rateLimit");
const normalizeImage = require("../middleware/normalizeImageUpload");
router.use(["/login", "/forgot-password", "/reset-password"], loginRateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

router.post("/login", loginRateLimit({
  key: (req) => `${req.ip}:${String(req.body?.email || "").trim().toLowerCase()}`,
}), ctrl.login);
router.post("/forgot-password", loginRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  key: (req) => `${req.ip}:${String(req.body?.email || "").trim().toLowerCase()}`,
}), ctrl.forgotPassword);
router.post("/reset-password", loginRateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), ctrl.resetPassword);
router.post("/logout", auth, ctrl.logout);
router.get("/me", auth, ctrl.me);
router.put("/profile", auth, ctrl.updateProfile);
router.put("/password", auth, loginRateLimit({ max: 10, key: req => req.user.id }), ctrl.changePassword);
router.post("/upload-foto", auth,
    ctrl.uploadFoto.single("foto"), normalizeImage("profil"), ctrl.uploadFotoProfile);
router.get("/notifikasi", auth, ctrl.getNotifikasi);

module.exports = router;
