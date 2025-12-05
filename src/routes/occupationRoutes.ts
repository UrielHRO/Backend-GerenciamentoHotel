import { Router } from 'express';
import { occupationController } from '../controllers/occupationController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Todas as rotas de ocupação requerem autenticação
router.post('/', authMiddleware, occupationController.createOccupation);
router.get('/', authMiddleware, occupationController.getAllOccupations);
router.get('/room/:roomId', authMiddleware, occupationController.getActiveOccupationByRoomId);
router.get('/:id', authMiddleware, occupationController.getOccupationById);
router.post('/:occupationId/consumptions', authMiddleware, occupationController.addConsumption);
router.post('/:occupationId/checkout', authMiddleware, occupationController.completeCheckOut);
router.delete('/:id', authMiddleware, occupationController.deleteOccupation);

export default router;
