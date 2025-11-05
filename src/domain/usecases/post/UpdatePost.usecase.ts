import { IPostRepository } from '../../repositories/IPostRepository';
import { PostEntity } from '../../entities/Post.entity';

export interface UpdatePostDTO {
  postId: string;
  userId: string; // For authorization
  content?: string;
  images?: string[];
  cloudinaryPublicIds?: string[];
  visibility?: 'public' | 'friends' | 'private';
}

/**
 * Use Case: Update Post
 */
export class UpdatePostUseCase {
  constructor(private postRepository: IPostRepository) {}

  async execute(dto: UpdatePostDTO): Promise<PostEntity> {
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
    if (!existingPost.canBeEditedBy(dto.userId)) {
      throw new Error('Bạn không có quyền chỉnh sửa bài viết này');
    }

    // Validate content
    if (dto.content !== undefined) {
      if (dto.content.trim().length === 0) {
        throw new Error('Nội dung bài viết không được để trống');
      }

      if (dto.content.length > 10000) {
        throw new Error('Nội dung bài viết không được vượt quá 10,000 ký tự');
      }
    }

    // Validate images
    if (dto.images && dto.images.length > 10) {
      throw new Error('Số lượng hình ảnh không được vượt quá 10');
    }

    if (dto.images && dto.cloudinaryPublicIds && dto.images.length !== dto.cloudinaryPublicIds.length) {
      throw new Error('Số lượng hình ảnh và public IDs không khớp');
    }

    // Prepare update data
    const updateData: Partial<PostEntity> = {
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

    if (dto.visibility !== undefined) {
      updateData.visibility = dto.visibility;
    }

    // Update post
    const updatedPost = await this.postRepository.update(dto.postId, updateData);

    if (!updatedPost) {
      throw new Error('Không thể cập nhật bài viết');
    }

    return updatedPost;
  }
}
