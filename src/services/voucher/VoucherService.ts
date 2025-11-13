import mongoose from 'mongoose';
import { voucherRepository } from '../../data/repositories/VoucherRepository';
import { voucherRedemptionRepository } from '../../data/repositories/VoucherRedemptionRepository';
import { Voucher } from '../../models/Voucher';
import { logger } from '../../shared/utils/logger';
import { notificationService } from '../notification/NotificationService';

class VoucherService {
  async create(input: any) {
    // normalize code to uppercase if provided
    if (input.code) input.code = String(input.code).toUpperCase();
    const created = await voucherRepository.create(input);
    return created;
  }

  async issueToUser(voucherId: string, userId: string, adminId?: string) {
    const v = await voucherRepository.findById(voucherId);
    if (!v) throw new Error('Voucher not found');
    // assign
    await Voucher.findByIdAndUpdate(voucherId, { assignedTo: userId, createdBy: adminId }, { new: true });
    // notify user
    try {
    await notificationService.send({ audience: 'user', targetId: userId, type: 'voucher', title: 'Bạn nhận được voucher', message: `Bạn vừa được cấp voucher ${v.code}`, payload: { voucherId, code: v.code } });
    } catch (e) {
      logger.warn('Failed to send voucher notification', e);
    }
    return true;
  }

  async redeem(userId: string, code: string, orderContext: { orderId?: string; cartTotal: number }) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const now = new Date();
      const voucherDoc = await Voucher.findOne({ code: code.toUpperCase() }).session(session);
      if (!voucherDoc) throw new Error('Voucher not found');
      if (!voucherDoc.isActive) throw new Error('Voucher không khả dụng');
      if (voucherDoc.startsAt && voucherDoc.startsAt > now) throw new Error('Voucher chưa đến thời gian sử dụng');
      if (voucherDoc.expiresAt && voucherDoc.expiresAt < now) throw new Error('Voucher đã hết hạn');
      if (voucherDoc.assignedTo && voucherDoc.assignedTo.toString() !== userId) throw new Error('Voucher không thuộc về bạn');

      const userUses = await voucherRedemptionRepository.countUserRedemptions(String(voucherDoc._id), userId);
      if (voucherDoc.perUserLimit != null && userUses >= (voucherDoc.perUserLimit as number)) {
        throw new Error('Bạn đã dùng voucher này quá số lần cho phép');
      }

      if (voucherDoc.usageLimit != null && voucherDoc.usageCount >= (voucherDoc.usageLimit as number)) {
        throw new Error('Voucher đã được sử dụng hết');
      }

      // compute discount
      let discount = 0;
      if (voucherDoc.type === 'fixed') {
        discount = voucherDoc.value;
      } else {
        discount = Math.floor(orderContext.cartTotal * (voucherDoc.value / 100));
        if (voucherDoc.maxDiscountAmount) discount = Math.min(discount, voucherDoc.maxDiscountAmount);
      }
      discount = Math.min(discount, orderContext.cartTotal);

      // atomic increment usageCount
      const updated = await Voucher.findOneAndUpdate(
        { _id: voucherDoc._id, $expr: { $lt: [ '$usageCount', { $ifNull: [ '$usageLimit', Number.MAX_SAFE_INTEGER ] } ] } },
        { $inc: { usageCount: 1 } },
        { new: true, session }
      ).session(session);

      if (!updated) throw new Error('Voucher không khả dụng (đã hết lượt)');

  // insert redemption
  const redemption = await voucherRedemptionRepository.create({ voucherId: voucherDoc._id, userId, orderId: orderContext.orderId, amountApplied: discount });

      await session.commitTransaction();
      session.endSession();

      // notify user
      try {
  await notificationService.send({ audience: 'user', targetId: userId, type: 'voucher_redeem', title: 'Bạn đã sử dụng voucher', message: `Bạn đã sử dụng voucher ${voucherDoc.code} - giảm ${discount}`, payload: { voucherId: voucherDoc._id, amount: discount } });
      } catch (e) {
        logger.warn('Failed to send voucher redemption notification', e);
      }

      return { discount, newTotal: orderContext.cartTotal - discount, voucherId: voucherDoc._id, redemptionId: redemption._id };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // Refund / revert a redemption by orderId (decrements usageCount and deletes redemption record)
  async refundByOrder(orderId: string) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const redemption = await voucherRedemptionRepository.findByOrderId(orderId);
      if (!redemption) {
        throw new Error('No voucher redemption found for this order');
      }

      const voucherId = redemption.voucherId;

      // decrement usageCount
      const updated = await Voucher.findOneAndUpdate(
        { _id: voucherId, usageCount: { $gte: 1 } },
        { $inc: { usageCount: -1 } },
        { new: true, session }
      ).session(session);

      if (!updated) {
        throw new Error('Failed to decrement voucher usage count');
      }

      // delete redemption record
      await voucherRedemptionRepository.deleteById(String(redemption._id));

      await session.commitTransaction();
      session.endSession();

      return { success: true };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}

export const voucherService = new VoucherService();
