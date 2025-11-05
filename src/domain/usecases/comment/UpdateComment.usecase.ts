import { ICommentRepository } from '../../repositories/ICommentRepository';
import { CommentEntity } from '../../entities/Comment.entity';

export interface UpdateCommentDTO {
  commentId: string;
  userId: string; // For authorization
  content?: string;
  images?: string[];
  cloudinaryPublicIds?: string[];
}

/**
 * Use Case: Update Comment
 */
export class UpdateCommentUseCase {
  constructor(private commentRepository: ICommentRepository) {}

  async execute(dto: UpdateCommentDTO): Promise<CommentEntity> {
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
    if (!existingComment.canBeEditedBy(dto.userId)) {
      throw new Error('Bạn không có quyền chỉnh sửa bình luận này');
    }

    // Validate content
    if (dto.content !== undefined) {
      if (dto.content.trim().length === 0) {
        throw new Error('Nội dung bình luận không được để trống');
      }

      if (dto.content.length > 2000) {
        throw new Error('Nội dung bình luận không được vượt quá 2,000 ký tự');
      }
    }

    // Validate images
    if (dto.images && dto.images.length > 5) {
      throw new Error('Số lượng hình ảnh không được vượt quá 5');
    }

    if (dto.images && dto.cloudinaryPublicIds && dto.images.length !== dto.cloudinaryPublicIds.length) {
      throw new Error('Số lượng hình ảnh và public IDs không khớp');
    }

    // Prepare update data
    const updateData: Partial<CommentEntity> = {
      isEdited: true,
      editedAt: new Date(),
    };

    if (dto.content !== undefined) {
      updateData.content = dto.content.trim();
    }

    if (dto.images !== undefined) {
      updateData.images = dto.images;
      updateData.cloudinaryPublicIds = dto.cloudinaryPublicIds || [];
    }

    // Update comment
    const updatedComment = await this.commentRepository.update(dto.commentId, updateData);

    if (!updatedComment) {
      throw new Error('Không thể cập nhật bình luận');
    }

    return updatedComment;
  }
}
