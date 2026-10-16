const router = require("express").Router();
const ctrl = require("../controllers/settingController");
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");
const normalizeImage = require("../middleware/normalizeImageUpload");

router.get("/", ctrl.getAll);
router.put("/", auth, rbac("admin","direktur"), ctrl.update);
router.post("/logo", auth, rbac("admin","direktur"),
    ctrl.uploadLogo.single("logo"), normalizeImage("logo"), ctrl.uploadLogoFile);

module.exports = router;
