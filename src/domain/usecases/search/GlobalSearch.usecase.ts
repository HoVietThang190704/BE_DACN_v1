import { ProductEntity } from '../../entities/Product.entity';
import { PostEntity } from '../../entities/Post.entity';
import { UserEntity } from '../../entities/User.entity';
import { IPostRepository, PostPagination, PaginatedPosts } from '../../repositories/IPostRepository';
import { SearchProductsUseCase, SearchProductsOptions } from './SearchProducts.usecase';
import { SearchUsersUseCase, SearchUsersOptions, SearchUsersResult } from './SearchUsers.usecase';

export interface GlobalSearchOptions {
  productsLimit?: number;
  postsLimit?: number;
  usersLimit?: number;
}

export interface GlobalSearchSection<T> {
  items: T[];
  total: number;
  limit: number;
  hasMore: boolean;
}

export interface GlobalSearchPostsSection extends GlobalSearchSection<PostEntity> {
  page: number;
  totalPages: number;
}

export interface GlobalSearchResult {
  query: string;
  products: GlobalSearchSection<ProductEntity>;
  posts: GlobalSearchPostsSection;
  users: GlobalSearchSection<UserEntity>;
}

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 6;

export class GlobalSearchUseCase {
  constructor(
    private readonly searchProductsUseCase: SearchProductsUseCase,
    private readonly searchUsersUseCase: SearchUsersUseCase,
    private readonly postRepository: IPostRepository
  ) {}

  async execute(query: string, options: GlobalSearchOptions = {}): Promise<GlobalSearchResult> {
    const keyword = (query ?? '').trim();
    if (keyword.length === 0) {
      throw new Error('Từ khóa tìm kiếm không được để trống');
    }

    if (keyword.length < MIN_QUERY_LENGTH) {
      throw new Error(`Từ khóa tìm kiếm phải có ít nhất ${MIN_QUERY_LENGTH} ký tự`);
    }

    const productsOptions: SearchProductsOptions = {
      limit: options.productsLimit ?? DEFAULT_LIMIT
    };

    const usersOptions: SearchUsersOptions = {
      limit: options.usersLimit ?? DEFAULT_LIMIT
    };

    const postsPagination: PostPagination = {
      page: 1,
      limit: Math.min(Math.max(options.postsLimit ?? DEFAULT_LIMIT, 1), 50)
    };

    const [productsResult, postsResult, usersResult] = await Promise.allSettled([
      this.searchProductsUseCase.execute(keyword, productsOptions),
      this.postRepository.search(keyword, postsPagination),
      this.searchUsersUseCase.execute(keyword, usersOptions)
    ]);

    const products: GlobalSearchSection<ProductEntity> = (() => {
      if (productsResult.status === 'fulfilled') {
        const value = productsResult.value;
        const limit = value.limit;
        return {
          items: value.products,
          total: value.total,
          limit,
          hasMore: value.total > limit
        };
      }
      return {
        items: [],
        total: 0,
        limit: productsOptions.limit ?? DEFAULT_LIMIT,
        hasMore: false
      };
    })();

    const posts: GlobalSearchPostsSection = (() => {
      if (postsResult.status === 'fulfilled') {
        const value = postsResult.value as PaginatedPosts;
        const limit = value.limit ?? postsPagination.limit;
        return {
          items: value.posts,
          total: value.total,
          limit,
          hasMore: value.hasMore ?? (value.total > limit),
          page: value.page ?? postsPagination.page,
          totalPages: value.totalPages ?? Math.ceil((value.total || 0) / limit)
        };
      }
      return {
        items: [],
        total: 0,
        limit: postsPagination.limit,
        hasMore: false,
        page: postsPagination.page,
        totalPages: 0
      };
    })();

    const users: GlobalSearchSection<UserEntity> = (() => {
      if (usersResult.status === 'fulfilled') {
        const value = usersResult.value as SearchUsersResult;
        return {
          items: value.users,
          total: value.total,
          limit: value.limit,
          hasMore: value.hasMore
        };
      }
      return {
        items: [],
        total: 0,
        limit: usersOptions.limit ?? DEFAULT_LIMIT,
        hasMore: false
      };
    })();

    return {
      query: keyword,
      products,
      posts,
      users
    };
  }
}
