import { IVoucherRepository, VoucherFilter } from '../../repositories/IVoucherRepository';

export class ListUserVouchersUseCase {
  constructor(private readonly voucherRepository: IVoucherRepository) {}

  async execute(userId: string, filter?: VoucherFilter) {
    return this.voucherRepository.findAvailableForUser(userId, {
      ...filter,
      userId,
      onlyActive: filter?.onlyActive ?? true,
    });
  }
}
