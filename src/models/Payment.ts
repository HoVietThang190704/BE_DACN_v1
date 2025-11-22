import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  orderId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  transactionRef: string;
  userId?: mongoose.Types.ObjectId;
  provider: 'vnpay';
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'succeeded' | 'failed' | 'refunded';
  checkoutUrl?: string;
  returnUrl?: string;
  clientIp?: string;
  metadata?: Record<string, unknown> | null;
  rawResponse?: Record<string, unknown> | null;
  failureReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
  orderNumber: { type: String, index: true },
  transactionRef: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  provider: { type: String, enum: ['vnpay'], required: true },
  providerPaymentId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'VND' },
  status: { type: String, enum: ['created','pending','succeeded','failed','refunded'], default: 'pending', index: true },
  checkoutUrl: { type: String },
  returnUrl: { type: String },
  clientIp: { type: String },
  metadata: { type: Schema.Types.Mixed },
  rawResponse: { type: Schema.Types.Mixed },
  failureReason: { type: String }
}, { timestamps: true, collection: 'payments' });

PaymentSchema.index({ provider: 1, transactionRef: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
