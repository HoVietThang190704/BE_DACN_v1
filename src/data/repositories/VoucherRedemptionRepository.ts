import { VoucherRedemption } from '../../models/VoucherRedemption';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export class VoucherRedemptionRepository {
  async create(data: any) {
    try {
      const doc = await VoucherRedemption.create(data);
      return doc;
    } catch (err) {
      logger.error('VoucherRedemptionRepository.create error', err);
      throw err;
    }
  }

  async countUserRedemptions(voucherId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(voucherId) || !mongoose.Types.ObjectId.isValid(userId)) return 0;
    return VoucherRedemption.countDocuments({ voucherId, userId }).exec();
  }

  async findByOrderId(orderId: string) {
    return VoucherRedemption.findOne({ orderId }).lean();
  }

  async deleteById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return VoucherRedemption.findByIdAndDelete(id).lean();
  }
}

export const voucherRedemptionRepository = new VoucherRedemptionRepository();
