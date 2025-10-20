import { Request, Response } from 'express';
import { GetProductsUseCase } from '../../domain/usecases/product/GetProducts.usecase';
import { GetProductByIdUseCase } from '../../domain/usecases/product/GetProductById.usecase';
import { GetProductTraceabilityUseCase } from '../../domain/usecases/product/GetProductTraceability.usecase';
import { GetCategoriesUseCase } from '../../domain/usecases/product/GetCategories.usecase';
import { ProductMapper } from '../dto/product/Product.dto';
import { ProductFilters, ProductSorting, ProductPagination } from '../../domain/repositories/IProductRepository';
import { logger } from '../../shared/utils/logger';

/**
 * Product Controller - HTTP Layer
 * Handles HTTP requests and delegates to use cases
 */
export class ProductController {
  constructor(
    private getProductsUseCase: GetProductsUseCase,
    private getProductByIdUseCase: GetProductByIdUseCase,
    private getProductTraceabilityUseCase: GetProductTraceabilityUseCase,
    private getCategoriesUseCase: GetCategoriesUseCase
  ) {}

  /**
   * GET /api/products
   * Get products with filtering, sorting and pagination
   */
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const { 
        q,           // search query
        category,
        farm,
        certified,
        minPrice,
        maxPrice,
        isOrganic,
        isFresh,
        inStock,
        province,
        minRating,
        sortBy,
        order,
        page = 1,
        limit = 20
      } = req.query;

      // Build filters
      const filters: ProductFilters = {};
      if (q) filters.search = q as string;
      if (category) filters.category = category as string;
      if (farm) filters.farm = farm as string;
      if (certified) filters.certified = certified as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (isOrganic !== undefined) filters.isOrganic = isOrganic === 'true';
      if (isFresh !== undefined) filters.isFresh = isFresh === 'true';
      if (inStock !== undefined) filters.inStock = inStock === 'true';
      if (province) filters.province = province as string;
      if (minRating) filters.minRating = parseFloat(minRating as string);

      // Build sorting
      const sorting: ProductSorting = {
        sortBy: (sortBy as any) || 'createdAt',
        order: (order as any) || 'desc'
      };

      // Build pagination
      const pagination: ProductPagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      // Execute use case
      const result = await this.getProductsUseCase.execute(filters, sorting, pagination);

      // Map to DTO
      const response = ProductMapper.toPaginatedDTO(
        result.products,
        result.total,
        result.page,
        result.limit,
        result.totalPages,
        true // Include computed fields
      );

      res.status(200).json({
        success: true,
        data: response.products,
        pagination: {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages
        }
      });
    } catch (error: any) {
      logger.error('ProductController.getProducts error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy danh sách sản phẩm'
      });
    }
  }

  /**
   * GET /api/products/:id
   * Get product by ID
   */
  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Execute use case
      const product = await this.getProductByIdUseCase.execute(id);

      // Map to DTO
      const response = ProductMapper.toDTO(product, true);

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error: any) {
      logger.error('ProductController.getProductById error:', error);
      
      if (error.message === 'Không tìm thấy sản phẩm') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy thông tin sản phẩm'
      });
    }
  }

  /**
   * GET /api/products/:id/traceability
   * Get product traceability information
   */
  async getProductTraceability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Execute use case
      const traceability = await this.getProductTraceabilityUseCase.execute(id);

      // Map to DTO
      const response = ProductMapper.toTraceabilityDTO(traceability);

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error: any) {
      logger.error('ProductController.getProductTraceability error:', error);
      
      if (error.message === 'Không tìm thấy sản phẩm') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy thông tin truy xuất nguồn gốc'
      });
    }
  }

  /**
   * GET /api/products/categories/list
   * Get all categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      // Execute use case
      const categories = await this.getCategoriesUseCase.execute();

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      logger.error('ProductController.getCategories error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy danh sách danh mục'
      });
    }
  }
}
