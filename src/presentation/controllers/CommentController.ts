import { Request, Response } from 'express';
import {
  CreateCommentUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
  GetCommentsByPostIdUseCase,
  GetCommentRepliesUseCase,
  ToggleLikeCommentUseCase
} from '../../domain/usecases/comment';
import { CommentMapper } from '../dto/comment/Comment.dto';

export class CommentController {
  constructor(
    private createCommentUseCase: CreateCommentUseCase,
    private updateCommentUseCase: UpdateCommentUseCase,
    private deleteCommentUseCase: DeleteCommentUseCase,
    private getCommentsByPostIdUseCase: GetCommentsByPostIdUseCase,
    private getCommentRepliesUseCase: GetCommentRepliesUseCase,
    private toggleLikeCommentUseCase: ToggleLikeCommentUseCase
  ) {}

  /**
   * Helper: Map comment with user data
   */
  private mapCommentWithUser(comment: any, currentUserId?: string) {
    return CommentMapper.toDTO(
      comment,
      currentUserId,
      {
        user: (comment as any).user,
        mentionedUser: (comment as any).mentionedUser
      }
    );
  }

  /**
   * Create a new comment
   * POST /api/comments
   */
  async createComment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { postId, content, parentCommentId, images, mentionedUserId } = req.body;

      const comment = await this.createCommentUseCase.execute({
        postId,
        userId,
        content,
        parentCommentId,
        images: images || [],
        mentionedUserId
      });

      res.status(201).json({
        success: true,
        data: this.mapCommentWithUser(comment, userId)
      });
    } catch (error: any) {
      console.error('Error creating comment:', error);
      res.status(400).json({ message: error.message || 'Failed to create comment' });
    }
  }

  /**
   * Update a comment
   * PUT /api/comments/:commentId
   */
  async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { commentId } = req.params;
      const { content, images } = req.body;

      const comment = await this.updateCommentUseCase.execute({
        commentId,
        userId,
        content,
        images
      });

      res.status(200).json({
        success: true,
        data: this.mapCommentWithUser(comment, userId)
      });
    } catch (error: any) {
      console.error('Error updating comment:', error);
      res.status(400).json({ message: error.message || 'Failed to update comment' });
    }
  }

  /**
   * Delete a comment
   * DELETE /api/comments/:commentId
   */
  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { commentId } = req.params;

      await this.deleteCommentUseCase.execute({
        commentId,
        userId
      });

      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      res.status(400).json({ message: error.message || 'Failed to delete comment' });
    }
  }

  /**
   * Get comments by post ID (with nested replies)
   * GET /api/comments/post/:postId
   */
  async getCommentsByPostId(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const withNested = req.query.withNested === 'true';

      const result = await this.getCommentsByPostIdUseCase.execute({
        postId,
        withNested,
        pagination: { page, limit }
      });

      const currentUserId = (req as any).user?.id;

      // If nested requested, build a hierarchical structure before mapping to DTOs
      if (withNested) {
        // result.comments is a flat list (top-level + all replies). Build nested structure.
        const nested = CommentMapper.buildNestedStructure(result.comments, currentUserId);

        // Map nested DTOs (they already include replies arrays) but we still ensure current user like flag handled by mapper
        res.status(200).json({
          success: true,
          data: {
            comments: nested.map((c: any) => c),
            pagination: {
              total: result.total,
              page: result.page,
              limit: result.limit,
              totalPages: result.totalPages,
              hasMore: result.hasMore
            }
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          comments: result.comments.map(c => this.mapCommentWithUser(c, currentUserId)),
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
      console.error('Error getting comments:', error);
      res.status(400).json({ message: error.message || 'Failed to get comments' });
    }
  }

  /**
   * Get comment replies
   * GET /api/comments/:commentId/replies
   */
  async getCommentReplies(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.getCommentRepliesUseCase.execute(
        commentId,
        { page, limit }
      );

      const currentUserId = (req as any).user?.id;
      res.status(200).json({
        success: true,
        data: {
          comments: result.comments.map(c => this.mapCommentWithUser(c, currentUserId)),
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
      console.error('Error getting comment replies:', error);
      res.status(400).json({ message: error.message || 'Failed to get replies' });
    }
  }

  /**
   * Toggle like on comment
   * POST /api/comments/:commentId/like
   */
  async toggleLike(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { commentId } = req.params;

      const result = await this.toggleLikeCommentUseCase.execute({
        commentId,
        userId
      });

      // Return in consistent wrapper { success, data }
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error toggling comment like:', error);
      res.status(400).json({ message: error.message || 'Failed to toggle like' });
    }
  }

  /**
   * Upload images for comment
   * POST /api/comments/upload
   */
  async uploadImages(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Handle image upload (integrate with Cloudinary or file storage)
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ message: 'No images provided' });
        return;
      }

      // TODO: Upload to Cloudinary
      const imageUrls: string[] = [];
      
      res.status(200).json({ images: imageUrls });
    } catch (error: any) {
      console.error('Error uploading images:', error);
      res.status(500).json({ message: error.message || 'Failed to upload images' });
    }
  }
}
