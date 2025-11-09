import {
  IProductReviewRepository,
  ProductReviewPagination,
  ProductReviewRatingSummary,
  PaginatedProductReviews
} from '../../repositories/IProductReviewRepository';

export interface GetProductReviewsInput {
  productId: string;
  pagination?: ProductReviewPagination;
}

export interface GetProductReviewsResult {
  reviews: PaginatedProductReviews;
  summary: ProductReviewRatingSummary;
}

export class GetProductReviewsUseCase {
  constructor(private readonly reviewRepository: IProductReviewRepository) {}

  async execute(input: GetProductReviewsInput): Promise<GetProductReviewsResult> {
    if (!input.productId) {
      throw new Error('Product ID không được để trống');
    }

    const pagination = input.pagination ?? { page: 1, limit: 10 };
    const reviews = await this.reviewRepository.findByProductIdWithNested(
      input.productId,
      pagination
    );

    const summary = await this.reviewRepository.getRatingSummary(input.productId);

    return {
      reviews,
      summary
    };
  }
}

export class GetProductReviewRepliesUseCase {
  constructor(private readonly reviewRepository: IProductReviewRepository) {}

  async execute(reviewId: string, pagination?: ProductReviewPagination): Promise<PaginatedProductReviews> {
    if (!reviewId) {
      throw new Error('Review ID không được để trống');
    }

    return this.reviewRepository.findReplies(reviewId, pagination ?? { page: 1, limit: 10 });
  }
}
