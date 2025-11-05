import { ICartRepository, AddCartItemDTO } from '../../repositories/ICartRepository';
import { CartEntity } from '../../entities/Cart.entity';

export class AddCartItemUseCase {
  constructor(private cartRepository: ICartRepository) {}

  async execute(userId: string, item: AddCartItemDTO): Promise<CartEntity> {
    // in a real app you may want to check product existence / stock here
    const cart = await this.cartRepository.addItem(userId, item);
    return cart;
  }
}
