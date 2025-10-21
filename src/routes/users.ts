import { Router } from 'express';
import { userController } from '../di/container';
import { authenticate } from '../shared/middleware/auth';
import { validate } from '../shared/middleware/validate';
import { updateProfileSchema } from '../shared/validation/user.schema';

export const userRoutes = Router();

/**
 * @swagger
 * /api/users/me/profile:
 *   get:
 *     summary: Lấy thông tin hồ sơ người dùng hiện tại
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin profile thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin profile thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     userName:
 *                       type: string
 *                       example: Nguyễn Văn A
 *                     phone:
 *                       type: string
 *                       example: "0901234567"
 *                     avatar:
 *                       type: string
 *                       example: https://example.com/avatar.jpg
 *                     dateOfBirth:
 *                       type: string
 *                       format: date-time
 *                       example: "1990-01-01T00:00:00.000Z"
 *                     role:
 *                       type: string
 *                       example: customer
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi server
 */
// GET /api/users/me/profile - Get current user profile
userRoutes.get(
  '/me/profile',
  authenticate,
  (req, res) => userController.getProfile(req, res)
);

/**
 * @swagger
 * /api/users/me/profile:
 *   put:
 *     summary: Cập nhật hồ sơ người dùng hiện tại
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: Nguyễn Văn B
 *                 description: Tên người dùng (1-50 ký tự)
 *               phone:
 *                 type: string
 *                 pattern: '^(\+84|84|0)[1-9][0-9]{8}$'
 *                 example: "0901234567"
 *                 description: Số điện thoại Việt Nam hợp lệ
 *               date_of_birth:
 *                 type: string
 *                 format: date-time
 *                 example: "1990-01-01T00:00:00.000Z"
 *                 description: Ngày sinh (phải trên 13 tuổi)
 *               avatar:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/new-avatar.jpg
 *                 description: URL ảnh đại diện
 *             minProperties: 1
 *           examples:
 *             updateName:
 *               summary: Cập nhật tên
 *               value:
 *                 userName: Nguyễn Văn B
 *             updatePhone:
 *               summary: Cập nhật số điện thoại
 *               value:
 *                 phone: "0901234567"
 *             updateMultiple:
 *               summary: Cập nhật nhiều trường
 *               value:
 *                 userName: Nguyễn Văn B
 *                 phone: "0901234567"
 *                 date_of_birth: "1990-01-01T00:00:00.000Z"
 *                 avatar: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Cập nhật profile thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cập nhật profile thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     userName:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     dateOfBirth:
 *                       type: string
 *                       format: date-time
 *                     role:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Số điện thoại không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi server
 */
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
