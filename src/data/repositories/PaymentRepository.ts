import mongoose from 'mongoose';
import { Payment, IPayment } from '../../models/Payment';
import { logger } from '../../shared/utils/logger';
import { PaymentEntity, PaymentProvider, PaymentRecordStatus } from '../../domain/entities/Payment.entity';
import { CreatePaymentRecord, IPaymentRepository, UpdatePaymentRecord } from '../../domain/repositories/IPaymentRepository';

export class PaymentRepository implements IPaymentRepository {
  private toEntity(model: IPayment): PaymentEntity {
    return new PaymentEntity({
      id: String(model._id),
      orderId: model.orderId ? String(model.orderId) : undefined,
      orderNumber: model.orderNumber,
      transactionRef: model.transactionRef,
      userId: model.userId ? String(model.userId) : undefined,
      provider: model.provider,
      providerPaymentId: model.providerPaymentId,
      amount: model.amount,
      currency: model.currency,
      status: model.status,
      checkoutUrl: model.checkoutUrl,
      returnUrl: model.returnUrl,
      clientIp: model.clientIp,
      metadata: model.metadata ?? undefined,
      rawResponse: model.rawResponse ?? undefined,
      failureReason: model.failureReason ?? undefined,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  private ensureObjectId(id: string): mongoose.Types.ObjectId {
    return new mongoose.Types.ObjectId(id);
  }

  async create(payload: CreatePaymentRecord): Promise<PaymentEntity> {
    try {
      const createBody: any = {
        orderNumber: payload.orderNumber,
        transactionRef: payload.transactionRef,
        userId: payload.userId ? this.ensureObjectId(payload.userId) : undefined,
        provider: payload.provider,
        amount: payload.amount,
        currency: payload.currency,
        status: payload.status ?? 'pending',
        checkoutUrl: payload.checkoutUrl,
        returnUrl: payload.returnUrl,
        clientIp: payload.clientIp,
        metadata: payload.metadata ?? undefined
      };

      if (payload.orderId) {
        createBody.orderId = this.ensureObjectId(payload.orderId);
      }

      const created = await Payment.create(createBody);
      

      return this.toEntity(created);
    } catch (error) {
      logger.error('PaymentRepository.create error:', error);
      throw new Error('Không thể tạo bản ghi thanh toán VNPay');
    }
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    try {
      const payment = await Payment.findById(id).lean<IPayment>();
      return payment ? this.toEntity(payment as IPayment) : null;
    } catch (error) {
      logger.error('PaymentRepository.findById error:', error);
      throw new Error('Không thể tìm bản ghi thanh toán');
    }
  }

  async findLatestByOrderId(orderId: string): Promise<PaymentEntity | null> {
    try {
      const payment = await Payment.findOne({ orderId: this.ensureObjectId(orderId) })
        .sort({ createdAt: -1 })
        .lean<IPayment>();
      return payment ? this.toEntity(payment as IPayment) : null;
    } catch (error) {
      logger.error('PaymentRepository.findLatestByOrderId error:', error);
      throw new Error('Không thể tìm bản ghi thanh toán');
    }
  }

  async findByTransactionRef(provider: PaymentProvider, transactionRef: string): Promise<PaymentEntity | null> {
    try {
      const payment = await Payment.findOne({ provider, transactionRef }).lean<IPayment>();
      return payment ? this.toEntity(payment as IPayment) : null;
    } catch (error) {
      logger.error('PaymentRepository.findByTransactionRef error:', error);
      throw new Error('Không thể tìm bản ghi thanh toán');
    }
  }

  async updateById(id: string, payload: UpdatePaymentRecord): Promise<PaymentEntity | null> {
    try {
      const updateSet: any = { ...payload };
      if (payload.orderId) updateSet.orderId = this.ensureObjectId(payload.orderId as string);

      const updated = await Payment.findByIdAndUpdate(
        id,
        { $set: updateSet },
        { new: true }
      ).lean<IPayment>();
      return updated ? this.toEntity(updated as IPayment) : null;
    } catch (error) {
      logger.error('PaymentRepository.updateById error:', error);
      throw new Error('Không thể cập nhật bản ghi thanh toán');
    }
  }

  async updateStatus(id: string, status: PaymentRecordStatus, payload?: UpdatePaymentRecord): Promise<PaymentEntity | null> {
    try {
      const updatePayload = { ...(payload ?? {}), status };
      const updated = await Payment.findByIdAndUpdate(
        id,
        { $set: updatePayload },
        { new: true }
      ).lean<IPayment>();
      return updated ? this.toEntity(updated as IPayment) : null;
    } catch (error) {
      logger.error('PaymentRepository.updateStatus error:', error);
      throw new Error('Không thể cập nhật trạng thái thanh toán');
    }
  }
}
