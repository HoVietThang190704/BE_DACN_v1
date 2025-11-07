import { ShopRepository } from '../../../data/repositories/ShopRepository';

export class RejectShopUseCase {
  constructor(private shopRepository: ShopRepository) {}

  async execute(shopId: string, reviewerId: string, reviewMessage?: string) {
    const shop = await this.shopRepository.setStatus(shopId, 'rejected', reviewerId, reviewMessage);
    return shop;
  }
}
