import { IPostRepository } from '../../repositories/IPostRepository';
import { ICommentRepository } from '../../repositories/ICommentRepository';

export interface DeletePostDTO {
  postId: string;
  userId: string; // For authorization
  isAdmin?: boolean; // Admin can delete any post
}

/**
 * Use Case: Delete Post
 */
export class DeletePostUseCase {
  constructor(
    private postRepository: IPostRepository,
    private commentRepository: ICommentRepository
  ) {}

  async execute(dto: DeletePostDTO): Promise<boolean> {
    // Validate input
    if (!dto.postId || dto.postId.trim().length === 0) {
      throw new Error('Post ID không được để trống');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID không được để trống');
    }

    // Get existing post
    const existingPost = await this.postRepository.findById(dto.postId);

    if (!existingPost) {
      throw new Error('Không tìm thấy bài viết');
    }

    // Check authorization
    if (!existingPost.canBeDeletedBy(dto.userId, dto.isAdmin)) {
      throw new Error('Bạn không có quyền xóa bài viết này');
    }

    // Delete all comments for this post (cascade delete)
    await this.commentRepository.deleteByPostId(dto.postId);

    // Delete the post
    const deleted = await this.postRepository.delete(dto.postId);

    if (!deleted) {
      throw new Error('Không thể xóa bài viết');
    }

    return true;
  }
}
