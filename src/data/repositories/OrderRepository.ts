import { IOrderRepository, OrderFilters, OrderPagination, PaginatedOrders, OrderStatusUpdateOptions } from '../../domain/repositories/IOrderRepository';
import { OrderEntity, OrderStatus, IOrderEntity, OrderStatusHistoryEntry } from '../../domain/entities/Order.entity';
import { Order, IOrder } from '../../models/Order';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export class OrderRepository implements IOrderRepository {
  
  private toDomainEntity(model: IOrder): OrderEntity {
    const statusHistory = (model.statusHistory || []).map((entry) => ({
      status: entry.status,
      changedAt: entry.changedAt instanceof Date ? entry.changedAt : new Date(entry.changedAt),
      changedBy: entry.changedBy,
      note: entry.note
    })) as OrderStatusHistoryEntry[];

    return new OrderEntity({
      id: String(model._id),
      userId: String(model.userId),
  managerId: model.managerId ? String(model.managerId) : undefined,
      orderNumber: model.orderNumber,
      items: model.items.map(item => ({
        productId: String(item.productId),
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      shippingAddress: model.shippingAddress,
      subtotal: model.subtotal,
      shippingFee: model.shippingFee,
      discount: model.discount,
      total: model.total,
      status: model.status,
      paymentMethod: model.paymentMethod,
      paymentStatus: model.paymentStatus,
      note: model.note,
      cancelReason: model.cancelReason,
      trackingNumber: model.trackingNumber,
      estimatedDelivery: model.estimatedDelivery,
      deliveredAt: model.deliveredAt,
      statusHistory,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private buildCommonFilters(filters?: OrderFilters): any {
    const filter: Record<string, unknown> = {};
    if (!filters) {
      return filter;
    }

    if (filters.status) {
      filter.status = filters.status;
    }

    if (filters.paymentStatus) {
      filter.paymentStatus = filters.paymentStatus;
    }

    if (filters.fromDate || filters.toDate) {
      filter.createdAt = {};
      if (filters.fromDate) {
        (filter.createdAt as any).$gte = filters.fromDate;
      }
      if (filters.toDate) {
        (filter.createdAt as any).$lte = filters.toDate;
      }
    }

    if (filters.orderNumber) {
      filter.orderNumber = filters.orderNumber;
    } else if (filters.search) {
      filter.orderNumber = {
        $regex: this.escapeRegex(filters.search),
        $options: 'i'
      };
    }

    return filter;
  }

  private buildUserFilter(userId: string, filters?: OrderFilters): any {
    const filter = {
      userId: new mongoose.Types.ObjectId(userId),
      ...this.buildCommonFilters(filters)
    };
    return filter;
  }

  private buildManagerFilter(managerId: string, filters?: OrderFilters): any {
    const filter = {
      managerId: new mongoose.Types.ObjectId(managerId),
      ...this.buildCommonFilters(filters)
    };
    return filter;
  }

  async findById(id: string): Promise<OrderEntity | null> {
    try {
      const order = await Order.findById(id).lean();
      return order ? this.toDomainEntity(order as unknown as IOrder) : null;
    } catch (error) {
      logger.error('OrderRepository.findById error:', error);
      throw new Error('Lỗi khi tìm đơn hàng');
    }
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderEntity | null> {
    try {
      const order = await Order.findOne({ orderNumber }).lean();
      return order ? this.toDomainEntity(order as unknown as IOrder) : null;
    } catch (error) {
      logger.error('OrderRepository.findByOrderNumber error:', error);
      throw new Error('Lỗi khi tìm đơn hàng');
    }
  }

  async findByUserId(
    userId: string,
    filters?: OrderFilters,
    pagination?: OrderPagination
  ): Promise<PaginatedOrders> {
    try {
  const filter = this.buildUserFilter(userId, filters);
      
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(filter)
      ]);

      const orderEntities = orders.map(o => this.toDomainEntity(o as unknown as IOrder));

      return {
        orders: orderEntities,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('OrderRepository.findByUserId error:', error);
      throw new Error('Lỗi khi lấy danh sách đơn hàng');
    }
  }

  async findManagedByUser(
    managerId: string,
    filters?: OrderFilters,
    pagination?: OrderPagination
  ): Promise<PaginatedOrders> {
    try {
      const filter = this.buildManagerFilter(managerId, filters);

      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(filter)
      ]);

      const orderEntities = orders.map(o => this.toDomainEntity(o as unknown as IOrder));

      return {
        orders: orderEntities,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
  logger.error('OrderRepository.findManagedByUser error:', error);
  throw new Error('Lỗi khi lấy danh sách đơn hàng được bạn quản lý');
    }
  }

  async create(order: Omit<IOrderEntity, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<OrderEntity> {
    try {
      const now = new Date();
      const statusHistory = (order.statusHistory && order.statusHistory.length > 0)
        ? order.statusHistory.map(entry => ({
            status: entry.status,
            changedAt: entry.changedAt ?? now,
            changedBy: entry.changedBy,
            note: entry.note
          }))
        : [{
            status: order.status,
            changedAt: now,
            changedBy: 'user' as const,
            note: order.note
          }];

      const newOrder = await Order.create({
        ...order,
        userId: new mongoose.Types.ObjectId(order.userId),
  managerId: order.managerId ? new mongoose.Types.ObjectId(order.managerId) : undefined,
        statusHistory,
        items: order.items.map(item => ({
          ...item,
          productId: new mongoose.Types.ObjectId(item.productId)
        }))
      });

      return this.toDomainEntity(newOrder as IOrder);
    } catch (error: any) {
      // log more context to help debugging (don't leak to clients)
      logger.error('OrderRepository.create error:', { error: error?.message || error, order: { userId: order.userId, managerId: order.managerId } });
      // include original message in thrown error so controllers can surface it to clients during debugging
      throw new Error(`Lỗi khi tạo đơn hàng: ${error?.message || String(error)}`);
    }
  }

  async updatePaymentStatus(id: string, paymentStatus: string): Promise<OrderEntity | null> {
    try {
      const updated = await Order.findByIdAndUpdate(
        id,
        { $set: { paymentStatus } },
        { new: true, runValidators: true }
      ).lean();
      return updated ? this.toDomainEntity(updated as unknown as IOrder) : null;
    } catch (error) {
      logger.error('OrderRepository.updatePaymentStatus error:', error);
      throw new Error('Lỗi khi cập nhật trạng thái thanh toán');
    }
  }

  async cancelOrder(id: string, userId: string, reason: string): Promise<OrderEntity | null> {
    try {
      const updated = await Order.findOneAndUpdate(
        { _id: id, userId: new mongoose.Types.ObjectId(userId) },
        { 
          $set: { 
            status: 'cancelled',
            cancelReason: reason
          },
          $push: {
            statusHistory: {
              status: 'cancelled',
              changedAt: new Date(),
              changedBy: 'user',
              note: reason
            }
          }
        },
        { new: true, runValidators: true }
      ).lean();
      return updated ? this.toDomainEntity(updated as unknown as IOrder) : null;
    } catch (error) {
      logger.error('OrderRepository.cancelOrder error:', error);
      throw new Error('Lỗi khi hủy đơn hàng');
    }
  }

  async countByUserId(userId: string): Promise<number> {
    try {
      return await Order.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    } catch (error) {
      logger.error('OrderRepository.countByUserId error:', error);
      return 0;
    }
  }

  async belongsToUser(id: string, userId: string): Promise<boolean> {
    try {
      const count = await Order.countDocuments({
        _id: id,
        userId: new mongoose.Types.ObjectId(userId)
      });
      return count > 0;
    } catch (error) {
      logger.error('OrderRepository.belongsToUser error:', error);
      return false;
    }
  }

  async isManagedByUser(id: string, managerId: string): Promise<boolean> {
    try {
      const count = await Order.countDocuments({
        _id: id,
        managerId: new mongoose.Types.ObjectId(managerId)
      });
      return count > 0;
    } catch (error) {
      logger.error('OrderRepository.isManagedByUser error:', error);
      return false;
    }
  }

  async getOrderStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    shipping: number;
    delivered: number;
    cancelled: number;
  }> {
    try {
      const stats = await Order.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        pending: 0,
        confirmed: 0,
        preparing: 0,
        shipping: 0,
        delivered: 0,
        cancelled: 0
      };

      stats.forEach(stat => {
        if (stat._id in result) {
          result[stat._id as keyof typeof result] = stat.count;
        }
      });

      result.total = await this.countByUserId(userId);

      return result;
    } catch (error) {
      logger.error('OrderRepository.getOrderStatistics error:', error);
      throw new Error('Lỗi khi lấy thống kê đơn hàng');
    }
  }

  async updateStatus(id: string, status: OrderStatus, options?: OrderStatusUpdateOptions): Promise<OrderEntity | null> {
    try {
      const setFields: Record<string, unknown> = { status };
      const unsetFields: Record<string, unknown> = {};

      if (status === 'delivered') {
        setFields.deliveredAt = options?.deliveredAt ?? new Date();
      } else if (options && Object.prototype.hasOwnProperty.call(options, 'deliveredAt')) {
        if (options.deliveredAt) {
          setFields.deliveredAt = options.deliveredAt;
        } else {
          unsetFields.deliveredAt = '';
        }
      }

      if (options && Object.prototype.hasOwnProperty.call(options, 'trackingNumber')) {
        if (options.trackingNumber) {
          setFields.trackingNumber = options.trackingNumber;
        } else {
          unsetFields.trackingNumber = '';
        }
      }

      if (options && Object.prototype.hasOwnProperty.call(options, 'estimatedDelivery')) {
        if (options.estimatedDelivery) {
          setFields.estimatedDelivery = options.estimatedDelivery;
        } else {
          unsetFields.estimatedDelivery = '';
        }
      }

      if (options && Object.prototype.hasOwnProperty.call(options, 'note')) {
        if (options.note) {
          setFields.note = options.note;
        } else {
          unsetFields.note = '';
        }
      }

      const updateQuery: Record<string, unknown> = {
        $set: setFields
      };

      if (Object.keys(unsetFields).length > 0) {
        updateQuery.$unset = unsetFields;
      }

      const historyEntry = {
        status,
        changedAt: new Date(),
        changedBy: options?.history?.changedBy ?? 'system',
        note: options?.history?.note
      };

      (updateQuery as any).$push = {
        statusHistory: historyEntry
      };

      const updated = await Order.findByIdAndUpdate(
        id,
        updateQuery,
        { new: true, runValidators: true }
      ).lean();
      return updated ? this.toDomainEntity(updated as unknown as IOrder) : null;
    } catch (error) {
      logger.error('OrderRepository.updateStatus error:', error);
      throw new Error('Lỗi khi cập nhật trạng thái đơn hàng');
    }
  }

  async updateTotals(orderId: string, discount: number, total: number): Promise<OrderEntity | null> {
    try {
      const updated = await Order.findByIdAndUpdate(orderId, { $set: { discount, total } }, { new: true }).lean();
      return updated ? this.toDomainEntity(updated as unknown as IOrder) : null;
    } catch (error) {
      logger.error('OrderRepository.updateTotals error:', error);
      throw new Error('Lỗi khi cập nhật tổng đơn hàng');
    }
  }
}
