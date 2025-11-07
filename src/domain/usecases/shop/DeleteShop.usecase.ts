import { ShopRepository } from '../../../data/repositories/ShopRepository';

export class DeleteShopUseCase {
  constructor(private shopRepository: ShopRepository) {}

  async execute(id: string): Promise<void> {
    await this.shopRepository.delete(id);
  }

  async hardDelete(id: string): Promise<void> {
    await this.shopRepository.hardDelete(id);
  }
}
