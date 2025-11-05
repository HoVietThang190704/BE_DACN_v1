import { PostEntity } from '../../../domain/entities/Post.entity';

/**
 * Post DTO - Data Transfer Object for API responses
 */
export interface PostDTO {
  id: string;
  userId: string;
  user?: {
    id: string;
    userName?: string;
    email: string;
    avatar?: string;
  };
  content: string;
  images: string[];
  
  // Engagement
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean; // If current user has liked
  
  // Metadata
  visibility: 'public' | 'friends' | 'private';
  isEdited: boolean;
  editedAt?: string;
  
  // Sharing
  originalPostId?: string;
  originalPost?: PostDTO; // Nested post if shared
  sharedBy?: {
    id: string;
    userName?: string;
    avatar?: string;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Post Request DTO
 */
export interface CreatePostRequestDTO {
  content: string;
  images?: string[];
  cloudinaryPublicIds?: string[];
  visibility?: 'public' | 'friends' | 'private';
}

/**
 * Update Post Request DTO
 */
export interface UpdatePostRequestDTO {
  content?: string;
  images?: string[];
  cloudinaryPublicIds?: string[];
  visibility?: 'public' | 'friends' | 'private';
}

/**
 * Share Post Request DTO
 */
export interface SharePostRequestDTO {
  originalPostId: string;
  content?: string;
}

/**
 * Paginated Posts Response DTO
 */
export interface PaginatedPostsDTO {
  posts: PostDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Post Mapper - Convert between Entity and DTO
 */
export class PostMapper {
  /**
   * Convert Post Entity to DTO
   */
  static toDTO(entity: PostEntity, currentUserId?: string, populatedData?: any): PostDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      // prefer explicit populatedData passed from controller, else fall back to any populated
      // user attached directly on the entity by the repository
      user: populatedData?.user ?? (entity as any).user,
      content: entity.content,
      images: entity.images,
      likesCount: entity.likesCount,
      commentsCount: entity.commentsCount,
      sharesCount: entity.sharesCount,
      isLiked: currentUserId ? entity.isLikedBy(currentUserId) : undefined,
      visibility: entity.visibility,
      isEdited: entity.isEdited,
      editedAt: entity.editedAt?.toISOString(),
      originalPostId: entity.originalPostId,
      // originalPost/sharedBy may be provided via populatedData or attached on entity
      originalPost: populatedData?.originalPost ? this.toDTO(populatedData.originalPost) : (entity as any).originalPost ? this.toDTO((entity as any).originalPost) : undefined,
      sharedBy: populatedData?.sharedBy ?? (entity as any).sharedBy,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /**
   * Convert multiple Post Entities to DTOs
   */
  static toDTOs(entities: PostEntity[], currentUserId?: string): PostDTO[] {
    return entities.map(entity => this.toDTO(entity, currentUserId));
  }

  /**
   * Convert to Paginated DTO
   */
  static toPaginatedDTO(
    entities: PostEntity[],
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    hasMore: boolean,
    currentUserId?: string
  ): PaginatedPostsDTO {
    return {
      posts: this.toDTOs(entities, currentUserId),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore
      }
    };
  }
}
