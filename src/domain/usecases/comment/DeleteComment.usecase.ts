import { ICommentRepository } from '../../repositories/ICommentRepository';
import { IPostRepository } from '../../repositories/IPostRepository';

export interface DeleteCommentDTO {
  commentId: string;
  userId: string;
  isAdmin?: boolean;
}

export class DeleteCommentUseCase {
  constructor(
    private commentRepository: ICommentRepository,
    private postRepository: IPostRepository
  ) {}

  async execute(dto: DeleteCommentDTO): Promise<boolean> {
    if (!dto.commentId || dto.commentId.trim().length === 0) {
      throw new Error('Comment ID không được để trống');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID không được để trống');
    }

    const existingComment = await this.commentRepository.findById(dto.commentId);

    if (!existingComment) {
      throw new Error('Không tìm thấy bình luận');
    }

    if (!existingComment.canBeDeletedBy(dto.userId, dto.isAdmin)) {
      throw new Error('Bạn không có quyền xóa bình luận này');
    }

    const deletedCount = await this.commentRepository.deleteWithReplies(dto.commentId);

    await this.postRepository.decrementCommentsCount(existingComment.postId);

    if (existingComment.parentCommentId) {
      await this.commentRepository.decrementRepliesCount(existingComment.parentCommentId);
    }

    return deletedCount > 0;
  }
} 
