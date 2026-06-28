// philip-backend/routes/propertiRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/propertiController");
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");

router.get("/", auth, ctrl.getAll);
router.get("/:id", auth, ctrl.getById);
router.get("/:id/share", auth, rbac("admin", "marketing"), ctrl.getShareText);
router.post("/", auth, rbac("admin"), ctrl.upload.array("fotos", 10), ctrl.create);
router.put("/:id", auth, rbac("admin"), ctrl.update);
router.delete("/:id", auth, rbac("admin"), ctrl.remove);

module.exports = router;
