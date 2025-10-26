import mongoose, { Schema, Document } from 'mongoose';

/**
 * Address Model - Mongoose schema for delivery addresses
 */

export interface IAddress extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  recipientName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
  label?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID là bắt buộc'],
      index: true
    },
    recipientName: {
      type: String,
      required: [true, 'Tên người nhận là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên người nhận không được vượt quá 100 ký tự']
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      trim: true,
      match: [
        /^(\+84|84|0)[1-9][0-9]{8}$/,
        'Số điện thoại không hợp lệ'
      ]
    },
    address: {
      type: String,
      required: [true, 'Địa chỉ là bắt buộc'],
      trim: true,
      maxlength: [200, 'Địa chỉ không được vượt quá 200 ký tự']
    },
    ward: {
      type: String,
      required: [true, 'Phường/Xã là bắt buộc'],
      trim: true
    },
    district: {
      type: String,
      required: [true, 'Quận/Huyện là bắt buộc'],
      trim: true
    },
    province: {
      type: String,
      required: [true, 'Tỉnh/Thành phố là bắt buộc'],
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true
    },
    label: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Ghi chú không được vượt quá 500 ký tự']
    }
  },
  {
    timestamps: true,
    collection: 'addresses',
    toJSON: {
      virtuals: true,
      transform: function(_doc, ret) {
        ret.id = ret._id.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Indexes
AddressSchema.index({ userId: 1, isDefault: 1 });
AddressSchema.index({ userId: 1, createdAt: -1 });

// Pre-save middleware: Ensure only one default address per user
AddressSchema.pre('save', async function(next) {
  if (this.isModified('isDefault') && this.isDefault) {
    // Set all other addresses of this user to non-default
    await mongoose.model('Address').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export const Address = mongoose.model<IAddress>('Address', AddressSchema);
