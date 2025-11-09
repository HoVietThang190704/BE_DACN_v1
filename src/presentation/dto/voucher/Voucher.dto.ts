import { VoucherEntity } from '../../../domain/entities/Voucher.entity';

export interface VoucherDTO {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxDiscountValue?: number;
  startDate?: Date;
  endDate?: Date;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  isActive: boolean;
}

export class VoucherMapper {
  static toDTO(voucher: VoucherEntity): VoucherDTO {
    return {
      id: voucher.id,
      code: voucher.code,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minOrderValue: voucher.minOrderValue,
      maxDiscountValue: voucher.maxDiscountValue,
      startDate: voucher.startDate,
      endDate: voucher.endDate,
      usageLimit: voucher.usageLimit,
      usageCount: voucher.usageCount,
      perUserLimit: voucher.perUserLimit,
      isActive: voucher.isActive,
    };
  }
}
