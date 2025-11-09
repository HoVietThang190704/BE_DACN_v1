import { IOrderRepository } from '../../repositories/IOrderRepository';
import { OrderEntity } from '../../entities/Order.entity';

export interface UpdatePaymentStatusUseCaseRequest {
  orderId: string;
  paymentStatus: string;
}

export class UpdatePaymentStatusUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(request: UpdatePaymentStatusUseCaseRequest): Promise<OrderEntity> {
    const { orderId, paymentStatus } = request;

    const updatedOrder = await this.orderRepository.updatePaymentStatus(orderId, paymentStatus);

    if (!updatedOrder) {
      throw new Error('Order not found');
    }

    return updatedOrder;
  }
}