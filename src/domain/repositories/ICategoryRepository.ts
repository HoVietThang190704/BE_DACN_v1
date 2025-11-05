import { CategoryEntity } from '../entities/Category.entity';

/**
 * Category Repository Interface
 * Defines methods for managing hierarchical categories
 */

export interface ICategoryRepository {
  /**
   * Find category by ID
   */
  findById(id: string): Promise<CategoryEntity | null>;

  /**
   * Get all categories (flat list)
   */
  findAll(includeInactive?: boolean): Promise<CategoryEntity[]>;

  /**
   * Get category tree structure (hierarchical)
   */
  getTree(includeInactive?: boolean): Promise<CategoryEntity[]>;

  /**
   * Get root categories (top-level, no parent)
   */
  getRootCategories(includeInactive?: boolean): Promise<CategoryEntity[]>;

  /**
   * Get children of a category
   */
  getChildren(parentId: string, includeInactive?: boolean): Promise<CategoryEntity[]>;

  /**
   * Get all descendants of a category (recursive)
   */
  getDescendants(categoryId: string, includeInactive?: boolean): Promise<CategoryEntity[]>;

  /**
   * Get breadcrumb path from root to category
   */
  getBreadcrumb(categoryId: string): Promise<CategoryEntity[]>;

  /**
   * Create new category
   */
  create(category: Omit<CategoryEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategoryEntity>;

  /**
   * Update category
   */
  update(id: string, data: Partial<CategoryEntity>): Promise<CategoryEntity | null>;

  /**
   * Delete category (soft delete by setting isActive = false)
   */
  delete(id: string): Promise<boolean>;

  /**
   * Hard delete category (remove document from DB)
   */
  hardDelete(id: string): Promise<boolean>;

  /**
   * Check if category exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if slug exists
   */
  slugExists(slug: string, excludeId?: string): Promise<boolean>;

  /**
   * Update product count for category
   */
  updateProductCount(categoryId: string, count: number): Promise<void>;

  /**
   * Increment product count
   */
  incrementProductCount(categoryId: string): Promise<void>;

  /**
   * Decrement product count
   */
  decrementProductCount(categoryId: string): Promise<void>;
}
