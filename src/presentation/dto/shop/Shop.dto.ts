import { ShopEntity } from '../../../domain/entities/Shop.entity';

export interface ShopDTO {
  id: string;
  ownerId: string;
  shopName: string;
  story?: string;
  slug?: string | null;
  isActive: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  submittedAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  reviewMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ShopMapper {
  static toDTO(entity: ShopEntity): ShopDTO {
    return {
      id: entity.id,
      ownerId: entity.ownerId,
      shopName: entity.shopName,
      story: entity.story,
      slug: entity.slug,
      isActive: entity.isActive,
      status: entity.status,
      submittedAt: entity.submittedAt ? entity.submittedAt.toISOString() : null,
      approvedAt: entity.approvedAt ? entity.approvedAt.toISOString() : null,
      approvedBy: entity.approvedBy || null,
      reviewMessage: entity.reviewMessage || null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }
}
