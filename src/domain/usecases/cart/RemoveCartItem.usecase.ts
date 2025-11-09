import { ICartRepository } from '../../repositories/ICartRepository';
import { IProductRepository } from '../../repositories/IProductRepository';
import { CartEntity } from '../../entities/Cart.entity';

export class RemoveCartItemUseCase {
  constructor(
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(userId: string, itemId: string): Promise<CartEntity | null> {
    const cart = await this.cartRepository.removeItem(userId, itemId);
    if (!cart) return null;

    // Populate stock for all items in the cart
    for (const cartItem of cart.items) {
      try {
        const product = await this.productRepository.findById(cartItem.productId);
        if (product) {
          cartItem.attrs = {
            ...cartItem.attrs,
            stock: product.stockQuantity
          };
        }
      } catch (error) {
        console.warn(`Could not fetch stock for product ${cartItem.productId}:`, error);
      }
    }

    return cart;
  }
}
