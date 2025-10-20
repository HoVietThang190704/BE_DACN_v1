import { IProductRepository } from '../../repositories/IProductRepository';

/**
 * Category Information
 */
export interface CategoryInfo {
  name: string;
  count: number;
}

/**
 * Use Case: Get All Product Categories
 */
export class GetCategoriesUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(): Promise<string[]> {
    const categories = await this.productRepository.getCategories();
    return categories;
  }
}
