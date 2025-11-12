import { IOrderRepository, OrderFilters, OrderPagination, PaginatedOrders } from '../../repositories/IOrderRepository';

export class GetManagedOrdersUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(
    managerId: string,
    filters?: OrderFilters,
    pagination?: OrderPagination
  ): Promise<PaginatedOrders> {
    if (!managerId) {
      throw new Error('Người quản lý đơn hàng là bắt buộc');
    }

    return this.orderRepository.findManagedByUser(managerId, filters, pagination);
  }
}
