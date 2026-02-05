import { Router } from 'express';
import * as ctrl from '../controllers/productsController';
import requireAdmin from '../middleware/requireAdmin';

const router = Router();

// Public/Admin
router.get("/", ctrl.list);
router.get("/:slug", ctrl.getBySlug);

// Admin-only
router.post("/", requireAdmin, ctrl.create);
router.put("/:id", requireAdmin, ctrl.update);
router.delete("/:id", requireAdmin, ctrl.remove);
router.patch("/:id/stock", requireAdmin, ctrl.patchStock);
router.patch("/:id/visibility", requireAdmin, ctrl.patchVisibility);

export default router;
