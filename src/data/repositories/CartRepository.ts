import { ICartRepository, AddCartItemDTO, UpdateCartItemDTO } from '../../domain/repositories/ICartRepository';
import { CartEntity } from '../../domain/entities/Cart.entity';
import { Cart, CartItem } from '../../models/Cart';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export class CartRepository implements ICartRepository {
  private toDomainEntity(model: any): CartEntity {
    return new CartEntity({
      id: String(model._id),
      userId: String(model.userId),
      items: (model.items || []).map((it: any) => ({
        id: String(it._id),
        productId: String(it.productId),
        shopId: it.shopId ? String(it.shopId) : undefined,
        quantity: it.quantity,
        unit: it.unit,
        price: it.price,
        title: it.title,
        thumbnail: it.thumbnail,
        attrs: it.attrs,
        addedAt: it.addedAt
      })),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  async findByUserId(userId: string): Promise<CartEntity | null> {
    try {
      const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
      return cart ? this.toDomainEntity(cart) : null;
    } catch (error) {
      logger.error('CartRepository.findByUserId error:', error);
      throw new Error('Lỗi khi lấy giỏ hàng');
    }
  }

  async create(userId: string): Promise<CartEntity> {
    try {
      const newCart = await Cart.create({ userId: new mongoose.Types.ObjectId(userId), items: [] });
      return this.toDomainEntity(newCart);
    } catch (error) {
      logger.error('CartRepository.create error:', error);
      throw new Error('Lỗi khi tạo giỏ hàng');
    }
  }

  async addItem(userId: string, item: AddCartItemDTO): Promise<CartEntity> {
    const session = await mongoose.startSession();
    let result: any = null;
    try {
      await session.withTransaction(async () => {
        const userObjId = new mongoose.Types.ObjectId(userId);
        const productObjId = new mongoose.Types.ObjectId(item.productId);
        const cart = await Cart.findOne({ userId: userObjId }).session(session);
        const attrsStr = item.attrs ? JSON.stringify(item.attrs) : null;
        const unitVal = item.unit ?? null;
        if (cart && Array.isArray(cart.items) && cart.items.length > 0) {
          const existing = cart.items.find((it: any) => {
            const itAttrs = it.attrs ? JSON.stringify(it.attrs) : null;
            const itUnit = it.unit ?? null;
            return String(it.productId) === String(productObjId) && itUnit === unitVal && itAttrs === attrsStr;
          });

          if (existing) {
            // Increment quantity atomically on the matched subdocument
            const updated = await Cart.findOneAndUpdate(
              { userId: userObjId },
              {
                $inc: { 'items.$[it].quantity': item.quantity },
                $set: {
                  // Only update snapshot fields if provided
                  ...(item.price !== undefined ? { 'items.$[it].price': item.price } : {}),
                  ...(item.title !== undefined ? { 'items.$[it].title': item.title } : {}),
                  ...(item.thumbnail !== undefined ? { 'items.$[it].thumbnail': item.thumbnail } : {})
                }
              },
              {
                new: true,
                arrayFilters: [{ 'it._id': existing._id }],
                session,
                runValidators: true
              }
            ).lean();

            result = updated;
            return;
          }
        }

        // If no existing item found, push new one (upsert cart if needed)
        const updated = await Cart.findOneAndUpdate(
          { userId: userObjId },
          {
            $push: {
              items: {
                productId: productObjId,
                shopId: item.shopId ? new mongoose.Types.ObjectId(item.shopId) : undefined,
                quantity: item.quantity,
                unit: item.unit,
                price: item.price,
                title: item.title,
                thumbnail: item.thumbnail,
                attrs: item.attrs,
                addedAt: new Date()
              }
            }
          },
          { new: true, upsert: true, setDefaultsOnInsert: true, session }
        ).lean();

        result = updated;
      });

      if (!result) throw new Error('Lỗi khi thêm sản phẩm vào giỏ hàng');
      return this.toDomainEntity(result as any);
    } catch (error) {
      logger.error('CartRepository.addItem error:', error);
      throw new Error('Lỗi khi thêm sản phẩm vào giỏ hàng');
    } finally {
      session.endSession();
    }
  }

  async updateItem(userId: string, itemId: string, payload: UpdateCartItemDTO): Promise<CartEntity | null> {
    try {
      const set: any = {};
      if (payload.quantity !== undefined) set['items.$[it].quantity'] = payload.quantity;
      if (payload.unit !== undefined) set['items.$[it].unit'] = payload.unit;
      if (payload.price !== undefined) set['items.$[it].price'] = payload.price;
      if (payload.attrs !== undefined) set['items.$[it].attrs'] = payload.attrs;

      if (Object.keys(set).length === 0) {
        return this.findByUserId(userId);
      }

      const updated = await Cart.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $set: set },
        {
          new: true,
          arrayFilters: [{ 'it._id': new mongoose.Types.ObjectId(itemId) }],
          runValidators: true
        }
      ).lean();

      return updated ? this.toDomainEntity(updated as any) : null;
    } catch (error) {
      logger.error('CartRepository.updateItem error:', error);
      throw new Error('Lỗi khi cập nhật sản phẩm trong giỏ hàng');
    }
  }

  async removeItem(userId: string, itemId: string): Promise<CartEntity | null> {
    try {
      const updated = await Cart.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $pull: { items: { _id: new mongoose.Types.ObjectId(itemId) } } },
        { new: true }
      ).lean();

      return updated ? this.toDomainEntity(updated as any) : null;
    } catch (error) {
      logger.error('CartRepository.removeItem error:', error);
      throw new Error('Lỗi khi xóa sản phẩm khỏi giỏ hàng');
    }
  }

  async removeItems(userId: string, itemIds: string[]): Promise<CartEntity | null> {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return this.findByUserId(userId);
    }

    try {
      const objectIds = itemIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (objectIds.length === 0) {
        return this.findByUserId(userId);
      }

      const updated = await Cart.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $pull: { items: { _id: { $in: objectIds } } } },
        { new: true }
      ).lean();

      return updated ? this.toDomainEntity(updated as any) : null;
    } catch (error) {
      logger.error('CartRepository.removeItems error:', error);
      throw new Error('Lỗi khi xóa các sản phẩm khỏi giỏ hàng');
    }
  }

  async clearCart(userId: string): Promise<boolean> {
    try {
      await Cart.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $set: { items: [] } },
        { new: true }
      );
      return true;
    } catch (error) {
      logger.error('CartRepository.clearCart error:', error);
      return false;
    }
  }
}
