import { PostEntity } from '../entities/Post.entity';

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
  findById(id: string): Promise<PostEntity | null>;

  findAll(
    filters?: PostFilters,
    sorting?: PostSorting,
    pagination?: PostPagination
  ): Promise<PaginatedPosts>;

  create(post: Omit<PostEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<PostEntity>;

  update(id: string, data: Partial<PostEntity>): Promise<PostEntity | null>;

  delete(id: string): Promise<boolean>;

  count(filters?: PostFilters): Promise<number>;

  exists(id: string): Promise<boolean>;

  findByUserId(userId: string, pagination?: PostPagination): Promise<PaginatedPosts>;

  findPublicPosts(pagination?: PostPagination): Promise<PaginatedPosts>;

  findFeedPosts(userId: string, friendIds: string[], pagination?: PostPagination): Promise<PaginatedPosts>;

  findTrending(limit?: number, timeWindow?: number): Promise<PostEntity[]>;

  search(query: string, pagination?: PostPagination): Promise<PaginatedPosts>;

  toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;

  addLike(postId: string, userId: string): Promise<PostEntity | null>;

  removeLike(postId: string, userId: string): Promise<PostEntity | null>;

  incrementCommentsCount(postId: string): Promise<PostEntity | null>;

  decrementCommentsCount(postId: string): Promise<PostEntity | null>;

  incrementSharesCount(postId: string): Promise<PostEntity | null>;

  sharePost(originalPostId: string, userId: string, content?: string): Promise<PostEntity>;

  findByIdWithUser(id: string): Promise<PostEntity | null>;

  findLikedByUser(userId: string, pagination?: PostPagination): Promise<PaginatedPosts>;

  findSharedByUser(userId: string, pagination?: PostPagination): Promise<PaginatedPosts>;

  findWithImages(userId?: string, pagination?: PostPagination): Promise<PaginatedPosts>;

  countUserPosts(userId: string): Promise<number>;

  getTotalLikesForUser(userId: string): Promise<number>;

  getMostLiked(limit?: number, timeWindow?: number): Promise<PostEntity[]>;

  getMostCommented(limit?: number, timeWindow?: number): Promise<PostEntity[]>;

  bulkDeleteByUser(userId: string): Promise<number>;
}
