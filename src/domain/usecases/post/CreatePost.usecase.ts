import { IPostRepository } from '../../repositories/IPostRepository';
import { PostEntity } from '../../entities/Post.entity';
import { ElasticsearchService } from '../../../services/search/elasticsearch.service';

export interface CreatePostDTO {
  userId: string;
  content: string;
  images?: string[];
  cloudinaryPublicIds?: string[];
  visibility?: 'public' | 'friends' | 'private';
}

export class CreatePostUseCase {
  constructor(
    private postRepository: IPostRepository,
    private readonly elasticsearchService?: ElasticsearchService
  ) {}

  async execute(dto: CreatePostDTO): Promise<PostEntity> {
    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID không được để trống');
    }

    const hasContent = dto.content && dto.content.trim().length > 0;
    const hasImages = dto.images && dto.images.length > 0;
    
    if (!hasContent && !hasImages) {
      throw new Error('Bài viết phải có nội dung hoặc hình ảnh');
    }
    if (dto.content && dto.content.length > 10000) {
      throw new Error('Nội dung bài viết không được vượt quá 10,000 ký tự');
    }

    if (dto.images && dto.images.length > 10) {
      throw new Error('Số lượng hình ảnh không được vượt quá 10');
    }

    if (dto.images && dto.cloudinaryPublicIds && dto.images.length !== dto.cloudinaryPublicIds.length) {
      throw new Error('Số lượng hình ảnh và public IDs không khớp');
    }

    // Create post entity
    const postData: Omit<PostEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: dto.userId,
      content: dto.content ? dto.content.trim() : '',
      images: dto.images || [],
      cloudinaryPublicIds: dto.cloudinaryPublicIds || [],
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      visibility: dto.visibility || 'public',
      isEdited: false,
    } as any;

    // Save to repository
    const post = await this.postRepository.create(postData);

    await this.elasticsearchService?.indexPost(post);

    return post;
  }
}
