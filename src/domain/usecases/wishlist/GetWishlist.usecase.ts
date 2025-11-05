import { IWishlistRepository } from '../../repositories/IWishlistRepository';
import { WishlistEntity } from '../../entities/Wishlist.entity';

export class GetWishlistUseCase {
  constructor(private wishlistRepository: IWishlistRepository) {}

  async execute(userId: string): Promise<WishlistEntity> {
    let w = await this.wishlistRepository.findByUserId(userId);
    if (!w) w = await this.wishlistRepository.create(userId);
    return w;
  }
}
