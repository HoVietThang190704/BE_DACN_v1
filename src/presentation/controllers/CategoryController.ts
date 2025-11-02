import { Request, Response } from 'express';
import { GetCategoriesTreeUseCase } from '../../domain/usecases/category/GetCategoriesTree.usecase';
import { GetCategoryByIdUseCase } from '../../domain/usecases/category/GetCategoryById.usecase';
import { GetCategoryBreadcrumbUseCase } from '../../domain/usecases/category/GetCategoryBreadcrumb.usecase';
import { CreateCategoryUseCase } from '../../domain/usecases/category/CreateCategory.usecase';
import { UpdateCategoryUseCase } from '../../domain/usecases/category/UpdateCategory.usecase';
import { DeleteCategoryUseCase } from '../../domain/usecases/category/DeleteCategory.usecase';
import { UpdateCategoryImageUseCase } from '../../domain/usecases/category/UpdateCategoryImage.usecase';
import { CategoryMapper } from '../dto/category/Category.dto';
import { logger } from '../../shared/utils/logger';

export class CategoryController {
  constructor(
    private getCategoriesTreeUseCase: GetCategoriesTreeUseCase,
    private getCategoryByIdUseCase: GetCategoryByIdUseCase,
    private getCategoryBreadcrumbUseCase: GetCategoryBreadcrumbUseCase,
    private createCategoryUseCase: CreateCategoryUseCase,
    private updateCategoryUseCase: UpdateCategoryUseCase,
    private deleteCategoryUseCase: DeleteCategoryUseCase,
    private updateCategoryImageUseCase?: UpdateCategoryImageUseCase
  ) {}

  async getCategoriesTree(req: Request, res: Response): Promise<void> {
    try {
      const { includeInactive } = req.query;
      const include = includeInactive === 'true';

      const categories = await this.getCategoriesTreeUseCase.execute(include);
      const response = CategoryMapper.toTreeArrayDTO(categories);

      res.status(200).json({
        success: true,
        data: response,
        meta: { total: categories.length, timestamp: new Date().toISOString() }
      });
    } catch (error: any) {
      logger.error('CategoryController.getCategoriesTree error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi lấy cây danh mục' });
    }
  }

  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await this.getCategoryByIdUseCase.execute(id);
      const response = CategoryMapper.toDTO(category);
      res.status(200).json({ success: true, data: response });
    } catch (error: any) {
      logger.error('CategoryController.getCategoryById error:', error);
      if (error.message === 'Không tìm thấy danh mục') {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi lấy thông tin danh mục' });
    }
  }

  async getCategoryBreadcrumb(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const breadcrumb = await this.getCategoryBreadcrumbUseCase.execute(id);
      const response = CategoryMapper.toBreadcrumbArrayDTO(breadcrumb);
      res.status(200).json({ success: true, data: response });
    } catch (error: any) {
      logger.error('CategoryController.getCategoryBreadcrumb error:', error);
      if (error.message === 'Không tìm thấy danh mục') {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi lấy đường dẫn danh mục' });
    }
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const { name, nameEn, slug, description, icon, image, parentId, order, isActive, images, imagesPublicIds } = req.body as any;

      const category = await this.createCategoryUseCase.execute({
        name,
        nameEn,
        slug,
        description,
        icon,
        image,
        parentId,
        order,
        isActive,
        // pass through images/publicIds if used by use-case (backwards compatible)
        imagePublicId: imagesPublicIds && imagesPublicIds.length ? imagesPublicIds[0] : undefined
      } as any);

      const response = CategoryMapper.toDTO(category);
      logger.info(`Category created: ${category.id}`);
      res.status(201).json({ success: true, message: 'Tạo danh mục thành công', data: response });
    } catch (error: any) {
      logger.error('CategoryController.createCategory error:', error);
      if (error.message.includes('Slug đã tồn tại') || error.message.includes('không được để trống') || error.message.includes('không tồn tại') || error.message.includes('không hợp lệ')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Lỗi khi tạo danh mục' });
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, nameEn, slug, description, icon, image, parentId, order, isActive } = req.body as any;

      const category = await this.updateCategoryUseCase.execute(id, { name, nameEn, slug, description, icon, image, parentId, order, isActive } as any);
      const response = CategoryMapper.toDTO(category);
      logger.info(`Category updated: ${id}`);
      res.status(200).json({ success: true, message: 'Cập nhật danh mục thành công', data: response });
    } catch (error: any) {
      logger.error('CategoryController.updateCategory error:', error);
      if (error.message === 'Không tìm thấy danh mục') {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      if (error.message.includes('Slug đã tồn tại') || error.message.includes('không được để trống') || error.message.includes('không thể') || error.message.includes('không hợp lệ')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật danh mục' });
    }
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { force } = req.query;
      await this.deleteCategoryUseCase.execute(id, { force: force === 'true' });
      logger.info(`Category deleted: ${id}`);
      res.status(200).json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (error: any) {
      logger.error('CategoryController.deleteCategory error:', error);
      if (error.message === 'Không tìm thấy danh mục') {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      if (error.message.includes('Không thể xóa') || error.message.includes('đã bị xóa')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Lỗi khi xóa danh mục' });
    }
  }

  async restoreCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.deleteCategoryUseCase.restore(id);
      logger.info(`Category restored: ${id}`);
      res.status(200).json({ success: true, message: 'Khôi phục danh mục thành công' });
    } catch (error: any) {
      logger.error('CategoryController.restoreCategory error:', error);
      if (error.message === 'Không tìm thấy danh mục') {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      if (error.message.includes('chưa bị xóa') || error.message.includes('Không thể khôi phục')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Lỗi khi khôi phục danh mục' });
    }
  }

  // Single-file image update for category (similar to user/product flows)
  async updateCategoryImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = req.file as Express.Multer.File | undefined;

      if (!file) {
        res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh' });
        return;
      }

      if (!this.updateCategoryImageUseCase) {
        throw new Error('Use case not available');
      }

      const category = await this.updateCategoryImageUseCase.execute(id, file);
      const response = CategoryMapper.toDTO(category);
      res.status(200).json({ success: true, message: 'Cập nhật ảnh danh mục thành công', data: response });
    } catch (error: any) {
      logger.error('CategoryController.updateCategoryImage error:', error);
      if (error.message === 'Không tìm thấy danh mục') {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi cập nhật ảnh danh mục' });
    }
  }
}

