import { Voucher } from '../../models/Voucher';
import mongoose from 'mongoose';
import { logger } from '../../shared/utils/logger';

export class VoucherRepository {
  async create(data: any) {
    try {
      const v = await Voucher.create(data);
      return v;
    } catch (err) {
      logger.error('VoucherRepository.create error', err);
      throw err;
    }
  }

  async findByCode(code: string) {
    return Voucher.findOne({ code }).lean();
  }

  async findById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Voucher.findById(id).lean();
  }

  async incrementUsageAtomic(voucherId: string) {
    // Attempts to increment usageCount if usageLimit not yet reached
    const filter: any = { _id: voucherId, isActive: true };
    // Only allow increment if usageLimit not set or usageCount < usageLimit
    filter.$expr = { $lt: [ '$usageCount', { $ifNull: [ '$usageLimit', Number.MAX_SAFE_INTEGER ] } ] };
    const updated = await Voucher.findOneAndUpdate(filter, { $inc: { usageCount: 1 } }, { new: true });
    return updated;
  }

  async list(filter: any = {}, options: any = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Voucher.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Voucher.countDocuments(filter)
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export const voucherRepository = new VoucherRepository();

