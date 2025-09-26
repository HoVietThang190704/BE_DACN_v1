import { Router } from 'express';
import { asyncHandler } from '../shared/middleware/errorHandler';
import { ProductService } from '../modules/products/productService';

export const productRoutes = Router();
const productService = new ProductService();

// GET /api/products - Danh sách sản phẩm với tìm kiếm và lọc
productRoutes.get('/', asyncHandler(async (req, res) => {
  const { 
    q,           // tìm kiếm
    category,    // danh mục  
    farm,        // farm/nhà cung cấp
    certified,   // chứng nhận (VietGAP, GlobalGAP)
    minPrice,    // giá tối thiểu
    maxPrice,    // giá tối đa
    sortBy,      // sắp xếp (price, name, createdAt)
    order,       // thứ tự (asc, desc)
    page = 1,    // trang
    limit = 20   // số lượng mỗi trang
  } = req.query;

  const filters = {
    search: q as string,
    category: category as string,
    farm: farm as string,
    certified: certified as string,
    minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
  };

  const sorting = {
    sortBy: (sortBy as string) || 'createdAt',
    order: (order as string) || 'desc'
  };

  const pagination = {
    page: parseInt(page as string),
    limit: parseInt(limit as string)
  };

  const result = await productService.getProducts(filters, sorting, pagination);
  
  res.json({
    success: true,
    data: result.products,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
}));

// GET /api/products/:id - Chi tiết sản phẩm
productRoutes.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productService.getProductById(id);
  
  res.json({
    success: true,
    data: product
  });
}));

// GET /api/products/:id/traceability - Truy xuất nguồn gốc
productRoutes.get('/:id/traceability', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const traceability = await productService.getProductTraceability(id);
  
  res.json({
    success: true,
    data: traceability
  });
}));

// GET /api/products/categories - Danh sách danh mục
productRoutes.get('/categories/list', asyncHandler(async (req, res) => {
  const categories = await productService.getCategories();
  
  res.json({
    success: true,
    data: categories
  });
}));

// POST /api/products/:id/wishlist - Thêm vào wishlist
productRoutes.post('/:id/wishlist', asyncHandler(async (req, res) => {
  // TODO: Implement after auth module
  res.json({
    success: true,
    message: 'Tính năng sẽ được triển khai sau khi hoàn thành auth module'
  });
}));