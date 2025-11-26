import { 
  IPostRepository, 
  PostFilters, 
  PostSorting, 
  PostPagination,
  PaginatedPosts 
} from '../../domain/repositories/IPostRepository';
import { PostEntity } from '../../domain/entities/Post.entity';
import { Post as PostModel, IPost } from '../../models/Post';
import { logger } from '../../shared/utils/logger';
import { buildVietnameseRegex } from '../../shared/utils/textSearch';

/**
 * Post Repository Implementation using Mongoose
 */
export class PostRepository implements IPostRepository {
  
  /**
   * Map Mongoose document to Domain Entity
   */
  private toDomainEntity(model: any): PostEntity {
    const entity = new PostEntity({
      id: String(model._id),
      userId: String(model.userId?._id || model.userId),
      content: model.content,
      images: model.images,
      cloudinaryPublicIds: model.cloudinaryPublicIds,
      likes: model.likes.map((id: any) => String(id)),
      likesCount: model.likesCount,
      commentsCount: model.commentsCount,
      sharesCount: model.sharesCount,
      visibility: model.visibility,
      isEdited: model.isEdited,
      editedAt: model.editedAt,
      originalPostId: model.originalPostId ? String(model.originalPostId) : undefined,
      sharedBy: model.sharedBy ? String(model.sharedBy) : undefined,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });

    // Attach populated user data for DTO mapping
    if (model.userId && typeof model.userId === 'object') {
      (entity as any).user = {
        id: String(model.userId._id),
        userName: model.userId.userName,
        email: model.userId.email,
        avatar: model.userId.avatar
      };
    }

    return entity;
  }

  /**
   * Build Mongoose filter from PostFilters
   */
  private buildFilter(filters?: PostFilters): any {
    const filter: any = {};

    if (!filters) return filter;

    if (filters.userId) {
      filter.userId = filters.userId;
    }

    if (filters.visibility) {
      filter.visibility = filters.visibility;
    }

    if (filters.hasImages !== undefined) {
      filter[filters.hasImages ? 'images.0' : 'images'] = filters.hasImages ? { $exists: true } : { $size: 0 };
    }

    if (filters.isShared !== undefined) {
      if (filters.isShared) {
        filter.originalPostId = { $exists: true, $ne: null };
      } else {
        filter.originalPostId = { $exists: false };
      }
    }

    if (filters.originalPostId) {
      filter.originalPostId = filters.originalPostId;
    }

    if (filters.search) {
      const trimmed = filters.search.trim();
      if (trimmed) {
        filter.$text = { $search: trimmed };
        const regex = buildVietnameseRegex(trimmed);
        if (filter.$or) {
          filter.$or.push({ content: regex });
        } else {
          filter.$or = [{ content: regex }];
        }
      }
    }

    if (filters.minLikes !== undefined) {
      filter.likesCount = { $gte: filters.minLikes };
    }

    if (filters.minComments !== undefined) {
      filter.commentsCount = { $gte: filters.minComments };
    }

    if (filters.createdAfter || filters.createdBefore) {
      filter.createdAt = {};
      if (filters.createdAfter) {
        filter.createdAt.$gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        filter.createdAt.$lte = filters.createdBefore;
      }
    }

    return filter;
  }

  /**
   * Build Mongoose sort from PostSorting
   */
  private buildSort(sorting?: PostSorting): any {
    if (!sorting) {
      return { createdAt: -1 }; // Default: newest first
    }

    const sortField = sorting.sortBy === 'engagement' 
      ? { likesCount: -1, commentsCount: -1, sharesCount: -1 }
      : { [sorting.sortBy]: sorting.order === 'asc' ? 1 : -1 };

    return sortField;
  }

  async findById(id: string): Promise<PostEntity | null> {
    try {
      const post = await PostModel.findById(id)
        .populate('userId', 'userName email avatar')
        .populate('sharedBy', 'userName email avatar')
        .lean();

      if (!post) return null;

  return this.toDomainEntity(post as unknown as IPost);
    } catch (error) {
      logger.error('Error finding post by ID:', error);
      throw new Error('Lỗi khi tìm bài viết');
    }
  }

