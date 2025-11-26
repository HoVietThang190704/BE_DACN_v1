import {
  IProductRepository,
  PaginatedProducts,
  ProductFilters,
  ProductPagination,
  ProductSorting
} from '../../repositories/IProductRepository';
import { ICategoryRepository } from '../../repositories/ICategoryRepository';
import { ElasticsearchService } from '../../../services/search/elasticsearch.service';
import { logger } from '../../../shared/utils/logger';

export interface SearchProductsOptions {
  limit?: number;
  page?: number;
}

const MIN_QUERY_LENGTH = 1;
const DEFAULT_LIMIT = 6;

export class SearchProductsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly elasticsearchService?: ElasticsearchService
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
    const page = Math.max(options.page ?? 1, 1);

    if (this.elasticsearchService?.isEnabled()) {
      try {
        const result = await this.elasticsearchService.searchProducts(keyword, { limit, page });

        // If ES returned fewer results than we requested for page 1, try to fill missing items from Mongo
        if (page === 1 && Array.isArray(result.items) && result.items.length < limit) {
          try {
            const fetchLimit = Math.max(limit * 3, limit + 20);
            const fallback = await this.productRepository.search(keyword, { page: 1, limit: fetchLimit });

            const existing = new Set(result.items.map(p => String(p.id)));
            for (const p of fallback.products) {
              if (existing.has(String(p.id))) continue;
              result.items.push(p as any);
              existing.add(String(p.id));
              if (result.items.length >= limit) break;
            }

            // compute total conservatively as the larger of both totals
            const totalUnion = Math.max(result.total || 0, fallback.total || 0);

            return {
              products: result.items.slice(0, limit),
              total: totalUnion,
              page: result.page,
              limit: result.limit,
              totalPages: Math.ceil((totalUnion || 0) / (result.limit || limit))
            };
          } catch (mergeErr) {
            logger.warn('[SearchProductsUseCase] Failed to merge fallback search results', mergeErr);
          }
        }

        return {
          products: result.items,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        };
      } catch (error) {
        logger.warn('[SearchProductsUseCase] Elasticsearch search failed, falling back to Mongo search', error);
      }
    }

    const filters: ProductFilters = {
      search: keyword
    };

    try {
      const matchedCategories = await this.categoryRepository.searchByName(keyword, 8);
      const categoryIds = matchedCategories
        .map(category => category.id)
        .filter((id): id is string => Boolean(id));

      if (categoryIds.length > 0) {
        filters.searchCategoryIds = categoryIds;
      }
    } catch {
      // Ignore category search errors to avoid breaking the overall search flow
    }

    const pagination: ProductPagination = {
      page,
      limit
    };

    const sorting: ProductSorting = {
      sortBy: 'createdAt',
      order: 'desc'
    };

    return this.productRepository.findAll(filters, sorting, pagination);
  }
}
