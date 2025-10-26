import { IAddressRepository } from '../../repositories/IAddressRepository';
import { AddressEntity } from '../../entities/Address.entity';

/**
 * Use Case: Set Default Address
 */
export class SetDefaultAddressUseCase {
  constructor(private addressRepository: IAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<AddressEntity> {
    // Check if address belongs to user
    const belongsToUser = await this.addressRepository.belongsToUser(addressId, userId);
    if (!belongsToUser) {
      throw new Error('Không tìm thấy địa chỉ hoặc bạn không có quyền truy cập');
    }

    // Set as default
    const updated = await this.addressRepository.setDefault(addressId, userId);
    if (!updated) {
      throw new Error('Không thể đặt địa chỉ mặc định');
    }

    return updated;
  }
}
