import { IOrderRepository } from '../../repositories/IOrderRepository';
import { OrderEntity } from '../../entities/Order.entity';

export class ConfirmOrderDeliveredUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(orderId: string, userId: string, note?: string): Promise<OrderEntity> {
    if (!orderId) {
      throw new Error('Order ID là bắt buộc');
    }

    if (!userId) {
      throw new Error('User ID là bắt buộc');
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    if (order.userId !== userId) {
      throw new Error('Bạn không có quyền cập nhật đơn hàng này');
    }

    if (order.status !== 'shipping') {
      throw new Error('Chỉ có thể xác nhận giao hàng khi đơn đang ở trạng thái Đang giao');
    }

    const updated = await this.orderRepository.updateStatus(orderId, 'delivered', {
      deliveredAt: new Date(),
      history: {
        changedBy: 'user',
        note: note ?? undefined
      }
    });

    if (!updated) {
      throw new Error('Không thể cập nhật trạng thái đơn hàng');
    }

    return updated;
  }
}
