export type PaymentProvider = 'vnpay';

export type PaymentRecordStatus = 'created' | 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface IPaymentEntity {
  id: string;
  orderId?: string;
  orderNumber?: string;
  transactionRef: string;
  userId?: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentRecordStatus;
  checkoutUrl?: string;
  returnUrl?: string;
  clientIp?: string;
  metadata?: Record<string, unknown> | null;
  rawResponse?: Record<string, unknown> | null;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentEntity implements IPaymentEntity {
  id: string;
  orderId?: string;
  orderNumber?: string;
  transactionRef: string;
  userId?: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentRecordStatus;
  checkoutUrl?: string;
  returnUrl?: string;
  clientIp?: string;
  metadata?: Record<string, unknown> | null;
  rawResponse?: Record<string, unknown> | null;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IPaymentEntity) {
    this.id = data.id;
    this.orderId = data.orderId ?? undefined;
    this.orderNumber = data.orderNumber ?? undefined;
    this.transactionRef = data.transactionRef;
    this.userId = data.userId;
    this.provider = data.provider;
    this.providerPaymentId = data.providerPaymentId;
    this.amount = data.amount;
    this.currency = data.currency;
    this.status = data.status;
    this.checkoutUrl = data.checkoutUrl;
    this.returnUrl = data.returnUrl;
    this.clientIp = data.clientIp;
    this.metadata = data.metadata;
    this.rawResponse = data.rawResponse;
    this.failureReason = data.failureReason;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  isSucceeded(): boolean {
    return this.status === 'succeeded';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  isPending(): boolean {
    return this.status === 'pending';
  }
}
