import { Document, Schema, model, Types } from 'mongoose';

export interface IProductReview extends Document {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  rating?: number;
  content: string;
  images: string[];
  cloudinaryPublicIds: string[];
  parentReviewId?: Types.ObjectId | null;
  level: number;
  mentionedUserId?: Types.ObjectId;
  repliesCount: number;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductReviewSchema = new Schema<IProductReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator(value: number | undefined): boolean {
          if (value === undefined || value === null) {
            return true;
          }
          return Number.isInteger(value * 2);
        },
        message: 'Đánh giá chỉ chấp nhận increment 0.5'
      }
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    images: {
      type: [String],
      default: []
    },
    cloudinaryPublicIds: {
      type: [String],
      default: []
    },
    parentReviewId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductReview',
      default: null
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 2
    },
    mentionedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    repliesCount: {
      type: Number,
      default: 0
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'product_reviews'
  }
);

ProductReviewSchema.index({ productId: 1, createdAt: -1 });
ProductReviewSchema.index({ productId: 1, level: 1, createdAt: 1 });
ProductReviewSchema.index({ parentReviewId: 1, createdAt: 1 });
ProductReviewSchema.index({ userId: 1, createdAt: -1 });

ProductReviewSchema.pre('validate', function (next) {
  const doc = this as IProductReview;
  if (doc.level === 0 && (doc.rating === undefined || doc.rating === null)) {
    return next(new Error('Đánh giá sao không được để trống'));
  }
  if (doc.level > 0 && doc.rating !== undefined && doc.rating !== null) {
    doc.rating = undefined;
  }
  next();
});

export const ProductReview = model<IProductReview>('ProductReview', ProductReviewSchema);
