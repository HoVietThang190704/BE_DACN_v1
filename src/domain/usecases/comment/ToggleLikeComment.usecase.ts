import { ICommentRepository } from '../../repositories/ICommentRepository';

export interface ToggleLikeCommentDTO {
  commentId: string;
  userId: string;
}

/**
 * Use Case: Toggle Like Comment
 */
export class ToggleLikeCommentUseCase {
  constructor(private commentRepository: ICommentRepository) {}

  async execute(dto: ToggleLikeCommentDTO): Promise<{ liked: boolean; likesCount: number }> {
    // Validate input
    if (!dto.commentId || dto.commentId.trim().length === 0) {
      throw new Error('Comment ID không được để trống');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID không được để trống');
    }

    // Check if comment exists
    const comment = await this.commentRepository.findById(dto.commentId);

    if (!comment) {
      throw new Error('Không tìm thấy bình luận');
    }

    // Toggle like
    const result = await this.commentRepository.toggleLike(dto.commentId, dto.userId);

    return result;
  }
}
