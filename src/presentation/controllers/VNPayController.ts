import { Request, Response } from 'express';
import crypto from 'crypto';
import qs from 'qs';
import { Payment } from '../../models/Payment';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';

function buildVNPayUrl(params: Record<string, string | number>) {
  const vnpUrl = config.VNPAY_PAYMENT_URL;
  const tmnCode = config.VNPAY_TMNCODE;
  const secret = config.VNPAY_HASH_SECRET;

  const vnp_Params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: String(params.orderId),
    vnp_OrderInfo: String(params.orderInfo || `Payment for order ${params.orderId}`),
    vnp_Locale: 'vn',
    vnp_ReturnUrl: config.VNPAY_RETURN_URL || String(params.returnUrl || ''),
    vnp_Amount: String(params.amount),
    vnp_CreateDate: new Date().toISOString().replace(/[-:]/g, '').slice(0,14),
    vnp_IpAddr: String(params.ipAddr || '127.0.0.1')
  };

  // sort
  const sortedKeys = Object.keys(vnp_Params).sort();
  const signData = sortedKeys.map(k => `${k}=${vnp_Params[k]}`).join('&');
  const hmac = crypto.createHmac('sha512', secret);
  const signature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  const query = qs.stringify(vnp_Params, { encode: true });
  return `${vnpUrl}?${query}&vnp_SecureHash=${signature}`;
}

export default class VNPayController {
  static async create(req: Request, res: Response) {
    try {
      const { orderId, amount, returnUrl } = req.body;
      if (!orderId || !amount) return res.status(400).json({ success: false, message: 'orderId and amount are required' });

      // VNPay expects amount in smallest unit *100 (they use VND without decimals but examples often multiply)
      const vnpAmount = Number(amount);

      // create payment record
      const payment = new Payment({
        orderId,
        provider: 'vnpay',
        amount: vnpAmount,
        currency: 'VND',
        status: 'created'
      });
      await payment.save();

      const url = buildVNPayUrl({ orderId, amount: vnpAmount, returnUrl, orderInfo: `Payment for ${orderId}` });

      return res.json({ success: true, paymentId: payment._id, paymentUrl: url });
    } catch (error) {
      logger.error('VNPayController.create error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async callback(req: Request, res: Response) {
    try {
      const vnpParams = { ...(req.query as Record<string, any>) };
      const secureHash = vnpParams.vnp_SecureHash as string | undefined;
      delete vnpParams.vnp_SecureHash;
      delete vnpParams.vnp_SecureHashType;

      const sortedKeys = Object.keys(vnpParams).sort();
      const signData = sortedKeys.map(k => `${k}=${vnpParams[k]}`).join('&');
      const hmac = crypto.createHmac('sha512', config.VNPAY_HASH_SECRET);
      const checkSum = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      if (checkSum !== secureHash) {
        logger.warn('VNPay callback invalid signature', { checksum: checkSum, secureHash });
        return res.status(400).send('Invalid signature');
      }

      const responseCode = vnpParams.vnp_ResponseCode;
      const txnRef = vnpParams.vnp_TxnRef;
      const amount = Number(vnpParams.vnp_Amount) || 0;

      // Find payment by orderId/txnRef
      const payment = await Payment.findOne({ orderId: txnRef, provider: 'vnpay' });
      if (!payment) {
        logger.warn('VNPay callback: payment not found', { txnRef });
      } else {
        payment.rawResponse = vnpParams;
        payment.providerPaymentId = vnpParams.vnp_TransactionNo || vnpParams.vnp_BankTranNo || undefined;
        if (responseCode === '00') {
          payment.status = 'succeeded';
        } else {
          payment.status = 'failed';
        }
        await payment.save();
      }

      // Redirect user to frontend result page if configured
      const frontendUrl = process.env.FRONTEND_URL || '';
      if (frontendUrl) {
        const path = responseCode === '00' ? '/payment-success' : '/payment-failed';
        return res.redirect(`${frontendUrl}${path}?orderId=${encodeURIComponent(txnRef || '')}`);
      }

      return res.json({ success: true, code: responseCode, txnRef });
    } catch (error) {
      logger.error('VNPayController.callback error:', error);
      return res.status(500).send('Server error');
    }
  }
}
