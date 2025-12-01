import { IRegisterShopOwnerRepository, IListRegisterShopOwnerFilter } from '../../repositories/IRegisterShopOwnerRepository';
import { RegisterShopOwnerRequestEntity } from '../../entities/RegisterShopOwnerRequest.entity';

export class ListRegisterShopOwnerRequestsUseCase {
  constructor(private registerRepo: IRegisterShopOwnerRepository) {}

  async execute(params: IListRegisterShopOwnerFilter = {}): Promise<{
    data: RegisterShopOwnerRequestEntity[];
    total: number;
    limit?: number;
    offset?: number;
  }> {
    const [data, total] = await Promise.all([
      this.registerRepo.findAll(params),
      this.registerRepo.count({ status: params.status, userId: params.userId })
    ]);

    return {
      data,
      total,
      limit: params.limit,
      offset: params.offset
    };
  }
}
