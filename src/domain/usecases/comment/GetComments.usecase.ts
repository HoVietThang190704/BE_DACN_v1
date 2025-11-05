import { ICommentRepository, CommentPagination, PaginatedComments } from '../../repositories/ICommentRepository';

export interface GetCommentsByPostIdDTO {
  postId: string;
  pagination?: CommentPagination;
  withNested?: boolean; // Get comments with nested structure
}

/**
 * Use Case: Get Comments By Post ID
 */
export class GetCommentsByPostIdUseCase {
  constructor(private commentRepository: ICommentRepository) {}

  async execute(dto: GetCommentsByPostIdDTO): Promise<PaginatedComments> {
    // Validate input
    if (!dto.postId || dto.postId.trim().length === 0) {
      throw new Error('Post ID không hợp lệ');
    }

    // Get comments
    if (dto.withNested) {
      // Get comments with nested structure (hierarchical)
      return await this.commentRepository.findByPostIdWithNested(
        dto.postId,
        dto.pagination
      );
    } else {
      // Get top-level comments only
      return await this.commentRepository.findByPostId(
        dto.postId,
        dto.pagination
      );
    }
  }
}

/**
 * Use Case: Get Comment Replies
 */
export class GetCommentRepliesUseCase {
  constructor(private commentRepository: ICommentRepository) {}

  async execute(
    parentCommentId: string,
    pagination?: CommentPagination
  ): Promise<PaginatedComments> {
    // Validate input
    if (!parentCommentId || parentCommentId.trim().length === 0) {
      throw new Error('Parent Comment ID không hợp lệ');
    }

    // Check if parent comment exists
    const parentComment = await this.commentRepository.findById(parentCommentId);

    if (!parentComment) {
      throw new Error('Không tìm thấy bình luận cha');
    }

    // Get replies
    const replies = await this.commentRepository.findReplies(
      parentCommentId,
      pagination
    );

    return replies;
  }
}

/**
 * Use Case: Get Comment By ID
 */
export class GetCommentByIdUseCase {
  constructor(private commentRepository: ICommentRepository) {}

  async execute(commentId: string) {
    // Validate input
    if (!commentId || commentId.trim().length === 0) {
      throw new Error('Comment ID không hợp lệ');
    }

    // Get comment
    const comment = await this.commentRepository.findByIdWithUser(commentId);

    if (!comment) {
      throw new Error('Không tìm thấy bình luận');
    }

    return comment;
  }
}
