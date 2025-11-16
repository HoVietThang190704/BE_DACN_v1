import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  orderId?: string;
  provider: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'succeeded' | 'failed' | 'refunded';
  method?: string;
  metadata?: any;
  rawResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
  orderId: { type: String },
  provider: { type: String, required: true },
  providerPaymentId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'VND' },
  status: { type: String, enum: ['created','pending','succeeded','failed','refunded'], default: 'created' },
  method: { type: String },
  metadata: { type: Schema.Types.Mixed },
  rawResponse: { type: Schema.Types.Mixed }
}, { timestamps: true, collection: 'payments' });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
