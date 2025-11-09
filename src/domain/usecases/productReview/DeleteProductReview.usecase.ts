import { IProductRepository } from '../../repositories/IProductRepository';
import { IProductReviewRepository, ProductReviewRatingSummary } from '../../repositories/IProductReviewRepository';

export interface DeleteProductReviewDTO {
  reviewId: string;
  userId: string;
  isAdmin?: boolean;
}

export interface DeleteProductReviewResult {
  deleted: boolean;
  summary: ProductReviewRatingSummary;
}

export class DeleteProductReviewUseCase {
  constructor(
    private readonly reviewRepository: IProductReviewRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(dto: DeleteProductReviewDTO): Promise<DeleteProductReviewResult> {
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
      throw new Error('Bạn không có quyền xóa đánh giá này');
    }

    const parentId = existing.parentReviewId;
    const deletedCount = await this.reviewRepository.deleteWithReplies(dto.reviewId);

    if (parentId) {
      await this.reviewRepository.decrementRepliesCount(parentId);
    }

    const summary = await this.refreshProductRating(existing.productId);

    return {
      deleted: deletedCount > 0,
      summary
    };
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
