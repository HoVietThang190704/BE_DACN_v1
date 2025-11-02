import { IWishlistRepository } from '../../domain/repositories/IWishlistRepository';
import { WishlistEntity } from '../../domain/entities/Wishlist.entity';
import { Wishlist } from '../../models/Wishlist';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export class WishlistRepository implements IWishlistRepository {
  private toDomainEntity(model: any): WishlistEntity {
    return new WishlistEntity({
      id: String(model._id),
      userId: String(model.userId),
      items: (model.items || []).map((it: any) => ({
        id: String(it._id),
        productId: String(it.productId),
        addedAt: it.addedAt,
        note: it.note
      })),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  async findByUserId(userId: string): Promise<WishlistEntity | null> {
    try {
      const w = await Wishlist.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
      return w ? this.toDomainEntity(w) : null;
    } catch (error) {
      logger.error('WishlistRepository.findByUserId error:', error);
      throw new Error('Lỗi khi lấy wishlist');
    }
  }

  async create(userId: string): Promise<WishlistEntity> {
    try {
      const newW = await Wishlist.create({ userId: new mongoose.Types.ObjectId(userId), items: [] });
      return this.toDomainEntity(newW);
    } catch (error) {
      logger.error('WishlistRepository.create error:', error);
      throw new Error('Lỗi khi tạo wishlist');
    }
  }

  async addItem(userId: string, productId: string, note?: string): Promise<WishlistEntity> {
    try {
      const updated = await Wishlist.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
          $addToSet: {
            items: {
              productId: new mongoose.Types.ObjectId(productId),
              addedAt: new Date(),
              note: note
            }
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();

      if (!updated) throw new Error('Lỗi khi thêm vào wishlist');
      return this.toDomainEntity(updated as any);
    } catch (error) {
      logger.error('WishlistRepository.addItem error:', error);
      throw new Error('Lỗi khi thêm vào wishlist');
    }
  }

  async removeItem(userId: string, productId: string): Promise<WishlistEntity | null> {
    try {
      const updated = await Wishlist.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $pull: { items: { productId: new mongoose.Types.ObjectId(productId) } } },
        { new: true }
      ).lean();

      return updated ? this.toDomainEntity(updated as any) : null;
    } catch (error) {
      logger.error('WishlistRepository.removeItem error:', error);
      throw new Error('Lỗi khi xóa khỏi wishlist');
    }
  }

  async clear(userId: string): Promise<boolean> {
    try {
      await Wishlist.findOneAndUpdate({ userId: new mongoose.Types.ObjectId(userId) }, { $set: { items: [] } });
      return true;
    } catch (error) {
      logger.error('WishlistRepository.clear error:', error);
      return false;
    }
  }

  async toggleItem(userId: string, productId: string): Promise<WishlistEntity> {
    const session = await mongoose.startSession();
    let result: any = null;
    try {
      await session.withTransaction(async () => {
        const userObj = new mongoose.Types.ObjectId(userId);
        const productObj = new mongoose.Types.ObjectId(productId);

        const w = await Wishlist.findOne({ userId: userObj }).session(session);
        if (w && w.items && w.items.some((it: any) => String(it.productId) === String(productObj))) {
          // exists -> remove
          const removed = await Wishlist.findOneAndUpdate(
            { userId: userObj },
            { $pull: { items: { productId: productObj } } },
            { new: true, session }
          ).lean();
          result = removed;
        } else {
          const added = await Wishlist.findOneAndUpdate(
            { userId: userObj },
            { $addToSet: { items: { productId: productObj, addedAt: new Date() } } },
            { new: true, upsert: true, setDefaultsOnInsert: true, session }
          ).lean();
          result = added;
        }
      });

      if (!result) throw new Error('Lỗi khi toggle wishlist');
      return this.toDomainEntity(result as any);
    } catch (error) {
      logger.error('WishlistRepository.toggleItem error:', error);
      throw new Error('Lỗi khi toggle wishlist');
    } finally {
      session.endSession();
    }
  }
}
