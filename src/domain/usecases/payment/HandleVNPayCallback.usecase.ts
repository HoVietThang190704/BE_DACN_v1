import { config } from '../../../config';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { IOrderRepository } from '../../repositories/IOrderRepository';
import { IProductRepository } from '../../repositories/IProductRepository';
import { OrderEntity } from '../../entities/Order.entity';
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
    private readonly productRepository: IProductRepository,
    private readonly vnPayGateway: IVNPayGateway
  ) {}

  private async deductStockForOrder(order: OrderEntity): Promise<void> {
    for (const item of order.items) {
      const ok = await this.productRepository.reduceStock(item.productId, item.quantity);
      if (!ok) {
        throw new Error(`Không đủ tồn kho cho sản phẩm ${item.productName}`);
      }
    }
  }

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
    const metadata = (payment.metadata ?? {}) as Record<string, unknown>;
    let stockDeducted = metadata.stockDeducted === true;
    let orderId = payment.orderId;
    let orderNumber = payment.orderNumber;
    let finalSuccess = success;
    let redirectMessage = success ? undefined : `VNPay code ${responseCode}`;

    await this.paymentRepository.updateStatus(payment.id, success ? 'succeeded' : 'failed', {
      providerPaymentId,
      rawResponse: normalizedParams,
      failureReason: success ? undefined : `VNPay response code ${responseCode}`
    });

    if (success) {
      try {
        let order: OrderEntity | null = null;

        if (orderId) {
          order = await this.orderRepository.findById(orderId);
          if (!order) {
            logger.warn('Payment succeeded but order not found when linking payment', { transactionRef, orderId });
          } else {
            orderNumber = order.orderNumber;
          }
        }

        // no order yet -> create final order from stored checkout snapshot if available
        if (!order) {
          const checkoutPayload = metadata.checkoutPayload as any | undefined;

          if (!checkoutPayload) {
            logger.warn('Payment succeeded but no checkout snapshot to create order', { transactionRef });
          } else {
            try {
              if (!checkoutPayload.userId) {
                checkoutPayload.userId = payment.userId;
              }

              const createdOrder = await this.orderRepository.create(checkoutPayload);
              order = createdOrder;
              orderId = createdOrder.id;
              orderNumber = createdOrder.orderNumber;

              await this.paymentRepository.updateById(payment.id, {
                orderId: createdOrder.id,
                orderNumber: createdOrder.orderNumber,
                status: 'succeeded',
                metadata: { ...(payment.metadata ?? {}), createdOrderId: createdOrder.id, createdOrderNumber: createdOrder.orderNumber }
              });
            } catch (error) {
              logger.error('Unable to create order from checkout snapshot after VNPay success', error);
              await this.paymentRepository.updateStatus(payment.id, 'failed', { failureReason: 'Unable to create order after successful payment' });
              finalSuccess = false;
              redirectMessage = 'Thanh toán thành công nhưng không thể tạo đơn hàng';
              const redirectUrl = this.buildRedirectUrl(undefined, {
                status: 'failed',
                message: redirectMessage
              });
              return { isValid: false, redirectUrl, message: redirectMessage };
            }
          }
        }

        if (order) {
          if (!stockDeducted) {
            try {
              await this.deductStockForOrder(order);
              stockDeducted = true;
            } catch (error) {
              logger.error('Unable to deduct stock after VNPay success', error);
              await this.paymentRepository.updateStatus(payment.id, 'failed', { failureReason: 'Out of stock after payment' });
              await this.orderRepository.updatePaymentStatus(order.id, 'failed');
              finalSuccess = false;
              redirectMessage = 'Sản phẩm đã hết hàng sau khi thanh toán';
              const redirectUrl = this.buildRedirectUrl(undefined, {
                status: 'failed',
                message: redirectMessage
              });
              return { isValid: false, redirectUrl, message: redirectMessage };
            }
          }

          await this.orderRepository.updatePaymentStatus(order.id, 'paid');
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

    const updatedMetadata = {
      ...metadata,
      ...(stockDeducted ? { stockDeducted: true } : {}),
      ...(orderId && !metadata.createdOrderId ? { createdOrderId: orderId, createdOrderNumber: orderNumber } : {})
    };

    if (orderId || stockDeducted) {
      await this.paymentRepository.updateById(payment.id, {
        ...(orderId ? { orderId, orderNumber } : {}),
        metadata: updatedMetadata
      });
    }

    const customRedirect = typeof metadata.frontendRedirectUrl === 'string'
      ? (metadata.frontendRedirectUrl as string)
      : undefined;
    const redirectUrl = this.buildRedirectUrl(customRedirect, {
      status: finalSuccess ? 'success' : 'failed',
      code: responseCode,
      orderId,
      orderNumber,
      message: finalSuccess ? undefined : redirectMessage,
      info: orderInfo
    });

    return {
      isValid: finalSuccess,
      redirectUrl,
      orderId,
      orderNumber,
      responseCode,
      message: finalSuccess ? 'Thanh toán thành công' : redirectMessage || `Thanh toán thất bại (mã ${responseCode})`
    };
  }
}
