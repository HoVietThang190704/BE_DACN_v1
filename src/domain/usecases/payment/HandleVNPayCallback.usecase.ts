import { config } from '../../../config';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { IOrderRepository } from '../../repositories/IOrderRepository';
import { IVNPayGateway } from '../../services/IVNPayGateway';
import { logger } from '../../../shared/utils/logger';

export interface HandleVNPayCallbackRequest {
  query: Record<string, string | string[]>;
}

export interface HandleVNPayCallbackResponse {
  isValid: boolean;
  redirectUrl: string;
  orderId?: string;
  orderNumber?: string;
  responseCode?: string;
  message: string;
}

export class HandleVNPayCallbackUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly vnPayGateway: IVNPayGateway
  ) {}

  private extractString(value?: string | string[]): string | undefined {
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  }

  private buildRedirectUrl(base: string | undefined, params: Record<string, string | undefined>): string {
    const target = base || `${config.FRONTEND_BASE_URL}/payment/vnpay/result`;
    const url = new URL(target);
    Object.entries(params).forEach(([key, val]) => {
      if (typeof val === 'string' && val.length > 0) {
        url.searchParams.set(key, val);
      }
    });
    return url.toString();
  }

  async execute(request: HandleVNPayCallbackRequest): Promise<HandleVNPayCallbackResponse> {
    const secureHash = this.extractString(request.query.vnp_SecureHash);
    const isValid = this.vnPayGateway.verifySignature(request.query, secureHash);
    const transactionRef = this.extractString(request.query.vnp_TxnRef);
    const responseCode = this.extractString(request.query.vnp_ResponseCode);
    const orderInfo = this.extractString(request.query.vnp_OrderInfo);

    if (!transactionRef) {
      logger.warn('VNPay callback missing transaction reference');
      const redirectUrl = this.buildRedirectUrl(undefined, {
        status: 'failed',
        message: 'Thiếu mã giao dịch từ VNPay'
      });
      return { isValid: false, redirectUrl, message: 'Thiếu mã giao dịch' };
    }

    if (!isValid) {
      logger.warn('VNPay callback invalid signature', { transactionRef });
      const redirectUrl = this.buildRedirectUrl(undefined, {
        status: 'failed',
        code: responseCode,
        message: 'Chữ ký không hợp lệ'
      });
      return { isValid: false, redirectUrl, message: 'Chữ ký không hợp lệ', responseCode };
    }

    const payment = await this.paymentRepository.findByTransactionRef('vnpay', transactionRef);
    if (!payment) {
      logger.warn('VNPay callback but payment record not found', { transactionRef });
      const redirectUrl = this.buildRedirectUrl(undefined, {
        status: 'failed',
        code: responseCode,
        message: 'Không tìm thấy thông tin thanh toán'
      });
      return { isValid: false, redirectUrl, message: 'Không tìm thấy giao dịch', responseCode };
    }

    const normalizedParams: Record<string, string> = {};
    Object.keys(request.query).forEach((key) => {
      const value = request.query[key];
      normalizedParams[key] = Array.isArray(value) ? value[0] : value;
    });

    const providerPaymentId = this.extractString(request.query.vnp_TransactionNo) ?? this.extractString(request.query.vnp_BankTranNo);
    const success = responseCode === '00';

    await this.paymentRepository.updateStatus(payment.id, success ? 'succeeded' : 'failed', {
      providerPaymentId,
      rawResponse: normalizedParams,
      failureReason: success ? undefined : `VNPay response code ${responseCode}`
    });

    if (success) {
      try {
        // If payment is linked to an order, mark it paid
        if (payment.orderId) {
          await this.orderRepository.updatePaymentStatus(payment.orderId, 'paid');
        } else {
          // no order yet -> create final order from stored checkout snapshot if available
          const metadata = (payment.metadata ?? {}) as Record<string, unknown>;
          const checkoutPayload = metadata.checkoutPayload as any | undefined;

          if (!checkoutPayload) {
            logger.warn('Payment succeeded but no checkout snapshot to create order', { transactionRef });
          } else {
            try {
              // ensure userId is set
              if (!checkoutPayload.userId) {
                // fall back: use payment.userId
                checkoutPayload.userId = payment.userId;
              }

              const createdOrder = await this.orderRepository.create(checkoutPayload);

              // link payment -> order and set succeeded
              await this.paymentRepository.updateById(payment.id, {
                orderId: createdOrder.id,
                orderNumber: createdOrder.orderNumber,
                status: 'succeeded',
                metadata: { ...(payment.metadata ?? {}), createdOrderId: createdOrder.id, createdOrderNumber: createdOrder.orderNumber }
              });

              // mark the newly created order as paid
              await this.orderRepository.updatePaymentStatus(createdOrder.id, 'paid');
            } catch (error) {
              logger.error('Unable to create order from checkout snapshot after VNPay success', error);
              // mark payment failed due to order creation problems
              await this.paymentRepository.updateStatus(payment.id, 'failed', { failureReason: 'Unable to create order after successful payment' });
              const redirectUrl = this.buildRedirectUrl(undefined, {
                status: 'failed',
                message: 'Thanh toán thành công nhưng không thể tạo đơn hàng (vui lòng liên hệ hỗ trợ)'
              });
              return { isValid: false, redirectUrl, message: 'Thanh toán thành công nhưng không thể tạo đơn hàng' };
            }
          }
        }
      } catch (error) {
        logger.error('Unable to update order payment status after VNPay callback', error);
      }
    } else {
      try {
        if (payment.orderId) {
          await this.orderRepository.updatePaymentStatus(payment.orderId, 'failed');
        }
      } catch (error) {
        logger.error('Unable to flag order payment failure after VNPay callback', error);
      }
    }

    const metadata = (payment.metadata ?? {}) as Record<string, unknown>;
    const customRedirect = typeof metadata.frontendRedirectUrl === 'string'
      ? (metadata.frontendRedirectUrl as string)
      : undefined;
    const redirectUrl = this.buildRedirectUrl(customRedirect, {
      status: success ? 'success' : 'failed',
      code: responseCode,
      orderId: payment.orderId,
      orderNumber: payment.orderNumber,
      message: success ? undefined : `VNPay code ${responseCode}`,
      info: orderInfo
    });

    return {
      isValid: success,
      redirectUrl,
      orderId: payment.orderId,
      orderNumber: payment.orderNumber,
      responseCode,
      message: success ? 'Thanh toán thành công' : `Thanh toán thất bại (mã ${responseCode})`
    };
  }
}
