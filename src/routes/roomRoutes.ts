import { Router } from 'express';
import { roomController } from '../controllers/roomController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Todas as rotas de quartos requerem autenticação
router.post('/', authMiddleware, roomController.createRoom);
router.get('/', authMiddleware, roomController.getAllRooms);
router.get('/:id', authMiddleware, roomController.getRoomById);
router.put('/:id', authMiddleware, roomController.updateRoom);
router.patch('/:id/status', authMiddleware, roomController.updateRoomStatus);
router.delete('/:id', authMiddleware, roomController.deleteRoom);

export default router;
