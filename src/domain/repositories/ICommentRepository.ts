import { CommentEntity } from '../entities/Comment.entity';

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
  findById(id: string): Promise<CommentEntity | null>;

  findAll(
    filters?: CommentFilters,
    sorting?: CommentSorting,
    pagination?: CommentPagination
  ): Promise<PaginatedComments>;

  create(comment: Omit<CommentEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommentEntity>;

  update(id: string, data: Partial<CommentEntity>): Promise<CommentEntity | null>;

  delete(id: string): Promise<boolean>;

  count(filters?: CommentFilters): Promise<number>;

  exists(id: string): Promise<boolean>;

  findByPostId(postId: string, pagination?: CommentPagination): Promise<PaginatedComments>;

  findReplies(parentCommentId: string, pagination?: CommentPagination): Promise<PaginatedComments>;

  findThread(parentCommentId: string): Promise<CommentEntity[]>;

  findByUserId(userId: string, pagination?: CommentPagination): Promise<PaginatedComments>;

  toggleLike(commentId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;

  addLike(commentId: string, userId: string): Promise<CommentEntity | null>;

  removeLike(commentId: string, userId: string): Promise<CommentEntity | null>;

  incrementRepliesCount(commentId: string): Promise<CommentEntity | null>;

  decrementRepliesCount(commentId: string): Promise<CommentEntity | null>;

  findByIdWithUser(id: string): Promise<CommentEntity | null>;

  findByPostIdWithNested(postId: string, pagination?: CommentPagination): Promise<PaginatedComments>;

  countByPostId(postId: string): Promise<number>;

  countReplies(commentId: string): Promise<number>;

  getRecentByPostId(postId: string, limit?: number): Promise<CommentEntity[]>;

  getMostLikedByPostId(postId: string, limit?: number): Promise<CommentEntity[]>;

  deleteByPostId(postId: string): Promise<number>;

  deleteByUserId(userId: string): Promise<number>;

  deleteWithReplies(commentId: string): Promise<number>;

  countUserComments(userId: string): Promise<number>;
}
