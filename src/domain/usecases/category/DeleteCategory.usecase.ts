import { ICategoryRepository } from '../../repositories/ICategoryRepository';
import { IProductRepository } from '../../repositories/IProductRepository';
import { logger } from '../../../shared/utils/logger';

/**
 * Use Case: Delete Category
 * Business logic for deleting a category (soft delete)
 */

export interface DeleteCategoryOptions {
  force?: boolean; // Force delete even if has products (for admin)
}

export class DeleteCategoryUseCase {
  constructor(
    private categoryRepository: ICategoryRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(categoryId: string, options?: DeleteCategoryOptions): Promise<boolean> {
    // Check if category exists
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }

    // Check if already deleted
    if (!category.isActive) {
      // If caller didn't ask to force delete, stop and inform client
      if (!options?.force) {
        throw new Error('Danh mục đã bị xóa trước đó');
      }
      // otherwise proceed to hard delete (force)
    }

    // Check if has active children
    const children = await this.categoryRepository.getChildren(categoryId, false);
    if (children.length > 0) {
      throw new Error('Không thể xóa danh mục có danh mục con đang hoạt động. Vui lòng xóa hoặc di chuyển các danh mục con trước.');
    }

    // Check if has products (unless force delete)
    if (!options?.force && category.productCount > 0) {
      throw new Error(`Không thể xóa danh mục có ${category.productCount} sản phẩm. Vui lòng di chuyển hoặc xóa các sản phẩm trước.`);
    }

  // Perform hard delete (remove document from DB)
  // NOTE: this will permanently remove the category. Be sure this is intended.
  const deleted = await this.categoryRepository.hardDelete(categoryId);

    if (!deleted) {
      throw new Error('Không thể xóa danh mục');
    }

    // If force delete and has products, update products to remove category
    if (options?.force && category.productCount > 0) {
      logger.warn(`Force deleting category ${categoryId} with ${category.productCount} products`);
    }

    logger.info(`Category deleted: ${categoryId} - ${category.name}`);

    return true;
  }

  async permanentDelete(categoryId: string): Promise<boolean> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }

    // Check if has children
    const allChildren = await this.categoryRepository.getChildren(categoryId, true);
    if (allChildren.length > 0) {
      throw new Error('Không thể xóa vĩnh viễn danh mục có danh mục con');
    }

    // Check if has products
    if (category.productCount > 0) {
      throw new Error('Không thể xóa vĩnh viễn danh mục có sản phẩm');
    }

    const deleted = await this.categoryRepository.delete(categoryId);

    logger.warn(`Category permanently deleted: ${categoryId} - ${category.name}`);

    return deleted;
  }

  async restore(categoryId: string): Promise<boolean> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }

    if (category.isActive) {
      throw new Error('Danh mục chưa bị xóa');
    }

    // If has parent, check if parent is active
    if (category.parentId) {
      const parent = await this.categoryRepository.findById(category.parentId);
      if (!parent || !parent.isActive) {
        throw new Error('Không thể khôi phục danh mục vì danh mục cha không hoạt động');
      }
    }

    // Restore category
    const restored = await this.categoryRepository.update(categoryId, { isActive: true });

    if (!restored) {
      throw new Error('Không thể khôi phục danh mục');
    }

    logger.info(`Category restored: ${categoryId} - ${category.name}`);

    return true;
  }
}
