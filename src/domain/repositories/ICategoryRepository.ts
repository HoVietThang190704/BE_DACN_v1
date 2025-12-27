import { CategoryEntity } from '../entities/Category.entity';

export interface ICategoryRepository {
  findById(id: string): Promise<CategoryEntity | null>;

  findAll(includeInactive?: boolean): Promise<CategoryEntity[]>;

  getTree(includeInactive?: boolean): Promise<CategoryEntity[]>;

  getRootCategories(includeInactive?: boolean): Promise<CategoryEntity[]>;

  getChildren(parentId: string, includeInactive?: boolean): Promise<CategoryEntity[]>;

  getDescendants(categoryId: string, includeInactive?: boolean): Promise<CategoryEntity[]>;

  getBreadcrumb(categoryId: string): Promise<CategoryEntity[]>;

  create(category: Omit<CategoryEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategoryEntity>;

  update(id: string, data: Partial<CategoryEntity>): Promise<CategoryEntity | null>;

  delete(id: string): Promise<boolean>;

  hardDelete(id: string): Promise<boolean>;

  exists(id: string): Promise<boolean>;

  slugExists(slug: string, excludeId?: string): Promise<boolean>;

  updateProductCount(categoryId: string, count: number): Promise<void>;

  incrementProductCount(categoryId: string): Promise<void>;

  decrementProductCount(categoryId: string): Promise<void>;

  searchByName(term: string, limit?: number): Promise<CategoryEntity[]>;
}
