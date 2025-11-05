import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { CategoryEntity } from '../../domain/entities/Category.entity';
import { Category, ICategory } from '../../models/Category';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export class CategoryRepository implements ICategoryRepository {
  
  private toDomainEntity(model: ICategory): CategoryEntity {
    return new CategoryEntity({
      id: String(model._id),
      name: model.name,
      nameEn: model.nameEn,
      slug: model.slug,
      description: model.description,
      icon: model.icon,
  images: (model as any).images || [],
  imagesPublicIds: (model as any).imagesPublicIds || [],
      parentId: model.parentId ? String(model.parentId) : null,
      level: model.level,
      order: model.order,
      isActive: model.isActive,
      productCount: model.productCount,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  private buildTree(categories: CategoryEntity[]): CategoryEntity[] {
    const categoryMap = new Map<string, any>();
    const rootCategories: any[] = [];

    categories.forEach(category => {
      const categoryData = category.toJSON();
      categoryMap.set(category.id, { ...categoryData, children: [] });
    });

    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id);
      if (!categoryWithChildren) return;

      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    const sortChildren = (cats: any[]) => {
      cats.sort((a, b) => a.order - b.order);
      cats.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
          sortChildren(cat.children);
        }
      });
    };
    sortChildren(rootCategories);
    return rootCategories.map(c => new CategoryEntity(c));
  }

  async findById(id: string): Promise<CategoryEntity | null> {
    try {
      const category = await Category.findById(id).lean();
      return category ? this.toDomainEntity(category as unknown as ICategory) : null;
    } catch (error) {
      logger.error('CategoryRepository.findById error:', error);
      throw new Error('Lỗi khi tìm danh mục');
    }
  }

  async findAll(includeInactive: boolean = false): Promise<CategoryEntity[]> {
    try {
      const filter = includeInactive ? {} : { isActive: true };
      const categories = await Category.find(filter)
        .sort({ level: 1, order: 1 })
        .lean();

      return categories.map(c => this.toDomainEntity(c as unknown as ICategory));
    } catch (error) {
      logger.error('CategoryRepository.findAll error:', error);
      throw new Error('Lỗi khi lấy danh sách danh mục');
    }
  }

  async getTree(includeInactive: boolean = false): Promise<CategoryEntity[]> {
    try {
      const categories = await this.findAll(includeInactive);
      return this.buildTree(categories);
    } catch (error) {
      logger.error('CategoryRepository.getTree error:', error);
      throw new Error('Lỗi khi lấy cây danh mục');
    }
  }

  async getRootCategories(includeInactive: boolean = false): Promise<CategoryEntity[]> {
    try {
      const filter: any = { parentId: null };
      if (!includeInactive) {
        filter.isActive = true;
      }

      const categories = await Category.find(filter)
        .sort({ order: 1 })
        .lean();

      return categories.map(c => this.toDomainEntity(c as unknown as ICategory));
    } catch (error) {
      logger.error('CategoryRepository.getRootCategories error:', error);
      throw new Error('Lỗi khi lấy danh mục gốc');
    }
  }

  async getChildren(parentId: string, includeInactive: boolean = false): Promise<CategoryEntity[]> {
    try {
      const filter: any = { parentId: new mongoose.Types.ObjectId(parentId) };
      if (!includeInactive) {
        filter.isActive = true;
      }

      const categories = await Category.find(filter)
        .sort({ order: 1 })
        .lean();

      return categories.map(c => this.toDomainEntity(c as unknown as ICategory));
    } catch (error) {
      logger.error('CategoryRepository.getChildren error:', error);
      throw new Error('Lỗi khi lấy danh mục con');
    }
  }

  async getDescendants(categoryId: string, includeInactive: boolean = false): Promise<CategoryEntity[]> {
    try {
      const descendants: CategoryEntity[] = [];
      const children = await this.getChildren(categoryId, includeInactive);

      for (const child of children) {
        descendants.push(child);
        const childDescendants = await this.getDescendants(child.id, includeInactive);
        descendants.push(...childDescendants);
      }

      return descendants;
    } catch (error) {
      logger.error('CategoryRepository.getDescendants error:', error);
      throw new Error('Lỗi khi lấy danh mục con cháu');
    }
  }

  async getBreadcrumb(categoryId: string): Promise<CategoryEntity[]> {
    try {
      const breadcrumb: CategoryEntity[] = [];
      let currentId: string | null = categoryId;

      while (currentId) {
        const category = await this.findById(currentId);
        if (!category) break;

        breadcrumb.unshift(category);
        currentId = category.parentId || null;
      }

      return breadcrumb;
    } catch (error) {
      logger.error('CategoryRepository.getBreadcrumb error:', error);
      throw new Error('Lỗi khi lấy đường dẫn danh mục');
    }
  }

  async create(category: Omit<CategoryEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategoryEntity> {
    try {
      const newCategory = await Category.create({
        ...category,
        imagesPublicIds: (category as any).imagesPublicIds || [],
        parentId: category.parentId ? new mongoose.Types.ObjectId(category.parentId) : null
      });
      return this.toDomainEntity(newCategory as ICategory);
    } catch (error) {
      logger.error('CategoryRepository.create error:', error);
      throw new Error('Lỗi khi tạo danh mục');
    }
  }

  async update(id: string, data: Partial<CategoryEntity>): Promise<CategoryEntity | null> {
    try {
      const updateData: any = { ...data };
      if (data.parentId !== undefined) {
        updateData.parentId = data.parentId ? new mongoose.Types.ObjectId(data.parentId) : null;
      }

      const updated = await Category.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      return updated ? this.toDomainEntity(updated as unknown as ICategory) : null;
    } catch (error) {
      logger.error('CategoryRepository.update error:', error);
      throw new Error('Lỗi khi cập nhật danh mục');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Soft delete by setting isActive = false
      const result = await Category.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      );
      return result !== null;
    } catch (error) {
      logger.error('CategoryRepository.delete error:', error);
      throw new Error('Lỗi khi xóa danh mục');
    }
  }

  async hardDelete(id: string): Promise<boolean> {
    try {
      const result = await Category.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      logger.error('CategoryRepository.hardDelete error:', error);
      throw new Error('Lỗi khi xóa vĩnh viễn danh mục');
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await Category.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      logger.error('CategoryRepository.exists error:', error);
      return false;
    }
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    try {
      const filter: any = { slug };
      if (excludeId) {
        filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
      }
      const count = await Category.countDocuments(filter);
      return count > 0;
    } catch (error) {
      logger.error('CategoryRepository.slugExists error:', error);
      return false;
    }
  }

  async updateProductCount(categoryId: string, count: number): Promise<void> {
    try {
      await Category.findByIdAndUpdate(
        categoryId,
        { $set: { productCount: Math.max(0, count) } }
      );
    } catch (error) {
      logger.error('CategoryRepository.updateProductCount error:', error);
      throw new Error('Lỗi khi cập nhật số lượng sản phẩm');
    }
  }

  async incrementProductCount(categoryId: string): Promise<void> {
    try {
      await Category.findByIdAndUpdate(
        categoryId,
        { $inc: { productCount: 1 } }
      );
    } catch (error) {
      logger.error('CategoryRepository.incrementProductCount error:', error);
      throw new Error('Lỗi khi tăng số lượng sản phẩm');
    }
  }

  async decrementProductCount(categoryId: string): Promise<void> {
    try {
      await Category.findByIdAndUpdate(
        categoryId,
        { $inc: { productCount: -1 } }
      );

      await Category.findByIdAndUpdate(
        categoryId,
        { $max: { productCount: 0 } }
      );
    } catch (error) {
      logger.error('CategoryRepository.decrementProductCount error:', error);
      throw new Error('Lỗi khi giảm số lượng sản phẩm');
    }
  }
}
