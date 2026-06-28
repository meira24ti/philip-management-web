// philip-backend/routes/statistikRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/statistikController");
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");

router.get("/", auth, rbac("admin", "direktur"), ctrl.getRingkasan);
router.get("/by-periode", auth, rbac("admin", "direktur"), ctrl.getByPeriode);

module.exports = router;
