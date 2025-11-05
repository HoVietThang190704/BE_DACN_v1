import { IPostRepository, PostPagination, PaginatedPosts } from '../../repositories/IPostRepository';

export interface GetPostByIdDTO {
  postId: string;
  userId?: string; // For checking permissions
}

/**
 * Use Case: Get Post By ID
 */
export class GetPostByIdUseCase {
  constructor(private postRepository: IPostRepository) {}

  async execute(dto: GetPostByIdDTO) {
    // Validate input
    if (!dto.postId || dto.postId.trim().length === 0) {
      throw new Error('Post ID không hợp lệ');
    }

    // Get post from repository
    const post = await this.postRepository.findByIdWithUser(dto.postId);

    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }

    // Check if user can view this post
    if (dto.userId && !post.canBeViewedBy(dto.userId)) {
      throw new Error('Bạn không có quyền xem bài viết này');
    }

    return post;
  }
}

/**
 * Use Case: Get Posts Feed
 */
export class GetPostsFeedUseCase {
  constructor(private postRepository: IPostRepository) {}

  async execute(
    userId: string,
    friendIds: string[] = [],
    pagination?: PostPagination
  ): Promise<PaginatedPosts> {
    // Get posts for user feed (public + friends' posts)
    const posts = await this.postRepository.findFeedPosts(
      userId,
      friendIds,
      pagination
    );

    return posts;
  }
}

/**
 * Use Case: Get User Posts
 */
export class GetUserPostsUseCase {
  constructor(private postRepository: IPostRepository) {}

  async execute(
    userId: string,
    pagination?: PostPagination
  ): Promise<PaginatedPosts> {
    // Get posts by user ID
    const posts = await this.postRepository.findByUserId(userId, pagination);

    return posts;
  }
}

/**
 * Use Case: Get Public Posts
 */
export class GetPublicPostsUseCase {
  constructor(private postRepository: IPostRepository) {}

  async execute(pagination?: PostPagination): Promise<PaginatedPosts> {
    // Get all public posts
    const posts = await this.postRepository.findPublicPosts(pagination);

    return posts;
  }
}

/**
 * Use Case: Search Posts
 */
export class SearchPostsUseCase {
  constructor(private postRepository: IPostRepository) {}

  async execute(
    query: string,
    pagination?: PostPagination
  ): Promise<PaginatedPosts> {
    // Validate input
    if (!query || query.trim().length === 0) {
      throw new Error('Từ khóa tìm kiếm không được để trống');
    }

    if (query.trim().length < 2) {
      throw new Error('Từ khóa tìm kiếm phải có ít nhất 2 ký tự');
    }

    // Search posts
    const posts = await this.postRepository.search(query, pagination);

    return posts;
  }
}

/**
 * Use Case: Get Trending Posts
 */
export class GetTrendingPostsUseCase {
  constructor(private postRepository: IPostRepository) {}

  async execute(limit: number = 10, timeWindow: number = 24) {
    // Get trending posts
    const posts = await this.postRepository.findTrending(limit, timeWindow);

    return posts;
  }
}
