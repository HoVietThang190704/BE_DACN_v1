import { ShopRepository } from '../../../data/repositories/ShopRepository';
import { ShopEntity } from '../../entities/Shop.entity';

export class FindPendingShopsUseCase {
  constructor(private shopRepository: ShopRepository) {}

  async execute(limit: number = 50, offset: number = 0): Promise<ShopEntity[]> {
    return this.shopRepository.findPending(limit, offset);
  }
}
