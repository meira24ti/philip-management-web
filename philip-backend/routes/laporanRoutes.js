// philip-backend/routes/laporanRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/laporanController");
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");

router.get("/", auth, rbac("direktur", "admin"), ctrl.getAll);
router.post("/generate", auth, rbac("direktur", "admin"), ctrl.generate);
router.get("/:id/download", auth, rbac("direktur", "admin"), ctrl.download);

module.exports = router;
