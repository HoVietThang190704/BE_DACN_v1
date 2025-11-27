import { IProductRepository } from '../../repositories/IProductRepository';
import {
  IProductReviewRepository,
  ProductReviewRatingSummary
} from '../../repositories/IProductReviewRepository';
import { ProductReviewEntity } from '../../entities/ProductReview.entity';

export interface CreateProductReviewDTO {
  productId: string;
  userId: string;
  content: string;
  rating?: number;
  images?: string[];
  cloudinaryPublicIds?: string[];
  parentReviewId?: string;
  mentionedUserId?: string;
}

export interface CreateProductReviewResult {
  review: ProductReviewEntity;
  summary: ProductReviewRatingSummary;
}

export class CreateProductReviewUseCase {
  constructor(
    private readonly reviewRepository: IProductReviewRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(dto: CreateProductReviewDTO): Promise<CreateProductReviewResult> {
    if (!dto.productId) {
      throw new Error('Product ID không được để trống');
    }

    if (!dto.userId) {
      throw new Error('User ID không được để trống');
    }

    if (!dto.content || dto.content.trim().length === 0) {
      throw new Error('Nội dung đánh giá không được để trống');
    }

    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    let level = 0;
    let parentReviewId: string | undefined;
    if (dto.parentReviewId) {
      const parent = await this.reviewRepository.findById(dto.parentReviewId);
      if (!parent) {
        throw new Error('Không tìm thấy đánh giá cha');
      }
      if (parent.productId !== dto.productId) {
        throw new Error('Đánh giá cha không thuộc sản phẩm này');
      }
      if (!parent.canHaveReplies()) {
        throw new Error('Không thể trả lời quá 3 cấp bình luận');
      }
      level = parent.level + 1;
      parentReviewId = parent.id;
    }

    if (level === 0) {
      // prevent a user from submitting more than one top-level review (rating) per product
      try {
        const existing = await this.reviewRepository.findAll({ productId: dto.productId, userId: dto.userId, level: 0 }, undefined, { page: 1, limit: 1 });
        if (existing.total > 0) {
          throw new Error('Bạn đã đánh giá sản phẩm này trước đó. Vui lòng phản hồi (reply) vào đánh giá trước đó nếu bạn muốn thêm ý kiến.');
        }
      } catch (err) {
        // if repository throws, rethrow to surface the error to the caller
        if (err instanceof Error) throw err;
      }
      if (dto.rating === undefined || dto.rating === null) {
        throw new Error('Vui lòng chọn số sao đánh giá');
      }
      if (dto.rating < 1 || dto.rating > 5) {
        throw new Error('Đánh giá phải nằm trong khoảng 1 đến 5');
      }
      if (!Number.isInteger(dto.rating * 2)) {
        throw new Error('Đánh giá chỉ chấp nhận increment 0.5');
      }
    } else if (dto.rating !== undefined) {
      throw new Error('Phản hồi không được phép có đánh giá sao');
    }

    if (dto.images && dto.images.length > 5) {
      throw new Error('Bạn chỉ có thể tải lên tối đa 5 hình ảnh');
    }

    const review = await this.reviewRepository.create({
      productId: dto.productId,
      userId: dto.userId,
      rating: level === 0 ? dto.rating : undefined,
      content: dto.content.trim(),
      images: dto.images || [],
      cloudinaryPublicIds: dto.cloudinaryPublicIds || [],
      parentReviewId,
      level,
      mentionedUserId: dto.mentionedUserId,
      repliesCount: 0,
      isEdited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      editedAt: undefined
    } as any);

    if (parentReviewId) {
      await this.reviewRepository.incrementRepliesCount(parentReviewId);
    }

    const summary = await this.refreshProductRating(dto.productId);

    return { review, summary };
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
