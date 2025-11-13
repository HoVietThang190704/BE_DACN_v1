import { ProductEntity } from '../entities/Product.entity';

export interface ProductFilters {
  search?: string;
  category?: string;
  categoryIds?: string[];
  owner?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  minRating?: number;
}

export interface ProductSorting {
  sortBy: 'price' | 'name' | 'createdAt' | 'rating';
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
  findById(id: string): Promise<ProductEntity | null>;
  findAll(
    filters?: ProductFilters,
    sorting?: ProductSorting,
    pagination?: ProductPagination
  ): Promise<PaginatedProducts>;
  create(product: Omit<ProductEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductEntity>;
  update(id: string, data: Partial<ProductEntity>): Promise<ProductEntity | null>;
  delete(id: string): Promise<boolean>;
  count(filters?: ProductFilters): Promise<number>;
  exists(id: string): Promise<boolean>;
  findByCategory(category: string, pagination?: ProductPagination): Promise<PaginatedProducts>;
  getCategories(): Promise<string[]>;
  search(query: string, pagination?: ProductPagination): Promise<PaginatedProducts>;
  getFeatured(limit?: number): Promise<ProductEntity[]>;
  getNewest(limit?: number): Promise<ProductEntity[]>;
  getBestSelling(limit?: number): Promise<ProductEntity[]>;
  updateStock(id: string, quantity: number): Promise<ProductEntity | null>;
  reduceStock(id: string, quantity: number): Promise<boolean>;
  addStock(id: string, quantity: number): Promise<ProductEntity | null>;
  updateRatingSummary(id: string, summary: { rating: number; reviewCount: number }): Promise<ProductEntity | null>;
}
