export type VoucherDiscountType = 'percentage' | 'fixed';

export interface VoucherUsageRecord {
  userId: string;
  usageCount: number;
  lastUsedAt?: Date;
}

export interface IVoucherEntity {
  id: string;
  code: string;
  description?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscountValue?: number;
  startDate?: Date;
  endDate?: Date;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  usageByUsers: VoucherUsageRecord[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class VoucherEntity implements IVoucherEntity {
  id: string;
  code: string;
  description?: string | undefined;
  discountType: VoucherDiscountType;
  discountValue: number;
  minOrderValue?: number | undefined;
  maxDiscountValue?: number | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  usageLimit?: number | undefined;
  usageCount: number;
  perUserLimit?: number | undefined;
  usageByUsers: VoucherUsageRecord[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IVoucherEntity) {
    this.id = data.id;
    this.code = data.code.toUpperCase();
    this.description = data.description;
    this.discountType = data.discountType;
    this.discountValue = data.discountValue;
    this.minOrderValue = data.minOrderValue;
    this.maxDiscountValue = data.maxDiscountValue;
    this.startDate = data.startDate ? new Date(data.startDate) : undefined;
    this.endDate = data.endDate ? new Date(data.endDate) : undefined;
    this.usageLimit = data.usageLimit;
    this.usageCount = data.usageCount;
    this.perUserLimit = data.perUserLimit;
    this.usageByUsers = data.usageByUsers || [];
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  private getUserUsage(userId: string): VoucherUsageRecord | undefined {
    return this.usageByUsers.find((record) => record.userId === userId);
  }

  canUserUse(userId: string): boolean {
    if (!this.isActive) {
      return false;
    }

    const now = new Date();
    if (this.startDate && now < this.startDate) {
      return false;
    }
    if (this.endDate && now > this.endDate) {
      return false;
    }

    if (this.usageLimit !== undefined && this.usageCount >= this.usageLimit) {
      return false;
    }

    if (this.perUserLimit !== undefined) {
      const usage = this.getUserUsage(userId);
      if (usage && usage.usageCount >= this.perUserLimit) {
        return false;
      }
    }

    return true;
  }

  validateForSubtotal(subtotal: number): { isValid: boolean; error?: string } {
    if (this.minOrderValue !== undefined && subtotal < this.minOrderValue) {
      return {
        isValid: false,
        error: `Đơn hàng cần tối thiểu ${this.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã giảm giá`,
      };
    }

    return { isValid: true };
  }

  calculateDiscount(subtotal: number): number {
    const validation = this.validateForSubtotal(subtotal);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Đơn hàng không đủ điều kiện để áp dụng mã giảm giá');
    }

    let discount = 0;

    if (this.discountType === 'percentage') {
      discount = (subtotal * this.discountValue) / 100;
    } else {
      discount = this.discountValue;
    }

    if (this.maxDiscountValue !== undefined) {
      discount = Math.min(discount, this.maxDiscountValue);
    }

    return Math.max(0, Math.min(discount, subtotal));
  }

  registerUsage(userId: string): VoucherEntity {
    this.usageCount += 1;

    const usage = this.getUserUsage(userId);
    if (usage) {
      usage.usageCount += 1;
      usage.lastUsedAt = new Date();
    } else {
      this.usageByUsers.push({
        userId,
        usageCount: 1,
        lastUsedAt: new Date(),
      });
    }

    return this;
  }

  toJSON(): IVoucherEntity {
    return {
      id: this.id,
      code: this.code,
      description: this.description,
      discountType: this.discountType,
      discountValue: this.discountValue,
      minOrderValue: this.minOrderValue,
      maxDiscountValue: this.maxDiscountValue,
      startDate: this.startDate,
      endDate: this.endDate,
      usageLimit: this.usageLimit,
      usageCount: this.usageCount,
      perUserLimit: this.perUserLimit,
      usageByUsers: this.usageByUsers,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
