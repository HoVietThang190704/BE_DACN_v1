import { ICategoryRepository } from '../../repositories/ICategoryRepository';
import { CategoryEntity } from '../../entities/Category.entity';

/**
 * Use Case: Get Category By ID
 */
export class GetCategoryByIdUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(id: string): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findById(id);
    
    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }

    return category;
  }
}
