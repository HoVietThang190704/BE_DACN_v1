import { ICartRepository } from '../../repositories/ICartRepository';
import { IProductRepository } from '../../repositories/IProductRepository';
import { CartEntity } from '../../entities/Cart.entity';

export class GetCartUseCase {
  constructor(
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(userId: string): Promise<CartEntity> {
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }

    // Populate stock for each cart item
    for (const item of cart.items) {
      try {
        const product = await this.productRepository.findById(item.productId);
        if (product) {
          item.attrs = {
            ...item.attrs,
            stock: product.stockQuantity
          };
        }
      } catch (error) {
        // If product not found or error, continue without stock info
        console.warn(`Could not fetch stock for product ${item.productId}:`, error);
      }
    }

    return cart;
  }
}
