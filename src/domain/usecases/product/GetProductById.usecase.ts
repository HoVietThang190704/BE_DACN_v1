import { IProductRepository } from '../../repositories/IProductRepository';
import { ProductEntity } from '../../entities/Product.entity';

/**
 * Use Case: Get Product By ID
 */
export class GetProductByIdUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(productId: string): Promise<ProductEntity> {
    // Validate product ID
    if (!productId || productId.trim().length === 0) {
      throw new Error('ID sản phẩm không hợp lệ');
    }

    // Get product from repository
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    return product;
  }
}
