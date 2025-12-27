import { ICategoryRepository } from '../../repositories/ICategoryRepository';
import { CategoryEntity } from '../../entities/Category.entity';

export class GetCategoriesTreeUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(includeInactive: boolean = false): Promise<CategoryEntity[]> {
    return await this.categoryRepository.getTree(includeInactive);
  }
}
