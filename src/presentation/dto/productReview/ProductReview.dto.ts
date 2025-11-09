import { ProductReviewEntity } from '../../../domain/entities/ProductReview.entity';
import { ProductReviewRatingSummary } from '../../../domain/repositories/IProductReviewRepository';

export interface ProductReviewUserDTO {
  id: string;
  userName?: string;
  email: string;
  avatar?: string;
}

export interface ProductReviewDTO {
  id: string;
  productId: string;
  userId: string;
  user?: ProductReviewUserDTO;
  rating?: number;
  content: string;
  images: string[];
  parentReviewId?: string;
  level: number;
  mentionedUserId?: string;
  mentionedUser?: ProductReviewUserDTO;
  replies?: ProductReviewDTO[];
  repliesCount: number;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviewSummaryDTO {
  average: number;
  totalReviews: number;
  distribution: Record<string, number>;
}

export interface PaginatedProductReviewsDTO {
  reviews: ProductReviewDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  summary: ProductReviewSummaryDTO;
}

export class ProductReviewMapper {
  static toDTO(entity: ProductReviewEntity): ProductReviewDTO {
    return {
      id: entity.id,
      productId: entity.productId,
      userId: entity.userId,
      user: (entity as any).user,
      rating: entity.rating,
      content: entity.content,
      images: entity.images,
      parentReviewId: entity.parentReviewId,
      level: entity.level,
      mentionedUserId: entity.mentionedUserId,
      mentionedUser: (entity as any).mentionedUser,
      replies: (entity as any).replies?.map((reply: ProductReviewEntity) => this.toDTO(reply)),
      repliesCount: entity.repliesCount,
      isEdited: entity.isEdited,
      editedAt: entity.editedAt?.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  static toDTOs(entities: ProductReviewEntity[]): ProductReviewDTO[] {
    return entities.map((entity) => this.toDTO(entity));
  }

  static buildNestedStructure(entities: ProductReviewEntity[]): ProductReviewDTO[] {
    const map = new Map<string, ProductReviewDTO>();
    const roots: ProductReviewDTO[] = [];

    entities.forEach((entity) => {
      const dto = this.toDTO(entity);
      dto.replies = [];
      map.set(entity.id, dto);
    });

    entities.forEach((entity) => {
      const dto = map.get(entity.id);
      if (!dto) return;
      if (!entity.parentReviewId) {
        roots.push(dto);
        return;
      }
      const parent = map.get(entity.parentReviewId);
      if (parent) {
        if (!parent.replies) {
          parent.replies = [];
        }
        parent.replies.push(dto);
      }
    });

    return roots;
  }

  static summaryToDTO(summary: ProductReviewRatingSummary): ProductReviewSummaryDTO {
    return {
      average: summary.average,
      totalReviews: summary.totalReviews,
      distribution: summary.distribution
    };
  }
}
