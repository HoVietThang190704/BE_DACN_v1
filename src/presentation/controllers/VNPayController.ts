import { Request, Response } from 'express';
import { CreateVNPayPaymentUseCase } from '../../domain/usecases/payment/CreateVNPayPayment.usecase';
import { HandleVNPayCallbackUseCase } from '../../domain/usecases/payment/HandleVNPayCallback.usecase';
import { logger } from '../../shared/utils/logger';

export class VNPayController {
  constructor(
    private readonly createVNPayPaymentUseCase: CreateVNPayPaymentUseCase,
    private readonly handleVNPayCallbackUseCase: HandleVNPayCallbackUseCase
  ) {}

  create = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập trước khi thanh toán' });
        return;
      }

      const { orderId, frontendRedirectUrl, locale, checkoutPayload } = req.body ?? {};

      if (!orderId && !checkoutPayload) {
        res.status(400).json({ message: 'Thiếu orderId hoặc checkoutPayload để khởi tạo thanh toán' });
        return;
      }

      const result = await this.createVNPayPaymentUseCase.execute({
        orderId,
        userId,
        clientIp: req.ip,
        frontendRedirectUrl,
        locale,
        checkoutPayload
      });

      res.status(200).json({
        message: 'Khởi tạo thanh toán VNPay thành công',
        data: result
      });
    } catch (error) {
      logger.error('VNPayController.create error', error);
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Không thể tạo yêu cầu thanh toán VNPay'
      });
    }
  };

  callback = async (req: Request, res: Response) => {
    try {
      const result = await this.handleVNPayCallbackUseCase.execute({
        query: req.query as Record<string, string | string[]>
      });

      return res.redirect(result.redirectUrl);
    } catch (error) {
      logger.error('VNPayController.callback error', error);
      return res.status(500).send('VNPay callback failed');
    }
  };
}
