import { Request, Response } from 'express';
import {
  CreateProductReviewUseCase,
  UpdateProductReviewUseCase,
  DeleteProductReviewUseCase,
  GetProductReviewsUseCase,
  GetProductReviewRepliesUseCase
} from '../../domain/usecases/productReview';
import { ProductReviewMapper } from '../dto/productReview/ProductReview.dto';

export class ProductReviewController {
  constructor(
    private readonly createReviewUseCase: CreateProductReviewUseCase,
    private readonly updateReviewUseCase: UpdateProductReviewUseCase,
    private readonly deleteReviewUseCase: DeleteProductReviewUseCase,
    private readonly getReviewsUseCase: GetProductReviewsUseCase,
    private readonly getRepliesUseCase: GetProductReviewRepliesUseCase
  ) {}

  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { productId, content, rating, parentReviewId, images, cloudinaryPublicIds, mentionedUserId } = req.body;
      const result = await this.createReviewUseCase.execute({
        productId,
        userId,
        content,
        rating,
        parentReviewId,
        images,
        cloudinaryPublicIds,
        mentionedUserId
      });

      res.status(201).json({
        success: true,
        data: {
          review: ProductReviewMapper.toDTO(result.review),
          summary: ProductReviewMapper.summaryToDTO(result.summary)
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Không thể tạo đánh giá' });
    }
  }

  async updateReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { reviewId } = req.params;
      const { content, rating, images, cloudinaryPublicIds } = req.body;

      const result = await this.updateReviewUseCase.execute({
        reviewId,
        userId,
        content,
        rating,
        images,
        cloudinaryPublicIds
      });

      res.status(200).json({
        success: true,
        data: {
          review: ProductReviewMapper.toDTO(result.review),
          summary: ProductReviewMapper.summaryToDTO(result.summary)
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Không thể cập nhật đánh giá' });
    }
  }

  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { reviewId } = req.params;
      const result = await this.deleteReviewUseCase.execute({
        reviewId,
        userId
      });

      res.status(200).json({
        success: result.deleted,
        data: {
          summary: ProductReviewMapper.summaryToDTO(result.summary)
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Không thể xóa đánh giá' });
    }
  }

  async getReviewsByProduct(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const result = await this.getReviewsUseCase.execute({
        productId,
        pagination: { page, limit }
      });

      const nested = ProductReviewMapper.buildNestedStructure(result.reviews.reviews);

      res.status(200).json({
        success: true,
        data: {
          reviews: nested,
          pagination: {
            total: result.reviews.total,
            page: result.reviews.page,
            limit: result.reviews.limit,
            totalPages: result.reviews.totalPages,
            hasMore: result.reviews.hasMore
          },
          summary: ProductReviewMapper.summaryToDTO(result.summary)
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Không thể lấy danh sách đánh giá' });
    }
  }

  async getReplies(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const result = await this.getRepliesUseCase.execute(reviewId, { page, limit });

      res.status(200).json({
        success: true,
        data: {
          reviews: ProductReviewMapper.toDTOs(result.reviews),
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
            hasMore: result.hasMore
          }
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Không thể lấy phản hồi' });
    }
  }
}
