import { Router, Request, Response } from 'express';
import { asyncHandler } from '../shared/middleware/errorHandler';
import { productController } from '../di/container';

export const productRoutes = Router();

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