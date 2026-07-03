// philip-backend/routes/laporanRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/laporanController");
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");

router.get("/", auth, rbac("direktur"), ctrl.getAll);
router.post("/generate", auth, rbac("direktur"), ctrl.generate);
router.get("/:id/download", auth, rbac("direktur"), ctrl.download);

module.exports = router;
