import { AddressEntity } from '../../../domain/entities/Address.entity';

/**
 * Address DTO - Data Transfer Object
 */

export interface AddressDTO {
  id: string;
  recipientName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  fullAddress: string;
  isDefault: boolean;
  label?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export class AddressMapper {
  /**
   * Map Entity to DTO
   */
  static toDTO(entity: AddressEntity): AddressDTO {
    return {
      id: entity.id,
      recipientName: entity.recipientName,
      phone: entity.phone,
      address: entity.address,
      ward: entity.ward,
      district: entity.district,
      province: entity.province,
      fullAddress: entity.getFullAddress(),
      isDefault: entity.isDefault,
      label: entity.label,
      note: entity.note,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /**
   * Map array of Entities to array of DTOs
   */
  static toArrayDTO(entities: AddressEntity[]): AddressDTO[] {
    return entities.map(e => this.toDTO(e));
  }
}
