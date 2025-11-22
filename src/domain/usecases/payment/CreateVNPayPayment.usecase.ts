import { config } from '../../../config';
import { IOrderRepository } from '../../repositories/IOrderRepository';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { IVNPayGateway } from '../../services/IVNPayGateway';

export interface CreateVNPayPaymentRequest {
  orderId?: string;
  userId: string;
  clientIp?: string;
  frontendRedirectUrl?: string;
  locale?: 'vn' | 'en';
  /**
   * Optional checkout payload — when orderId is not provided we accept a checkout snapshot
   * that will be stored with the payment and used to create the order upon successful callback.
   */
  checkoutPayload?: Record<string, unknown> | null;
}

export interface CreateVNPayPaymentResponse {
  paymentUrl: string;
  paymentId: string;
  transactionRef: string;
}

export class CreateVNPayPaymentUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly vnPayGateway: IVNPayGateway
  ) {}

  private generateTransactionRef(orderNumber: string): string {
    const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const base = `${orderNumber}-${randomSuffix}`;
    return base.slice(0, 32);
  }

  async execute(request: CreateVNPayPaymentRequest): Promise<CreateVNPayPaymentResponse> {
    const { orderId, userId, clientIp, frontendRedirectUrl, locale } = request;

    // if an orderId is provided we use the existing order (existing behaviour)
    if (orderId) {
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        throw new Error('Không tìm thấy đơn hàng để thanh toán');
      }

      if (order.userId !== userId) {
        throw new Error('Bạn không có quyền thanh toán cho đơn hàng này');
      }

      if (order.paymentMethod !== 'vnpay') {
        throw new Error('Đơn hàng này không sử dụng phương thức thanh toán VNPay');
      }

      if (order.paymentStatus === 'paid') {
        throw new Error('Đơn hàng đã được thanh toán thành công trước đó');
      }

      const transactionRef = this.generateTransactionRef(order.orderNumber);
      const orderInfo = `Thanh toan don hang ${order.orderNumber}`;
      const { paymentUrl } = this.vnPayGateway.createPaymentUrl({
        amount: order.total,
        transactionRef,
        orderInfo,
        clientIp,
        locale: locale ?? 'vn'
      });

      const paymentRecord = await this.paymentRepository.create({
        orderId: order.id,
        orderNumber: order.orderNumber,
        transactionRef,
        userId,
        provider: 'vnpay',
        amount: order.total,
        currency: 'VND',
        checkoutUrl: paymentUrl,
        returnUrl: config.VNPAY_RETURN_URL,
        clientIp,
        metadata: frontendRedirectUrl ? { frontendRedirectUrl } : undefined
      });

      return {
        paymentUrl,
        paymentId: paymentRecord.id,
        transactionRef
      };
    }

    // No orderId — treat this as a payment session for a checkout snapshot (no order created yet)
    const payloadAmount = Number(request.checkoutPayload?.['total'] ?? request.checkoutPayload?.['amount']);
    if (!payloadAmount || isNaN(payloadAmount) || payloadAmount <= 0) {
      throw new Error('Thiếu tổng số tiền cho phiên thanh toán');
    }

    const transactionRef = this.generateTransactionRef(`INTENT-${userId}`);
    const orderInfo = `Thanh toan session ${transactionRef}`;
    const { paymentUrl } = this.vnPayGateway.createPaymentUrl({
      amount: payloadAmount,
      transactionRef,
      orderInfo,
      clientIp,
      locale: locale ?? 'vn'
    });

    // store checkout snapshot in metadata so callback can create the final order
    const metadata = {
      checkoutPayload: request.checkoutPayload ?? undefined,
      frontendRedirectUrl: frontendRedirectUrl ?? undefined
    };

    const paymentRecord = await this.paymentRepository.create({
      transactionRef,
      userId,
      provider: 'vnpay',
      amount: payloadAmount,
      currency: 'VND',
      checkoutUrl: paymentUrl,
      returnUrl: config.VNPAY_RETURN_URL,
      clientIp,
      metadata
    });

    return {
      paymentUrl,
      paymentId: paymentRecord.id,
      transactionRef
    };
  }
}
