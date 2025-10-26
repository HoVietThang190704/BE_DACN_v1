import { Router, Request, Response } from 'express';
import { asyncHandler } from '../shared/middleware/errorHandler';
import { productController } from '../di/container';

export const productRoutes = Router();

/**
 * @swagger
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