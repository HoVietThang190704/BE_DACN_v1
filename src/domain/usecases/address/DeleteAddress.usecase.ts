import { IAddressRepository } from '../../repositories/IAddressRepository';

/**
 * Use Case: Delete Address
 */
export class DeleteAddressUseCase {
  constructor(private addressRepository: IAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<void> {
    // Check if address belongs to user
    const belongsToUser = await this.addressRepository.belongsToUser(addressId, userId);
    if (!belongsToUser) {
      throw new Error('Không tìm thấy địa chỉ hoặc bạn không có quyền truy cập');
    }

    // Delete
    const deleted = await this.addressRepository.delete(addressId, userId);
    if (!deleted) {
      throw new Error('Không thể xóa địa chỉ');
    }
  }
}
