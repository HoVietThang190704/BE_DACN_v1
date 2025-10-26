import { IAddressRepository } from '../../repositories/IAddressRepository';
import { AddressEntity } from '../../entities/Address.entity';

/**
 * Use Case: Update Address
 */
export class UpdateAddressUseCase {
  constructor(private addressRepository: IAddressRepository) {}

  async execute(
    addressId: string,
    userId: string,
    data: {
      recipientName?: string;
      phone?: string;
      address?: string;
      ward?: string;
      district?: string;
      province?: string;
      label?: string;
      note?: string;
    }
  ): Promise<AddressEntity> {
    // Check if address belongs to user
    const belongsToUser = await this.addressRepository.belongsToUser(addressId, userId);
    if (!belongsToUser) {
      throw new Error('Không tìm thấy địa chỉ hoặc bạn không có quyền truy cập');
    }

    // Update
    const updated = await this.addressRepository.update(addressId, userId, data);
    if (!updated) {
      throw new Error('Không thể cập nhật địa chỉ');
    }

    return updated;
  }
}
