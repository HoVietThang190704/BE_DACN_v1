import { VoucherEntity } from '../entities/Voucher.entity';

export interface VoucherFilter {
  onlyActive?: boolean;
  userId?: string;
  minSubtotal?: number;
}

export interface IVoucherRepository {
  findByCode(code: string): Promise<VoucherEntity | null>;
  findAvailableForUser(userId: string, filter?: VoucherFilter): Promise<VoucherEntity[]>;
  incrementUsage(voucherId: string, userId: string): Promise<VoucherEntity | null>;
}
