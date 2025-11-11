import {
  IProductRepository,
  PaginatedProducts,
  ProductFilters,
  ProductPagination,
  ProductSorting
} from '../../repositories/IProductRepository';
import { ICategoryRepository } from '../../repositories/ICategoryRepository';

export interface SearchProductsOptions {
  limit?: number;
}

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 6;

export class SearchProductsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async execute(query: string, options: SearchProductsOptions = {}): Promise<PaginatedProducts> {
    const keyword = (query ?? '').trim();
    if (keyword.length === 0) {
      throw new Error('Từ khóa tìm kiếm không được để trống');
    }

    if (keyword.length < MIN_QUERY_LENGTH) {
      throw new Error(`Từ khóa tìm kiếm phải có ít nhất ${MIN_QUERY_LENGTH} ký tự`);
    }

    const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), 50);

    const filters: ProductFilters = {
      search: keyword
    };

    try {
      const matchedCategories = await this.categoryRepository.searchByName(keyword, 8);
      const categoryIds = matchedCategories
        .map(category => category.id)
        .filter((id): id is string => Boolean(id));

      if (categoryIds.length > 0) {
        filters.categoryIds = categoryIds;
      }
    } catch {
      // Ignore category search errors to avoid breaking the overall search flow
    }

    const pagination: ProductPagination = {
      page: 1,
      limit
    };

    const sorting: ProductSorting = {
      sortBy: 'createdAt',
      order: 'desc'
    };

    return this.productRepository.findAll(filters, sorting, pagination);
  }
}
