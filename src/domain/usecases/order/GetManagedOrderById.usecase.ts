import { IOrderRepository } from '../../repositories/IOrderRepository';
import { OrderEntity } from '../../entities/Order.entity';

export class GetManagedOrderByIdUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(orderId: string, managerId: string): Promise<OrderEntity> {
    if (!orderId) {
      throw new Error('Order ID là bắt buộc');
    }

    if (!managerId) {
      throw new Error('Người quản lý đơn hàng là bắt buộc');
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    if (!order.managerId || order.managerId !== managerId) {
      throw new Error('Bạn không có quyền truy cập đơn hàng này');
    }

    return order;
  }
}
