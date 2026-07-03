// philip-backend/routes/authRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/login", ctrl.login);
router.post("/logout", auth, ctrl.logout);
router.get("/me", auth, ctrl.me);
router.put("/profile", auth, ctrl.updateProfile);
router.put("/password", auth, ctrl.changePassword);
router.post("/upload-foto", auth,
    ctrl.uploadFoto.single("foto"), ctrl.uploadFotoProfile);


module.exports = router;