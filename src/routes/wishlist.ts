import { Router } from 'express';
import { authenticate } from '../shared/middleware/auth';
import { validate } from '../shared/middleware/validate';
import { z } from 'zod';
import { wishlistController } from '../di/container';

const router = Router();

const addSchema = z.object({ body: z.object({ productId: z.string().min(1), note: z.string().optional() }) });

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Lấy danh sách sản phẩm yêu thích của user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách yêu thích
 */
router.get('/', authenticate, (req, res) => wishlistController.getWishlist(req, res));

/**
 * @swagger
 * /api/wishlist:
 *   post:
 *     summary: Thêm sản phẩm vào danh sách yêu thích
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thêm thành công
 */
router.post('/', authenticate, validate(addSchema), (req, res) => wishlistController.addItem(req, res));

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi danh sách yêu thích
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:productId', authenticate, (req, res) => wishlistController.removeItem(req, res));

/**
 * @swagger
 * /api/wishlist/toggle/{productId}:
 *   post:
 *     summary: Toggle product in wishlist (add if not exist, remove if exists)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Toggled
 */
router.post('/toggle/:productId', authenticate, (req, res) => wishlistController.toggleItem(req, res));

export default router;
