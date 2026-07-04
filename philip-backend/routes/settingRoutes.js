const router = require("express").Router();
const ctrl = require("../controllers/settingController");
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");

router.get("/", ctrl.getAll);
router.put("/", auth, rbac("admin"), ctrl.update);
router.post("/logo", auth, rbac("admin"),
    ctrl.uploadLogo.single("logo"), ctrl.uploadLogoFile);

module.exports = router;
