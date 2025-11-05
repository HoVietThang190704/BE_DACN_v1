import { IPostRepository } from '../../repositories/IPostRepository';
import { PostEntity } from '../../entities/Post.entity';

export interface SharePostDTO {
  originalPostId: string;
  userId: string;
  content?: string; // Optional additional content when sharing
}

/**
 * Use Case: Share Post
 */
export class SharePostUseCase {
  constructor(private postRepository: IPostRepository) {}

  async execute(dto: SharePostDTO): Promise<PostEntity> {
    // Validate input
    if (!dto.originalPostId || dto.originalPostId.trim().length === 0) {
      throw new Error('Original Post ID không được để trống');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID không được để trống');
    }

    // Check if original post exists
    const originalPost = await this.postRepository.findById(dto.originalPostId);

    if (!originalPost) {
      throw new Error('Không tìm thấy bài viết gốc');
    }

    // Check if original post is public
    if (!originalPost.isPublic()) {
      throw new Error('Chỉ có thể chia sẻ bài viết công khai');
    }

    // Check if user is trying to share their own post
    if (originalPost.isOwnedBy(dto.userId)) {
      throw new Error('Không thể chia sẻ bài viết của chính mình');
    }

    // Validate additional content
    if (dto.content && dto.content.length > 1000) {
      throw new Error('Nội dung chia sẻ không được vượt quá 1,000 ký tự');
    }

    // Share the post
    const sharedPost = await this.postRepository.sharePost(
      dto.originalPostId,
      dto.userId,
      dto.content
    );

    // Increment shares count on original post
    await this.postRepository.incrementSharesCount(dto.originalPostId);

    return sharedPost;
  }
}
