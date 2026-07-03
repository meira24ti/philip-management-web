// philip-backend/routes/staffRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/staffController");
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");

router.get("/", auth, ctrl.getAll);
router.post("/", auth, rbac("admin", "direktur"), ctrl.create);
router.put("/:id", auth, rbac("admin", "direktur"), ctrl.update);
router.patch("/:id/deactivate", auth, rbac("admin", "direktur"), ctrl.deactivate);

module.exports = router;
