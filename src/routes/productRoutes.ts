import { Router } from 'express';
import { productController } from '../controllers/productController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Todas as rotas de produtos requerem autenticação
router.post('/', authMiddleware, productController.createProduct);
router.get('/', authMiddleware, productController.getAllProducts);
router.get('/:id', authMiddleware, productController.getProductById);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

export default router;
