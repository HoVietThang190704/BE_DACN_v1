import { OrderEntity } from '../../../domain/entities/Order.entity';
import { UserEntity } from '../../../domain/entities/User.entity';
import { OrderDTO, OrderMapper } from './Order.dto';

export interface ManagedOrderDTO extends OrderDTO {
  customer: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
}

export class ManagedOrderMapper {
  static toDTO(order: OrderEntity, customer?: UserEntity): ManagedOrderDTO {
    const base = OrderMapper.toDTO(order);

    return {
      ...base,
      customer: {
        id: customer?.id ?? order.userId,
        name: customer?.userName,
        email: customer?.email,
        phone: customer?.phone
      }
    };
  }
}

export { ManagedOrderDTO as ShopOrderDTO, ManagedOrderMapper as ShopOrderMapper };
