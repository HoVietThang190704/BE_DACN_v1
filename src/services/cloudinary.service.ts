import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import { logger } from '../shared/utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true
});

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export class CloudinaryService {
  /**
   * Upload a single image to Cloudinary
   */
  static async uploadImage(
    buffer: Buffer,
    folder: string = 'posts',
    publicId?: string
  ): Promise<UploadResult> {
    try {
      return new Promise((resolve, reject) => {
        const uploadOptions: Record<string, unknown> = {
          folder: `fresh-food/${folder}`,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // Max size
            { quality: 'auto:good' }, // Auto quality
            { fetch_format: 'auto' } // Auto format (WebP when supported)
          ]
        };

        if (publicId) {
          // allow passing custom public id for stable naming
          (uploadOptions as any).public_id = publicId;
        }

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              logger.error('Cloudinary upload error:', error);
              reject(error);
            } else if (result) {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes
              });
            } else {
              reject(new Error('Upload failed - no result'));
            }
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      logger.error('Error uploading to Cloudinary:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Upload multiple images to Cloudinary
   */
  static async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'posts'
  ): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map(file => {
        // create lightweight unique public id; avoid using original filename directly
        const randomId = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        return this.uploadImage(file.buffer, folder, randomId);
      });
      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error('Error uploading multiple images:', error);
      throw new Error('Failed to upload images');
    }
  }

  /**
   * Delete an image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Deleted image: ${publicId}`);
    } catch (error) {
      logger.error('Error deleting from Cloudinary:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  static async deleteMultipleImages(publicIds: string[]): Promise<void> {
    try {
      const deletePromises = publicIds.map(id => this.deleteImage(id));
      await Promise.all(deletePromises);
    } catch (error) {
      logger.error('Error deleting multiple images:', error);
      throw new Error('Failed to delete images');
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedUrl(
    publicId: string,
    width?: number,
    height?: number
  ): string {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto'
    });
  }
}
