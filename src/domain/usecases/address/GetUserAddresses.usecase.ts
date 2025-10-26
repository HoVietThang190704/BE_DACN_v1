import { IAddressRepository } from '../../repositories/IAddressRepository';
import { AddressEntity } from '../../entities/Address.entity';

/**
 * Use Case: Get User Addresses
 */
export class GetUserAddressesUseCase {
  constructor(private addressRepository: IAddressRepository) {}

  async execute(userId: string): Promise<AddressEntity[]> {
    return await this.addressRepository.findByUserId(userId);
  }
}
