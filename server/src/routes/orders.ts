import { Router } from 'express';
import { createOrder, list, updateStatus } from '../controllers/ordersController';
import requireAdmin from '../middleware/requireAdmin';

const router = Router();

router.post('/', createOrder);
router.get('/', requireAdmin, list);
router.patch('/:id/status', requireAdmin, updateStatus);

export default router;
