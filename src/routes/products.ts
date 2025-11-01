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
 * /api/products/seller/products:
 *   post:
 *     summary: Thêm sản phẩm mới (seller)
 *     tags: [Products]
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
 *               - farm
 *               - harvestDate
 *               - shelfLife
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
 *               farm:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Nông trại Xanh"
 *                   location:
 *                     type: object
 *                     properties:
 *                       province:
 *                         type: string
 *                         example: "Đà Lạt"
 *                       district:
 *                         type: string
 *                         example: "Lâm Đồng"
 *                       commune:
 *                         type: string
 *                         example: "Xuân Thọ"
 *                   farmer:
 *                     type: string
 *                     example: "Nguyễn Văn A"
 *                   contact:
 *                     type: string
 *                     example: "0901234567"
 *               harvestDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-10-27"
 *               shelfLife:
 *                 type: number
 *                 example: 7
 *               certifications:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [VietGAP, GlobalGAP, Organic, HACCP, ISO22000]
 *                 example: ["VietGAP", "Organic"]
 *               isOrganic:
 *                 type: boolean
 *                 example: true
 *               isFresh:
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
 *               description:
 *                 type: string
 *               stockQuantity:
 *                 type: number
 *               isOrganic:
 *                 type: boolean
 *               isFresh:
 *                 type: boolean
 *               inStock:
 *                 type: boolean
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
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sản phẩm đã được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 price:
 *                   type: number
 *                 category:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 */
let nextProductId = 1;
productRoutes.post('/seller/products', (req, res) => {
  const { name, price, category } = req.body;
  const id = nextProductId++;
  res.status(201).json({
    id,
    name,
    price,
    category,
    createdAt: new Date()
  });
});

// GET /api/products - Danh sách sản phẩm với tìm kiếm và lọc
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