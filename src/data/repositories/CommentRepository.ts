import { 
  ICommentRepository, 
  CommentFilters, 
  CommentSorting, 
  CommentPagination,
  PaginatedComments 
} from '../../domain/repositories/ICommentRepository';
import { CommentEntity } from '../../domain/entities/Comment.entity';
import { Comment as CommentModel, IComment } from '../../models/Comment';
import { logger } from '../../shared/utils/logger';

/**
 * Comment Repository Implementation using Mongoose
 */
export class CommentRepository implements ICommentRepository {
  
  /**
   * Map Mongoose document to Domain Entity
   */
  private toDomainEntity(model: any): CommentEntity {
    const entity = new CommentEntity({
      id: String(model._id),
      postId: String(model.postId),
      userId: String(model.userId?._id || model.userId),
      content: model.content,
      images: model.images,
      cloudinaryPublicIds: model.cloudinaryPublicIds,
      parentCommentId: model.parentCommentId ? String(model.parentCommentId) : undefined,
      level: model.level,
      mentionedUserId: model.mentionedUserId ? String(model.mentionedUserId) : undefined,
      likes: model.likes.map((id: any) => String(id)),
      likesCount: model.likesCount,
      repliesCount: model.repliesCount,
      isEdited: model.isEdited,
      editedAt: model.editedAt,
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

    // Attach mentioned user data if present
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

  /**
   * Build Mongoose filter from CommentFilters
   */
  private buildFilter(filters?: CommentFilters): any {
    const filter: any = {};

    if (!filters) return filter;

    if (filters.postId) {
      filter.postId = filters.postId;
    }

    if (filters.userId) {
      filter.userId = filters.userId;
    }

    if (filters.parentCommentId !== undefined) {
      if (filters.parentCommentId === null) {
        filter.parentCommentId = null;
      } else {
        filter.parentCommentId = filters.parentCommentId;
      }
    }

    if (filters.level !== undefined) {
      filter.level = filters.level;
    }

    if (filters.hasImages !== undefined) {
      filter[filters.hasImages ? 'images.0' : 'images'] = filters.hasImages ? { $exists: true } : { $size: 0 };
    }

    if (filters.minLikes !== undefined) {
      filter.likesCount = { $gte: filters.minLikes };
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
   * Build Mongoose sort from CommentSorting
   */
  private buildSort(sorting?: CommentSorting): any {
    if (!sorting) {
      return { createdAt: 1 }; // Default: oldest first (for chronological comments)
    }

    return { [sorting.sortBy]: sorting.order === 'asc' ? 1 : -1 };
  }

  async findById(id: string): Promise<CommentEntity | null> {
    try {
      const comment = await CommentModel.findById(id)
        .populate('userId', 'userName email avatar')
        .populate('mentionedUserId', 'userName email avatar')
        .lean();

      if (!comment) return null;

      return this.toDomainEntity(comment as IComment);
    } catch (error) {
      logger.error('Error finding comment by ID:', error);
      throw new Error('Lỗi khi tìm bình luận');
    }
  }

  async findAll(
    filters?: CommentFilters,
    sorting?: CommentSorting,
    pagination?: CommentPagination
  ): Promise<PaginatedComments> {
    try {
      const filter = this.buildFilter(filters);
      const sort = this.buildSort(sorting);
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      const [comments, total] = await Promise.all([
        CommentModel.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('userId', 'userName email avatar')
          .populate('mentionedUserId', 'userName email avatar')
          .lean(),
        CommentModel.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        comments: comments.map(comment => this.toDomainEntity(comment as IComment)),
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages
      };
    } catch (error) {
      logger.error('Error finding comments:', error);
      throw new Error('Lỗi khi tìm bình luận');
    }
  }

  async create(commentData: Omit<CommentEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommentEntity> {
    try {
      const comment = new CommentModel(commentData);
      const saved = await comment.save();
      
      const populated = await CommentModel.findById(saved._id)
        .populate('userId', 'userName email avatar')
        .populate('mentionedUserId', 'userName email avatar')
        .lean();

      return this.toDomainEntity(populated as IComment);
    } catch (error) {
      logger.error('Error creating comment:', error);
      throw new Error('Lỗi khi tạo bình luận');
    }
  }

  async update(id: string, data: Partial<CommentEntity>): Promise<CommentEntity | null> {
    try {
      const updated = await CommentModel.findByIdAndUpdate(
        id,
        { $set: { ...data, updatedAt: new Date() } },
        { new: true, runValidators: true }
      )
      .populate('userId', 'userName email avatar')
      .populate('mentionedUserId', 'userName email avatar')
      .lean();

      if (!updated) return null;

      return this.toDomainEntity(updated as IComment);
    } catch (error) {
      logger.error('Error updating comment:', error);
      throw new Error('Lỗi khi cập nhật bình luận');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await CommentModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('Error deleting comment:', error);
      throw new Error('Lỗi khi xóa bình luận');
    }
  }

  async count(filters?: CommentFilters): Promise<number> {
    try {
      const filter = this.buildFilter(filters);
      return await CommentModel.countDocuments(filter);
    } catch (error) {
      logger.error('Error counting comments:', error);
      throw new Error('Lỗi khi đếm bình luận');
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await CommentModel.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      logger.error('Error checking comment exists:', error);
      return false;
    }
  }

  async findByPostId(postId: string, pagination?: CommentPagination): Promise<PaginatedComments> {
    // Get only top-level comments (level 0, no parent)
    return this.findAll(
      { postId, level: 0, parentCommentId: null as any },
      { sortBy: 'createdAt', order: 'asc' },
      pagination
    );
  }

  async findReplies(parentCommentId: string, pagination?: CommentPagination): Promise<PaginatedComments> {
    return this.findAll(
      { parentCommentId },
      { sortBy: 'createdAt', order: 'asc' },
      pagination
    );
  }

  async findThread(parentCommentId: string): Promise<CommentEntity[]> {
    try {
      // Get all comments in the thread (parent + all nested replies)
      const comments = await CommentModel.find({
        $or: [
          { _id: parentCommentId },
          { parentCommentId }
        ]
      })
      .sort({ createdAt: 1 })
      .populate('userId', 'userName email avatar')
      .lean();

      return comments.map(comment => this.toDomainEntity(comment as IComment));
    } catch (error) {
      logger.error('Error finding thread:', error);
      throw new Error('Lỗi khi tìm thread bình luận');
    }
  }

  async findByUserId(userId: string, pagination?: CommentPagination): Promise<PaginatedComments> {
    return this.findAll(
      { userId },
      { sortBy: 'createdAt', order: 'desc' },
      pagination
    );
  }

  async toggleLike(commentId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    try {
      const comment = await CommentModel.findById(commentId);

      if (!comment) {
        throw new Error('Không tìm thấy bình luận');
      }

      const userIdObj = userId as any;
      const likeIndex = comment.likes.findIndex(id => String(id) === String(userId));

      if (likeIndex > -1) {
        // Unlike
        comment.likes.splice(likeIndex, 1);
        comment.likesCount = Math.max(0, comment.likesCount - 1);
        await comment.save();
        return { liked: false, likesCount: comment.likesCount };
      } else {
        // Like
        comment.likes.push(userIdObj);
        comment.likesCount += 1;
        await comment.save();
        return { liked: true, likesCount: comment.likesCount };
      }
    } catch (error) {
      logger.error('Error toggling like:', error);
      throw new Error('Lỗi khi toggle like');
    }
  }

  async addLike(commentId: string, userId: string): Promise<CommentEntity | null> {
    try {
      const updated = await CommentModel.findByIdAndUpdate(
        commentId,
        { 
          $addToSet: { likes: userId },
          $inc: { likesCount: 1 }
        },
        { new: true }
      )
      .populate('userId', 'userName email avatar')
      .lean();

      if (!updated) return null;

      return this.toDomainEntity(updated as IComment);
    } catch (error) {
      logger.error('Error adding like:', error);
      throw new Error('Lỗi khi thêm like');
    }
  }

  async removeLike(commentId: string, userId: string): Promise<CommentEntity | null> {
    try {
      const updated = await CommentModel.findByIdAndUpdate(
        commentId,
        { 
          $pull: { likes: userId },
          $inc: { likesCount: -1 }
        },
        { new: true }
      )
      .populate('userId', 'userName email avatar')
      .lean();

      if (!updated) return null;

      return this.toDomainEntity(updated as IComment);
    } catch (error) {
      logger.error('Error removing like:', error);
      throw new Error('Lỗi khi xóa like');
    }
  }

  async incrementRepliesCount(commentId: string): Promise<CommentEntity | null> {
    try {
      const updated = await CommentModel.findByIdAndUpdate(
        commentId,
        { $inc: { repliesCount: 1 } },
        { new: true }
      )
      .populate('userId', 'userName email avatar')
      .lean();

      if (!updated) return null;

      return this.toDomainEntity(updated as IComment);
    } catch (error) {
      logger.error('Error incrementing replies count:', error);
      throw new Error('Lỗi khi tăng replies count');
    }
  }

  async decrementRepliesCount(commentId: string): Promise<CommentEntity | null> {
    try {
      const updated = await CommentModel.findByIdAndUpdate(
        commentId,
        { $inc: { repliesCount: -1 } },
        { new: true }
      )
      .populate('userId', 'userName email avatar')
      .lean();

      if (!updated) return null;

      return this.toDomainEntity(updated as IComment);
    } catch (error) {
      logger.error('Error decrementing replies count:', error);
      throw new Error('Lỗi khi giảm replies count');
    }
  }

  async findByIdWithUser(id: string): Promise<CommentEntity | null> {
    return this.findById(id);
  }

  async findByPostIdWithNested(postId: string, pagination?: CommentPagination): Promise<PaginatedComments> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      // Get top-level comments with pagination
      const [topLevelComments, total] = await Promise.all([
        CommentModel.find({ postId, level: 0, parentCommentId: null })
          .sort({ createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'userName email avatar')
          .populate('mentionedUserId', 'userName email avatar')
          .lean(),
        CommentModel.countDocuments({ postId, level: 0, parentCommentId: null })
      ]);

      // Get all replies for this post (all depths). We'll assemble the nested tree in the presentation layer.
      const replies = await CommentModel.find({ postId, parentCommentId: { $ne: null } })
        .sort({ createdAt: 1 })
        .populate('userId', 'userName email avatar')
        .populate('mentionedUserId', 'userName email avatar')
        .lean();

      // Combine top-level comments with all replies (flat list). Presentation will build the nested structure.
      const allComments = [...topLevelComments, ...replies];

      const totalPages = Math.ceil(total / limit);

      return {
        comments: allComments.map(comment => this.toDomainEntity(comment as IComment)),
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages
      };
    } catch (error) {
      logger.error('Error finding comments with nested:', error);
      throw new Error('Lỗi khi tìm bình luận có cấu trúc lồng nhau');
    }
  }

  async countByPostId(postId: string): Promise<number> {
    return this.count({ postId });
  }

  async countReplies(commentId: string): Promise<number> {
    return this.count({ parentCommentId: commentId });
  }

  async getRecentByPostId(postId: string, limit: number = 3): Promise<CommentEntity[]> {
    try {
      const comments = await CommentModel.find({ postId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'userName email avatar')
        .lean();

      return comments.map(comment => this.toDomainEntity(comment as IComment));
    } catch (error) {
      logger.error('Error finding recent comments:', error);
      throw new Error('Lỗi khi tìm bình luận gần đây');
    }
  }

  async getMostLikedByPostId(postId: string, limit: number = 3): Promise<CommentEntity[]> {
    try {
      const comments = await CommentModel.find({ postId })
        .sort({ likesCount: -1 })
        .limit(limit)
        .populate('userId', 'userName email avatar')
        .lean();

      return comments.map(comment => this.toDomainEntity(comment as IComment));
    } catch (error) {
      logger.error('Error finding most liked comments:', error);
      throw new Error('Lỗi khi tìm bình luận được thích nhiều nhất');
    }
  }

  async deleteByPostId(postId: string): Promise<number> {
    try {
      const result = await CommentModel.deleteMany({ postId });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Error deleting comments by post ID:', error);
      throw new Error('Lỗi khi xóa bình luận theo post ID');
    }
  }

  async deleteByUserId(userId: string): Promise<number> {
    try {
      const result = await CommentModel.deleteMany({ userId });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Error deleting comments by user ID:', error);
      throw new Error('Lỗi khi xóa bình luận theo user ID');
    }
  }

  async deleteWithReplies(commentId: string): Promise<number> {
    try {
      // First, find all replies (including nested)
      const comment = await CommentModel.findById(commentId);
      if (!comment) return 0;

      // Delete all replies recursively
      const replies = await CommentModel.find({ parentCommentId: commentId });
      let deletedCount = 0;

      for (const reply of replies) {
        deletedCount += await this.deleteWithReplies(String(reply._id));
      }

      // Delete the comment itself
      await CommentModel.findByIdAndDelete(commentId);
      deletedCount += 1;

      return deletedCount;
    } catch (error) {
      logger.error('Error deleting comment with replies:', error);
      throw new Error('Lỗi khi xóa bình luận và replies');
    }
  }

  async countUserComments(userId: string): Promise<number> {
    return this.count({ userId });
  }
}
