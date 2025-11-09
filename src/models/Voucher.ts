import mongoose, { Document, Schema } from 'mongoose';

export interface VoucherUsage {
  userId: mongoose.Types.ObjectId;
  usageCount: number;
  lastUsedAt?: Date;
}

export interface IVoucher extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxDiscountValue?: number;
  startDate?: Date;
  endDate?: Date;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  usageByUsers: VoucherUsage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VoucherUsageSchema = new Schema<VoucherUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usageCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const VoucherSchema = new Schema<IVoucher>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      min: 0,
    },
    maxDiscountValue: {
      type: Number,
      min: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    usageLimit: {
      type: Number,
      min: 0,
    },
    usageCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      min: 0,
    },
    usageByUsers: {
      type: [VoucherUsageSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'vouchers',
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        ret.id = ret._id.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

VoucherSchema.index({ isActive: 1, endDate: 1 });
VoucherSchema.index({ 'usageByUsers.userId': 1 });

export const Voucher = mongoose.model<IVoucher>('Voucher', VoucherSchema);
