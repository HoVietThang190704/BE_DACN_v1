import { CommentEntity } from '../../../domain/entities/Comment.entity';

/**
 * Comment DTO - Data Transfer Object for API responses
 */
export interface CommentDTO {
  id: string;
  postId: string;
  userId: string;
  user?: {
    id: string;
    userName?: string;
    email: string;
    avatar?: string;
  };
  content: string;
  images: string[];
  
  // Nested structure
  parentCommentId?: string;
  level: number;
  mentionedUserId?: string;
  mentionedUser?: {
    id: string;
    userName?: string;
    email: string;
    avatar?: string;
  };
  replies?: CommentDTO[]; // Nested replies
  
  // Engagement
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean; // If current user has liked
  
  // Metadata
  isEdited: boolean;
  editedAt?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Comment Request DTO
 */
export interface CreateCommentRequestDTO {
  postId: string;
  content: string;
  images?: string[];
  cloudinaryPublicIds?: string[];
  parentCommentId?: string; // For replies
  mentionedUserId?: string; // User being replied to
}

/**
 * Update Comment Request DTO
 */
export interface UpdateCommentRequestDTO {
  content?: string;
  images?: string[];
  cloudinaryPublicIds?: string[];
}

/**
 * Paginated Comments Response DTO
 */
export interface PaginatedCommentsDTO {
  comments: CommentDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Comment Mapper - Convert between Entity and DTO
 */
export class CommentMapper {
  /**
   * Convert Comment Entity to DTO
   */
  static toDTO(entity: CommentEntity, currentUserId?: string, populatedData?: any): CommentDTO {
    return {
      id: entity.id,
      postId: entity.postId,
      userId: entity.userId,
      // Prefer explicit populatedData from controller; fall back to any attached user on the domain entity
      user: populatedData?.user || (entity as any).user,
      content: entity.content,
      images: entity.images,
      parentCommentId: entity.parentCommentId,
      level: entity.level,
      mentionedUserId: entity.mentionedUserId,
      // Mentioned user may be attached to the entity during repository mapping
      mentionedUser: populatedData?.mentionedUser || (entity as any).mentionedUser,
      replies: populatedData?.replies?.map((r: CommentEntity) => this.toDTO(r, currentUserId)),
      likesCount: entity.likesCount,
      repliesCount: entity.repliesCount,
      isLiked: currentUserId ? entity.isLikedBy(currentUserId) : undefined,
      isEdited: entity.isEdited,
      editedAt: entity.editedAt?.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /**
   * Convert multiple Comment Entities to DTOs
   */
  static toDTOs(entities: CommentEntity[], currentUserId?: string): CommentDTO[] {
    return entities.map(entity => this.toDTO(entity, currentUserId));
  }

  /**
   * Convert to Paginated DTO
   */
  static toPaginatedDTO(
    entities: CommentEntity[],
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    hasMore: boolean,
    currentUserId?: string
  ): PaginatedCommentsDTO {
    return {
      comments: this.toDTOs(entities, currentUserId),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore
      }
    };
  }

  /**
   * Build nested comment structure (for hierarchical display)
   */
  static buildNestedStructure(comments: CommentEntity[], currentUserId?: string): CommentDTO[] {
    const commentMap = new Map<string, CommentDTO>();
    const rootComments: CommentDTO[] = [];

    // First pass: create all comment DTOs
    comments.forEach(comment => {
      const dto = this.toDTO(comment, currentUserId);
      dto.replies = [];
      commentMap.set(comment.id, dto);
    });

    // Second pass: build tree structure
    comments.forEach(comment => {
      const dto = commentMap.get(comment.id)!;
      
      if (!comment.parentCommentId) {
        // This is a root comment
        rootComments.push(dto);
      } else {
        // This is a reply, add to parent's replies
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          if (!parent.replies) {
            parent.replies = [];
          }
          parent.replies.push(dto);
        }
      }
    });

    return rootComments;
  }
}
