import { Voucher } from '../../models/Voucher';
import mongoose from 'mongoose';
import { logger } from '../../shared/utils/logger';
import { VoucherEntity } from '../../domain/entities/Voucher.entity';

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

  private toEntity(doc: any): VoucherEntity {
    return new VoucherEntity({
      id: doc._id?.toString() || doc.id,
      code: doc.code,
      description: doc.description,
      discountType: (doc.type === 'percent' || doc.type === 'percentage') ? 'percentage' : (doc.type === 'fixed' ? 'fixed' : (doc.discountType ?? 'fixed')),
      discountValue: typeof doc.value === 'number' ? doc.value : (doc.discountValue ?? 0),
      minOrderValue: doc.minOrderValue ?? doc.metadata?.minOrderValue,
      maxDiscountValue: doc.maxDiscountAmount ?? doc.maxDiscountValue,
      startDate: doc.startDate,
      endDate: doc.endDate,
      usageLimit: doc.usageLimit,
      usageCount: doc.usageCount || 0,
      perUserLimit: doc.perUserLimit,
      usageByUsers: doc.usageByUsers || [],
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findByCode(code: string) {
    const normalized = String(code).toUpperCase();
    const doc: any = await Voucher.findOne({ code: normalized }).lean();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc: any = await Voucher.findById(id).lean();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async incrementUsageAtomic(voucherId: string) {
    // Attempts to increment usageCount if usageLimit not yet reached
    const filter: any = { _id: voucherId, isActive: true };
    // Only allow increment if usageLimit not set or usageCount < usageLimit
    filter.$expr = { $lt: [ '$usageCount', { $ifNull: [ '$usageLimit', Number.MAX_SAFE_INTEGER ] } ] };
    const updated = await Voucher.findOneAndUpdate(filter, { $inc: { usageCount: 1 } }, { new: true });
    return updated;
  }

  async incrementUsage(voucherId: string, userId?: string) {
    const updatedDoc: any = await this.incrementUsageAtomic(voucherId);
    if (!updatedDoc) return null;
    return this.toEntity(updatedDoc);
  }

  async list(filter: any = {}, options: any = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Voucher.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Voucher.countDocuments(filter)
    ]);
    return { items: items.map((d: any) => this.toEntity(d)), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAvailableForUser(userId: string, filter: any = {}) {
    const q: any = { $or: [{ assignedTo: userId }, { assignedTo: null }] };
    if (filter.onlyActive) q.isActive = true;
    const docs: any[] = await Voucher.find(q).sort({ createdAt: -1 }).lean();
    return docs.map((d) => this.toEntity(d));
  }
}

export const voucherRepository = new VoucherRepository();

