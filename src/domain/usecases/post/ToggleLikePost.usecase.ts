import { IPostRepository } from '../../repositories/IPostRepository';

export interface ToggleLikePostDTO {
  postId: string;
  userId: string;
}

/**
 * Use Case: Toggle Like Post
 */
export class ToggleLikePostUseCase {
  constructor(private postRepository: IPostRepository) {}

  async execute(dto: ToggleLikePostDTO): Promise<{ liked: boolean; likesCount: number }> {
    // Validate input
    if (!dto.postId || dto.postId.trim().length === 0) {
      throw new Error('Post ID không được để trống');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID không được để trống');
    }

    // Check if post exists
    const post = await this.postRepository.findById(dto.postId);

    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }

    // Toggle like
    const result = await this.postRepository.toggleLike(dto.postId, dto.userId);

    return result;
  }
}
