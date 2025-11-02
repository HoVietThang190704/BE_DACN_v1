import { ICartRepository } from '../../repositories/ICartRepository';
import { CartEntity } from '../../entities/Cart.entity';

export class GetCartUseCase {
  constructor(private cartRepository: ICartRepository) {}

  async execute(userId: string): Promise<CartEntity> {
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }
    return cart;
  }
}
