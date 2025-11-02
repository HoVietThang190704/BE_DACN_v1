import multer from 'multer';
import { Request } from 'express';

/**
 * Multer configuration for file upload
 * Store files in memory as buffer for Cloudinary upload
 */

// File filter - only accept images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)'));
  }
};

// Multer config
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for Cloudinary
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Export middleware for single avatar upload
export const uploadAvatar = upload.single('avatar');

// Export middleware for multiple product images (max 5)
export const uploadProductImages = upload.array('images', 5);

// Export middleware for multiple images (general, max 10)
export const uploadMultiple = upload.array('images', 10);

export default upload;
