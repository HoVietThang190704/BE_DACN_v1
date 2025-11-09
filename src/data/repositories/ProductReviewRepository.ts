import {
  IProductReviewRepository,
  PaginatedProductReviews,
  ProductReviewFilters,
  ProductReviewPagination,
  ProductReviewRatingSummary,
  ProductReviewSorting
} from '../../domain/repositories/IProductReviewRepository';
import { ProductReviewEntity } from '../../domain/entities/ProductReview.entity';
import { ProductReview, IProductReview } from '../../models/ProductReview';
import { Types } from 'mongoose';
import { logger } from '../../shared/utils/logger';

export class ProductReviewRepository implements IProductReviewRepository {
  private toDomainEntity(model: any): ProductReviewEntity {
    const entity = new ProductReviewEntity({
      id: String(model._id),
      productId: String(model.productId),
      userId: String(model.userId?._id || model.userId),
      rating: model.rating,
      content: model.content,
      images: model.images || [],
      cloudinaryPublicIds: model.cloudinaryPublicIds || [],
      parentReviewId: model.parentReviewId ? String(model.parentReviewId) : undefined,
      level: model.level,
      mentionedUserId: model.mentionedUserId ? String(model.mentionedUserId) : undefined,
      repliesCount: model.repliesCount || 0,
      isEdited: model.isEdited || false,
      editedAt: model.editedAt || undefined,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });

    if (model.userId && typeof model.userId === 'object') {
      (entity as any).user = {
        id: String(model.userId._id),
        userName: model.userId.userName,
        email: model.userId.email,
        avatar: model.userId.avatar
      };
    }

    if (model.mentionedUserId && typeof model.mentionedUserId === 'object') {
      (entity as any).mentionedUser = {
        id: String(model.mentionedUserId._id),
        userName: model.mentionedUserId.userName,
        email: model.mentionedUserId.email,
        avatar: model.mentionedUserId.avatar
      };
    }

    return entity;
  }

  private buildFilter(filters?: ProductReviewFilters): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    if (!filters) return filter;

    if (filters.productId) {
      filter.productId = new Types.ObjectId(filters.productId);
    }

    if (filters.userId) {
      filter.userId = new Types.ObjectId(filters.userId);
    }

    if (filters.parentReviewId !== undefined) {
      if (filters.parentReviewId === null) {
        filter.parentReviewId = null;
      } else {
        filter.parentReviewId = new Types.ObjectId(filters.parentReviewId);
      }
    }

    if (filters.level !== undefined) {
      filter.level = filters.level;
    }

    if (filters.hasImages !== undefined) {
      filter['images.0'] = filters.hasImages ? { $exists: true } : { $exists: false };
    }

    if (filters.createdAfter || filters.createdBefore) {
      filter.createdAt = {} as Record<string, Date>;
      if (filters.createdAfter) {
        (filter.createdAt as Record<string, Date>).$gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        (filter.createdAt as Record<string, Date>).$lte = filters.createdBefore;
      }
    }

