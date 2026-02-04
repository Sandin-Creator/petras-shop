import { Router } from 'express';
import * as ctrl from '../controllers/authController';

const router = Router();

router.post('/login', ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', ctrl.me);

export default router;
