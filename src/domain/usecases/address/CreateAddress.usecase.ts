import { IAddressRepository } from '../../repositories/IAddressRepository';
import { AddressEntity } from '../../entities/Address.entity';

/**
 * Use Case: Create Address
 */
export class CreateAddressUseCase {
  constructor(private addressRepository: IAddressRepository) {}

  async execute(data: {
    userId: string;
    recipientName: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    province: string;
    isDefault?: boolean;
    label?: string;
    note?: string;
  }): Promise<AddressEntity> {
    // Create temporary entity for validation
    const tempEntity = new AddressEntity({
      id: '',
      userId: data.userId,
      recipientName: data.recipientName,
      phone: data.phone,
      address: data.address,
      ward: data.ward,
      district: data.district,
      province: data.province,
      isDefault: data.isDefault || false,
      label: data.label,
      note: data.note,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Validate
    const validation = tempEntity.validate();
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Create
    return await this.addressRepository.create({
      userId: data.userId,
      recipientName: data.recipientName,
      phone: data.phone,
      address: data.address,
      ward: data.ward,
      district: data.district,
      province: data.province,
      isDefault: data.isDefault || false,
      label: data.label,
      note: data.note
    });
  }
}
