import { ICartRepository, UpdateCartItemDTO } from '../../repositories/ICartRepository';
import { CartEntity } from '../../entities/Cart.entity';

export class UpdateCartItemUseCase {
  constructor(private cartRepository: ICartRepository) {}

  async execute(userId: string, itemId: string, payload: UpdateCartItemDTO): Promise<CartEntity | null> {
    // Could add validation like quantity > 0
    const cart = await this.cartRepository.updateItem(userId, itemId, payload);
    return cart;
  }
}
