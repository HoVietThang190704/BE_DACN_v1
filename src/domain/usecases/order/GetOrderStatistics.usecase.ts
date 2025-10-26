import { IOrderRepository } from '../../repositories/IOrderRepository';

/**
 * Use Case: Get Order Statistics
 */
export class GetOrderStatisticsUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(userId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    shipping: number;
    delivered: number;
    cancelled: number;
  }> {
    return await this.orderRepository.getOrderStatistics(userId);
  }
}
