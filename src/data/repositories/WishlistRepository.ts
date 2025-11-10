import { IWishlistRepository } from '../../domain/repositories/IWishlistRepository';
import { WishlistEntity, WishlistItemEntity, WishlistProductEntity } from '../../domain/entities/Wishlist.entity';
import { Wishlist } from '../../models/Wishlist';
import { Product } from '../../models/Product';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export class WishlistRepository implements IWishlistRepository {
  private toObjectId(id: string, label: string): mongoose.Types.ObjectId {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`${label} ID không hợp lệ`);
    }
    return new mongoose.Types.ObjectId(id);
  }

  private normalizeId(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value instanceof mongoose.Types.ObjectId) return value.toString();
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if (obj._id) {
        return this.normalizeId(obj._id);
      }
      if (obj.id) {
        return this.normalizeId(obj.id);
      }
    }
    return String(value);
  }

  private mapProduct(raw: any): WishlistProductEntity | undefined {
    if (!raw || typeof raw !== 'object') {
      return undefined;
    }

    const id = this.normalizeId(raw);
    if (!id) {
      return undefined;
    }

    const images = Array.isArray(raw.images)
      ? raw.images.filter((img: unknown): img is string => typeof img === 'string' && img.length > 0)
      : [];

    const image = typeof raw.image === 'string' && raw.image.length > 0 ? raw.image : images[0];

    return {
      id,
      name: raw.name,
      price: raw.price,
      image,
      images,
      unit: raw.unit,
      stock: typeof raw.stock === 'number' ? raw.stock : raw.stockQuantity,
      stockQuantity: raw.stockQuantity,
      inStock: raw.inStock,
      rating: raw.rating,
      reviewCount: raw.reviewCount,
      originalPrice: raw.originalPrice,
      discount: raw.discount,
      owner: raw.owner ? {
        id: this.normalizeId(raw.owner._id || raw.owner.id || raw.owner),
        userName: raw.owner.userName,
        email: raw.owner.email
      } : undefined
    };
  }

  private mapItems(items: any[] | undefined): WishlistItemEntity[] {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => {
      const productId = this.normalizeId(item.productId);
      // prefer an explicit attached product snapshot (item.product) if available
      const rawProduct = item.product ?? item.productId;
      const itemId = this.normalizeId(item._id ?? item.id) || productId;
      return {
        id: itemId,
        productId,
        addedAt: item.addedAt,
        note: item.note,
        product: this.mapProduct(rawProduct)
      };
    });
  }

  private toDomainEntity(model: any): WishlistEntity {
    return new WishlistEntity({
      id: this.normalizeId(model._id),
      userId: this.normalizeId(model.userId),
      items: this.mapItems(model.items),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  async findByUserId(userId: string): Promise<WishlistEntity | null> {
    try {
      const userObj = this.toObjectId(userId, 'User');
      // initially try to populate product references
      const wishlistDoc = await Wishlist.findOne({ userId: userObj })
        .populate({
          path: 'items.productId',
          select: 'name price images image unit stockQuantity stock inStock rating reviewCount originalPrice discount owner',
          populate: {
            path: 'owner',
            select: 'userName email'
          }
        })
        .lean();

      if (!wishlistDoc) return null;

      // If some items still only have ObjectId for productId (populate may not have run or product missing),
      // fetch product snapshots and attach them into `items.product` so the frontend always receives product data.
      const items = Array.isArray(wishlistDoc.items) ? wishlistDoc.items : [];
      const missingIds: string[] = [];

      items.forEach((it: any) => {
        const pid = it?.productId;
        // if productId is a plain object and has a name, assume populated
        if (!pid) return;
        const isPopulated = typeof pid === 'object' && ('name' in pid || 'images' in pid || 'price' in pid);
        if (!isPopulated) {
          // normalize and collect id string
          const normalized = this.normalizeId(pid);
          if (normalized) missingIds.push(normalized);
        }
      });

      if (missingIds.length > 0) {
        // fetch product docs in one go
        const products = await Product.find({ _id: { $in: missingIds } })
          .select('name price images image unit stockQuantity stock inStock rating reviewCount originalPrice discount owner')
          .populate('owner', 'userName email')
          .lean();

        const productMap = new Map<string, any>();
        products.forEach((p: any) => productMap.set(this.normalizeId(p._id), p));

        // attach snapshot to each item as `product`
        items.forEach((it: any) => {
          const pid = it?.productId;
          const id = this.normalizeId(pid);
          const prod = productMap.get(id);
          if (prod) {
            it.product = prod;
          } else if (typeof pid === 'object' && ('name' in pid || 'images' in pid || 'price' in pid)) {
            // already populated object
            it.product = pid;
          } else {
            it.product = undefined;
          }
        });
      } else {
        // all items were populated — map `productId` object into `product` field for consistency
        items.forEach((it: any) => {
          const pid = it?.productId;
          if (pid && typeof pid === 'object') {
            it.product = pid;
          }
        });
      }

      return this.toDomainEntity(wishlistDoc);
    } catch (error) {
      logger.error('WishlistRepository.findByUserId error:', error);
      throw new Error('Lỗi khi lấy wishlist');
    }
  }

  async create(userId: string): Promise<WishlistEntity> {
    try {
      const userObj = this.toObjectId(userId, 'User');
      await Wishlist.create({ userId: userObj, items: [] });
      const wishlist = await this.findByUserId(userId);
      if (!wishlist) {
        throw new Error('Không thể tạo wishlist');
      }
      return wishlist;
    } catch (error) {
      logger.error('WishlistRepository.create error:', error);
      throw new Error(error instanceof Error ? error.message : 'Lỗi khi tạo wishlist');
    }
  }

  async addItem(userId: string, productId: string, note?: string): Promise<WishlistEntity> {
    try {
      const userObj = this.toObjectId(userId, 'User');
      const productObj = this.toObjectId(productId, 'Product');

      await Wishlist.findOneAndUpdate(
        { userId: userObj },
        {
          $addToSet: {
            items: {
              productId: productObj,
              addedAt: new Date(),
              note: note
            }
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      const wishlist = await this.findByUserId(userId);
      if (!wishlist) throw new Error('Lỗi khi thêm vào wishlist');
      return wishlist;
    } catch (error) {
      logger.error('WishlistRepository.addItem error:', error);
      throw new Error(error instanceof Error ? error.message : 'Lỗi khi thêm vào wishlist');
    }
  }

  async removeItem(userId: string, productId: string): Promise<WishlistEntity | null> {
    try {
      const userObj = this.toObjectId(userId, 'User');
      const productObj = this.toObjectId(productId, 'Product');

      const updated = await Wishlist.findOneAndUpdate(
        { userId: userObj },
        { $pull: { items: { productId: productObj } } },
        { new: true }
      );

      if (!updated) {
        return null;
      }

      const wishlist = await this.findByUserId(userId);
      return wishlist ?? null;
    } catch (error) {
      logger.error('WishlistRepository.removeItem error:', error);
      throw new Error(error instanceof Error ? error.message : 'Lỗi khi xóa khỏi wishlist');
    }
  }

  async clear(userId: string): Promise<boolean> {
    try {
      const userObj = this.toObjectId(userId, 'User');
      await Wishlist.findOneAndUpdate({ userId: userObj }, { $set: { items: [] } });
      return true;
    } catch (error) {
      logger.error('WishlistRepository.clear error:', error);
      return false;
    }
  }

  async toggleItem(userId: string, productId: string): Promise<WishlistEntity> {
    const session = await mongoose.startSession();
    try {
      const userObj = this.toObjectId(userId, 'User');
      const productObj = this.toObjectId(productId, 'Product');

      await session.withTransaction(async () => {
        const wishlist = await Wishlist.findOne({ userId: userObj }).session(session);
        if (wishlist && wishlist.items && wishlist.items.some((it: any) => String(it.productId) === String(productObj))) {
          // exists -> remove
          await Wishlist.findOneAndUpdate(
            { userId: userObj },
            { $pull: { items: { productId: productObj } } },
            { new: true, session }
          );
        } else {
          await Wishlist.findOneAndUpdate(
            { userId: userObj },
            { $addToSet: { items: { productId: productObj, addedAt: new Date() } } },
            { new: true, upsert: true, setDefaultsOnInsert: true, session }
          );
        }
      });

      const wishlist = await this.findByUserId(userId);
      if (!wishlist) throw new Error('Lỗi khi toggle wishlist');
      return wishlist;
    } catch (error) {
      logger.error('WishlistRepository.toggleItem error:', error);
      throw new Error(error instanceof Error ? error.message : 'Lỗi khi toggle wishlist');
    } finally {
      await session.endSession();
    }
  }
}
