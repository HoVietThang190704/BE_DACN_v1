import { Router, Request, Response } from 'express';
import { asyncHandler } from '../shared/middleware/errorHandler';
import { productController } from '../di/container';
import { authenticate } from '../shared/middleware/auth';
import { authorizeRoles } from '../shared/middleware/authorize';
import { uploadProductImages } from '../shared/middleware/upload';

export const productRoutes = Router();

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Tạo sản phẩm mới (Shop owner/Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - price
 *               - unit
 *               - description
 *               - stockQuantity
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Cà chua bi"
 *               nameEn:
 *                 type: string
 *                 example: "Cherry Tomato"
 *               category:
 *                 type: string
 *                 enum: [vegetable, fruit, herb, grain, meat, seafood, dairy, organic]
 *                 example: "vegetable"
 *               price:
 *                 type: number
 *                 example: 35000
 *               unit:
 *                 type: string
 *                 example: "kg"
 *               description:
 *                 type: string
 *                 example: "Cà chua bi tươi ngon, giàu vitamin C"
 *               stockQuantity:
 *                 type: number
 *                 example: 100
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/image-1.jpg"]
 *               inStock:
 *                 type: boolean
 *                 example: true
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["organic", "fresh", "local"]
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
productRoutes.post('/', authenticate, authorizeRoles('shop_owner', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  await productController.createProduct(req, res);
}));

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm (Shop owner/Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               unit:
 *                 type: string
 *               description:
 *                 type: string
 *               stockQuantity:
 *                 type: number
 *               inStock:
 *                 type: boolean
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
productRoutes.put('/:id', authenticate, authorizeRoles('shop_owner', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  await productController.updateProduct(req, res);
}));

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Xóa sản phẩm - Soft delete (Shop owner/Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
productRoutes.delete('/:id', authenticate, authorizeRoles('shop_owner', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  await productController.deleteProduct(req, res);
}));

/**
 * @swagger
 * /api/products/{id}/permanent:
 *   delete:
 *     summary: Xóa sản phẩm vĩnh viễn (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Xóa vĩnh viễn thành công
 *       400:
 *         description: Sản phẩm chưa được xóa mềm hoặc không thể xóa
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
productRoutes.delete('/:id/permanent', authenticate, authorizeRoles('admin'), asyncHandler(async (req: Request, res: Response) => {
  await productController.permanentDelete(req, res);
}));

/**
 * @swagger
 * /api/products/{id}/images:
 *   post:
 *     summary: Upload ảnh sản phẩm (Shop owner/Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
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
 *                 description: Tối đa 5 ảnh, mỗi ảnh max 5MB
 *     responses:
 *       200:
 *         description: Upload ảnh thành công
 *       400:
 *         description: File không hợp lệ
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
productRoutes.post('/:id/images', authenticate, authorizeRoles('shop_owner', 'admin'), uploadProductImages, asyncHandler(async (req: Request, res: Response) => {
  await productController.uploadImages(req, res);
}));

/**
 * @swagger
 * /api/products/{id}/images:
 *   delete:
 *     summary: Xóa một ảnh sản phẩm (Shop owner/Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL của ảnh cần xóa
 *     responses:
 *       200:
 *         description: Xóa ảnh thành công
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc ảnh
 */
productRoutes.delete('/:id/images', authenticate, authorizeRoles('shop_owner', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  await productController.deleteImage(req, res);
}));

// GET /api/products - Danh sách sản phẩm với tìm kiếm và lọc
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm (tìm kiếm, lọc, sắp xếp, phân trang)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm (text search trên name và description)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: owner
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Danh sách tag, phân tách bằng dấu phẩy
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, name, createdAt, rating]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm với pagination
 *       400:
 *         description: Tham số không hợp lệ
 *       500:
 *         description: Lỗi server
 */
productRoutes.get('/', asyncHandler(async (req: Request, res: Response) => {
  await productController.getProducts(req, res);
}));

// GET /api/products/categories/list - Danh sách danh mục
productRoutes.get('/categories/list', asyncHandler(async (req: Request, res: Response) => {
  await productController.getCategories(req, res);
}));

// GET /api/products/:id/traceability - Truy xuất nguồn gốc
productRoutes.get('/:id/traceability', asyncHandler(async (req: Request, res: Response) => {
  await productController.getProductTraceability(req, res);
}));

// GET /api/products/:id - Chi tiết sản phẩm
productRoutes.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  await productController.getProductById(req, res);
}));

// POST /api/products/:id/wishlist - Thêm vào wishlist
productRoutes.post('/:id/wishlist', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement after auth module
  res.json({
    success: true,
    message: 'Tính năng sẽ được triển khai sau khi hoàn thành auth module'
  });
}));