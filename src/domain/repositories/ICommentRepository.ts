import { CommentEntity } from '../entities/Comment.entity';

/**
 * Comment Repository Interface - Contract for data access
 * Define all data operations needed by use cases
 */

export interface CommentFilters {
  postId?: string;
  userId?: string;
  parentCommentId?: string;
  level?: number;
  hasImages?: boolean;
  minLikes?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface CommentSorting {
  sortBy: 'createdAt' | 'likesCount' | 'repliesCount';
  order: 'asc' | 'desc';
}

export interface CommentPagination {
  page: number;
  limit: number;
}

export interface PaginatedComments {
  comments: CommentEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ICommentRepository {
  /**
   * Find comment by ID
   */
  findById(id: string): Promise<CommentEntity | null>;

  /**
   * Find all comments with filters, sorting and pagination
   */
  findAll(
    filters?: CommentFilters,
    sorting?: CommentSorting,
    pagination?: CommentPagination
  ): Promise<PaginatedComments>;

  /**
   * Create new comment
   */
  create(comment: Omit<CommentEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommentEntity>;

  /**
   * Update existing comment
   */
  update(id: string, data: Partial<CommentEntity>): Promise<CommentEntity | null>;

  /**
   * Delete comment
   */
  delete(id: string): Promise<boolean>;

  /**
   * Count comments with filters
   */
  count(filters?: CommentFilters): Promise<number>;

  /**
   * Check if comment exists by ID
   */
  exists(id: string): Promise<boolean>;

  /**
   * Find comments by post ID (top-level comments only)
   */
  findByPostId(postId: string, pagination?: CommentPagination): Promise<PaginatedComments>;

  /**
   * Find replies to a comment
   */
  findReplies(parentCommentId: string, pagination?: CommentPagination): Promise<PaginatedComments>;

  /**
   * Find all comments in a thread (including nested replies)
   */
  findThread(parentCommentId: string): Promise<CommentEntity[]>;

  /**
   * Find comments by user ID
   */
  findByUserId(userId: string, pagination?: CommentPagination): Promise<PaginatedComments>;

  /**
   * Toggle like on a comment
   */
  toggleLike(commentId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;

  /**
   * Add like to comment
   */
  addLike(commentId: string, userId: string): Promise<CommentEntity | null>;

  /**
   * Remove like from comment
   */
  removeLike(commentId: string, userId: string): Promise<CommentEntity | null>;

  /**
   * Increment replies count for parent comment
   */
  incrementRepliesCount(commentId: string): Promise<CommentEntity | null>;

  /**
   * Decrement replies count for parent comment
   */
  decrementRepliesCount(commentId: string): Promise<CommentEntity | null>;

  /**
   * Get comment with full details (including user info)
   */
  findByIdWithUser(id: string): Promise<CommentEntity | null>;

  /**
   * Get comments with nested structure (hierarchical)
   */
  findByPostIdWithNested(postId: string, pagination?: CommentPagination): Promise<PaginatedComments>;

  /**
   * Count comments by post ID
   */
  countByPostId(postId: string): Promise<number>;

  /**
   * Count replies for a comment
   */
  countReplies(commentId: string): Promise<number>;

  /**
   * Get recent comments for a post
   */
  getRecentByPostId(postId: string, limit?: number): Promise<CommentEntity[]>;

  /**
   * Get most liked comments for a post
   */
  getMostLikedByPostId(postId: string, limit?: number): Promise<CommentEntity[]>;

  /**
   * Delete all comments for a post (cascade delete)
   */
  deleteByPostId(postId: string): Promise<number>;

  /**
   * Delete all comments by user
   */
  deleteByUserId(userId: string): Promise<number>;

  /**
   * Delete comment and all its replies (cascade)
   */
  deleteWithReplies(commentId: string): Promise<number>;

  /**
   * Get total comments count for user
   */
  countUserComments(userId: string): Promise<number>;
}
