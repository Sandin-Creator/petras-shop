// server/routes/products.js
const router = require("express").Router();
const ctrl = require("../controllers/products");
const requireAdmin = require("../middleware/requireAdmin");

// Public/Admin
router.get("/", ctrl.list);
router.get("/:slug", ctrl.getBySlug);

// Admin-only
router.post("/", requireAdmin, ctrl.create);
router.put("/:id", requireAdmin, ctrl.update);
router.delete("/:id", requireAdmin, ctrl.remove);
router.patch("/:id/stock", requireAdmin, ctrl.patchStock);
router.patch("/:id/visibility", requireAdmin, ctrl.patchVisibility);

module.exports = router;
