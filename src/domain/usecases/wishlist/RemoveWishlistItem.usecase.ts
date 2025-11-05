import { IWishlistRepository } from '../../repositories/IWishlistRepository';
import { WishlistEntity } from '../../entities/Wishlist.entity';

export class RemoveWishlistItemUseCase {
  constructor(private wishlistRepository: IWishlistRepository) {}

  async execute(userId: string, productId: string): Promise<WishlistEntity | null> {
    return await this.wishlistRepository.removeItem(userId, productId);
  }
}
