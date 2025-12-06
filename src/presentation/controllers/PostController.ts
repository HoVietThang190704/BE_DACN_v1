import { Request, Response } from 'express';
import { 
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
  GetPostByIdUseCase,
  GetPostsFeedUseCase,
  GetUserPostsUseCase,
  GetPublicPostsUseCase,
  SearchPostsUseCase,
  GetTrendingPostsUseCase,
  ToggleLikePostUseCase,
  SharePostUseCase,
  GetPostShareInfoUseCase
} from '../../domain/usecases/post';
import { PostMapper, CreatePostRequestDTO, UpdatePostRequestDTO, SharePostRequestDTO } from '../dto/post/Post.dto';
import { ShareInfoMapper } from '../dto/share/ShareInfo.dto';
import { PostFilters, PostSorting, PostPagination } from '../../domain/repositories/IPostRepository';
import { logger } from '../../shared/utils/logger';

/**
 * Post Controller - HTTP Layer
 * Handles HTTP requests and delegates to use cases
 */
export class PostController {
  constructor(
    private createPostUseCase: CreatePostUseCase,
    private updatePostUseCase: UpdatePostUseCase,
    private deletePostUseCase: DeletePostUseCase,
    private getPostByIdUseCase: GetPostByIdUseCase,
    private getPostsFeedUseCase: GetPostsFeedUseCase,
    private getUserPostsUseCase: GetUserPostsUseCase,
    private getPublicPostsUseCase: GetPublicPostsUseCase,
    private searchPostsUseCase: SearchPostsUseCase,
    private getTrendingPostsUseCase: GetTrendingPostsUseCase,
    private toggleLikePostUseCase: ToggleLikePostUseCase,
    private sharePostUseCase: SharePostUseCase,
    private getPostShareInfoUseCase: GetPostShareInfoUseCase
  ) {}

  /**
   * Helper: Map post with user data
   */
  private mapPostWithUser(post: any, currentUserId?: string) {
    return PostMapper.toDTO(
      post, 
      currentUserId, 
      (post as any).user ? { user: (post as any).user } : undefined
    );
  }

  /**
   * Helper: Map paginated posts with user data
   */
  private mapPaginatedPosts(result: any, currentUserId?: string) {
    return {
      posts: result.posts.map((post: any) => this.mapPostWithUser(post, currentUserId)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasMore: result.hasMore
      }
    };
  }

