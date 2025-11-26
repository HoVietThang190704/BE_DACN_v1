import { VoucherRedemption } from '../../models/VoucherRedemption';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export class VoucherRedemptionRepository {
  async create(data: any, session?: any) {
    try {
      if (session) {
        const doc = await new VoucherRedemption(data).save({ session });
        return doc;
      }
      const doc = await VoucherRedemption.create(data);
      return doc;
    } catch (err) {
      logger.error('VoucherRedemptionRepository.create error', err);
      throw err;
    }
  }

  async countUserRedemptions(voucherId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(voucherId) || !mongoose.Types.ObjectId.isValid(userId)) return 0;
    return VoucherRedemption.countDocuments({ voucherId, userId, orderId: { $ne: null } }).exec();
  }

  async findUnassigned(voucherId: string, userId: string, session?: any) {
    if (!mongoose.Types.ObjectId.isValid(voucherId) || !mongoose.Types.ObjectId.isValid(userId)) return null;
    const q = { voucherId, userId, $or: [{ orderId: null }, { orderId: { $exists: false } }] };
    return session
      ? VoucherRedemption.findOne(q).session(session).lean()
      : VoucherRedemption.findOne(q).lean();
  }

  async updateAssignToOrder(redemptionId: string, orderId: string, amountApplied: number, session?: any) {
    if (!mongoose.Types.ObjectId.isValid(redemptionId)) return null;
    return session
      ? VoucherRedemption.findByIdAndUpdate(redemptionId, { orderId, amountApplied }, { new: true, session }).lean()
      : VoucherRedemption.findByIdAndUpdate(redemptionId, { orderId, amountApplied }, { new: true }).lean();
  }

  async findByOrderId(orderId: string, session?: any) {
    return session
      ? VoucherRedemption.findOne({ orderId }).session(session).lean()
      : VoucherRedemption.findOne({ orderId }).lean();
  }

  async deleteById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return VoucherRedemption.findByIdAndDelete(id).lean();
  }
}

export const voucherRedemptionRepository = new VoucherRedemptionRepository();