  async findAll(
    filters?: PostFilters,
    sorting?: PostSorting,
    pagination?: PostPagination
  ): Promise<PaginatedPosts> {
    try {
      const filter = this.buildFilter(filters);
      const sort = this.buildSort(sorting);
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        PostModel.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('userId', 'userName email avatar')
          .populate('sharedBy', 'userName email avatar')
          .lean(),
        PostModel.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
  posts: posts.map(post => this.toDomainEntity(post as unknown as IPost)),
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages
      };
    } catch (error) {
      logger.error('Error finding posts:', error);
      throw new Error('Lỗi khi tìm bài viết');
    }
  }

  async create(postData: Omit<PostEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<PostEntity> {
    try {
      const post = new PostModel(postData);
      const saved = await post.save();
      
      const populated = await PostModel.findById(saved._id)
        .populate('userId', 'userName email avatar')
        .lean();

  return this.toDomainEntity(populated as unknown as IPost);
    } catch (error) {
      logger.error('Error creating post:', error);
      throw new Error('Lỗi khi tạo bài viết');
    }
  }

  async update(id: string, data: Partial<PostEntity>): Promise<PostEntity | null> {
    try {
      const updated = await PostModel.findByIdAndUpdate(
        id,
        { $set: { ...data, updatedAt: new Date() } },
        { new: true, runValidators: true }
      )
      .populate('userId', 'userName email avatar')
      .lean();

      if (!updated) return null;

  return this.toDomainEntity(updated as unknown as IPost);
    } catch (error) {
      logger.error('Error updating post:', error);
      throw new Error('Lỗi khi cập nhật bài viết');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await PostModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('Error deleting post:', error);
      throw new Error('Lỗi khi xóa bài viết');
    }
  }

  async count(filters?: PostFilters): Promise<number> {
    try {
      const filter = this.buildFilter(filters);
      return await PostModel.countDocuments(filter);
    } catch (error) {
      logger.error('Error counting posts:', error);
      throw new Error('Lỗi khi đếm bài viết');
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await PostModel.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      logger.error('Error checking post exists:', error);
      return false;
    }
  }

  async findByUserId(userId: string, pagination?: PostPagination): Promise<PaginatedPosts> {
    return this.findAll({ userId }, undefined, pagination);
  }

  async findPublicPosts(pagination?: PostPagination): Promise<PaginatedPosts> {
    return this.findAll({ visibility: 'public' }, undefined, pagination);
  }

  async findFeedPosts(userId: string, friendIds: string[], pagination?: PostPagination): Promise<PaginatedPosts> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      // Find posts that are either:
      // 1. Public posts
      // 2. User's own posts
      // 3. Friends' posts with visibility 'public' or 'friends'
      const filter = {
        $or: [
          { visibility: 'public' },
          { userId, visibility: { $in: ['public', 'friends', 'private'] } },
          { userId: { $in: friendIds }, visibility: { $in: ['public', 'friends'] } }
        ]
      };

      const [posts, total] = await Promise.all([
        PostModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'userName email avatar')
          .populate('sharedBy', 'userName email avatar')
          .lean(),
        PostModel.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
  posts: posts.map(post => this.toDomainEntity(post as unknown as IPost)),
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages
      };
    } catch (error) {
      logger.error('Error finding feed posts:', error);
      throw new Error('Lỗi khi tìm bài viết feed');
    }
  }

  async findTrending(limit: number = 10, timeWindow: number = 24): Promise<PostEntity[]> {
    try {
      const cutoffTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);

      const posts = await PostModel.find({
        createdAt: { $gte: cutoffTime },
        visibility: 'public'
      })
      .sort({ likesCount: -1, commentsCount: -1, sharesCount: -1 })
      .limit(limit)
      .populate('userId', 'userName email avatar')
      .lean();

  return posts.map(post => this.toDomainEntity(post as unknown as IPost));
    } catch (error) {
      logger.error('Error finding trending posts:', error);
      throw new Error('Lỗi khi tìm bài viết trending');
    }
  }

  async search(query: string, pagination?: PostPagination): Promise<PaginatedPosts> {
    return this.findAll({ search: query, visibility: 'public' }, undefined, pagination);
  }

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    try {
      const post = await PostModel.findById(postId);

      if (!post) {
        throw new Error('Không tìm thấy bài viết');
      }

      const userIdObj = userId as any;
      const likeIndex = post.likes.findIndex(id => String(id) === String(userId));

      if (likeIndex > -1) {
        // Unlike
        post.likes.splice(likeIndex, 1);
        post.likesCount = Math.max(0, post.likesCount - 1);
        await post.save();
        return { liked: false, likesCount: post.likesCount };
      } else {
        // Like
        post.likes.push(userIdObj);
        post.likesCount += 1;
        await post.save();
        return { liked: true, likesCount: post.likesCount };
      }
    } catch (error) {
      logger.error('Error toggling like:', error);
      throw new Error('Lỗi khi toggle like');
    }
  }

  async addLike(postId: string, userId: string): Promise<PostEntity | null> {
    try {
      const updated = await PostModel.findByIdAndUpdate(
        postId,
        { 
          $addToSet: { likes: userId },
          $inc: { likesCount: 1 }
        },
        { new: true }
      )
      .populate('userId', 'userName email avatar')
      .lean();

      if (!updated) return null;

  return this.toDomainEntity(updated as unknown as IPost);
    } catch (error) {
      logger.error('Error adding like:', error);
      throw new Error('Lỗi khi thêm like');
    }
  }

  async removeLike(postId: string, userId: string): Promise<PostEntity | null> {
    try {
      const updated = await PostModel.findByIdAndUpdate(
        postId,
        { 
          $pull: { likes: userId },
          $inc: { likesCount: -1 }
        },
        { new: true }
      )
      .populate('userId', 'userName email avatar')
      .lean();

      if (!updated) return null;

  return this.toDomainEntity(updated as unknown as IPost);
    } catch (error) {
      logger.error('Error removing like:', error);
      throw new Error('Lỗi khi xóa like');
    }
  }

  async incrementCommentsCount(postId: string): Promise<PostEntity | null> {
    try {
      const updated = await PostModel.findByIdAndUpdate(
        postId,
        { $inc: { commentsCount: 1 } },
        { new: true }
      )
      .populate('userId', 'userName email avatar')
      .lean();

      if (!updated) return null;

  return this.toDomainEntity(updated as unknown as IPost);
    } catch (error) {
      logger.error('Error incrementing comments count:', error);
      throw new Error('Lỗi khi tăng comments count');
    }
  }

  async decrementCommentsCount(postId: string): Promise<PostEntity | null> {
    try {
      const updated = await PostModel.findByIdAndUpdate(
        postId,
        { $inc: { commentsCount: -1 } },
        { new: true }
      )
      .populate('userId', 'userName email avatar')
      .lean();

      if (!updated) return null;

  return this.toDomainEntity(updated as unknown as IPost);
    } catch (error) {
      logger.error('Error decrementing comments count:', error);
      throw new Error('Lỗi khi giảm comments count');
    }
  }

  async incrementSharesCount(postId: string): Promise<PostEntity | null> {
    try {
      const updated = await PostModel.findByIdAndUpdate(
        postId,
        { $inc: { sharesCount: 1 } },
        { new: true }
      )
      .populate('userId', 'userName email avatar')
      .lean();

      if (!updated) return null;

  return this.toDomainEntity(updated as unknown as IPost);
    } catch (error) {
      logger.error('Error incrementing shares count:', error);
      throw new Error('Lỗi khi tăng shares count');
    }
  }

  async sharePost(originalPostId: string, userId: string, content?: string): Promise<PostEntity> {
    try {
      const sharedPostData = {
        userId,
        content: content || '',
        images: [],
        cloudinaryPublicIds: [],
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        visibility: 'public' as const,
        isEdited: false,
        originalPostId,
        sharedBy: userId
      };

      const post = new PostModel(sharedPostData);
      const saved = await post.save();

      const populated = await PostModel.findById(saved._id)
        .populate('userId', 'userName email avatar')
        .populate('sharedBy', 'userName email avatar')
        .lean();

  return this.toDomainEntity(populated as unknown as IPost);
    } catch (error) {
      logger.error('Error sharing post:', error);
      throw new Error('Lỗi khi chia sẻ bài viết');
    }
  }

  async findByIdWithUser(id: string): Promise<PostEntity | null> {
    return this.findById(id);
  }

  async findLikedByUser(userId: string, pagination?: PostPagination): Promise<PaginatedPosts> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      const filter = { likes: userId, visibility: 'public' };

      const [posts, total] = await Promise.all([
        PostModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'userName email avatar')
          .lean(),
        PostModel.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
  posts: posts.map(post => this.toDomainEntity(post as unknown as IPost)),
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages
      };
    } catch (error) {
      logger.error('Error finding liked posts:', error);
      throw new Error('Lỗi khi tìm bài viết đã thích');
    }
  }

  async findSharedByUser(userId: string, pagination?: PostPagination): Promise<PaginatedPosts> {
    return this.findAll({ userId, isShared: true }, undefined, pagination);
  }

  async findWithImages(userId?: string, pagination?: PostPagination): Promise<PaginatedPosts> {
    const filters: PostFilters = { hasImages: true };
    if (userId) {
      filters.userId = userId;
    }
    return this.findAll(filters, undefined, pagination);
  }

  async countUserPosts(userId: string): Promise<number> {
    return this.count({ userId });
  }

  async getTotalLikesForUser(userId: string): Promise<number> {
    try {
      const result = await PostModel.aggregate([
        { $match: { userId } },
        { $group: { _id: null, totalLikes: { $sum: '$likesCount' } } }
      ]);

      return result.length > 0 ? result[0].totalLikes : 0;
    } catch (error) {
      logger.error('Error getting total likes:', error);
      return 0;
    }
  }

  async getMostLiked(limit: number = 10, timeWindow?: number): Promise<PostEntity[]> {
    try {
      const filter: any = { visibility: 'public' };
      
      if (timeWindow) {
        const cutoffTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
        filter.createdAt = { $gte: cutoffTime };
      }

      const posts = await PostModel.find(filter)
        .sort({ likesCount: -1 })
        .limit(limit)
        .populate('userId', 'userName email avatar')
        .lean();

  return posts.map(post => this.toDomainEntity(post as unknown as IPost));
    } catch (error) {
      logger.error('Error finding most liked posts:', error);
      throw new Error('Lỗi khi tìm bài viết được thích nhiều nhất');
    }
  }

  async getMostCommented(limit: number = 10, timeWindow?: number): Promise<PostEntity[]> {
    try {
      const filter: any = { visibility: 'public' };
      
      if (timeWindow) {
        const cutoffTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
        filter.createdAt = { $gte: cutoffTime };
      }

      const posts = await PostModel.find(filter)
        .sort({ commentsCount: -1 })
        .limit(limit)
        .populate('userId', 'userName email avatar')
        .lean();

  return posts.map(post => this.toDomainEntity(post as unknown as IPost));
    } catch (error) {
      logger.error('Error finding most commented posts:', error);
      throw new Error('Lỗi khi tìm bài viết có nhiều bình luận nhất');
    }
  }

  async bulkDeleteByUser(userId: string): Promise<number> {
    try {
      const result = await PostModel.deleteMany({ userId });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Error bulk deleting posts:', error);
      throw new Error('Lỗi khi xóa hàng loạt bài viết');
    }
  }
}
