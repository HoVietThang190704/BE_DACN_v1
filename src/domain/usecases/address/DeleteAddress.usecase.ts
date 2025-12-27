import { IAddressRepository } from '../../repositories/IAddressRepository';

export class DeleteAddressUseCase {
  constructor(private addressRepository: IAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<void> {
    const belongsToUser = await this.addressRepository.belongsToUser(addressId, userId);
    if (!belongsToUser) {
      throw new Error('Không tìm thấy địa chỉ hoặc bạn không có quyền truy cập');
    }

    const deleted = await this.addressRepository.delete(addressId, userId);
    if (!deleted) {
      throw new Error('Không thể xóa địa chỉ');
    }
  }
}
