import mongoose, { Schema, Document } from 'mongoose';

export interface WishlistItem {
  _id?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  addedAt?: Date;
  note?: string;
}

export interface IWishlist extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: WishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: () => new Date() },
    note: { type: String }
  },
  { _id: true }
);

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    items: { type: [WishlistItemSchema], default: [] }
  },
  {
    timestamps: true,
    collection: 'wishlists',
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

export const Wishlist = mongoose.model<IWishlist>('Wishlist', WishlistSchema);
