import { IProductRepository } from '../../repositories/IProductRepository';
import { logger } from '../../../shared/utils/logger';
import { deleteFromCloudinary } from '../../../shared/utils/cloudinary';
import { Wishlist } from '../../../models/Wishlist';
import { Cart } from '../../../models/Cart';
import mongoose from 'mongoose';

/**
 * Use Case: Delete Product
 * Business logic for deleting a product (soft delete via inStock flag)
 */

export class DeleteProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(productId: string): Promise<boolean> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    await this.cleanupRelatedData(productId, product.images);

    const deleted = await this.productRepository.delete(productId);
    if (!deleted) {
      throw new Error('Không thể xóa sản phẩm');
    }

    logger.info(`Product permanently deleted: ${productId} - ${product.name}`);
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

    await this.cleanupRelatedData(productId, product.images);

    const deleted = await this.productRepository.delete(productId);
    if (!deleted) {
      throw new Error('Không thể xóa vĩnh viễn sản phẩm');
    }

    logger.warn(`Product permanently deleted: ${productId} - ${product.name}`);

    return true;
  }

  private async cleanupRelatedData(productId: string, images?: string[]): Promise<void> {
    await this.removeImages(images);
    await this.purgeFromCartsAndWishlists(productId);
  }

  private async removeImages(images?: string[]): Promise<void> {
    if (!images || images.length === 0) {
      return;
    }

    for (const imageUrl of images) {
      try {
        const publicId = this.extractPublicIdFromUrl(imageUrl);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (error) {
        logger.error('Error deleting product image from Cloudinary:', error);
      }
    }
  }

  private async purgeFromCartsAndWishlists(productId: string): Promise<void> {
    try {
      const prodObj = new mongoose.Types.ObjectId(productId);
      await Promise.all([
        Wishlist.updateMany({}, { $pull: { items: { productId: prodObj } } }),
        Cart.updateMany({}, { $pull: { items: { productId: prodObj } } })
      ]);
    } catch (error) {
      logger.error('Error cleaning up references in carts/wishlists:', error);
    }
  }

  // Helper to extract Cloudinary public id (same logic used in UploadProductImages.usecase)
  private extractPublicIdFromUrl(url: string): string | null {
    try {
      // Robust extraction for Cloudinary URLs
      // Examples handled:
      // https://res.cloudinary.com/<cloud>/image/upload/v123456/fresh-food/abc123.jpg -> fresh-food/abc123
      // https://res.cloudinary.com/<cloud>/image/upload/fresh-food/abc123.png -> fresh-food/abc123
      const parsed = new URL(url);
      let path = parsed.pathname; // e.g. /image/upload/v12345/fresh-food/abc123.jpg

      // Find the part after '/upload/'
      const uploadIndex = path.indexOf('/upload/');
      if (uploadIndex >= 0) {
        path = path.substring(uploadIndex + '/upload/'.length);
      }

      // Remove leading slash if any
      if (path.startsWith('/')) path = path.substring(1);

      // Remove version segment like v123456/
      path = path.replace(/^v\d+\//, '');

      // Remove file extension if present
      const lastDot = path.lastIndexOf('.');
      if (lastDot > -1) {
        path = path.substring(0, lastDot);
      }

      // Result is the public id (may include folders)
      return path || null;
    } catch (error) {
      logger.error('Error extracting public ID from URL:', error);
      return null;
    }
  }
}
