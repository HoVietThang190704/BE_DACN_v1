import { IProductRepository } from '../../repositories/IProductRepository';
import { ProductEntity } from '../../entities/Product.entity';

/**
 * Traceability Information for Product
 */
export interface ProductTraceability {
  productId: string;
  productName: string;
  category: ProductEntity['category'];
  owner: ProductEntity['owner'];
  tags: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
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
      owner: product.owner,
      tags: product.tags,
      rating: product.rating,
      reviewCount: product.reviewCount,
      isAvailable: product.isAvailable(),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    return traceability;
  }
}
