import mongoose, { Schema, Document } from 'mongoose';

export interface IShop extends Document {
  _id: mongoose.Types.ObjectId;
  owner_id: mongoose.Types.ObjectId;
  shop_name: string;
  story?: string;
  slug?: string | null;
  isActive: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  approvedBy?: mongoose.Types.ObjectId | null;
  reviewMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema<IShop>(
  {
    owner_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true
    },
    shop_name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: [150, 'Shop name too long']
    },
    story: {
      type: String,
      default: ''
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      unique: true,
      sparse: true,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
    ,
    // Approval workflow fields
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
      index: true
    },
    submittedAt: {
      type: Date,
      default: null,
      index: true
    },
    approvedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    reviewMessage: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'shops',
    toJSON: {
      virtuals: true,
      transform: function(_doc, ret) {
        (ret as any).id = (ret as any)._id ? (ret as any)._id.toString() : undefined;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      }
    }
  }
);

// Indexes
ShopSchema.index({ owner_id: 1 });
ShopSchema.index({ shop_name: 'text', story: 'text' });

export const Shop = mongoose.model<IShop>('Shop', ShopSchema);
