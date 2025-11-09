import { IOrderRepository, OrderFilters, OrderPagination, PaginatedOrders } from '../../domain/repositories/IOrderRepository';
import { OrderEntity, OrderStatus, IOrderEntity } from '../../domain/entities/Order.entity';
import { Order, IOrder } from '../../models/Order';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export class OrderRepository implements IOrderRepository {
  
  private toDomainEntity(model: IOrder): OrderEntity {
    return new OrderEntity({
      id: String(model._id),
      userId: String(model.userId),
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
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  private buildFilter(userId: string, filters?: OrderFilters): any {
    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (filters?.status) {
      filter.status = filters.status;
    }

    if (filters?.paymentStatus) {
      filter.paymentStatus = filters.paymentStatus;
    }

    if (filters?.fromDate || filters?.toDate) {
      filter.createdAt = {};
      if (filters.fromDate) {
        filter.createdAt.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        filter.createdAt.$lte = filters.toDate;
      }
    }

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
      const filter = this.buildFilter(userId, filters);
      
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

  async create(order: Omit<IOrderEntity, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<OrderEntity> {
    try {
      const newOrder = await Order.create({
        ...order,
        userId: new mongoose.Types.ObjectId(order.userId),
        items: order.items.map(item => ({
          ...item,
          productId: new mongoose.Types.ObjectId(item.productId)
        }))
      });

      return this.toDomainEntity(newOrder as IOrder);
    } catch (error) {
      logger.error('OrderRepository.create error:', error);
      throw new Error('Lỗi khi tạo đơn hàng');
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

  async updateStatus(id: string, status: OrderStatus): Promise<OrderEntity | null> {
    try {
      const update: any = { status };
      if (status === 'delivered') {
        update.deliveredAt = new Date();
      }
      const updated = await Order.findByIdAndUpdate(
        id,
        { $set: update },
        { new: true, runValidators: true }
      ).lean();
      return updated ? this.toDomainEntity(updated as unknown as IOrder) : null;
    } catch (error) {
      logger.error('OrderRepository.updateStatus error:', error);
      throw new Error('Lỗi khi cập nhật trạng thái đơn hàng');
    }
  }
}
