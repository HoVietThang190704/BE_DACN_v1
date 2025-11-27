import { Request, Response } from 'express';
import { voucherService } from '../../services/voucher/VoucherService';
import { voucherRepository } from '../../data/repositories/VoucherRepository';
import { logger } from '../../shared/utils/logger';

export class VoucherController {
  async create(req: Request, res: Response) {
    try {
      const adminId = req.user?.userId;
      const payload = { ...req.body, createdBy: adminId };
      const created = await voucherService.create(payload);
      return res.json({ success: true, data: created });
    } catch (err: any) {
      logger.error('VoucherController.create error', err);
      return res.status(400).json({ success: false, message: err.message || 'Error' });
    }
  }

  async issueToUser(req: Request, res: Response) {
    try {
      const voucherId = req.params.id;
      const { userId } = req.body;
      const adminId = req.user?.userId;
      await voucherService.issueToUser(voucherId, userId, adminId);
      return res.json({ success: true });
    } catch (err: any) {
      logger.error('VoucherController.issueToUser error', err);
      return res.status(400).json({ success: false, message: err.message || 'Error' });
    }
  }

  async redeem(req: Request, res: Response) {
    try {
      const userId = req.user?.userId as string;
      const { code, orderId } = req.body;
      // support both 'cartTotal' (old) and 'subtotal' (client uses subtotal) as input
      const cartTotal = req.body.cartTotal ?? req.body.subtotal;
      const result = await voucherService.redeem(userId, code, { orderId, cartTotal, subtotal: req.body.subtotal });
      return res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('VoucherController.redeem error', err);
      return res.status(400).json({ success: false, message: err.message || 'Error' });
    }
  }

  async listUserVouchers(req: Request, res: Response) {
    try {
      const userId = req.user?.userId as string;
      const docs = await voucherRepository.list({ $or: [{ assignedTo: userId }, { assignedTo: null }] }, { limit: 50 });
      return res.json({ success: true, data: docs });
    } catch (err: any) {
      logger.error('VoucherController.listUserVouchers error', err);
      return res.status(400).json({ success: false, message: err.message || 'Error' });
    }
  }

  async refundByOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.body;
      await voucherService.refundByOrder(orderId);
      return res.json({ success: true });
    } catch (err: any) {
      logger.error('VoucherController.refundByOrder error', err);
      return res.status(400).json({ success: false, message: err.message || 'Error' });
    }
  }

  // Backwards-compatible alias so routes that call `applyVoucher` still work.
  async applyVoucher(req: Request, res: Response) {
    // Reuse redeem implementation which handles applying a voucher for a user
    return this.redeem(req, res);
  }
}

export const voucherController = new VoucherController();
