import { Router } from 'express';
import { userController } from '../di/container';
import { authenticate } from '../shared/middleware/auth';
import { validate } from '../shared/middleware/validate';
import { updateProfileSchema } from '../shared/validation/user.schema';

export const userRoutes = Router();

// GET /api/users/me/profile - Get current user profile
userRoutes.get(
  '/me/profile',
  authenticate,
  (req, res) => userController.getProfile(req, res)
);

// PUT /api/users/me/profile - Update current user profile
userRoutes.put(
  '/me/profile',
  authenticate,
  validate(updateProfileSchema),
  (req, res) => userController.updateProfile(req, res)
);

// Legacy endpoints
userRoutes.get('/profile', authenticate, (req, res) => {
  res.redirect(307, '/api/users/me/profile');
});

userRoutes.put('/profile', authenticate, validate(updateProfileSchema), (req, res) => {
  res.redirect(307, '/api/users/me/profile');
});

// GET /api/users/addresses - Manage user addresses
userRoutes.get('/addresses', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Quản lý địa chỉ giao hàng sẽ được triển khai trong Sprint tiếp theo'
  });
});
