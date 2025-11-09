import { ICartRepository, UpdateCartItemDTO } from '../../repositories/ICartRepository';
import { IProductRepository } from '../../repositories/IProductRepository';
import { CartEntity } from '../../entities/Cart.entity';

export class UpdateCartItemUseCase {
  constructor(
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(userId: string, itemId: string, payload: UpdateCartItemDTO): Promise<CartEntity | null> {
    // Check stock if quantity is being updated
    if (payload.quantity !== undefined) {
      // Get current cart item to find productId
      const currentCart = await this.cartRepository.findByUserId(userId);
      if (!currentCart) {
        throw new Error('Giỏ hàng không tồn tại');
      }

      const cartItem = currentCart.items?.find(item => item.id === itemId);
      if (!cartItem) {
        throw new Error('Sản phẩm không tồn tại trong giỏ hàng');
      }

      // Check product stock
      const product = await this.productRepository.findById(cartItem.productId);
      if (!product) {
        throw new Error('Sản phẩm không tồn tại');
      }

      if (!product.inStock || product.stockQuantity <= 0) {
        throw new Error('Sản phẩm đã hết hàng');
      }

      if (payload.quantity > product.stockQuantity) {
        throw new Error(`Không thể cập nhật số lượng. Chỉ còn ${product.stockQuantity} sản phẩm trong kho`);
      }
    }

    const cart = await this.cartRepository.updateItem(userId, itemId, payload);
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
