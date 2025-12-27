import { IAddressRepository } from '../../repositories/IAddressRepository';
import { AddressEntity } from '../../entities/Address.entity';

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
    const belongsToUser = await this.addressRepository.belongsToUser(addressId, userId);
    if (!belongsToUser) {
      throw new Error('Không tìm thấy địa chỉ hoặc bạn không có quyền truy cập');
    }

    const updated = await this.addressRepository.update(addressId, userId, data);
    if (!updated) {
      throw new Error('Không thể cập nhật địa chỉ');
    }

    return updated;
  }
}
