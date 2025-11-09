import { Router } from 'express';
import { ProductReviewRepository } from '../data/repositories/ProductReviewRepository';
import { ProductRepository } from '../data/repositories/ProductRepository';
import {
  CreateProductReviewUseCase,
  UpdateProductReviewUseCase,
  DeleteProductReviewUseCase,
  GetProductReviewsUseCase,
  GetProductReviewRepliesUseCase
} from '../domain/usecases/productReview';
import { ProductReviewController } from '../presentation/controllers/ProductReviewController';
import { authMiddleware } from '../shared/middleware/auth.middleware';

const router = Router();

const productReviewRepository = new ProductReviewRepository();
const productRepository = new ProductRepository();

const createReviewUseCase = new CreateProductReviewUseCase(productReviewRepository, productRepository);
const updateReviewUseCase = new UpdateProductReviewUseCase(productReviewRepository, productRepository);
const deleteReviewUseCase = new DeleteProductReviewUseCase(productReviewRepository, productRepository);
const getReviewsUseCase = new GetProductReviewsUseCase(productReviewRepository);
const getRepliesUseCase = new GetProductReviewRepliesUseCase(productReviewRepository);

const controller = new ProductReviewController(
  createReviewUseCase,
  updateReviewUseCase,
  deleteReviewUseCase,
  getReviewsUseCase,
  getRepliesUseCase
);

router.post('/', authMiddleware, (req, res) => controller.createReview(req, res));
router.put('/:reviewId', authMiddleware, (req, res) => controller.updateReview(req, res));
router.delete('/:reviewId', authMiddleware, (req, res) => controller.deleteReview(req, res));
router.get('/product/:productId', (req, res) => controller.getReviewsByProduct(req, res));
router.get('/:reviewId/replies', (req, res) => controller.getReplies(req, res));

export default router;
