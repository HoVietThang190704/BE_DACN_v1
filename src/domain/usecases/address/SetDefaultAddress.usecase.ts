import { IAddressRepository } from '../../repositories/IAddressRepository';
import { AddressEntity } from '../../entities/Address.entity';

export class SetDefaultAddressUseCase {
  constructor(private addressRepository: IAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<AddressEntity> {
    const belongsToUser = await this.addressRepository.belongsToUser(addressId, userId);
    if (!belongsToUser) {
      throw new Error('Không tìm thấy địa chỉ hoặc bạn không có quyền truy cập');
    }

    const updated = await this.addressRepository.setDefault(addressId, userId);
    if (!updated) {
      throw new Error('Không thể đặt địa chỉ mặc định');
    }

    return updated;
  }
}
