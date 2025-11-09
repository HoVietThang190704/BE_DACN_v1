import { Request, Response } from 'express';
import { ListUserVouchersUseCase } from '../../domain/usecases/voucher/ListUserVouchers.usecase';
import { ValidateVoucherUseCase } from '../../domain/usecases/voucher/ValidateVoucher.usecase';
import { VoucherMapper } from '../dto/voucher/Voucher.dto';
import { logger } from '../../shared/utils/logger';

export class VoucherController {
  constructor(
    private readonly listUserVouchersUseCase: ListUserVouchersUseCase,
    private readonly validateVoucherUseCase: ValidateVoucherUseCase
  ) {}

  listUserVouchers = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
        return;
      }

      const { minSubtotal } = req.query;
      const vouchers = await this.listUserVouchersUseCase.execute(userId, {
        minSubtotal: minSubtotal ? Number(minSubtotal) : undefined,
      });

      res.status(200).json({
        message: 'Lấy danh sách mã giảm giá thành công',
        data: vouchers.map((voucher) => VoucherMapper.toDTO(voucher)),
      });
    } catch (error) {
      logger.error('VoucherController.listUserVouchers error:', error);
      res.status(500).json({
        message: 'Lỗi khi lấy danh sách mã giảm giá',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  applyVoucher = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
        return;
      }

      const { code, subtotal } = req.body;

      if (!code || typeof code !== 'string') {
        res.status(400).json({ message: 'Vui lòng nhập mã giảm giá' });
        return;
      }

      if (subtotal === undefined || Number.isNaN(Number(subtotal))) {
        res.status(400).json({ message: 'Thiếu thông tin giá trị đơn hàng' });
        return;
      }

      const result = await this.validateVoucherUseCase.execute({
        userId,
        code,
        subtotal: Number(subtotal),
      });

      res.status(200).json({
        message: 'Áp dụng mã giảm giá thành công',
        data: {
          voucher: VoucherMapper.toDTO(result.voucher),
          discount: result.discount,
        },
      });
    } catch (error) {
      logger.error('VoucherController.applyVoucher error:', error);

      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: 'Lỗi khi áp dụng mã giảm giá' });
    }
  };
}
