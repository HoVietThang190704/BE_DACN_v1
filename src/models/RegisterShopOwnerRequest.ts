import mongoose, { Schema, Document } from 'mongoose';

export interface IRegisterShopOwnerRequest extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  certificateUrl: string;
  certificatePublicId: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewMessage?: string | null;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  userSnapshot?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      province?: string;
      district?: string;
      commune?: string;
      street?: string;
      detail?: string;
    };
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const RegisterShopOwnerSchema = new Schema<IRegisterShopOwnerRequest>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  certificateUrl: {
    type: String,
    required: true
  },
  certificatePublicId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  reviewMessage: {
    type: String,
    default: null,
    trim: true
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  userSnapshot: {
    name: String,
    email: String,
    phone: String,
    address: {
      province: String,
      district: String,
      commune: String,
      street: String,
      detail: String
    }
  }
}, {
  timestamps: true,
  collection: 'register_shop_owner',
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      ret.id = ret._id ? ret._id.toString() : undefined;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

RegisterShopOwnerSchema.index({ user_id: 1, status: 1 });

export const RegisterShopOwnerRequestModel = mongoose.model<IRegisterShopOwnerRequest>('RegisterShopOwnerRequest', RegisterShopOwnerSchema);
