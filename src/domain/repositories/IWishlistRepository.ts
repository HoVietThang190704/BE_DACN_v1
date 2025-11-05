import { WishlistEntity } from '../entities/Wishlist.entity';

export interface IWishlistRepository {
  findByUserId(userId: string): Promise<WishlistEntity | null>;
  create(userId: string): Promise<WishlistEntity>;
  addItem(userId: string, productId: string, note?: string): Promise<WishlistEntity>;
  removeItem(userId: string, productId: string): Promise<WishlistEntity | null>;
  clear(userId: string): Promise<boolean>;
  toggleItem(userId: string, productId: string): Promise<WishlistEntity>;
}
