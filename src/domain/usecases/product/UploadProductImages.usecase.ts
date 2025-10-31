import { ProductEntity } from '../../entities/Product.entity';
import { IProductRepository } from '../../repositories/IProductRepository';
import { uploadToCloudinary, deleteFromCloudinary } from '../../../shared/utils/cloudinary';
import { logger } from '../../../shared/utils/logger';

/**
 * Use Case: Upload Product Images
 * Business logic for managing product images (upload, update, delete)
 */

export class UploadProductImagesUseCase {
  constructor(private productRepository: IProductRepository) {}

  /**
   * Upload multiple images for a product
   * Max 5 images per product
   */
  async execute(
    productId: string,
    files: Express.Multer.File[]
  ): Promise<ProductEntity> {
    // Check if product exists
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    // Validate number of files
    if (!files || files.length === 0) {
      throw new Error('Vui lòng chọn ít nhất một ảnh');
    }

    // Check total images limit (existing + new)
    const maxImages = 5;
    const currentImagesCount = product.images.length;
    const totalAfterUpload = currentImagesCount + files.length;

    if (totalAfterUpload > maxImages) {
      throw new Error(`Sản phẩm chỉ có thể có tối đa ${maxImages} ảnh. Hiện tại có ${currentImagesCount} ảnh.`);
    }

    // Validate file types and sizes
    this.validateFiles(files);

    // Upload images to Cloudinary
    const uploadedImages: string[] = [];
    const uploadPromises = files.map(async (file) => {
      try {
        const result = await uploadToCloudinary(file, 'products');
        return result.url;
      } catch (error) {
        logger.error('Error uploading image to Cloudinary:', error);
        throw new Error('Lỗi khi upload ảnh');
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    uploadedImages.push(...uploadResults);

    // Update product with new images
    const updatedImages = [...product.images, ...uploadedImages];
    const updatedProduct = await this.productRepository.update(productId, {
      images: updatedImages
    });

    if (!updatedProduct) {
      throw new Error('Không thể cập nhật ảnh sản phẩm');
    }

    logger.info(`Uploaded ${uploadedImages.length} images for product: ${productId}`);

    return updatedProduct;
  }

  /**
   * Delete a specific image from product
   */
  async deleteImage(productId: string, imageUrl: string): Promise<ProductEntity> {
    // Check if product exists
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    // Check if image exists in product
    if (!product.images.includes(imageUrl)) {
      throw new Error('Ảnh không tồn tại trong sản phẩm');
    }

    // Extract Cloudinary public ID from URL
    const publicId = this.extractPublicIdFromUrl(imageUrl);

    // Delete from Cloudinary
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (error) {
        logger.error('Error deleting image from Cloudinary:', error);
        // Continue even if Cloudinary deletion fails
      }
    }

    // Remove image from product
    const updatedImages = product.images.filter(img => img !== imageUrl);
    const updatedProduct = await this.productRepository.update(productId, {
      images: updatedImages
    });

    if (!updatedProduct) {
      throw new Error('Không thể xóa ảnh sản phẩm');
    }

    logger.info(`Deleted image from product: ${productId}`);

    return updatedProduct;
  }

  /**
   * Replace all product images
   */
  async replaceAllImages(
    productId: string,
    files: Express.Multer.File[]
  ): Promise<ProductEntity> {
    // Check if product exists
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    // Validate files
    if (!files || files.length === 0) {
      throw new Error('Vui lòng chọn ít nhất một ảnh');
    }

    if (files.length > 5) {
      throw new Error('Sản phẩm chỉ có thể có tối đa 5 ảnh');
    }

    this.validateFiles(files);

    // Delete old images from Cloudinary
    for (const imageUrl of product.images) {
      const publicId = this.extractPublicIdFromUrl(imageUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (error) {
          logger.error('Error deleting old image:', error);
        }
      }
    }

    // Upload new images
    const uploadedImages: string[] = [];
    const uploadPromises = files.map(async (file) => {
      try {
        const result = await uploadToCloudinary(file, 'products');
        return result.url;
      } catch (error) {
        logger.error('Error uploading image:', error);
        throw new Error('Lỗi khi upload ảnh');
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    uploadedImages.push(...uploadResults);

    // Update product with new images
    const updatedProduct = await this.productRepository.update(productId, {
      images: uploadedImages
    });

    if (!updatedProduct) {
      throw new Error('Không thể cập nhật ảnh sản phẩm');
    }

    logger.info(`Replaced all images for product: ${productId}`);

    return updatedProduct;
  }

  /**
   * Set primary image (move to first position)
   */
  async setPrimaryImage(productId: string, imageUrl: string): Promise<ProductEntity> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    if (!product.images.includes(imageUrl)) {
      throw new Error('Ảnh không tồn tại trong sản phẩm');
    }

    // Reorder images with selected image first
    const reorderedImages = [
      imageUrl,
      ...product.images.filter(img => img !== imageUrl)
    ];

    const updatedProduct = await this.productRepository.update(productId, {
      images: reorderedImages
    });

    if (!updatedProduct) {
      throw new Error('Không thể cập nhật ảnh chính');
    }

    return updatedProduct;
  }

  private validateFiles(files: Express.Multer.File[]): void {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error('Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP');
      }

      if (file.size > maxSize) {
        throw new Error(`Kích thước ảnh không được vượt quá ${maxSize / 1024 / 1024}MB`);
      }
    }
  }

  private extractPublicIdFromUrl(url: string): string | null {
    try {
      // Extract public ID from Cloudinary URL
      // Example: https://res.cloudinary.com/xxx/image/upload/v123/fresh-food/products/abc.jpg
      // Public ID: fresh-food/products/abc
      const matches = url.match(/\/fresh-food\/[^/]+\/([^.]+)/);
      if (matches && matches[0]) {
        return matches[0].substring(1); // Remove leading slash
      }
      return null;
    } catch (error) {
      logger.error('Error extracting public ID from URL:', error);
      return null;
    }
  }
}
