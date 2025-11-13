import { ShopEntity } from '../entities/Shop.entity';

export interface IShopRepository {
  create(data: Omit<ShopEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShopEntity>;
  findById(id: string): Promise<ShopEntity | null>;
  findByOwnerId(ownerId: string): Promise<ShopEntity | null>;
  findAll(filter?: Record<string, unknown>): Promise<ShopEntity[]>;
  update(id: string, data: Partial<ShopEntity>): Promise<ShopEntity | null>;
  delete(id: string): Promise<boolean>;
  hardDelete?(id: string): Promise<boolean>;
  slugExists?(slug: string, excludeId?: string): Promise<boolean>;
  setStatus?(id: string, status: 'pending' | 'approved' | 'rejected', reviewerId?: string, reviewMessage?: string): Promise<ShopEntity | null>;
  findPending?(limit?: number, offset?: number): Promise<ShopEntity[]>;
}
