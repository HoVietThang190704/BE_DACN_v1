import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../shared/middleware/auth.middleware';
import { CloudinaryService } from '../services/cloudinary.service';

const router = Router();

// Configure multer for memory storage (upload to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files. Prefer checking mimetype startsWith('image/'),
    // but keep extension fallback for odd clients.
    try {
      const allowedTypes = /(jpeg|jpg|jfif|png|gif|webp)/;
      const orig = String(file.originalname || '');
      const ext = path.extname(orig).toLowerCase().replace(/^\./, '');
      const mimetype = String(file.mimetype || '');

      // Debug log to help diagnose unexpected uploads
      console.debug('[upload] fileFilter:', { originalname: orig, mimetype, ext });

      const isImageMime = mimetype.startsWith('image/');
      const isAllowedExt = allowedTypes.test(ext);

      if (isImageMime || isAllowedExt) {
        return cb(null, true);
      }

      cb(new Error('Only image files are allowed!'));
    } catch (err) {
      // If anything surprising happens, reject the file and log
      console.error('[upload] fileFilter error', err);
      cb(new Error('Only image files are allowed!'));
    }
  }
});

/**
 * @swagger
 * /api/upload/images:
 *   post:
 *     tags: [Upload]
 *     summary: Upload ảnh lên Cloudinary
 *     description: Upload nhiều ảnh (tối đa 10 ảnh, mỗi ảnh tối đa 10MB)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     urls:
 *                       type: array
 *                       items:
 *                         type: string
 *                     publicIds:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.post('/images', authMiddleware, upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    // Log origin and filenames to aid debugging when running in production
    console.info('[upload] origin:', req.headers.origin || 'none', 'files:', files.map(f => f.originalname));
    
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
      return;
    }

    // Upload to Cloudinary
    const uploadResults = await CloudinaryService.uploadMultipleImages(files, 'posts');
    
    const urls = uploadResults.map(result => result.url);
    const publicIds = uploadResults.map(result => result.publicId);

    res.status(200).json({
      success: true,
      data: {
        urls,
        publicIds
      }
    });
  } catch (error: any) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images'
    });
  }
});

/**
 * @swagger
 * /api/upload/images/{publicId}:
 *   delete:
 *     tags: [Upload]
 *     summary: Xóa ảnh trên Cloudinary
 *     description: Xóa ảnh đã upload (cần encode publicId)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID của ảnh (encode URL)
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/images/:publicId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    
    // Decode publicId (it might be URL encoded)
    const decodedPublicId = decodeURIComponent(publicId);

    // Delete from Cloudinary
    await CloudinaryService.deleteImage(decodedPublicId);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete image'
    });
  }
});

export { router as uploadRoutes };
