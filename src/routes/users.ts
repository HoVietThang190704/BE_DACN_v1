import { Router } from 'express';
import { userController, addressController, orderController, voucherController, repositories, adminUserController } from '../di/container';
import { authenticate } from '../shared/middleware/auth';
import { isShopOwnerOrAdmin, isAdmin } from '../shared/middleware/authorize';
import { validate } from '../shared/middleware/validate';
import { updateProfileSchema } from '../shared/validation/user.schema';
import { UserMapper } from '../presentation/dto/user/User.dto';
import { uploadAvatar } from '../shared/middleware/upload';

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

/**
 * @swagger
 * /api/users/me/avatar:
 *   post:
 *     summary: Cập nhật ảnh đại diện
 *     description: Upload ảnh đại diện lên Cloudinary và cập nhật thông tin người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh (jpg, jpeg, png, gif, webp) - tối đa 5MB
 *     responses:
 *       200:
 *         description: Cập nhật ảnh đại diện thành công
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
 *                   example: Cập nhật ảnh đại diện thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatar:
 *                       type: string
 *                       format: uri
 *                       example: https://res.cloudinary.com/dtk2qgorj/image/upload/v1234567890/fresh-food/avatars/user123.jpg
 *       400:
 *         description: Lỗi validation (không có file hoặc file không hợp lệ)
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
 *                   example: Vui lòng chọn file ảnh để upload
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi server khi upload
 */
// POST /api/users/me/avatar - Upload avatar
userRoutes.post(
  '/me/avatar',
  authenticate,
  (req, res, next) => {
    uploadAvatar(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Lỗi khi upload file'
        });
      }
      return next();
    });
  },
  (req, res) => userController.uploadAvatar(req, res)
);

// Legacy endpoints
userRoutes.get('/profile', authenticate, (req, res) => {
  res.redirect(307, '/api/users/me/profile');
});

userRoutes.put('/profile', authenticate, validate(updateProfileSchema), (req, res) => {
  res.redirect(307, '/api/users/me/profile');
});

/**
 * @swagger
 * /api/users/me/addresses:
 *   get:
 *     summary: Lấy danh sách địa chỉ giao hàng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách địa chỉ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Chưa đăng nhập
 */
userRoutes.get('/me/addresses', authenticate, (req, res) => {
  addressController.getUserAddresses(req, res);
});

/**
 * @swagger
 * /api/users/me/addresses/{id}/default:
 *   patch:
 *     summary: Đặt địa chỉ làm mặc định
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ
 *     responses:
 *       200:
 *         description: Đặt địa chỉ mặc định thành công
 *       404:
 *         description: Không tìm thấy địa chỉ
 *       401:
 *         description: Chưa đăng nhập
 */
userRoutes.patch('/me/addresses/:id/default', authenticate, (req, res) => {
  addressController.setDefaultAddress(req, res);
});

// ============================================================
// ORDER ROUTES
// ============================================================

/**
 * @swagger
 * /api/users/me/orders/statistics:
 *   get:
 *     summary: Lấy thống kê đơn hàng của người dùng
 *     description: Thống kê số lượng đơn hàng theo từng trạng thái
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thống kê đơn hàng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       example: 25
 *                     pending:
 *                       type: number
 *                       example: 3
 *                     confirmed:
 *                       type: number
 *                       example: 5
 *                     preparing:
 *                       type: number
 *                       example: 2
 *                     shipping:
 *                       type: number
 *                       example: 4
 *                     delivered:
 *                       type: number
 *                       example: 10
 *                     cancelled:
 *                       type: number
 *                       example: 1
 *       401:
 *         description: Chưa đăng nhập
 */
userRoutes.get('/me/orders/statistics', authenticate, (req, res) => {
  orderController.getOrderStatistics(req, res);
});

userRoutes.post('/me/orders', authenticate, (req, res) => {
  orderController.createOrder(req, res);
});

// Managed order routes for sellers/admins
userRoutes.get('/me/manage/orders', authenticate, isShopOwnerOrAdmin, (req, res) => {
  orderController.getManagedOrders(req, res);
});

userRoutes.get('/me/manage/orders/:id', authenticate, isShopOwnerOrAdmin, (req, res) => {
  orderController.getManagedOrderById(req, res);
});

userRoutes.patch('/me/manage/orders/:id/status', authenticate, isShopOwnerOrAdmin, (req, res) => {
  orderController.updateManagedOrderStatus(req, res);
});

/**
 * @swagger
 * /api/users/me/orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng của người dùng
 *     description: Lấy danh sách đơn hàng với bộ lọc và phân trang
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, preparing, shipping, delivered, cancelled, refunded]
 *         description: Lọc theo trạng thái đơn hàng
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *         description: Lọc theo trạng thái thanh toán
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Lọc từ ngày (ISO 8601)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Lọc đến ngày (ISO 8601)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng đơn hàng mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách đơn hàng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 10
 *                         total:
 *                           type: number
 *                           example: 25
 *                         totalPages:
 *                           type: number
 *                           example: 3
 *       401:
 *         description: Chưa đăng nhập
 */
userRoutes.get('/me/orders', authenticate, (req, res) => {
  orderController.getUserOrders(req, res);
});

/**
 * @swagger
 * /api/users/me/orders/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng
 *     description: Lấy thông tin chi tiết của một đơn hàng cụ thể
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     responses:
 *       200:
 *         description: Lấy thông tin đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin đơn hàng thành công
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy đơn hàng hoặc không có quyền truy cập
 */
userRoutes.get('/me/orders/:id', authenticate, (req, res) => {
  orderController.getOrderById(req, res);
});

/**
 * @swagger
 * /api/users/me/orders/{id}/cancel:
 *   post:
 *     summary: Hủy đơn hàng
 *     description: Hủy đơn hàng (chỉ được hủy khi ở trạng thái pending hoặc confirmed)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 example: Tôi đã đặt nhầm sản phẩm
 *                 description: Lý do hủy đơn hàng
 *     responses:
 *       200:
 *         description: Hủy đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hủy đơn hàng thành công
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Không thể hủy đơn hàng (trạng thái không phù hợp hoặc thiếu lý do)
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy đơn hàng hoặc không có quyền truy cập
 */
userRoutes.post('/me/orders/:id/cancel', authenticate, (req, res) => {
  orderController.cancelOrder(req, res);
});

/**
 * @swagger
 * /api/users/me/orders/{id}/payment-status:
 *   put:
 *     summary: Cập nhật trạng thái thanh toán
 *     description: Cập nhật trạng thái thanh toán của đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed, refunded]
 *                 example: paid
 *                 description: Trạng thái thanh toán mới
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật trạng thái thanh toán thành công
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy đơn hàng hoặc không có quyền truy cập
 */
userRoutes.put('/me/orders/:id/payment-status', authenticate, (req, res) => {
  orderController.updatePaymentStatus(req, res);
});

userRoutes.post('/me/orders/:id/confirm-delivered', authenticate, (req, res) => {
  orderController.confirmOrderDelivered(req, res);
});

// Voucher routes
userRoutes.get('/me/vouchers', authenticate, (req, res) => {
  voucherController.listUserVouchers(req, res);
});

userRoutes.post('/me/vouchers/apply', authenticate, (req, res) => {
  voucherController.applyVoucher(req, res);
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách người dùng (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           example: customer
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: Nguyen
 *     responses:
 *       200:
 *         description: Danh sách người dùng trả về thành công
 */
userRoutes.get('/', authenticate, isAdmin, (req, res) => adminUserController.listUsers(req, res));
