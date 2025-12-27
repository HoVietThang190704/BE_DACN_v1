import { ICategoryRepository } from '../../repositories/ICategoryRepository';
import { CategoryEntity } from '../../entities/Category.entity';

export class GetCategoryBreadcrumbUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(categoryId: string): Promise<CategoryEntity[]> {
    const exists = await this.categoryRepository.exists(categoryId);
    
    if (!exists) {
      throw new Error('Không tìm thấy danh mục');
    }

    return await this.categoryRepository.getBreadcrumb(categoryId);
  }
}
