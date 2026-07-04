// philip-backend/routes/propertiRoutes.js — VERSI LENGKAP
const router = require("express").Router();
const ctrl   = require("../controllers/propertiController");
const auth   = require("../middleware/auth");
const rbac   = require("../middleware/rbac");
 
// Helper data untuk form
router.get("/vendors",   auth, ctrl.getVendors);       // dropdown vendor
router.post("/vendors",  auth, rbac("admin"), ctrl.createVendor);
router.get("/marketing", auth, ctrl.getMarketingList); // dropdown marketing
 
// CRUD properti
router.get("/",    auth,              ctrl.getAll);
router.get("/:id", auth,              ctrl.getById);
router.get("/:id/share", auth, rbac("admin","marketing"), ctrl.getShareText);
router.post("/",   auth, rbac("admin"), ctrl.upload.array("fotos",10), ctrl.create);
router.put("/:id", auth, rbac("admin"), ctrl.update);
router.delete("/:id", auth, rbac("admin"), ctrl.remove);
 
// Transaksi
router.post("/:id/transaksi", auth, rbac("admin"),             ctrl.createTransaksi);
router.get("/:id/transaksi",  auth, rbac("admin","direktur"),  ctrl.getTransaksi);
 
// Foto
router.put("/:id/fotos/reorder",    auth, rbac("admin"), ctrl.reorderFotos);
router.delete("/:id/fotos/:fotoId", auth, rbac("admin"), ctrl.deleteFoto);
 
module.exports = router;
