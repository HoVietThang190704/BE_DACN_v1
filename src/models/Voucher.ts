import mongoose, { Document, Schema } from 'mongoose';

export interface IVoucher extends Document {
  code: string;
  title?: string;
  description?: string;
  type: 'fixed' | 'percent';
  value: number;
  currency?: string;
  maxDiscountAmount?: number;
  isActive: boolean;
  startsAt?: Date;
  expiresAt?: Date;
  usageLimit?: number | null;
  usageCount: number;
  perUserLimit?: number | null;
  assignedTo?: mongoose.Types.ObjectId | null;
  createdBy?: mongoose.Types.ObjectId | null;
  metadata?: Record<string, any>;
}

const VoucherSchema: Schema<IVoucher> = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    title: { type: String },
    description: { type: String },
    type: { type: String, enum: ['fixed', 'percent'], required: true },
    value: { type: Number, required: true },
    currency: { type: String, default: 'VND' },
    maxDiscountAmount: { type: Number },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    usageLimit: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true, collection: 'vouchers' }
);

VoucherSchema.index({ isActive: 1, expiresAt: 1 });

export const Voucher = mongoose.model<IVoucher>('Voucher', VoucherSchema);

export default Voucher;
