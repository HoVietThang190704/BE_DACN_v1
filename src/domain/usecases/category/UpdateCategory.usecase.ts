import { CategoryEntity } from '../../entities/Category.entity';
import { ICategoryRepository } from '../../repositories/ICategoryRepository';
import { logger } from '../../../shared/utils/logger';

/**
 * Use Case: Update Category
 * Business logic for updating an existing category
 */

export interface UpdateCategoryInput {
  name?: string;
  nameEn?: string;
  slug?: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
}

export class UpdateCategoryUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(categoryId: string, input: UpdateCategoryInput): Promise<CategoryEntity> {
    // Check if category exists
    const existingCategory = await this.categoryRepository.findById(categoryId);
    if (!existingCategory) {
      throw new Error('Không tìm thấy danh mục');
    }

    // Validate input
    this.validateInput(input);

    // Check if new slug exists (if slug is being changed)
    if (input.slug && input.slug !== existingCategory.slug) {
      const slugExists = await this.categoryRepository.slugExists(input.slug, categoryId);
      if (slugExists) {
        throw new Error('Slug đã tồn tại');
      }
    }

    // Handle parent change
    let newLevel = existingCategory.level;
    if (input.parentId !== undefined) {
      // Check for circular reference
      if (input.parentId === categoryId) {
        throw new Error('Danh mục không thể là cha của chính nó');
      }

      // Check if new parent exists and get its level
      if (input.parentId) {
        const parentCategory = await this.categoryRepository.findById(input.parentId);
        if (!parentCategory) {
          throw new Error('Danh mục cha không tồn tại');
        }
        if (!parentCategory.isActive) {
          throw new Error('Không thể gán danh mục cha đã bị vô hiệu hóa');
        }

        // Check if trying to set a descendant as parent (circular reference)
        const descendants = await this.categoryRepository.getDescendants(categoryId);
        const isDescendant = descendants.some(d => d.id === input.parentId);
        if (isDescendant) {
          throw new Error('Không thể đặt danh mục con làm danh mục cha');
        }

        newLevel = parentCategory.level + 1;
      } else {
        // Moving to root level
        newLevel = 0;
      }
    }

    // Build update data
    const updateData: Partial<CategoryEntity> = {};
    
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.nameEn !== undefined) updateData.nameEn = input.nameEn.trim();
    if (input.slug !== undefined) updateData.slug = input.slug.trim().toLowerCase();
    if (input.description !== undefined) updateData.description = input.description.trim();
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.image !== undefined) updateData.image = input.image;
    if (input.parentId !== undefined) {
      updateData.parentId = input.parentId;
      updateData.level = newLevel;
    }
    if (input.order !== undefined) updateData.order = input.order;
    if (input.isActive !== undefined) {
      // If deactivating, check if it has active children
      if (!input.isActive && existingCategory.isActive) {
        const children = await this.categoryRepository.getChildren(categoryId, false);
        if (children.length > 0) {
          throw new Error('Không thể vô hiệu hóa danh mục có danh mục con đang hoạt động');
        }
      }
      updateData.isActive = input.isActive;
    }

    // Update category
    const updatedCategory = await this.categoryRepository.update(categoryId, updateData);
    
    if (!updatedCategory) {
      throw new Error('Không thể cập nhật danh mục');
    }

    // If level changed, need to update all descendants' levels
    if (updateData.level !== undefined && updateData.level !== existingCategory.level) {
      await this.updateDescendantsLevel(categoryId, updateData.level - existingCategory.level);
    }

    logger.info(`Category updated: ${categoryId} - ${updatedCategory.name}`);

    return updatedCategory;
  }

  private async updateDescendantsLevel(categoryId: string, levelDiff: number): Promise<void> {
    const descendants = await this.categoryRepository.getDescendants(categoryId);
    
    for (const descendant of descendants) {
      await this.categoryRepository.update(descendant.id, {
        level: descendant.level + levelDiff
      });
    }
  }

  private validateInput(input: UpdateCategoryInput): void {
    const errors: string[] = [];

    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        errors.push('Tên danh mục không được để trống');
      }
      if (input.name.trim().length > 100) {
        errors.push('Tên danh mục không được vượt quá 100 ký tự');
      }
    }

    if (input.slug !== undefined) {
      if (input.slug.trim().length === 0) {
        errors.push('Slug không được để trống');
      }
      if (!/^[a-z0-9-]+$/.test(input.slug)) {
        errors.push('Slug chỉ được chứa chữ thường, số và dấu gạch ngang');
      }
    }

    if (input.order !== undefined && input.order < 0) {
      errors.push('Thứ tự phải là số không âm');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}
