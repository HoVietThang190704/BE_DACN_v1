import { IOrderRepository } from '../../repositories/IOrderRepository';
import { OrderEntity } from '../../entities/Order.entity';

/**
 * Use Case: Cancel Order
 */
export class CancelOrderUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, userId: string, reason: string): Promise<OrderEntity> {
    // Check if order belongs to user
    const belongsToUser = await this.orderRepository.belongsToUser(orderId, userId);
    if (!belongsToUser) {
      throw new Error('Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập');
    }

    // Get order to check if it can be cancelled
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    if (!order.canBeCancelled()) {
      throw new Error(`Không thể hủy đơn hàng ở trạng thái "${order.getStatusDisplay()}"`);
    }

    // Cancel order
    const cancelled = await this.orderRepository.cancelOrder(orderId, userId, reason);
    if (!cancelled) {
      throw new Error('Không thể hủy đơn hàng');
    }

    return cancelled;
  }
}
