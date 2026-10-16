// philip-backend/routes/laporanRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/laporanController");
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");
const rateLimit = require("../middleware/rateLimit");

router.get("/", auth, rbac("direktur", "admin"), ctrl.getAll);
router.post("/generate", auth, rbac("direktur", "admin"), rateLimit({ windowMs: 60000, max: 3, key: req => req.user.id }), ctrl.generate);
router.get("/:id/download", auth, rbac("direktur", "admin"), ctrl.download);

module.exports = router;
