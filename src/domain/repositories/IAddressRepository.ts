import { AddressEntity, IAddressEntity } from '../entities/Address.entity';

export interface IAddressRepository {
  findById(id: string): Promise<AddressEntity | null>;

  findByUserId(userId: string): Promise<AddressEntity[]>;

  getDefaultAddress(userId: string): Promise<AddressEntity | null>;

  create(address: Omit<IAddressEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AddressEntity>;

  update(id: string, userId: string, data: Partial<AddressEntity>): Promise<AddressEntity | null>;

  delete(id: string, userId: string): Promise<boolean>;

  setDefault(id: string, userId: string): Promise<AddressEntity | null>;

  countByUserId(userId: string): Promise<number>;

  belongsToUser(id: string, userId: string): Promise<boolean>;
}
