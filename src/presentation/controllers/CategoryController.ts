import { Request, Response } from 'express';
import { GetCategoriesTreeUseCase } from '../../domain/usecases/category/GetCategoriesTree.usecase';
import { GetCategoryByIdUseCase } from '../../domain/usecases/category/GetCategoryById.usecase';
import { GetCategoryBreadcrumbUseCase } from '../../domain/usecases/category/GetCategoryBreadcrumb.usecase';
import { CategoryMapper } from '../dto/category/Category.dto';
import { logger } from '../../shared/utils/logger';

/**
 * Category Controller - HTTP Layer
 * Handles HTTP requests for category operations
 */
export class CategoryController {
  constructor(
    private getCategoriesTreeUseCase: GetCategoriesTreeUseCase,
    private getCategoryByIdUseCase: GetCategoryByIdUseCase,
    private getCategoryBreadcrumbUseCase: GetCategoryBreadcrumbUseCase
  ) {}

  /**
   * GET /api/categories
   * Get all categories in tree structure (hierarchical)
   */
  async getCategoriesTree(req: Request, res: Response): Promise<void> {
    try {
      const { includeInactive } = req.query;
      const include = includeInactive === 'true';

      // Execute use case
      const categories = await this.getCategoriesTreeUseCase.execute(include);

      // Map to DTO with computed fields
      const response = CategoryMapper.toTreeArrayDTO(categories);

      res.status(200).json({
        success: true,
        data: response,
        meta: {
          total: categories.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      logger.error('CategoryController.getCategoriesTree error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy cây danh mục'
      });
    }
  }

  /**
   * GET /api/categories/:id
   * Get category by ID
   */
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Execute use case
      const category = await this.getCategoryByIdUseCase.execute(id);

      // Map to DTO
      const response = CategoryMapper.toDTO(category);

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error: any) {
      logger.error('CategoryController.getCategoryById error:', error);
      
      if (error.message === 'Không tìm thấy danh mục') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy thông tin danh mục'
      });
    }
  }

  /**
   * GET /api/categories/:id/breadcrumb
   * Get breadcrumb path for a category
   */
  async getCategoryBreadcrumb(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Execute use case
      const breadcrumb = await this.getCategoryBreadcrumbUseCase.execute(id);

      // Map to DTO
      const response = CategoryMapper.toBreadcrumbArrayDTO(breadcrumb);

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error: any) {
      logger.error('CategoryController.getCategoryBreadcrumb error:', error);
      
      if (error.message === 'Không tìm thấy danh mục') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy đường dẫn danh mục'
      });
    }
  }
}