  /**
   * POST /api/posts
   * Create a new post
   */
  async createPost(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id; // From auth middleware
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const data: CreatePostRequestDTO = req.body;

      const post = await this.createPostUseCase.execute({
        userId,
        content: data.content,
        images: data.images,
        cloudinaryPublicIds: data.cloudinaryPublicIds,
        visibility: data.visibility
      });

      res.status(201).json({
        success: true,
        message: 'Tạo bài viết thành công',
        data: this.mapPostWithUser(post, userId)
      });
    } catch (error: any) {
      logger.error('Error creating post:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi tạo bài viết'
      });
    }
  }

  /**
   * PUT /api/posts/:postId
   * Update a post
   */
  async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const postId = req.params.postId;
      const data: UpdatePostRequestDTO = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const post = await this.updatePostUseCase.execute({
        postId,
        userId,
        ...data
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật bài viết thành công',
        data: PostMapper.toDTO(post, userId)
      });
    } catch (error: any) {
      logger.error('Error updating post:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi cập nhật bài viết'
      });
    }
  }

  /**
   * DELETE /api/posts/:postId
   * Delete a post
   */
  async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const isAdmin = (req as any).user?.role === 'admin';
      const postId = req.params.postId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      await this.deletePostUseCase.execute({
        postId,
        userId,
        isAdmin
      });

      res.status(200).json({
        success: true,
        message: 'Xóa bài viết thành công'
      });
    } catch (error: any) {
      logger.error('Error deleting post:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi xóa bài viết'
      });
    }
  }

  /**
   * GET /api/posts/:postId
   * Get post by ID
   */
  async getPostById(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const postId = req.params.postId;

      const post = await this.getPostByIdUseCase.execute({
        postId,
        userId
      });

      res.status(200).json({
        success: true,
        data: PostMapper.toDTO(post, userId, (post as any).user ? { user: (post as any).user } : undefined)
      });
    } catch (error: any) {
      logger.error('Error getting post:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Không tìm thấy bài viết'
      });
    }
  }

  /**
   * GET /api/posts/feed
   * Get posts feed for current user
   */
  async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      // TODO: Get user's friends IDs from database
      const friendIds: string[] = []; // Implement this

      const result = await this.getPostsFeedUseCase.execute(
        userId,
        friendIds,
        { page, limit }
      );

      res.status(200).json({
        success: true,
        data: this.mapPaginatedPosts(result, userId)
      });
    } catch (error: any) {
      logger.error('Error getting feed:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi lấy feed'
      });
    }
  }

  /**
   * GET /api/posts/user/:userId
   * Get posts by user
   */
  async getUserPosts(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = (req as any).user?.id;
      const targetUserId = req.params.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.getUserPostsUseCase.execute(
        targetUserId,
        { page, limit }
      );

      res.status(200).json({
        success: true,
        data: PostMapper.toPaginatedDTO(
          result.posts,
          result.total,
          result.page,
          result.limit,
          result.totalPages,
          result.hasMore,
          currentUserId
        )
      });
    } catch (error: any) {
      logger.error('Error getting user posts:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi lấy bài viết người dùng'
      });
    }
  }

  /**
   * GET /api/posts/public
   * Get all public posts
   */
  async getPublicPosts(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.getPublicPostsUseCase.execute({ page, limit });

      res.status(200).json({
        success: true,
        data: PostMapper.toPaginatedDTO(
          result.posts,
          result.total,
          result.page,
          result.limit,
          result.totalPages,
          result.hasMore,
          currentUserId
        )
      });
    } catch (error: any) {
      logger.error('Error getting public posts:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi lấy bài viết công khai'
      });
    }
  }

  /**
   * GET /api/posts/search
   * Search posts
   */
  async searchPosts(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = (req as any).user?.id;
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.searchPostsUseCase.execute(
        query,
        { page, limit }
      );

      res.status(200).json({
        success: true,
        data: PostMapper.toPaginatedDTO(
          result.posts,
          result.total,
          result.page,
          result.limit,
          result.totalPages,
          result.hasMore,
          currentUserId
        )
      });
    } catch (error: any) {
      logger.error('Error searching posts:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi tìm kiếm bài viết'
      });
    }
  }

  /**
   * GET /api/posts/trending
   * Get trending posts
   */
  async getTrendingPosts(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = (req as any).user?.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const timeWindow = parseInt(req.query.timeWindow as string) || 24;

      const posts = await this.getTrendingPostsUseCase.execute(limit, timeWindow);

      res.status(200).json({
        success: true,
        data: PostMapper.toDTOs(posts, currentUserId)
      });
    } catch (error: any) {
      logger.error('Error getting trending posts:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi lấy bài viết trending'
      });
    }
  }

  /**
   * POST /api/posts/:postId/like
   * Toggle like on a post
   */
  async toggleLike(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const postId = req.params.postId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const result = await this.toggleLikePostUseCase.execute({
        postId,
        userId
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error toggling like:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi like/unlike bài viết'
      });
    }
  }

  /**
   * POST /api/posts/:postId/share
   * Share a post
   */
  async sharePost(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const originalPostId = req.params.postId;
      const data: SharePostRequestDTO = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const post = await this.sharePostUseCase.execute({
        originalPostId,
        userId,
        content: data.content
      });

      res.status(201).json({
        success: true,
        message: 'Chia sẻ bài viết thành công',
        data: this.mapPostWithUser(post, userId)
      });
    } catch (error: any) {
      logger.error('Error sharing post:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi chia sẻ bài viết'
      });
    }
  }

  /**
   * GET /api/posts/:postId/share-info
   * Build share metadata for a public post
   */
  async getShareInfo(req: Request, res: Response): Promise<void> {
    try {
      const postId = req.params.postId;
      const locale = (req.query.locale as string) || 'vi';

      const shareInfo = await this.getPostShareInfoUseCase.execute({
        postId,
        locale
      });

      res.status(200).json({
        success: true,
        data: ShareInfoMapper.toDTO(shareInfo)
      });
    } catch (error: any) {
      logger.error('Error generating post share info:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể tạo liên kết chia sẻ cho bài viết'
      });
    }
  }
}
