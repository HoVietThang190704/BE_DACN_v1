import { OrderEntity, OrderStatus, PaymentMethod, PaymentStatus, OrderStatusChangedBy } from '../../../domain/entities/Order.entity';

/**
 * Order DTO
 */
export interface OrderDTO {
  id: string;
  orderNumber: string;
  userId: string;
  managerId?: string;
  
  // Items
  items: {
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  totalItems: number;
  
  // Pricing
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  
  // Status
  status: OrderStatus;
  statusDisplay: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  isInProgress: boolean;
  isCompleted: boolean;
  canBeCancelled: boolean;
  trackingNumber?: string | null;
  
  // Shipping
  shippingAddress: {
    recipientName: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    province: string;
    fullAddress: string;
  };
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  daysUntilDelivery?: number | null;
  
  // Notes
  note?: string;
  cancelReason?: string;
  statusHistory?: {
    status: OrderStatus;
    changedAt: Date;
    changedBy: OrderStatusChangedBy;
    note?: string;
  }[];
}

/**
 * Order Mapper
 */
export class OrderMapper {
  static toDTO(order: OrderEntity): OrderDTO {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
  managerId: order.managerId,
      
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      totalItems: order.getTotalItems(),
      
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      discount: order.discount,
      total: order.total,
      
      status: order.status,
      statusDisplay: order.getStatusDisplay(),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      isInProgress: order.isInProgress(),
      isCompleted: order.isCompleted(),
      canBeCancelled: order.canBeCancelled(),
      trackingNumber: order.trackingNumber,
      
      shippingAddress: {
        ...order.shippingAddress
      },
      
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      daysUntilDelivery: order.getDaysUntilDelivery(),
      
      note: order.note,
      cancelReason: order.cancelReason,
      statusHistory: order.statusHistory?.map(entry => ({
        status: entry.status,
        changedAt: entry.changedAt,
        changedBy: entry.changedBy,
        note: entry.note
      }))
    };
  }

  static toArrayDTO(orders: OrderEntity[]): OrderDTO[] {
    return orders.map(order => this.toDTO(order));
  }
}
