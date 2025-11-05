import { ICommentRepository } from '../../repositories/ICommentRepository';
import { IPostRepository } from '../../repositories/IPostRepository';

export interface DeleteCommentDTO {
  commentId: string;
  userId: string; // For authorization
  isAdmin?: boolean; // Admin can delete any comment
}

/**
 * Use Case: Delete Comment
 */
export class DeleteCommentUseCase {
  constructor(
    private commentRepository: ICommentRepository,
    private postRepository: IPostRepository
  ) {}

  async execute(dto: DeleteCommentDTO): Promise<boolean> {
    // Validate input
    if (!dto.commentId || dto.commentId.trim().length === 0) {
      throw new Error('Comment ID không được để trống');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID không được để trống');
    }

    // Get existing comment
    const existingComment = await this.commentRepository.findById(dto.commentId);

    if (!existingComment) {
      throw new Error('Không tìm thấy bình luận');
    }

    // Check authorization
    if (!existingComment.canBeDeletedBy(dto.userId, dto.isAdmin)) {
      throw new Error('Bạn không có quyền xóa bình luận này');
    }

    // Delete comment and all its replies (cascade delete)
    const deletedCount = await this.commentRepository.deleteWithReplies(dto.commentId);

    // Decrement comments count on post
    await this.postRepository.decrementCommentsCount(existingComment.postId);

    // If this comment has a parent, decrement replies count on parent
    if (existingComment.parentCommentId) {
      await this.commentRepository.decrementRepliesCount(existingComment.parentCommentId);
    }

    return deletedCount > 0;
  }
}
