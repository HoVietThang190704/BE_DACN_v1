import mongoose, { Schema, Document } from 'mongoose';

/**
 * Category Model - Mongoose schema for hierarchical categories
 * Supports multi-level category tree structure
 */

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  imagePublicId?: string;
  parentId?: mongoose.Types.ObjectId | null;
  level: number;
  order: number;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên danh mục không được vượt quá 100 ký tự']
    },
    nameEn: {
      type: String,
      trim: true,
      maxlength: [100, 'Tên tiếng Anh không được vượt quá 100 ký tự']
    },
    slug: {
      type: String,
      required: [true, 'Slug là bắt buộc'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
    },
    icon: {
      type: String,
      trim: true
    },
    image: {
      type: String,
      trim: true,
      default: null
    },
    imagePublicId: {
      type: String,
      trim: true,
      default: null
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true
    },
    level: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Level không được nhỏ hơn 0'],
      index: true
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Order không được nhỏ hơn 0']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    productCount: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng sản phẩm không được nhỏ hơn 0']
    }
  },
  {
    timestamps: true,
    collection: 'categories',
    toJSON: {
      virtuals: true,
      transform: function(_doc, ret) {
        (ret as any).id = (ret as any)._id ? (ret as any)._id.toString() : undefined;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
CategorySchema.index({ name: 'text', nameEn: 'text', description: 'text' });
CategorySchema.index({ parentId: 1, order: 1 });
CategorySchema.index({ level: 1, order: 1 });
CategorySchema.index({ isActive: 1, level: 1 });

// Pre-save middleware to set level based on parent
CategorySchema.pre('save', async function(this: any, next: any) {
  const doc = this as any;
  if (doc.isModified && doc.isModified('parentId')) {
    if (doc.parentId) {
      const parent = await mongoose.model('Category').findById(doc.parentId);
      if (parent) {
        doc.level = (parent as any).level + 1;
      } else {
        doc.level = 0;
      }
    } else {
      doc.level = 0;
    }
  }
  next();
});

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
