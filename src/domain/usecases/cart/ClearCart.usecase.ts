import { ICartRepository } from '../../repositories/ICartRepository';

export class ClearCartUseCase {
  constructor(private cartRepository: ICartRepository) {}

  async execute(userId: string): Promise<boolean> {
    return await this.cartRepository.clearCart(userId);
  }
}
