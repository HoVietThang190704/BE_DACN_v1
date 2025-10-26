import { IOrderRepository } from '../../repositories/IOrderRepository';
import { OrderEntity } from '../../entities/Order.entity';

/**
 * Use Case: Get Order By ID
 */
export class GetOrderByIdUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, userId: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(orderId);
    
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    // Check if order belongs to user
    if (order.userId !== userId) {
      throw new Error('Bạn không có quyền truy cập đơn hàng này');
    }

    return order;
  }
}
