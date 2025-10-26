/**
 * Order Entity - Domain model for orders
 */

export type OrderStatus = 
  | 'pending'       // Chờ xác nhận
  | 'confirmed'     // Đã xác nhận
  | 'preparing'     // Đang chuẩn bị
  | 'shipping'      // Đang giao
  | 'delivered'     // Đã giao
  | 'cancelled'     // Đã hủy
  | 'refunded';     // Đã hoàn tiền

export type PaymentMethod = 'cod' | 'momo' | 'zalopay' | 'vnpay' | 'card';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  productId: string;
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

export interface IOrderEntity {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  
  // Pricing
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  
  // Status
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  
  // Tracking
  note?: string;
  cancelReason?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export class OrderEntity implements IOrderEntity {
  id: string;
  userId: string;
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

  constructor(data: IOrderEntity) {
    this.id = data.id;
    this.userId = data.userId;
    this.orderNumber = data.orderNumber;
    this.items = data.items;
    this.shippingAddress = data.shippingAddress;
    this.subtotal = data.subtotal;
    this.shippingFee = data.shippingFee;
    this.discount = data.discount;
    this.total = data.total;
    this.status = data.status;
    this.paymentMethod = data.paymentMethod;
    this.paymentStatus = data.paymentStatus;
    this.note = data.note;
    this.cancelReason = data.cancelReason;
    this.trackingNumber = data.trackingNumber;
    this.estimatedDelivery = data.estimatedDelivery;
    this.deliveredAt = data.deliveredAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Check if order can be cancelled
   */
  canBeCancelled(): boolean {
    return ['pending', 'confirmed'].includes(this.status);
  }

  /**
   * Check if order is in progress
   */
  isInProgress(): boolean {
    return ['pending', 'confirmed', 'preparing', 'shipping'].includes(this.status);
  }

  /**
   * Check if order is completed
   */
  isCompleted(): boolean {
    return this.status === 'delivered';
  }

  /**
   * Check if order is cancelled
   */
  isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  /**
   * Check if payment is completed
   */
  isPaid(): boolean {
    return this.paymentStatus === 'paid';
  }

  /**
   * Get total items count
   */
  getTotalItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Get order status display
   */
  getStatusDisplay(): string {
    const statusMap: Record<OrderStatus, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền'
    };
    return statusMap[this.status];
  }

  /**
   * Get payment method display
   */
  getPaymentMethodDisplay(): string {
    const methodMap: Record<PaymentMethod, string> = {
      cod: 'Thanh toán khi nhận hàng (COD)',
      momo: 'Ví MoMo',
      zalopay: 'ZaloPay',
      vnpay: 'VNPAY',
      card: 'Thẻ ngân hàng'
    };
    return methodMap[this.paymentMethod];
  }

  /**
   * Calculate days until estimated delivery
   */
  getDaysUntilDelivery(): number | null {
    if (!this.estimatedDelivery) return null;
    
    const now = new Date();
    const diff = this.estimatedDelivery.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if order is delayed
   */
  isDelayed(): boolean {
    if (!this.estimatedDelivery || this.isCompleted() || this.isCancelled()) {
      return false;
    }
    
    return new Date() > this.estimatedDelivery;
  }

  /**
   * Validate order data
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.userId) {
      errors.push('User ID không được để trống');
    }

    if (!this.items || this.items.length === 0) {
      errors.push('Đơn hàng phải có ít nhất 1 sản phẩm');
    }

    if (!this.shippingAddress) {
      errors.push('Địa chỉ giao hàng không được để trống');
    }

    if (this.total <= 0) {
      errors.push('Tổng tiền phải lớn hơn 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to JSON
   */
  toJSON(): IOrderEntity {
    return {
      id: this.id,
      userId: this.userId,
      orderNumber: this.orderNumber,
      items: this.items,
      shippingAddress: this.shippingAddress,
      subtotal: this.subtotal,
      shippingFee: this.shippingFee,
      discount: this.discount,
      total: this.total,
      status: this.status,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      note: this.note,
      cancelReason: this.cancelReason,
      trackingNumber: this.trackingNumber,
      estimatedDelivery: this.estimatedDelivery,
      deliveredAt: this.deliveredAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
