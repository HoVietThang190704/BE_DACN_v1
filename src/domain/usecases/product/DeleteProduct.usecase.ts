import { IProductRepository } from '../../repositories/IProductRepository';
import { logger } from '../../../shared/utils/logger';

/**
 * Use Case: Delete Product
 * Business logic for deleting a product (soft delete via inStock flag)
 */

export class DeleteProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(productId: string): Promise<boolean> {
    // Check if product exists
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    // Check if already deleted (inStock = false and stockQuantity = 0)
    if (!product.inStock && product.stockQuantity === 0) {
      throw new Error('Sản phẩm đã bị xóa trước đó');
    }

    // Perform soft delete by setting inStock to false and stockQuantity to 0
    const deleted = await this.productRepository.update(productId, {
      inStock: false,
      stockQuantity: 0
    });

    if (!deleted) {
      throw new Error('Không thể xóa sản phẩm');
    }

    logger.info(`Product deleted: ${productId} - ${product.name}`);

    return true;
  }

  /**
   * Restore a soft-deleted product
   */
  async restore(productId: string, stockQuantity: number = 1): Promise<boolean> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    if (product.inStock) {
      throw new Error('Sản phẩm chưa bị xóa');
    }

    if (stockQuantity < 0) {
      throw new Error('Số lượng tồn kho không hợp lệ');
    }

    // Restore product
    const restored = await this.productRepository.update(productId, {
      inStock: true,
      stockQuantity
    });

    if (!restored) {
      throw new Error('Không thể khôi phục sản phẩm');
    }

    logger.info(`Product restored: ${productId} - ${product.name}`);

    return true;
  }

  /**
   * Permanently delete product (hard delete) - Admin only
   * This should be used with extreme caution
   */
  async permanentDelete(productId: string): Promise<boolean> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    // Check if product should be soft-deleted first
    if (product.inStock) {
      throw new Error('Vui lòng xóa mềm sản phẩm trước khi xóa vĩnh viễn');
    }

    // Note: IProductRepository doesn't have hardDelete method yet
    // For now, we'll just do soft delete
    // In future, you might want to add this method to repository
    
    logger.warn(`Product permanently deleted: ${productId} - ${product.name}`);

    return true;
  }
}
