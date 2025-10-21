/**
 * Category Entity - Pure domain model for hierarchical categories
 * Supports multi-level category tree structure
 */

export interface ICategoryEntity {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  level: number; // 0 = root, 1 = level 1, etc.
  order: number; // Display order
  isActive: boolean;
  productCount: number;
  
  // Tree structure helpers
  children?: ICategoryEntity[];
  
  createdAt: Date;
  updatedAt: Date;
}

export class CategoryEntity implements ICategoryEntity {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  level: number;
  order: number;
  isActive: boolean;
  productCount: number;
  children?: ICategoryEntity[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: ICategoryEntity) {
    this.id = data.id;
    this.name = data.name;
    this.nameEn = data.nameEn;
    this.slug = data.slug;
    this.description = data.description;
    this.icon = data.icon;
    this.image = data.image;
    this.parentId = data.parentId;
    this.level = data.level;
    this.order = data.order;
    this.isActive = data.isActive;
    this.productCount = data.productCount;
    this.children = data.children;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Business Logic Methods

  /**
   * Check if category is root (top-level)
   */
  isRoot(): boolean {
    return !this.parentId && this.level === 0;
  }

  /**
   * Check if category has children
   */
  hasChildren(): boolean {
    return !!this.children && this.children.length > 0;
  }

  /**
   * Check if category is leaf (no children)
   */
  isLeaf(): boolean {
    return !this.hasChildren();
  }

  /**
   * Get number of children
   */
  getChildrenCount(): number {
    return this.children?.length || 0;
  }

  /**
   * Get all descendant IDs (recursive)
   */
  getAllDescendantIds(): string[] {
    const ids: string[] = [];
    
    if (this.children) {
      for (const child of this.children) {
        ids.push(child.id);
        const childEntity = new CategoryEntity(child);
        ids.push(...childEntity.getAllDescendantIds());
      }
    }
    
    return ids;
  }

  /**
   * Get total product count including children
   */
  getTotalProductCount(): number {
    let total = this.productCount;
    
    if (this.children) {
      for (const child of this.children) {
        const childEntity = new CategoryEntity(child);
        total += childEntity.getTotalProductCount();
      }
    }
    
    return total;
  }

  /**
   * Find child by ID
   */
  findChildById(id: string): ICategoryEntity | null {
    if (!this.children) return null;
    
    for (const child of this.children) {
      if (child.id === id) return child;
      
      const childEntity = new CategoryEntity(child);
      const found = childEntity.findChildById(id);
      if (found) return found;
    }
    
    return null;
  }

  /**
   * Get breadcrumb path from root to this category
   */
  getBreadcrumb(allCategories: ICategoryEntity[]): ICategoryEntity[] {
    const breadcrumb: ICategoryEntity[] = [this];
    let currentParentId = this.parentId;
    
    while (currentParentId) {
      const parent = allCategories.find(c => c.id === currentParentId);
      if (!parent) break;
      
      breadcrumb.unshift(parent);
      currentParentId = parent.parentId;
    }
    
    return breadcrumb;
  }

  /**
   * Validate category data
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Tên danh mục không được để trống');
    }

    if (!this.slug || this.slug.trim().length === 0) {
      errors.push('Slug không được để trống');
    }

    if (this.level < 0) {
      errors.push('Level phải >= 0');
    }

    if (this.order < 0) {
      errors.push('Order phải >= 0');
    }

    if (this.productCount < 0) {
      errors.push('Số lượng sản phẩm không hợp lệ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to plain object (for JSON serialization)
   */
  toJSON(): ICategoryEntity {
    return {
      id: this.id,
      name: this.name,
      nameEn: this.nameEn,
      slug: this.slug,
      description: this.description,
      icon: this.icon,
      image: this.image,
      parentId: this.parentId,
      level: this.level,
      order: this.order,
      isActive: this.isActive,
      productCount: this.productCount,
      children: this.children,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
