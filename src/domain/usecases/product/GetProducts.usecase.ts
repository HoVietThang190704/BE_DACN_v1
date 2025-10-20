import { 
  IProductRepository, 
  ProductFilters, 
  ProductSorting, 
  ProductPagination,
  PaginatedProducts 
} from '../../repositories/IProductRepository';

/**
 * Use Case: Get Products with Filtering, Sorting and Pagination
 */
export class GetProductsUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(
    filters?: ProductFilters,
    sorting?: ProductSorting,
    pagination?: ProductPagination
  ): Promise<PaginatedProducts> {
    // Set default values
    const defaultSorting: ProductSorting = {
      sortBy: 'createdAt',
      order: 'desc'
    };

    const defaultPagination: ProductPagination = {
      page: 1,
      limit: 20
    };

    // Validate pagination
    const validatedPagination = this.validatePagination(pagination || defaultPagination);

    // Get products from repository
    const result = await this.productRepository.findAll(
      filters,
      sorting || defaultSorting,
      validatedPagination
    );

    return result;
  }

  private validatePagination(pagination: ProductPagination): ProductPagination {
    const page = Math.max(1, pagination.page);
    const limit = Math.min(100, Math.max(1, pagination.limit)); // Max 100 items per page

    return { page, limit };
  }
}
