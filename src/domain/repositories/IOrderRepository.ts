import { OrderEntity, OrderStatus, OrderStatusChangedBy } from '../entities/Order.entity';

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
  findById(id: string): Promise<OrderEntity | null>;

  findByOrderNumber(orderNumber: string): Promise<OrderEntity | null>;

  findByUserId(
    userId: string,
    filters?: OrderFilters,
    pagination?: OrderPagination
  ): Promise<PaginatedOrders>;

  create(order: Omit<import('../entities/Order.entity').IOrderEntity, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<OrderEntity>;

  updateStatus(id: string, status: OrderStatus, options?: OrderStatusUpdateOptions): Promise<OrderEntity | null>;

  updatePaymentStatus(id: string, paymentStatus: string): Promise<OrderEntity | null>;

  cancelOrder(id: string, userId: string, reason: string): Promise<OrderEntity | null>;

  countByUserId(userId: string): Promise<number>;

  belongsToUser(id: string, userId: string): Promise<boolean>;

  findManagedByUser(
    managerId: string,
    filters?: OrderFilters,
    pagination?: OrderPagination
  ): Promise<PaginatedOrders>;

  isManagedByUser(id: string, managerId: string): Promise<boolean>;

  getOrderStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    shipping: number;
    delivered: number;
    cancelled: number;
  }>;
  updateTotals(orderId: string, discount: number, total: number): Promise<OrderEntity | null>;
}
