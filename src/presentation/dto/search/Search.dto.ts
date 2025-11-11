import { ProductMapper, ProductResponseDTO } from '../product/Product.dto';
import { PostMapper, PostDTO } from '../post/Post.dto';
import { UserMapper, UserResponseDto } from '../user/User.dto';
import { GlobalSearchResult } from '../../../domain/usecases/search/GlobalSearch.usecase';

export interface SearchSectionDTO<T> {
  items: T[];
  total: number;
  limit: number;
  hasMore: boolean;
}

export interface SearchPostsSectionDTO extends SearchSectionDTO<PostDTO> {
  page: number;
  totalPages: number;
}

export interface SearchResponseDTO {
  query: string;
  products: SearchSectionDTO<ProductResponseDTO>;
  posts: SearchPostsSectionDTO;
  users: SearchSectionDTO<UserResponseDto>;
}

export class SearchMapper {
  static toDTO(result: GlobalSearchResult): SearchResponseDTO {
    return {
      query: result.query,
      products: {
        items: ProductMapper.toDTOArray(result.products.items, true),
        total: result.products.total,
        limit: result.products.limit,
        hasMore: result.products.hasMore
      },
      posts: {
        items: PostMapper.toDTOs(result.posts.items),
        total: result.posts.total,
        limit: result.posts.limit,
        hasMore: result.posts.hasMore,
        page: result.posts.page,
        totalPages: result.posts.totalPages
      },
      users: {
        items: result.users.items.map(user => UserMapper.toResponseDto(user)),
        total: result.users.total,
        limit: result.users.limit,
        hasMore: result.users.hasMore
      }
    };
  }
}
