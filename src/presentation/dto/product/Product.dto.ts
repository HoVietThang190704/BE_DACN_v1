import { ProductEntity, FarmInfo, NutritionInfo } from '../../../domain/entities/Product.entity';

/**
 * Product Response DTO
 */
export interface ProductResponseDTO {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  farm: FarmInfo;
  certifications: string[];
  harvestDate: string; // ISO date string
  shelfLife: number;
  nutrition?: NutritionInfo;
  isOrganic: boolean;
  isFresh: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  
  // Computed fields
  isAvailable?: boolean;
  remainingShelfLife?: number;
  freshnessPercentage?: number;
  fullLocation?: string;
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
 * Product Traceability Response DTO
 */
export interface ProductTraceabilityResponseDTO {
  productId: string;
  productName: string;
  category: string;
  farm: FarmInfo;
  certifications: string[];
  harvestDate: string;
  shelfLife: number;
  daysSinceHarvest: number;
  remainingShelfLife: number;
  freshnessPercentage: number;
  isOrganic: boolean;
  isFresh: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
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
      category: product.category,
      price: product.price,
      unit: product.unit,
      description: product.description,
      images: product.images,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity,
      farm: product.farm,
      certifications: product.certifications,
      harvestDate: product.harvestDate.toISOString(),
      shelfLife: product.shelfLife,
      nutrition: product.nutrition,
      isOrganic: product.isOrganic,
      isFresh: product.isFresh,
      rating: product.rating,
      reviewCount: product.reviewCount,
      tags: product.tags,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    };

    // Add computed fields if requested
    if (includeComputed) {
      dto.isAvailable = product.isAvailable();
      dto.remainingShelfLife = product.getRemainingShelfLife();
      dto.freshnessPercentage = product.getFreshnessPercentage();
      dto.fullLocation = product.getFullLocation();
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

  /**
   * Map traceability data to DTO
   */
  static toTraceabilityDTO(traceability: any): ProductTraceabilityResponseDTO {
    return {
      productId: traceability.productId,
      productName: traceability.productName,
      category: traceability.category,
      farm: traceability.farm,
      certifications: traceability.certifications,
      harvestDate: traceability.harvestDate.toISOString(),
      shelfLife: traceability.shelfLife,
      daysSinceHarvest: traceability.daysSinceHarvest,
      remainingShelfLife: traceability.remainingShelfLife,
      freshnessPercentage: traceability.freshnessPercentage,
      isOrganic: traceability.isOrganic,
      isFresh: traceability.isFresh,
      isAvailable: traceability.isAvailable,
      createdAt: traceability.createdAt.toISOString(),
      updatedAt: traceability.updatedAt.toISOString()
    };
  }
}
