import { ProductEntity } from '../entities/Product.entity';

/**
 * Product Repository Interface - Contract for data access
 * Define all data operations needed by use cases
 */

export interface ProductFilters {
  search?: string;
  category?: string;
  farm?: string;
  certified?: string;
  minPrice?: number;
  maxPrice?: number;
  isOrganic?: boolean;
  isFresh?: boolean;
  inStock?: boolean;
  province?: string;
  minRating?: number;
}

export interface ProductSorting {
  sortBy: 'price' | 'name' | 'createdAt' | 'rating' | 'harvestDate';
  order: 'asc' | 'desc';
}

export interface ProductPagination {
  page: number;
  limit: number;
}

export interface PaginatedProducts {
  products: ProductEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IProductRepository {
  /**
   * Find product by ID
   */
  findById(id: string): Promise<ProductEntity | null>;

  /**
   * Find all products with filters, sorting and pagination
   */
  findAll(
    filters?: ProductFilters,
    sorting?: ProductSorting,
    pagination?: ProductPagination
  ): Promise<PaginatedProducts>;

  /**
   * Create new product
   */
  create(product: Omit<ProductEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductEntity>;

  /**
   * Update existing product
   */
  update(id: string, data: Partial<ProductEntity>): Promise<ProductEntity | null>;

  /**
   * Delete product
   */
  delete(id: string): Promise<boolean>;

  /**
   * Count products with filters
   */
  count(filters?: ProductFilters): Promise<number>;

  /**
   * Check if product exists by ID
   */
  exists(id: string): Promise<boolean>;

  /**
   * Find products by category
   */
  findByCategory(category: string, pagination?: ProductPagination): Promise<PaginatedProducts>;

  /**
   * Find products by farm name
   */
  findByFarm(farmName: string, pagination?: ProductPagination): Promise<PaginatedProducts>;

  /**
   * Find organic products
   */
  findOrganic(pagination?: ProductPagination): Promise<PaginatedProducts>;

  /**
   * Find fresh products (within shelf life)
   */
  findFresh(pagination?: ProductPagination): Promise<PaginatedProducts>;

  /**
   * Find products with certification
   */
  findByCertification(certification: string, pagination?: ProductPagination): Promise<PaginatedProducts>;

  /**
   * Find products by province
   */
  findByProvince(province: string, pagination?: ProductPagination): Promise<PaginatedProducts>;

  /**
   * Get all unique categories
   */
  getCategories(): Promise<string[]>;

  /**
   * Get all unique provinces
   */
  getProvinces(): Promise<string[]>;

  /**
   * Get all unique certifications
   */
  getCertifications(): Promise<string[]>;

  /**
   * Search products by text (name, description)
   */
  search(query: string, pagination?: ProductPagination): Promise<PaginatedProducts>;

  /**
   * Get featured products (high rating, popular)
   */
  getFeatured(limit?: number): Promise<ProductEntity[]>;

  /**
   * Get newest products
   */
  getNewest(limit?: number): Promise<ProductEntity[]>;

  /**
   * Get best-selling products (by review count)
   */
  getBestSelling(limit?: number): Promise<ProductEntity[]>;

  /**
   * Update stock quantity
   */
  updateStock(id: string, quantity: number): Promise<ProductEntity | null>;

  /**
   * Reduce stock (for order processing)
   */
  reduceStock(id: string, quantity: number): Promise<boolean>;

  /**
   * Add stock
   */
  addStock(id: string, quantity: number): Promise<ProductEntity | null>;
}
