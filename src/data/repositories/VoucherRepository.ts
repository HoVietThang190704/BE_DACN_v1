import { IVoucherRepository, VoucherFilter } from '../../domain/repositories/IVoucherRepository';
import { VoucherEntity } from '../../domain/entities/Voucher.entity';
import { Voucher, IVoucher } from '../../models/Voucher';
import mongoose from 'mongoose';
import { logger } from '../../shared/utils/logger';

export class VoucherRepository implements IVoucherRepository {
  private toDomainEntity(model: IVoucher): VoucherEntity {
    return new VoucherEntity({
      id: String(model._id),
      code: model.code,
      description: model.description,
      discountType: model.discountType,
      discountValue: model.discountValue,
      minOrderValue: model.minOrderValue,
      maxDiscountValue: model.maxDiscountValue,
      startDate: model.startDate,
      endDate: model.endDate,
      usageLimit: model.usageLimit,
      usageCount: model.usageCount,
      perUserLimit: model.perUserLimit,
      usageByUsers: (model.usageByUsers || []).map((record) => ({
        userId: String(record.userId),
        usageCount: record.usageCount,
        lastUsedAt: record.lastUsedAt,
      })),
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  async findByCode(code: string): Promise<VoucherEntity | null> {
    try {
      const voucher = await Voucher.findOne({ code: code.toUpperCase() }).lean();
      return voucher ? this.toDomainEntity(voucher as unknown as IVoucher) : null;
    } catch (error) {
      logger.error('VoucherRepository.findByCode error:', error);
      throw new Error('Lỗi khi tìm mã giảm giá');
    }
  }

  async findAvailableForUser(userId: string, filter?: VoucherFilter): Promise<VoucherEntity[]> {
    try {
      const conditions: any = {};

      if (filter?.onlyActive !== false) {
        conditions.isActive = true;

        const now = new Date();
        conditions.$and = [
          {
            $or: [
              { startDate: { $exists: false } },
              { startDate: { $lte: now } },
            ],
          },
          {
            $or: [
              { endDate: { $exists: false } },
              { endDate: { $gte: now } },
            ],
          },
        ];
      }

      if (filter?.minSubtotal !== undefined) {
        conditions.$or = [
          { minOrderValue: { $exists: false } },
          { minOrderValue: { $lte: filter.minSubtotal } },
        ];
      }

      const vouchers = await Voucher.find(conditions).lean();
      const entities = vouchers.map((voucher) => this.toDomainEntity(voucher as unknown as IVoucher));

      if (!filter?.userId) {
        return entities;
      }

      return entities.filter((voucher) => voucher.canUserUse(userId));
    } catch (error) {
      logger.error('VoucherRepository.findAvailableForUser error:', error);
      throw new Error('Lỗi khi lấy danh sách mã giảm giá');
    }
  }

  async incrementUsage(voucherId: string, userId: string): Promise<VoucherEntity | null> {
    try {
      const filter = { _id: new mongoose.Types.ObjectId(voucherId) };

      const update = {
        $inc: { usageCount: 1, 'usageByUsers.$[element].usageCount': 1 },
        $set: { 'usageByUsers.$[element].lastUsedAt': new Date() },
      };

      let updated = await Voucher.findOneAndUpdate(
        filter,
        update,
        {
          arrayFilters: [{ 'element.userId': new mongoose.Types.ObjectId(userId) }],
          new: true,
          runValidators: true,
        }
      ).lean<IVoucher>();

      if (!updated) {
        // user entry does not exist yet, push new record
        updated = await Voucher.findOneAndUpdate(
          filter,
          {
            $inc: { usageCount: 1 },
            $push: {
              usageByUsers: {
                userId: new mongoose.Types.ObjectId(userId),
                usageCount: 1,
                lastUsedAt: new Date(),
              },
            },
          },
          { new: true, runValidators: true }
        ).lean<IVoucher>();
      }

      return updated ? this.toDomainEntity(updated) : null;
    } catch (error) {
      logger.error('VoucherRepository.incrementUsage error:', error);
      throw new Error('Lỗi khi cập nhật lượt sử dụng mã giảm giá');
    }
  }
}
