import { CategoryEntity, ICategoryEntity } from '../../../domain/entities/Category.entity';

/**
 * Category DTO - Data Transfer Object for API responses
 */

export interface CategoryDTO {
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
  children?: CategoryDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeDTO extends CategoryDTO {
  children: CategoryTreeDTO[];
  totalProducts?: number; // Including children
}

export interface CategoryBreadcrumbDTO {
  id: string;
  name: string;
  slug: string;
  level: number;
}

export class CategoryMapper {
  /**
   * Map Entity to DTO
   */
  static toDTO(entity: CategoryEntity): CategoryDTO {
    return {
      id: entity.id,
      name: entity.name,
      nameEn: entity.nameEn,
      slug: entity.slug,
      description: entity.description,
      icon: entity.icon,
      image: entity.image,
      parentId: entity.parentId,
      level: entity.level,
      order: entity.order,
      isActive: entity.isActive,
      productCount: entity.productCount,
      children: entity.children?.map(c => this.toDTO(new CategoryEntity(c))),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /**
   * Map Entity to Tree DTO with computed fields
   */
  static toTreeDTO(entity: CategoryEntity): CategoryTreeDTO {
    const dto: CategoryTreeDTO = {
      ...this.toDTO(entity),
      children: entity.children?.map(c => this.toTreeDTO(new CategoryEntity(c))) || [],
      totalProducts: entity.getTotalProductCount()
    };
    return dto;
  }

  /**
   * Map Entity to Breadcrumb DTO
   */
  static toBreadcrumbDTO(entity: CategoryEntity): CategoryBreadcrumbDTO {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      level: entity.level
    };
  }

  /**
   * Map array of Entities to array of DTOs
   */
  static toArrayDTO(entities: CategoryEntity[]): CategoryDTO[] {
    return entities.map(e => this.toDTO(e));
  }

  /**
   * Map array of Entities to array of Tree DTOs
   */
  static toTreeArrayDTO(entities: CategoryEntity[]): CategoryTreeDTO[] {
    return entities.map(e => this.toTreeDTO(e));
  }

  /**
   * Map array of Entities to array of Breadcrumb DTOs
   */
  static toBreadcrumbArrayDTO(entities: CategoryEntity[]): CategoryBreadcrumbDTO[] {
    return entities.map(e => this.toBreadcrumbDTO(e));
  }
}
