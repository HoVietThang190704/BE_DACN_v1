import { Router, Request, Response } from 'express';
import { asyncHandler } from '../shared/middleware/errorHandler';
import { repositories, shopController, orderController } from '../di/container';
import { ShopMapper } from '../presentation/dto/shop/Shop.dto';
import { authenticate } from '../shared/middleware/auth';
import { authorizeRoles, isShopOwnerOrAdmin } from '../shared/middleware/authorize';
import { validate } from '../shared/middleware/validate';
import { createShopSchema, updateShopSchema } from '../shared/validation/shop.schema';

export const shopRoutes = Router();

/**
 * @openapi
 * /api/shops:
 *   get:
 *     tags:
 *       - Shops
 *     summary: List shops
 *     responses:
 *       200:
 *         description: List of shops
 */
shopRoutes.get('/', asyncHandler(async (req: Request, res: Response) => {
  const shops = await repositories.shopRepository.findAll();
  const data = shops.map(s => ShopMapper.toDTO(s));
  res.status(200).json({ success: true, data });
}));

/**
 * @openapi
 * /api/shops/pending:
 *   get:
 *     tags:
 *       - Shops
 *     summary: List pending shops for admin review
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending shops
 */
shopRoutes.get('/pending', authenticate, authorizeRoles('admin'), asyncHandler(async (req: Request, res: Response) => {
  await shopController.listPending(req, res);
}));

/**
 * @openapi
 * /api/shops/{id}:
 *   get:
 *     tags:
 *       - Shops
 *     summary: Get shop by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shop detail
 */
shopRoutes.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  await shopController.getShopById(req, res);
}));

/**
 * @openapi
 * /api/shops:
 *   post:
 *     tags:
 *       - Shops
 *     summary: Create a new shop
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ownerId:
 *                 type: string
 *               shopName:
 *                 type: string
 *               story:
 *                 type: string
 *               slug:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Shop created
 */
shopRoutes.post('/', authenticate, validate(createShopSchema), asyncHandler(async (req: Request, res: Response) => {
  await shopController.createShop(req, res);
}));

/**
 * @openapi
 * /api/shops/{id}:
 *   put:
 *     tags:
 *       - Shops
 *     summary: Update a shop
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopName:
 *                 type: string
 *               story:
 *                 type: string
 *               slug:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Shop updated
 */
shopRoutes.put('/:id', authenticate, validate(updateShopSchema), asyncHandler(async (req: Request, res: Response) => {
  await shopController.updateShop(req, res);
}));

/**
 * @openapi
 * /api/shops/{id}:
 *   delete:
 *     tags:
 *       - Shops
 *     summary: Delete a shop (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shop deleted
 */
shopRoutes.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await shopController.deleteShop(req, res);
}));

/**
 * @openapi
 * /api/shops/{id}/approve:
 *   patch:
 *     tags:
 *       - Shops
 *     summary: Approve a pending shop
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shop approved
 */
shopRoutes.patch('/:id/approve', authenticate, authorizeRoles('admin'), asyncHandler(async (req: Request, res: Response) => {
  await shopController.approveShop(req, res);
}));

/**
 * @openapi
 * /api/shops/{id}/reject:
 *   patch:
 *     tags:
 *       - Shops
 *     summary: Reject a pending shop
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shop rejected
 */
shopRoutes.patch('/:id/reject', authenticate, authorizeRoles('admin'), asyncHandler(async (req: Request, res: Response) => {
  await shopController.rejectShop(req, res);
}));
