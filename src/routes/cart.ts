import { Router } from 'express';
import { authenticate } from '../shared/middleware/auth';
import { validate } from '../shared/middleware/validate';
import { cartValidation } from '../shared/validation/cart.schema';
import { cartController } from '../di/container';

const router = Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Lấy giỏ hàng của user hiện tại
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về giỏ hàng (nếu chưa có sẽ tạo mới)
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/', authenticate, (req, res) => cartController.getCart(req, res));


/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Orders]
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
 *               shopId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 example: 1
 *               unit:
 *                 type: string
 *               price:
 *                 type: number
 *               title:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               attrs:
 *                 type: object
 *     responses:
 *       200:
 *         description: Thêm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/items', authenticate, validate(cartValidation.addItem), (req, res) => cartController.addItem(req, res));


/**
 * @swagger
 * /api/cart/items/{itemId}:
 *   put:
 *     summary: Cập nhật item trong giỏ hàng (quantity, unit, attrs)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               price:
 *                 type: number
 *               attrs:
 *                 type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Item không tồn tại
 */
router.put('/items/:itemId', authenticate, validate(cartValidation.updateItem), (req, res) => cartController.updateItem(req, res));


/**
 * @swagger
 * /api/cart/items/{itemId}:
 *   delete:
 *     summary: Xóa item khỏi giỏ hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item id
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Item không tồn tại
 */
router.delete('/items/:itemId', authenticate, (req, res) => cartController.removeItem(req, res));


/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng của user hiện tại
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/', authenticate, (req, res) => cartController.clearCart(req, res));

export default router;
