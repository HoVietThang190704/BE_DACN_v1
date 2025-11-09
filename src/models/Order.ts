import mongoose, { Schema, Document } from 'mongoose';

/**
 * Order Model - Mongoose schema for orders
 */

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'shipping' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded';

export type PaymentMethod = 'cod' | 'momo' | 'zalopay' | 'vnpay' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  fullAddress: string;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  note?: string;
  cancelReason?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const ShippingAddressSchema = new Schema({
  recipientName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  ward: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  province: {
    type: String,
    required: true
  },
  fullAddress: {
    type: String,
    required: true
  }
}, { _id: false });

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID là bắt buộc'],
      index: true
    },
    orderNumber: {
      type: String,
      required: [true, 'Mã đơn hàng là bắt buộc'],
      unique: true,
      index: true
    },
    items: {
      type: [OrderItemSchema],
      required: [true, 'Danh sách sản phẩm là bắt buộc'],
      validate: {
        validator: (items: OrderItem[]) => items.length > 0,
        message: 'Đơn hàng phải có ít nhất 1 sản phẩm'
      }
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: [true, 'Địa chỉ giao hàng là bắt buộc']
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'momo', 'zalopay', 'vnpay', 'card'],
      required: [true, 'Phương thức thanh toán là bắt buộc']
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    note: {
      type: String,
      maxlength: [500, 'Ghi chú không được vượt quá 500 ký tự']
    },
    cancelReason: {
      type: String,
      maxlength: [500, 'Lý do hủy không được vượt quá 500 ký tự']
    },
    trackingNumber: {
      type: String
    },
    estimatedDelivery: {
      type: Date
    },
    deliveredAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'orders',
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

// Indexes for performance
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

// Generate order number before save
OrderSchema.pre('validate', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Count orders today
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    const OrderModel = mongoose.model('Order');
    const count = await OrderModel.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    this.orderNumber = `ORD${year}${month}${day}${sequence}`;
  }
  next();
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
