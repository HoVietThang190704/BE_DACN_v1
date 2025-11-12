import { Shop } from '../../models/Shop';
import { ShopEntity } from '../../domain/entities/Shop.entity';
import { IShopRepository } from '../../domain/repositories/IShopRepository';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export class ShopRepository implements IShopRepository {
  private toDomain(model: any): ShopEntity {
    return new ShopEntity({
      id: String(model._id),
      ownerId: String(model.owner_id),
      shopName: model.shop_name,
      story: model.story,
      slug: model.slug,
      isActive: model.isActive,
      status: model.status,
      submittedAt: model.submittedAt,
      approvedAt: model.approvedAt,
      approvedBy: model.approvedBy ? String(model.approvedBy) : null,
      reviewMessage: model.reviewMessage,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  async create(data: Omit<ShopEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShopEntity> {
    try {
      const doc = await Shop.create({
        owner_id: new mongoose.Types.ObjectId(data.ownerId),
        shop_name: data.shopName,
        story: data.story,
        slug: data.slug || null,
        isActive: data.isActive,
        status: (data as any).status || 'approved',
        submittedAt: (data as any).submittedAt || null,
        approvedAt: (data as any).approvedAt || null,
        approvedBy: (data as any).approvedBy || null,
        reviewMessage: (data as any).reviewMessage || null
      });
      return this.toDomain(doc);
    } catch (error) {
      logger.error('ShopRepository.create error:', error);
      throw new Error('Lỗi khi tạo shop');
    }
  }

  async findById(id: string): Promise<ShopEntity | null> {
    try {
      const doc = await Shop.findById(id).lean();
      return doc ? this.toDomain(doc) : null;
    } catch (error) {
      logger.error('ShopRepository.findById error:', error);
      throw new Error('Lỗi khi tìm shop');
    }
  }

  async findByOwnerId(ownerId: string): Promise<ShopEntity | null> {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(ownerId);

      const orFilters: any[] = [];
      if (isObjectId) {
        const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
        orFilters.push({ owner_id: ownerObjectId });
        orFilters.push({ ownerId: ownerObjectId });
      }

      orFilters.push({ owner_id: ownerId });
      orFilters.push({ ownerId: ownerId });

      const doc = await Shop.findOne({ $or: orFilters }).lean();
      return doc ? this.toDomain(doc) : null;
    } catch (error) {
      logger.error('ShopRepository.findByOwnerId error:', error);
      throw new Error('Lỗi khi tìm shop theo chủ sở hữu');
    }
  }

  async findAll(filter: any = {}): Promise<ShopEntity[]> {
    try {
      const docs = await Shop.find(filter).sort({ createdAt: -1 }).lean();
      return docs.map(d => this.toDomain(d));
    } catch (error) {
      logger.error('ShopRepository.findAll error:', error);
      throw new Error('Lỗi khi lấy danh sách shop');
    }
  }

  async findPending(limit: number = 50, offset: number = 0): Promise<ShopEntity[]> {
    try {
      const docs = await Shop.find({ status: 'pending' }).sort({ submittedAt: -1 }).skip(offset).limit(limit).lean();
      return docs.map(d => this.toDomain(d));
    } catch (error) {
      logger.error('ShopRepository.findPending error:', error);
      throw new Error('Lỗi khi lấy danh sách shop chờ duyệt');
    }
  }

  async setStatus(id: string, status: 'pending' | 'approved' | 'rejected', reviewerId?: string, reviewMessage?: string): Promise<ShopEntity | null> {
    try {
      const update: any = { status };

      if (status === 'pending') {
        update.submittedAt = new Date();
        update.approvedAt = null;
        update.approvedBy = null;
        update.reviewMessage = null;
      } else if (status === 'approved') {
        update.approvedAt = new Date();
        update.approvedBy = reviewerId ? new mongoose.Types.ObjectId(reviewerId) : null;
        update.reviewMessage = reviewMessage || null;
      } else if (status === 'rejected') {
        update.approvedAt = null;
        update.approvedBy = reviewerId ? new mongoose.Types.ObjectId(reviewerId) : null;
        update.reviewMessage = reviewMessage || null;
      }

      const updated = await Shop.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
      return updated ? this.toDomain(updated) : null;
    } catch (error) {
      logger.error('ShopRepository.setStatus error:', error);
      throw new Error('Lỗi khi cập nhật trạng thái shop');
    }
  }

  async update(id: string, data: Partial<ShopEntity>): Promise<ShopEntity | null> {
    try {
      const updateData: any = {};
      if (data.shopName !== undefined) updateData.shop_name = data.shopName;
      if (data.story !== undefined) updateData.story = data.story;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const updated = await Shop.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).lean();
      return updated ? this.toDomain(updated) : null;
    } catch (error) {
      logger.error('ShopRepository.update error:', error);
      throw new Error('Lỗi khi cập nhật shop');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      // soft delete: set isActive = false
      const res = await Shop.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
      return res != null;
    } catch (error) {
      logger.error('ShopRepository.delete error:', error);
      throw new Error('Lỗi khi xóa shop');
    }
  }

  async hardDelete(id: string): Promise<boolean> {
    try {
      const res = await Shop.findByIdAndDelete(id);
      return res != null;
    } catch (error) {
      logger.error('ShopRepository.hardDelete error:', error);
      throw new Error('Lỗi khi xóa vĩnh viễn shop');
    }
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    try {
      if (!slug) return false;
      const filter: any = { slug };
      if (excludeId) {
        filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
      }
      const count = await Shop.countDocuments(filter);
      return count > 0;
    } catch (error) {
      logger.error('ShopRepository.slugExists error:', error);
      return false;
    }
  }
}
