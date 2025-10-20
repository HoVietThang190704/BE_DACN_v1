import { IProductRepository } from '../../repositories/IProductRepository';
import { ProductEntity, FarmInfo } from '../../entities/Product.entity';

/**
 * Traceability Information for Product
 */
export interface ProductTraceability {
  productId: string;
  productName: string;
  category: string;
  
  // Farm information
  farm: FarmInfo;
  
  // Quality certifications
  certifications: string[];
  
  // Freshness info
  harvestDate: Date;
  shelfLife: number;
  daysSinceHarvest: number;
  remainingShelfLife: number;
  freshnessPercentage: number;
  
  // Product status
  isOrganic: boolean;
  isFresh: boolean;
  isAvailable: boolean;
  
  // Additional metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Use Case: Get Product Traceability Information
 * Returns detailed origin and quality information for transparency
 */
export class GetProductTraceabilityUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(productId: string): Promise<ProductTraceability> {
    // Validate product ID
    if (!productId || productId.trim().length === 0) {
      throw new Error('ID sản phẩm không hợp lệ');
    }

    // Get product from repository
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    // Build traceability information
    const traceability: ProductTraceability = {
      productId: product.id,
      productName: product.name,
      category: product.category,
      
      farm: product.farm,
      
      certifications: product.certifications,
      
      harvestDate: product.harvestDate,
      shelfLife: product.shelfLife,
      daysSinceHarvest: product.getDaysSinceHarvest(),
      remainingShelfLife: product.getRemainingShelfLife(),
      freshnessPercentage: product.getFreshnessPercentage(),
      
      isOrganic: product.isCertifiedOrganic(),
      isFresh: product.isFreshEnough(),
      isAvailable: product.isAvailable(),
      
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    return traceability;
  }
}
