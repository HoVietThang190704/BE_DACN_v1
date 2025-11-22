import { PaymentEntity, PaymentProvider, PaymentRecordStatus } from '../entities/Payment.entity';

export interface CreatePaymentRecord {
  orderId?: string;
  orderNumber?: string;
  transactionRef: string;
  userId?: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status?: PaymentRecordStatus;
  checkoutUrl?: string;
  returnUrl?: string;
  clientIp?: string;
  metadata?: Record<string, unknown> | null;
}

export interface UpdatePaymentRecord {
  providerPaymentId?: string;
  rawResponse?: Record<string, unknown> | null;
  failureReason?: string | null;
  orderId?: string;
  orderNumber?: string;
  checkoutUrl?: string;
  status?: PaymentRecordStatus;
  metadata?: Record<string, unknown> | null;
}

export interface IPaymentRepository {
  create(payload: CreatePaymentRecord): Promise<PaymentEntity>;
  findById(id: string): Promise<PaymentEntity | null>;
  findLatestByOrderId(orderId: string): Promise<PaymentEntity | null>;
  findByTransactionRef(provider: PaymentProvider, transactionRef: string): Promise<PaymentEntity | null>;
  updateById(id: string, payload: UpdatePaymentRecord): Promise<PaymentEntity | null>;
  updateStatus(id: string, status: PaymentRecordStatus, payload?: UpdatePaymentRecord): Promise<PaymentEntity | null>;
}
