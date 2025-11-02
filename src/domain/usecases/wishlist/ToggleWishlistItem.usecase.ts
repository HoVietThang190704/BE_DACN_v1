import { IWishlistRepository } from '../../repositories/IWishlistRepository';
import { WishlistEntity } from '../../entities/Wishlist.entity';

export class ToggleWishlistItemUseCase {
  constructor(private wishlistRepository: IWishlistRepository) {}

  async execute(userId: string, productId: string): Promise<WishlistEntity> {
    return await this.wishlistRepository.toggleItem(userId, productId);
  }
}
