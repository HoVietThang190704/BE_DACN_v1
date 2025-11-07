import { ShopRepository } from '../../../data/repositories/ShopRepository';
import { UserRepository } from '../../../data/repositories/UserRepository';

export class ApproveShopUseCase {
  constructor(private shopRepository: ShopRepository, private userRepository: UserRepository) {}

  async execute(shopId: string, reviewerId: string, reviewMessage?: string) {
    // set shop status to approved
  const shop = await this.shopRepository.setStatus(shopId, 'approved', reviewerId, reviewMessage);
    if (!shop) return null;

    // promote owner to shop_owner if currently customer
    try {
      const ownerId = shop.ownerId;
      const owner = await this.userRepository.findById(ownerId);
      if (owner && (owner as any).role === 'customer') {
        await this.userRepository.update(ownerId, { role: 'shop_owner' } as any);
      }
    } catch (err) {
      // Log and continue
      // repository should handle logging
    }

    return shop;
  }
}
