import { ShopRepository } from '../../../data/repositories/ShopRepository';
import { ShopEntity } from '../../entities/Shop.entity';
import { logger } from '../../../shared/utils/logger';
import { IUserRepository } from '../../repositories/IUserRepository';

export type CreateShopDTO = {
  ownerId: string;
  shopName: string;
  story?: string;
  slug?: string | null;
  isActive?: boolean;
};

export class CreateShopUseCase {
  constructor(private shopRepository: ShopRepository, private userRepository?: IUserRepository) {}

  private validate(input: CreateShopDTO) {
    const errors: string[] = [];
    if (!input.ownerId) errors.push('OwnerId không được để trống');
    if (!input.shopName || input.shopName.trim().length === 0) errors.push('Tên shop không được để trống');
    if (input.shopName && input.shopName.trim().length > 150) errors.push('Tên shop quá dài');
    if (input.slug && !/^[a-z0-9-]+$/.test(String(input.slug))) errors.push('Slug chỉ chứa chữ thường, số và dấu gạch ngang');
    if (errors.length) throw new Error(errors.join(', '));
  }

  async execute(input: CreateShopDTO): Promise<ShopEntity> {
    this.validate(input);

    if (input.slug) {
      const slugExists = await this.shopRepository.slugExists(input.slug);
      if (slugExists) throw new Error('Slug đã tồn tại');
    }

    // Determine creator's role to decide approval flow
    let ownerRole: string | null = null;
    if (this.userRepository) {
      const owner = await this.userRepository.findById(input.ownerId);
      ownerRole = owner ? (owner as any).role : null;
    }

    const isCustomer = ownerRole === 'customer';

    const data: any = {
      ownerId: input.ownerId,
      shopName: input.shopName.trim(),
      story: input.story || '',
      slug: input.slug || null,
      isActive: input.isActive ?? true,
      // default approval: if customer -> pending; otherwise auto-approved
      status: isCustomer ? 'pending' : 'approved',
      submittedAt: isCustomer ? new Date() : new Date(),
      approvedAt: isCustomer ? null : new Date(),
      approvedBy: isCustomer ? null : null,
      reviewMessage: null,
      id: '' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: (() => ({})) as any
    };

    const shop = await this.shopRepository.create(data as any);
    logger.info(`Shop created: ${shop.id} - ${shop.shopName} (status=${(shop as any).status})`);

    // If the shop is auto-approved and owner was a customer (rare), promote; normally customer-created are pending
    try {
      if (!isCustomer && this.userRepository) {
        const owner = await this.userRepository.findById(input.ownerId);
        if (owner && (owner as any).role === 'customer') {
          await this.userRepository.update(input.ownerId, { role: 'shop_owner' } as any);
          logger.info(`User promoted to shop_owner: ${input.ownerId}`);
        }
      }
    } catch (err) {
      logger.error('Failed to promote user to shop_owner after shop creation', err);
    }

    return shop;
  }
}
