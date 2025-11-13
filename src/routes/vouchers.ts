import express from 'express';
import { voucherController } from '../presentation/controllers/VoucherController';
import { authenticate, authorize } from '../shared/middleware/auth';
import { validate } from '../shared/middleware/validate';
import voucherValidator from '../presentation/validators/voucher.validator';

const router = express.Router();

/**
 * @openapi
 * /api/vouchers:
 *   post:
 *     tags:
 *       - Vouchers
 *     summary: Create a voucher (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [fixed, percent]
 *               value:
 *                 type: number
 *               code:
 *                 type: string
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Created
 */
router.post('/', authenticate, authorize('admin'), validate(voucherValidator.createVoucherSchema), (req, res) => voucherController.create(req, res));

/**
 * @openapi
 * /api/vouchers/{id}/issue:
 *   post:
 *     tags:
 *       - Vouchers
 *     summary: Issue voucher to a specific user (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Issued
 */
router.post('/:id/issue', authenticate, authorize('admin'), validate(voucherValidator.issueVoucherSchema), (req, res) => voucherController.issueToUser(req, res));

/**
 * @openapi
 * /api/vouchers/me:
 *   get:
 *     tags:
 *       - Vouchers
 *     summary: List vouchers available to the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/me', authenticate, (req, res) => voucherController.listUserVouchers(req, res));

/**
 * @openapi
 * /api/vouchers/redeem:
 *   post:
 *     tags:
 *       - Vouchers
 *     summary: Redeem a voucher for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               orderId:
 *                 type: string
 *               cartTotal:
 *                 type: number
 *     responses:
 *       200:
 *         description: Redeemed
 */
router.post('/redeem', authenticate, validate(voucherValidator.redeemVoucherSchema), (req, res) => voucherController.redeem(req, res));

/**
 * @openapi
 * /api/vouchers/refund:
 *   post:
 *     tags:
 *       - Vouchers
 *     summary: Refund a voucher redemption by orderId (admin/service)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refunded
 */
router.post('/refund', authenticate, authorize('admin'), validate(voucherValidator.refundVoucherSchema), (req, res) => voucherController.refundByOrder(req, res));

export default router;
