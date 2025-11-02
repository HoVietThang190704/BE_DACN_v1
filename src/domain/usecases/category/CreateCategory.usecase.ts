import { CategoryEntity } from '../../entities/Category.entity';
import { ICategoryRepository } from '../../repositories/ICategoryRepository';
import { logger } from '../../../shared/utils/logger';

/**
 * Use Case: Create Category
 * Business logic for creating a new category
 */

export interface CreateCategoryInput {
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  icon?: string;
  images?: string[];
  imagesPublicIds?: string[];
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
}

export class CreateCategoryUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<CategoryEntity> {
    // Validate input
    this.validateInput(input);

    // Check if slug already exists
    const slugExists = await this.categoryRepository.slugExists(input.slug);
    if (slugExists) {
      throw new Error('Slug đã tồn tại');
    }

    // Determine level based on parent
    let level = 0;
    let parentCategory: CategoryEntity | null = null;

    if (input.parentId) {
      parentCategory = await this.categoryRepository.findById(input.parentId);
      if (!parentCategory) {
        throw new Error('Danh mục cha không tồn tại');
      }
      if (!parentCategory.isActive) {
        throw new Error('Không thể tạo danh mục con cho danh mục đã bị vô hiệu hóa');
      }
      level = parentCategory.level + 1;
    }

    // Create category data
    const categoryData: Omit<CategoryEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      name: input.name.trim(),
      nameEn: input.nameEn?.trim(),
      slug: input.slug.trim().toLowerCase(),
      description: input.description?.trim(),
      icon: input.icon,
  images: input.images || [],
  imagesPublicIds: input.imagesPublicIds || [],
      parentId: input.parentId || null,
      level,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
      productCount: 0,
      children: []
    } as any;

    // Create category
    const category = await this.categoryRepository.create(categoryData);

    logger.info(`Category created: ${category.id} - ${category.name}`);

    return category;
  }

  private validateInput(input: CreateCategoryInput): void {
    const errors: string[] = [];

    if (!input.name || input.name.trim().length === 0) {
      errors.push('Tên danh mục không được để trống');
    }

    if (input.name && input.name.trim().length > 100) {
      errors.push('Tên danh mục không được vượt quá 100 ký tự');
    }

    if (!input.slug || input.slug.trim().length === 0) {
      errors.push('Slug không được để trống');
    }

    if (input.slug && !/^[a-z0-9-]+$/.test(input.slug)) {
      errors.push('Slug chỉ được chứa chữ thường, số và dấu gạch ngang');
    }

    if (input.order !== undefined && input.order < 0) {
      errors.push('Thứ tự phải là số không âm');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}
