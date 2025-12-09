import { ProductEntity, ProductCategoryInfo, ProductOwnerInfo } from '../../../domain/entities/Product.entity';

/**
 * Product Response DTO
 */
export interface ProductResponseDTO {
  id: string;
  name: string;
  nameEn?: string;
  category: ProductCategoryInfo;
  owner: ProductOwnerInfo;
  price: number;
  unit: string;
  description: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  sold?: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  
  // Computed fields
  isAvailable?: boolean;
  isHighRated?: boolean;
  isPopular?: boolean;
  hasValidPrice?: boolean;
}

/**
 * Paginated Products Response DTO
 */
export interface PaginatedProductsResponseDTO {
  products: ProductResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Mapper: Domain Entity -> DTO
 */
export class ProductMapper {
  /**
   * Map single product to DTO
   */
  static toDTO(product: ProductEntity, includeComputed: boolean = false): ProductResponseDTO {
    const dto: ProductResponseDTO = {
      id: product.id,
      name: product.name,
      nameEn: product.nameEn,
      category: {
        id: product.category?.id || '',
        name: product.category?.name,
        slug: product.category?.slug
      },
      owner: {
        id: product.owner?.id || '',
        email: product.owner?.email,
        userName: product.owner?.userName,
        role: product.owner?.role,
        avatar: product.owner?.avatar
      },
      price: product.price,
      unit: product.unit,
      description: product.description,
      images: product.images,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity,
      sold: product.sold,
      rating: product.rating,
      reviewCount: product.reviewCount,
      tags: product.tags,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    };

    // Add computed fields if requested
    if (includeComputed) {
      dto.isAvailable = product.isAvailable();
      dto.isHighRated = product.isHighRated();
      dto.isPopular = product.isPopular();
      dto.hasValidPrice = product.hasValidPrice();
    }

    return dto;
  }

  /**
   * Map array of products to DTOs
   */
  static toDTOArray(products: ProductEntity[], includeComputed: boolean = false): ProductResponseDTO[] {
    return products.map(p => this.toDTO(p, includeComputed));
  }

  /**
   * Map paginated products to DTO
   */
  static toPaginatedDTO(
    products: ProductEntity[],
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    includeComputed: boolean = false
  ): PaginatedProductsResponseDTO {
    return {
      products: this.toDTOArray(products, includeComputed),
      total,
      page,
      limit,
      totalPages
    };
  }
}
