import { PostEntity } from '../entities/Post.entity';

/**
 * Post Repository Interface - Contract for data access
 * Define all data operations needed by use cases
 */

export interface PostFilters {
  userId?: string;
  visibility?: 'public' | 'friends' | 'private';
  hasImages?: boolean;
  isShared?: boolean;
  originalPostId?: string;
  search?: string; // Search in content
  minLikes?: number;
  minComments?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PostSorting {
  sortBy: 'createdAt' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'engagement';
  order: 'asc' | 'desc';
}

export interface PostPagination {
  page: number;
  limit: number;
}

export interface PaginatedPosts {
  posts: PostEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface IPostRepository {
  /**
   * Find post by ID
   */
  findById(id: string): Promise<PostEntity | null>;

  /**
   * Find all posts with filters, sorting and pagination
   */
  findAll(
    filters?: PostFilters,
    sorting?: PostSorting,
    pagination?: PostPagination
  ): Promise<PaginatedPosts>;

  /**
   * Create new post
   */
  create(post: Omit<PostEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<PostEntity>;

  /**
   * Update existing post
   */
  update(id: string, data: Partial<PostEntity>): Promise<PostEntity | null>;

  /**
   * Delete post
   */
  delete(id: string): Promise<boolean>;

  /**
   * Count posts with filters
   */
  count(filters?: PostFilters): Promise<number>;

  /**
   * Check if post exists by ID
   */
  exists(id: string): Promise<boolean>;

  /**
   * Find posts by user ID
   */
  findByUserId(userId: string, pagination?: PostPagination): Promise<PaginatedPosts>;

  /**
   * Find public posts (for feed)
   */
  findPublicPosts(pagination?: PostPagination): Promise<PaginatedPosts>;

  /**
   * Find posts for user feed (public + friends' posts)
   */
  findFeedPosts(userId: string, friendIds: string[], pagination?: PostPagination): Promise<PaginatedPosts>;

  /**
   * Find trending posts (high engagement rate)
   */
  findTrending(limit?: number, timeWindow?: number): Promise<PostEntity[]>;

  /**
   * Search posts by content
   */
  search(query: string, pagination?: PostPagination): Promise<PaginatedPosts>;

  /**
   * Toggle like on a post
   */
  toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;

  /**
   * Add like to post
   */
  addLike(postId: string, userId: string): Promise<PostEntity | null>;

  /**
   * Remove like from post
   */
  removeLike(postId: string, userId: string): Promise<PostEntity | null>;

  /**
   * Increment comments count
   */
  incrementCommentsCount(postId: string): Promise<PostEntity | null>;

  /**
   * Decrement comments count
   */
  decrementCommentsCount(postId: string): Promise<PostEntity | null>;

  /**
   * Increment shares count
   */
  incrementSharesCount(postId: string): Promise<PostEntity | null>;

  /**
   * Share a post (create new post referencing original)
   */
  sharePost(originalPostId: string, userId: string, content?: string): Promise<PostEntity>;

  /**
   * Get post with full details (including user info)
   */
  findByIdWithUser(id: string): Promise<PostEntity | null>;

  /**
   * Get posts liked by user
   */
  findLikedByUser(userId: string, pagination?: PostPagination): Promise<PaginatedPosts>;

  /**
   * Get posts shared by user
   */
  findSharedByUser(userId: string, pagination?: PostPagination): Promise<PaginatedPosts>;

  /**
   * Find posts with images
   */
  findWithImages(userId?: string, pagination?: PostPagination): Promise<PaginatedPosts>;

  /**
   * Get user's posts count
   */
  countUserPosts(userId: string): Promise<number>;

  /**
   * Get total likes for user's posts
   */
  getTotalLikesForUser(userId: string): Promise<number>;

  /**
   * Get most liked posts
   */
  getMostLiked(limit?: number, timeWindow?: number): Promise<PostEntity[]>;

  /**
   * Get most commented posts
   */
  getMostCommented(limit?: number, timeWindow?: number): Promise<PostEntity[]>;

  /**
   * Bulk delete posts by user
   */
  bulkDeleteByUser(userId: string): Promise<number>;
}
