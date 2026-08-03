// philip-backend/routes/authRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/authController");
const auth = require("../middleware/auth");
const loginRateLimit = require("../middleware/rateLimit");

router.post("/login", loginRateLimit({
  key: (req) => `${req.ip}:${String(req.body?.email || "").trim().toLowerCase()}`,
}), ctrl.login);
router.post("/logout", auth, ctrl.logout);
router.get("/me", auth, ctrl.me);
router.put("/profile", auth, ctrl.updateProfile);
router.put("/password", auth, ctrl.changePassword);
router.post("/upload-foto", auth,
    ctrl.uploadFoto.single("foto"), ctrl.uploadFotoProfile);
router.get("/notifikasi", auth, ctrl.getNotifikasi);

module.exports = router;
