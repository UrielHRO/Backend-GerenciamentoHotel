import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/profile', authMiddleware, authController.getProfile);

export default router;
