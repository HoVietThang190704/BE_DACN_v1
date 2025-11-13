import mongoose, { Schema } from 'mongoose';

const VoucherRedemptionSchema = new Schema({
  voucherId: { type: Schema.Types.ObjectId, ref: 'Voucher', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  amountApplied: { type: Number, required: true },
  createdAt: { type: Date, default: () => new Date() }
}, { collection: 'voucher_redemptions' });

VoucherRedemptionSchema.index({ voucherId: 1, userId: 1 });

export const VoucherRedemption = mongoose.model('VoucherRedemption', VoucherRedemptionSchema);
export default VoucherRedemption;
