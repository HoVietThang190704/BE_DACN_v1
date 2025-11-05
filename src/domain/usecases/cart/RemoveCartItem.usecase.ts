import { ICartRepository } from '../../repositories/ICartRepository';
import { CartEntity } from '../../entities/Cart.entity';

export class RemoveCartItemUseCase {
  constructor(private cartRepository: ICartRepository) {}

  async execute(userId: string, itemId: string): Promise<CartEntity | null> {
    return await this.cartRepository.removeItem(userId, itemId);
  }
}
