import multer from 'multer';
import { Request } from 'express';

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(), 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});

export const uploadAvatar = upload.single('avatar');

export const uploadCertificate = upload.single('certificate');

export const uploadProductImages = upload.array('images', 5);

export const uploadMultiple = upload.array('images', 10);

export default upload;
