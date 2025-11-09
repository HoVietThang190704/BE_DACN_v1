import { IProductRepository } from '../../repositories/IProductRepository';
import {
  IProductReviewRepository,
  ProductReviewRatingSummary
} from '../../repositories/IProductReviewRepository';
import { ProductReviewEntity } from '../../entities/ProductReview.entity';

export interface UpdateProductReviewDTO {
  reviewId: string;
  userId: string;
  content?: string;
  rating?: number;
  images?: string[];
  cloudinaryPublicIds?: string[];
  isAdmin?: boolean;
}

export interface UpdateProductReviewResult {
  review: ProductReviewEntity;
  summary: ProductReviewRatingSummary;
}

export class UpdateProductReviewUseCase {
  constructor(
    private readonly reviewRepository: IProductReviewRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(dto: UpdateProductReviewDTO): Promise<UpdateProductReviewResult> {
    if (!dto.reviewId) {
      throw new Error('Review ID không được để trống');
    }

    if (!dto.userId) {
      throw new Error('User ID không được để trống');
    }

    const existing = await this.reviewRepository.findById(dto.reviewId);
    if (!existing) {
      throw new Error('Không tìm thấy đánh giá');
    }

    if (existing.userId !== dto.userId && !dto.isAdmin) {
      throw new Error('Bạn không có quyền chỉnh sửa đánh giá này');
    }

    const updates: Partial<ProductReviewEntity> = { updatedAt: new Date() };

    if (dto.content !== undefined) {
      if (!dto.content || dto.content.trim().length === 0) {
        throw new Error('Nội dung đánh giá không được để trống');
      }
      updates.content = dto.content.trim();
      updates.isEdited = true;
      updates.editedAt = new Date();
    }

    if (dto.images) {
      if (dto.images.length > 5) {
        throw new Error('Bạn chỉ có thể tải lên tối đa 5 hình ảnh');
      }
      updates.images = dto.images;
      if (dto.cloudinaryPublicIds) {
        updates.cloudinaryPublicIds = dto.cloudinaryPublicIds;
      }
    }

    if (dto.rating !== undefined) {
      if (!existing.isTopLevel()) {
        throw new Error('Chỉ đánh giá cấp 1 mới được chỉnh sửa số sao');
      }
      if (dto.rating < 1 || dto.rating > 5) {
        throw new Error('Đánh giá phải nằm trong khoảng 1 đến 5');
      }
      if (!Number.isInteger(dto.rating * 2)) {
        throw new Error('Đánh giá chỉ chấp nhận increment 0.5');
      }
      updates.rating = dto.rating;
    }

    const updated = await this.reviewRepository.update(dto.reviewId, updates);
    if (!updated) {
      throw new Error('Không thể cập nhật đánh giá');
    }

    const summary = await this.refreshProductRating(existing.productId);

    return { review: updated, summary };
  }

  private async refreshProductRating(productId: string): Promise<ProductReviewRatingSummary> {
    const summary = await this.reviewRepository.getRatingSummary(productId);
    await this.productRepository.updateRatingSummary(productId, {
      rating: summary.average,
      reviewCount: summary.totalReviews
    });
    return summary;
  }
}
