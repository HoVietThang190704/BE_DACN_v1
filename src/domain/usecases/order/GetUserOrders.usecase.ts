import { IOrderRepository, OrderFilters, OrderPagination, PaginatedOrders } from '../../repositories/IOrderRepository';

/**
 * Use Case: Get User Orders
 */
export class GetUserOrdersUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(
    userId: string,
    filters?: OrderFilters,
    pagination?: OrderPagination
  ): Promise<PaginatedOrders> {
    return await this.orderRepository.findByUserId(userId, filters, pagination);
  }
}
