import { OrderEntity, OrderStatus } from '../../entities/Order.entity';
import { IOrderRepository, OrderStatusUpdateOptions } from '../../repositories/IOrderRepository';

interface UpdateOrderStatusRequest {
  orderId: string;
  managerId: string;
  status: OrderStatus;
  trackingNumber?: string | null;
  estimatedDelivery?: Date | string | null;
  note?: string | null;
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipping', 'cancelled'],
  shipping: ['delivered', 'refunded'],
  delivered: [],
  cancelled: [],
  refunded: []
};

export class UpdateOrderStatusUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(request: UpdateOrderStatusRequest): Promise<OrderEntity> {
  const { orderId, managerId, status, trackingNumber, estimatedDelivery, note } = request;

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
      throw new Error('Bạn không có quyền cập nhật đơn hàng này');
    }

    if (order.status === status) {
      return order;
    }

    const allowedStatuses = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Không thể chuyển trạng thái đơn hàng từ "${order.status}" sang "${status}"`);
    }

    const updateOptions: OrderStatusUpdateOptions = {
      history: {
        changedBy: 'manager',
        note: note ?? undefined
      }
    };

    if (trackingNumber !== undefined) {
      updateOptions.trackingNumber = trackingNumber;
    }

    if (note !== undefined) {
      updateOptions.note = note;
    }

    if (estimatedDelivery !== undefined) {
      const deliveryDate = typeof estimatedDelivery === 'string'
        ? new Date(estimatedDelivery)
        : estimatedDelivery;
  updateOptions.estimatedDelivery = deliveryDate ?? null;
    }

    if (status === 'delivered') {
      updateOptions.deliveredAt = new Date();
    }

    const updated = await this.orderRepository.updateStatus(orderId, status, updateOptions);
    if (!updated) {
      throw new Error('Không thể cập nhật trạng thái đơn hàng');
    }

    return updated;
  }
}
