import mongoose, { Schema, Document } from 'mongoose';

export interface CartItem {
  _id?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  shopId?: mongoose.Types.ObjectId;
  quantity: number;
  unit?: string;
  price?: number; // snapshot price
  title?: string; // snapshot title
  thumbnail?: string; // snapshot image
  attrs?: any;
  addedAt?: Date;
}

export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    unit: {
      type: String
    },
    price: {
      type: Number,
      min: 0
    },
    title: {
      type: String
    },
    thumbnail: {
      type: String
    },
    attrs: {
      type: Schema.Types.Mixed
    },
    addedAt: {
      type: Date,
      default: () => new Date()
    }
  },
  { _id: true }
);

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      unique: true
    },
    items: {
      type: [CartItemSchema],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'carts',
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        ret.id = ret._id.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      }
    }
  }
);

// Indexes
CartSchema.index({ userId: 1 }, { unique: true });

export const Cart = mongoose.model<ICart>('Cart', CartSchema);
