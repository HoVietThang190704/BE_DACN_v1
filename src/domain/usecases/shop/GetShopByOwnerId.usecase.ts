import { IShopRepository } from '../../repositories/IShopRepository';
import { ShopEntity } from '../../entities/Shop.entity';

export class GetShopByOwnerIdUseCase {
  constructor(private readonly shopRepository: IShopRepository) {}

  async execute(ownerId: string): Promise<ShopEntity | null> {
    if (!ownerId) {
      throw new Error('Owner ID là bắt buộc');
    }

    return this.shopRepository.findByOwnerId(ownerId);
  }
}
