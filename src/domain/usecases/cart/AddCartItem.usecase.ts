import { ICartRepository, AddCartItemDTO } from '../../repositories/ICartRepository';
import { IProductRepository } from '../../repositories/IProductRepository';
import { CartEntity } from '../../entities/Cart.entity';

export class AddCartItemUseCase {
  constructor(
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(userId: string, item: AddCartItemDTO): Promise<CartEntity> {
    // Check product existence and stock
    const product = await this.productRepository.findById(item.productId);
    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }

    if (!product.inStock || product.stockQuantity <= 0) {
      throw new Error('Sản phẩm đã hết hàng');
    }

    // Check if adding this quantity would exceed available stock
    // First, get current cart to see existing quantity of this product
    const currentCart = await this.cartRepository.findByUserId(userId);
    let existingQuantity = 0;
    if (currentCart && currentCart.items) {
      const existingItem = currentCart.items.find(cartItem => cartItem.productId === item.productId);
      if (existingItem) {
        existingQuantity = existingItem.quantity || 0;
      }
    }

    const totalQuantity = existingQuantity + item.quantity;
    if (totalQuantity > product.stockQuantity) {
      throw new Error(`Không thể thêm sản phẩm. Chỉ còn ${product.stockQuantity} sản phẩm trong kho`);
    }

    const cart = await this.cartRepository.addItem(userId, item);

    // Populate stock for all items in the cart
    for (const cartItem of cart.items) {
      try {
        const itemProduct = await this.productRepository.findById(cartItem.productId);
        if (itemProduct) {
          cartItem.attrs = {
            ...cartItem.attrs,
            stock: itemProduct.stockQuantity
          };
        }
      } catch (error) {
        console.warn(`Could not fetch stock for product ${cartItem.productId}:`, error);
      }
    }

    return cart;
  }
}
