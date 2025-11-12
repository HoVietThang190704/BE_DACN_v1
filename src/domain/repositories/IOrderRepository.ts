import { OrderEntity, OrderStatus, OrderStatusChangedBy } from '../entities/Order.entity';

/**
 * Order Repository Interface
 */

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
  orderNumber?: string;
}

export interface OrderPagination {
  page: number;
  limit: number;
}

export interface PaginatedOrders {
  orders: OrderEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderStatusUpdateOptions {
  trackingNumber?: string | null;
  estimatedDelivery?: Date | null;
  note?: string | null;
  deliveredAt?: Date | null;
  history?: {
    changedBy: OrderStatusChangedBy;
    note?: string;
  };
}

export interface IOrderRepository {
  /**
   * Find order by ID
   */
  findById(id: string): Promise<OrderEntity | null>;

  /**
   * Find order by order number
   */
  findByOrderNumber(orderNumber: string): Promise<OrderEntity | null>;

  /**
   * Get user's orders with filters and pagination
   */
  findByUserId(
    userId: string,
    filters?: OrderFilters,
    pagination?: OrderPagination
  ): Promise<PaginatedOrders>;

  /**
   * Create new order
   */
  create(order: Omit<import('../entities/Order.entity').IOrderEntity, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<OrderEntity>;

  /**
   * Update order status
   */
  updateStatus(id: string, status: OrderStatus, options?: OrderStatusUpdateOptions): Promise<OrderEntity | null>;

  /**
   * Update payment status
   */
  updatePaymentStatus(id: string, paymentStatus: string): Promise<OrderEntity | null>;

  /**
   * Cancel order
   */
  cancelOrder(id: string, userId: string, reason: string): Promise<OrderEntity | null>;

  /**
   * Count user's orders
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Check if order belongs to user
   */
  belongsToUser(id: string, userId: string): Promise<boolean>;

  /**
   * Get orders managed by a specific user with filters and pagination
   */
  findManagedByUser(
    managerId: string,
    filters?: OrderFilters,
    pagination?: OrderPagination
  ): Promise<PaginatedOrders>;

  /**
   * Check if order is managed by user
   */
  isManagedByUser(id: string, managerId: string): Promise<boolean>;

  /**
   * Get order statistics for user
   */
  getOrderStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    shipping: number;
    delivered: number;
    cancelled: number;
  }>;
}
