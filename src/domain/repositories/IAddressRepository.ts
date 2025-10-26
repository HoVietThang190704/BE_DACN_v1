import { AddressEntity, IAddressEntity } from '../entities/Address.entity';

/**
 * Address Repository Interface
 */

export interface IAddressRepository {
  /**
   * Find address by ID
   */
  findById(id: string): Promise<AddressEntity | null>;

  /**
   * Find all addresses of a user
   */
  findByUserId(userId: string): Promise<AddressEntity[]>;

  /**
   * Get default address of a user
   */
  getDefaultAddress(userId: string): Promise<AddressEntity | null>;

  /**
   * Create new address
   */
  create(address: Omit<IAddressEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AddressEntity>;

  /**
   * Update address
   */
  update(id: string, userId: string, data: Partial<AddressEntity>): Promise<AddressEntity | null>;

  /**
   * Delete address
   */
  delete(id: string, userId: string): Promise<boolean>;

  /**
   * Set address as default
   */
  setDefault(id: string, userId: string): Promise<AddressEntity | null>;

  /**
   * Count addresses of a user
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Check if address belongs to user
   */
  belongsToUser(id: string, userId: string): Promise<boolean>;
}
