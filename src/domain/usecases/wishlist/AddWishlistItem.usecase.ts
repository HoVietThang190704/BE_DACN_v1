import { IWishlistRepository } from '../../repositories/IWishlistRepository';
import { WishlistEntity } from '../../entities/Wishlist.entity';

export class AddWishlistItemUseCase {
  constructor(private wishlistRepository: IWishlistRepository) {}

  async execute(userId: string, productId: string, note?: string): Promise<WishlistEntity> {
    return await this.wishlistRepository.addItem(userId, productId, note);
  }
}
