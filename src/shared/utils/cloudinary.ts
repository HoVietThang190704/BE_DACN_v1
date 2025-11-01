import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../config';

/**
 * Cloudinary Configuration
 */
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 */
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = 'avatars'
): Promise<{ url: string; publicId: string }> => {
  // Determine transformation based on folder
  const transformation = folder === 'products' 
    ? [
        { width: 800, height: 800, crop: 'limit' }, // Maintain aspect ratio, max 800x800
        { quality: 'auto:good', fetch_format: 'auto' }
      ]
    : [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ];

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `fresh-food/${folder}`,
        resource_type: 'image',
        transformation
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    ).end(file.buffer);
  });
};

/**
 * Delete image from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    // Don't throw error, just log it
  }
};

export default cloudinary;
