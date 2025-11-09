/**
 * Product Review Repository Interface
 */

import { ProductReviewEntity } from '../entities/ProductReview.entity';

export interface ProductReviewFilters {
  productId?: string;
  userId?: string;
  parentReviewId?: string | null;
  level?: number;
  hasImages?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface ProductReviewSorting {
  sortBy: 'createdAt' | 'rating';
  order: 'asc' | 'desc';
}

export interface ProductReviewPagination {
  page: number;
  limit: number;
}

export interface PaginatedProductReviews {
  reviews: ProductReviewEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ProductReviewRatingSummary {
  average: number;
  totalReviews: number;
  distribution: Record<string, number>;
}

export interface IProductReviewRepository {
  findById(id: string): Promise<ProductReviewEntity | null>;
  findByIdWithUser(id: string): Promise<ProductReviewEntity | null>;
  create(review: Omit<ProductReviewEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductReviewEntity>;
  update(id: string, data: Partial<ProductReviewEntity>): Promise<ProductReviewEntity | null>;
  delete(id: string): Promise<boolean>;
  deleteWithReplies(id: string): Promise<number>;
  findAll(
    filters?: ProductReviewFilters,
    sorting?: ProductReviewSorting,
    pagination?: ProductReviewPagination
  ): Promise<PaginatedProductReviews>;
  findByProductId(
    productId: string,
    pagination?: ProductReviewPagination
  ): Promise<PaginatedProductReviews>;
  findByProductIdWithNested(
    productId: string,
    pagination?: ProductReviewPagination
  ): Promise<PaginatedProductReviews>;
  findReplies(
    parentReviewId: string,
    pagination?: ProductReviewPagination
  ): Promise<PaginatedProductReviews>;
  incrementRepliesCount(reviewId: string): Promise<ProductReviewEntity | null>;
  decrementRepliesCount(reviewId: string): Promise<ProductReviewEntity | null>;
  getRatingSummary(productId: string): Promise<ProductReviewRatingSummary>;
}
