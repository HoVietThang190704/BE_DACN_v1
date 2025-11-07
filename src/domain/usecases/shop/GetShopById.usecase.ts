import { ShopRepository } from '../../../data/repositories/ShopRepository';
import { ShopEntity } from '../../entities/Shop.entity';

export class GetShopByIdUseCase {
  constructor(private shopRepository: ShopRepository) {}

  async execute(id: string): Promise<ShopEntity | null> {
    return await this.shopRepository.findById(id);
  }
}
