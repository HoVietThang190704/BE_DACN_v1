import { Router } from 'express';
import VNPayController from '../presentation/controllers/VNPayController';

const router = Router();

/**
 * @swagger
 * /api/payments/vnpay/create:
 *   post:
 *     summary: Create VNPay payment and get redirect URL
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "ORDER123"
 *               amount:
 *                 type: number
 *                 example: 100000
 *               returnUrl:
 *                 type: string
 *                 example: "http://localhost:5000/api/payments/vnpay/callback"
 *     responses:
 *       200:
 *         description: Payment created, returns paymentUrl to redirect user
 */
// Create VNPay payment and return redirect URL
router.post('/vnpay/create', VNPayController.create);

/**
 * @swagger
 * /api/payments/vnpay/callback:
 *   get:
 *     summary: VNPay callback URL (VNPay redirects user here after payment)
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: Your order reference
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *         description: Amount returned by VNPay
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         description: Response code (00 for success)
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: HMAC SHA512 secure hash
 *     responses:
 *       200:
 *         description: Callback processed
 */
// VNPay will redirect to this URL after payment
router.get('/vnpay/callback', VNPayController.callback);

export default router;