    return filter;
  }

  private buildSort(sorting?: ProductReviewSorting): Record<string, 1 | -1> {
    if (!sorting) {
      return { createdAt: -1 };
    }
    return { [sorting.sortBy]: sorting.order === 'asc' ? 1 : -1 } as Record<string, 1 | -1>;
  }

  private buildPagination(pagination?: ProductReviewPagination) {
    const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
    const limit = pagination?.limit && pagination.limit > 0 ? pagination.limit : 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  async findById(id: string): Promise<ProductReviewEntity | null> {
    try {
      const review = await ProductReview.findById(id)
        .populate('userId', 'userName email avatar')
        .populate('mentionedUserId', 'userName email avatar')
        .lean();
      return review ? this.toDomainEntity(review as unknown as IProductReview) : null;
    } catch (error) {
      logger.error('ProductReviewRepository.findById error:', error);
      throw new Error('Lỗi khi tìm đánh giá');
    }
  }

  async findByIdWithUser(id: string): Promise<ProductReviewEntity | null> {
    return this.findById(id);
  }

  async create(review: Omit<ProductReviewEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductReviewEntity> {
    try {
      const created = await ProductReview.create({
        ...review,
        productId: new Types.ObjectId(review.productId),
        userId: new Types.ObjectId(review.userId),
        parentReviewId: review.parentReviewId ? new Types.ObjectId(review.parentReviewId) : null,
        mentionedUserId: review.mentionedUserId ? new Types.ObjectId(review.mentionedUserId) : null
      });

      const populated = await ProductReview.findById(created._id)
        .populate('userId', 'userName email avatar')
        .populate('mentionedUserId', 'userName email avatar')
        .lean();

      return this.toDomainEntity(populated as unknown as IProductReview);
    } catch (error) {
      logger.error('ProductReviewRepository.create error:', error);
      throw new Error('Lỗi khi tạo đánh giá');
    }
  }

  async update(id: string, data: Partial<ProductReviewEntity>): Promise<ProductReviewEntity | null> {
    try {
      const updateData: Record<string, unknown> = { ...data };
      if (data.mentionedUserId) {
        updateData.mentionedUserId = new Types.ObjectId(data.mentionedUserId);
      }
      if (data.parentReviewId) {
        updateData.parentReviewId = new Types.ObjectId(data.parentReviewId);
      }

      const updated = await ProductReview.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('userId', 'userName email avatar')
        .populate('mentionedUserId', 'userName email avatar')
        .lean();

      return updated ? this.toDomainEntity(updated as unknown as IProductReview) : null;
    } catch (error) {
      logger.error('ProductReviewRepository.update error:', error);
      throw new Error('Lỗi khi cập nhật đánh giá');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await ProductReview.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('ProductReviewRepository.delete error:', error);
      throw new Error('Lỗi khi xóa đánh giá');
    }
  }

  async deleteWithReplies(id: string): Promise<number> {
    try {
      const root = await ProductReview.findById(id).lean();
      if (!root) return 0;

      const rootObjectId = root._id as Types.ObjectId;
      const idsToDelete: Types.ObjectId[] = [rootObjectId];

      const collectDescendants = async (parentIds: Types.ObjectId[]): Promise<void> => {
        const children = await ProductReview.find({ parentReviewId: { $in: parentIds } }, '_id').lean();
        if (!children.length) return;
        const childIds = children.map((child) => child._id as Types.ObjectId);
        idsToDelete.push(...childIds);
        await collectDescendants(childIds);
      };

      await collectDescendants([rootObjectId]);

      const result = await ProductReview.deleteMany({ _id: { $in: idsToDelete } });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('ProductReviewRepository.deleteWithReplies error:', error);
      throw new Error('Lỗi khi xóa đánh giá và phản hồi');
    }
  }

  async findAll(
    filters?: ProductReviewFilters,
    sorting?: ProductReviewSorting,
    pagination?: ProductReviewPagination
  ): Promise<PaginatedProductReviews> {
    try {
      const filter = this.buildFilter(filters);
      const sort = this.buildSort(sorting);
      const { page, limit, skip } = this.buildPagination(pagination);

      const [rows, total] = await Promise.all([
        ProductReview.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('userId', 'userName email avatar')
          .populate('mentionedUserId', 'userName email avatar')
          .lean(),
        ProductReview.countDocuments(filter)
      ]);

      return {
        reviews: rows.map((row) => this.toDomainEntity(row as unknown as IProductReview)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      };
    } catch (error) {
      logger.error('ProductReviewRepository.findAll error:', error);
      throw new Error('Lỗi khi lấy danh sách đánh giá');
    }
  }

  async findByProductId(productId: string, pagination?: ProductReviewPagination): Promise<PaginatedProductReviews> {
    return this.findAll(
      { productId, level: 0, parentReviewId: null },
      { sortBy: 'createdAt', order: 'desc' },
      pagination
    );
  }

  async findByProductIdWithNested(
    productId: string,
    pagination?: ProductReviewPagination
  ): Promise<PaginatedProductReviews> {
    try {
      const { page, limit, skip } = this.buildPagination(pagination);

      const [roots, total] = await Promise.all([
        ProductReview.find({ productId, level: 0, parentReviewId: null })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'userName email avatar')
          .lean(),
        ProductReview.countDocuments({ productId, level: 0, parentReviewId: null })
      ]);

  const rootIds = roots.map((root) => root._id as Types.ObjectId);
      const level1Replies = await ProductReview.find({
        productId,
        parentReviewId: { $in: rootIds }
      })
        .sort({ createdAt: 1 })
        .populate('userId', 'userName email avatar')
        .populate('mentionedUserId', 'userName email avatar')
        .lean();

      const level1Ids = level1Replies.map((reply) => reply._id as Types.ObjectId);

      let level2Replies: any[] = [];
      if (level1Ids.length) {
        level2Replies = await ProductReview.find({
          productId,
          parentReviewId: { $in: level1Ids }
        })
          .sort({ createdAt: 1 })
          .populate('userId', 'userName email avatar')
          .populate('mentionedUserId', 'userName email avatar')
          .lean();
      }

      const combined = [...roots, ...level1Replies, ...level2Replies];

      return {
        reviews: combined.map((row) => this.toDomainEntity(row as unknown as IProductReview)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      };
    } catch (error) {
      logger.error('ProductReviewRepository.findByProductIdWithNested error:', error);
      throw new Error('Lỗi khi lấy danh sách đánh giá kèm phản hồi');
    }
  }

  async findReplies(
    parentReviewId: string,
    pagination?: ProductReviewPagination
  ): Promise<PaginatedProductReviews> {
    return this.findAll(
      { parentReviewId, level: 1 },
      { sortBy: 'createdAt', order: 'asc' },
      pagination
    );
  }

  async incrementRepliesCount(reviewId: string): Promise<ProductReviewEntity | null> {
    try {
      const updated = await ProductReview.findByIdAndUpdate(
        reviewId,
        { $inc: { repliesCount: 1 } },
        { new: true }
      )
        .populate('userId', 'userName email avatar')
        .lean();
      return updated ? this.toDomainEntity(updated as unknown as IProductReview) : null;
    } catch (error) {
      logger.error('ProductReviewRepository.incrementRepliesCount error:', error);
      throw new Error('Lỗi khi tăng số lượng phản hồi');
    }
  }

  async decrementRepliesCount(reviewId: string): Promise<ProductReviewEntity | null> {
    try {
      const updated = await ProductReview.findByIdAndUpdate(
        reviewId,
        { $inc: { repliesCount: -1 } },
        { new: true }
      )
        .populate('userId', 'userName email avatar')
        .lean();
      return updated ? this.toDomainEntity(updated as unknown as IProductReview) : null;
    } catch (error) {
      logger.error('ProductReviewRepository.decrementRepliesCount error:', error);
      throw new Error('Lỗi khi giảm số lượng phản hồi');
    }
  }

  async getRatingSummary(productId: string): Promise<ProductReviewRatingSummary> {
    try {
      const [result] = await ProductReview.aggregate([
        {
          $match: {
            productId: new Types.ObjectId(productId),
            level: 0
          }
        },
        {
          $facet: {
            histogram: [
              {
                $group: {
                  _id: '$rating',
                  count: { $sum: 1 }
                }
              },
              {
                $sort: { _id: -1 }
              }
            ],
            stats: [
              {
                $group: {
                  _id: null,
                  totalReviews: { $sum: 1 },
                  average: { $avg: '$rating' }
                }
              }
            ]
          }
        }
      ]);

      const distribution: Record<string, number> = {};
      if (result?.histogram) {
        for (const item of result.histogram) {
          const key = item._id?.toString() ?? '0';
          distribution[key] = item.count ?? 0;
        }
      }

      const totalReviews = result?.stats?.[0]?.totalReviews ?? 0;
      const average = result?.stats?.[0]?.average ?? 0;

      return {
        average: totalReviews > 0 ? Number(average.toFixed(2)) : 0,
        totalReviews,
        distribution
      };
    } catch (error) {
      logger.error('ProductReviewRepository.getRatingSummary error:', error);
      throw new Error('Lỗi khi tính toán thống kê đánh giá');
    }
  }
}
