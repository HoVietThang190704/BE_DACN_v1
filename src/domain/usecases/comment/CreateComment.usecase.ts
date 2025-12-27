import { ICommentRepository } from '../../repositories/ICommentRepository';
import { IPostRepository } from '../../repositories/IPostRepository';
import { CommentEntity } from '../../entities/Comment.entity';

export interface CreateCommentDTO {
  postId: string;
  userId: string;
  content: string;
  images?: string[];
  cloudinaryPublicIds?: string[];
  parentCommentId?: string;
  mentionedUserId?: string;
}

export class CreateCommentUseCase {
  constructor(
    private commentRepository: ICommentRepository,
    private postRepository: IPostRepository
  ) {}

  async execute(dto: CreateCommentDTO): Promise<CommentEntity> {
    if (!dto.postId || dto.postId.trim().length === 0) {
      throw new Error('Post ID không được để trống');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID không được để trống');
    }

    if (!dto.content || dto.content.trim().length === 0) {
      throw new Error('Nội dung bình luận không được để trống');
    }

    if (dto.content.length > 2000) {
      throw new Error('Nội dung bình luận không được vượt quá 2,000 ký tự');
    }

    if (dto.images && dto.images.length > 5) {
      throw new Error('Số lượng hình ảnh không được vượt quá 5');
    }

    if (dto.images && dto.cloudinaryPublicIds && dto.images.length !== dto.cloudinaryPublicIds.length) {
      throw new Error('Số lượng hình ảnh và public IDs không khớp');
    }

    const post = await this.postRepository.findById(dto.postId);

    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }

    let level = 0;
    let parentComment = null;
    let mentionedUserId = dto.mentionedUserId;

    if (dto.parentCommentId) {
      parentComment = await this.commentRepository.findById(dto.parentCommentId);

      if (!parentComment) {
        throw new Error('Không tìm thấy bình luận cha');
      }

      if (parentComment.postId !== dto.postId) {
        throw new Error('Bình luận cha không thuộc bài viết này');
      }

      level = parentComment.level + 1;

      if (level > 2) {
        throw new Error('Không thể trả lời quá 3 cấp bình luận');
      }

      if (!mentionedUserId) {
        mentionedUserId = parentComment.userId;
      }
    }

    const commentData: Omit<CommentEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      postId: dto.postId,
      userId: dto.userId,
      content: dto.content.trim(),
      images: dto.images || [],
      cloudinaryPublicIds: dto.cloudinaryPublicIds || [],
      parentCommentId: dto.parentCommentId,
      level,
      mentionedUserId,
      likes: [],
      likesCount: 0,
      repliesCount: 0,
      isEdited: false,
    } as any;

    const comment = await this.commentRepository.create(commentData);

    await this.postRepository.incrementCommentsCount(dto.postId);

    if (parentComment) {
      await this.commentRepository.incrementRepliesCount(dto.parentCommentId!);
    }

    return comment;
  }
}
