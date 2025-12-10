import { Router } from 'express';
import { authenticate } from '../shared/middleware/auth';
import { authorizeRoles } from '../shared/middleware/authorize';
import { registerShopOwnerController } from '../di/container';
import { HttpStatus } from '../shared/constants/httpStatus';
import { uploadCertificate } from '../shared/middleware/upload';
import { validate } from '../shared/middleware/validate';
import { listRegisterShopOwnerQuerySchema, reviewRegisterShopOwnerSchema } from '../shared/validation/registerShopOwner.schema';

export const registerShopOwnerRoutes = Router();

registerShopOwnerRoutes.get('/me', authenticate, (req, res) => registerShopOwnerController.getMine(req, res));

registerShopOwnerRoutes.post(
  '/',
  authenticate,
  (req, res, next) => {
    uploadCertificate(req, res, (err: any) => {
      if (err) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: err.message });
        return;
      }
      next();
    });
  },
  (req, res) => registerShopOwnerController.submit(req, res)
);

registerShopOwnerRoutes.get(
  '/',
  authenticate,
  authorizeRoles('admin'),
  validate(listRegisterShopOwnerQuerySchema),
  (req, res) => registerShopOwnerController.list(req, res)
);

registerShopOwnerRoutes.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('admin'),
  validate(reviewRegisterShopOwnerSchema),
  (req, res) => registerShopOwnerController.review(req, res)
);
