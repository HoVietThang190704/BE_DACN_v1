import { IVoucherRepository } from '../../repositories/IVoucherRepository';

interface ValidateVoucherInput {
  userId: string;
  code: string;
  subtotal: number;
}

export class ValidateVoucherUseCase {
  constructor(private readonly voucherRepository: IVoucherRepository) {}

  async execute({ userId, code, subtotal }: ValidateVoucherInput) {
    const voucher = await this.voucherRepository.findByCode(code);

    if (!voucher) {
      throw new Error('Mã giảm giá không tồn tại');
    }

    if (!voucher.canUserUse(userId)) {
      throw new Error('Bạn không thể sử dụng mã giảm giá này');
    }

    const validation = voucher.validateForSubtotal(subtotal);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Đơn hàng không đủ điều kiện áp dụng mã giảm giá');
    }

    const discount = voucher.calculateDiscount(subtotal);

    return {
      voucher,
      discount,
    };
  }
}
