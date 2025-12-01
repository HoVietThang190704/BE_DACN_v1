import { IRegisterShopOwnerRepository } from '../../repositories/IRegisterShopOwnerRepository';
import { RegisterShopOwnerRequestEntity } from '../../entities/RegisterShopOwnerRequest.entity';

export class GetMyRegisterShopOwnerRequestUseCase {
  constructor(private registerRepo: IRegisterShopOwnerRepository) {}

  async execute(userId: string): Promise<RegisterShopOwnerRequestEntity | null> {
    if (!userId) {
      throw new Error('UserId is required');
    }

    return this.registerRepo.findLatestByUserId(userId);
  }
}
