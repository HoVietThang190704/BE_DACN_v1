import {
  IProductRepository,
  ProductFilters,
  ProductSorting,
  ProductPagination,
  PaginatedProducts
} from '../../domain/repositories/IProductRepository';
import { ProductEntity, ProductCategoryInfo, ProductOwnerInfo } from '../../domain/entities/Product.entity';
import { Product as ProductModel, IProduct } from '../../models/Product';
import { Category } from '../../models/Category';
import { User } from '../../models/users/User';
import mongoose from 'mongoose';
import { logger } from '../../shared/utils/logger';

export class ProductRepository implements IProductRepository {

  private toDomainEntity(model: IProduct): ProductEntity {
    const rawCategory: any = (model as any).category;
    const rawOwner: any = (model as any).owner;

    const category: ProductCategoryInfo = rawCategory && typeof rawCategory === 'object' && rawCategory._id
      ? {
          id: String(rawCategory._id),
          name: rawCategory.name,
          slug: rawCategory.slug
        }
      : {
          id: rawCategory ? String(rawCategory) : ''
        };

    const owner: ProductOwnerInfo = rawOwner && typeof rawOwner === 'object' && rawOwner._id
      ? {
          id: String(rawOwner._id),
          email: rawOwner.email,
          userName: rawOwner.userName,
          role: rawOwner.role,
          avatar: rawOwner.avatar
        }
      : {
          id: rawOwner ? String(rawOwner) : ''
        };

    return new ProductEntity({
      id: String(model._id),
      name: model.name,
      nameEn: model.nameEn,
      category,
      owner,
      price: model.price,
      unit: model.unit,
      description: model.description,
      images: model.images,
      inStock: model.inStock,
      stockQuantity: model.stockQuantity,
      rating: model.rating,
      reviewCount: model.reviewCount,
      tags: model.tags,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  private buildFilter(filters?: ProductFilters): any {
    const filter: any = {};
    if (!filters) return filter;
    if (filters.search) {
      filter.$text = { $search: filters.search };
    }
    if (filters.category) {
      const cat = filters.category;
      if (mongoose.Types.ObjectId.isValid(cat)) {
        filter.category = new mongoose.Types.ObjectId(cat);
      } else {
        filter.__categorySlug = cat; // temporary marker for later resolution in findAll
      }
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filter.price = {};
      if (filters.minPrice !== undefined) {
        filter.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        filter.price.$lte = filters.maxPrice;
      }
    }
    if (filters.inStock !== undefined) {
      filter.inStock = filters.inStock;
    }
    if (filters.minRating !== undefined) {
      filter.rating = { $gte: filters.minRating };
    }
    if (filters.owner) {
      if (mongoose.Types.ObjectId.isValid(filters.owner)) {
        filter.owner = new mongoose.Types.ObjectId(filters.owner);
      } else {
        filter.__ownerEmail = filters.owner;
      }
    }
    if (filters.tags && filters.tags.length > 0) {
      filter.tags = { $in: filters.tags.map(tag => tag.toLowerCase()) };
    }
    return filter;
  }

  private buildSort(sorting?: ProductSorting): any {
    if (!sorting) {
      return { createdAt: -1 }; 
    }
    const order = sorting.order === 'asc' ? 1 : -1;
    return { [sorting.sortBy]: order };
  }

  async findById(id: string): Promise<ProductEntity | null> {
    try {
      const product = await ProductModel.findById(id)
        .populate('owner', 'email userName role avatar')
        .populate('category', 'name slug')
        .lean();
      return product ? this.toDomainEntity(product as unknown as IProduct) : null;
    } catch (error) {
      logger.error('ProductRepository.findById error:', error);
      throw new Error('Lỗi khi tìm sản phẩm');
    }
  }

  async findAll(
    filters?: ProductFilters,
    sorting?: ProductSorting,
    pagination?: ProductPagination
  ): Promise<PaginatedProducts> {
    try {
      let filter = await this.buildFilter(filters);
      // If slug marker present, try to resolve to id
      if (filter.__categorySlug) {
        try {
          const found = await Category.findOne({ slug: filter.__categorySlug }).lean();
          if (found) {
            filter.category = new mongoose.Types.ObjectId(found._id);
          }
        } catch (e) {
          // leave filter as-is
        }
        delete filter.__categorySlug;
      }
      if (filter.__ownerEmail) {
        try {
          const owners = await User.find(
            { email: new RegExp(filter.__ownerEmail, 'i') },
            { _id: 1 }
          ).lean();
          filter.owner = owners.length > 0 ? { $in: owners.map(o => o._id) } : { $in: [] };
        } catch (e) {
          logger.warn('ProductRepository.findAll owner email filter error:', e);
        }
        delete filter.__ownerEmail;
      }
      const sort = this.buildSort(sorting);
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;
      const [products, total] = await Promise.all([
        ProductModel.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('owner', 'email userName role avatar')
          .populate('category', 'name slug')
          .lean(),
        ProductModel.countDocuments(filter)
      ]);
      const productEntities = products.map(p => this.toDomainEntity(p as unknown as IProduct));
      return {
        products: productEntities,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('ProductRepository.findAll error:', error);
      throw new Error('Lỗi khi lấy danh sách sản phẩm');
    }
  }

  async create(product: Omit<ProductEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductEntity> {
    try {
      const categoryId = product.category?.id || '';
      let categoryValue: mongoose.Types.ObjectId | undefined;
      if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
        categoryValue = new mongoose.Types.ObjectId(categoryId);
      } else if (categoryId) {
        const resolved = await Category.findOne({ $or: [{ slug: categoryId }, { name: categoryId }, { nameEn: categoryId }] }).lean();
        if (resolved?._id) {
          categoryValue = new mongoose.Types.ObjectId(resolved._id);
        }
      }
      if (!categoryValue) {
        throw new Error('Danh mục không hợp lệ');
      }

      const ownerId = product.owner?.id;
      if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
        throw new Error('Người đăng không hợp lệ');
      }

      const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : 0;
      const normalizedTags = Array.isArray(product.tags)
        ? product.tags.map(tag => tag.trim().toLowerCase()).filter(Boolean)
        : [];

      const createData = {
        name: product.name.trim(),
        nameEn: product.nameEn?.trim() || undefined,
        category: categoryValue,
        owner: new mongoose.Types.ObjectId(ownerId),
        price: product.price,
        unit: product.unit.trim(),
        description: product.description.trim(),
        images: Array.isArray(product.images) ? product.images : [],
        inStock: product.inStock ?? stockQuantity > 0,
        stockQuantity,
        tags: normalizedTags,
        rating: product.rating ?? 0,
        reviewCount: product.reviewCount ?? 0
      };

      const newProduct = await ProductModel.create(createData);
      const populated = await ProductModel.findById(newProduct._id)
        .populate('owner', 'email userName role avatar')
        .populate('category', 'name slug')
        .lean();

      return this.toDomainEntity((populated || newProduct) as unknown as IProduct);
    } catch (error) {
      // Log full error for debugging (preserve original message if available)
      const msg = error && (error as any).message ? (error as any).message : String(error);
      logger.error('ProductRepository.create error:', msg);
      const errMsg = msg || 'Lỗi khi tạo sản phẩm';
      throw new Error(errMsg);
    }
  }

  async update(id: string, data: Partial<ProductEntity>): Promise<ProductEntity | null> {
    try {
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn?.trim() || undefined;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.unit !== undefined) updateData.unit = data.unit.trim();
      if (data.description !== undefined) updateData.description = data.description.trim();
      if (data.images !== undefined) updateData.images = Array.isArray(data.images) ? data.images : [];
      if (data.inStock !== undefined) updateData.inStock = data.inStock;
      if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity;
      if (data.tags !== undefined) {
        updateData.tags = Array.isArray(data.tags)
          ? data.tags.map(tag => tag.trim().toLowerCase()).filter(Boolean)
          : [];
      }

      if (data.category?.id) {
        if (mongoose.Types.ObjectId.isValid(data.category.id)) {
          updateData.category = new mongoose.Types.ObjectId(data.category.id);
        } else {
          const resolved = await Category.findOne({ $or: [{ slug: data.category.id }, { name: data.category.id }, { nameEn: data.category.id }] }).lean();
          if (resolved?._id) {
            updateData.category = new mongoose.Types.ObjectId(resolved._id);
          }
        }
      }
      // Do not allow changing owner via repository update

      const updated = await ProductModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('owner', 'email userName role avatar')
        .populate('category', 'name slug')
        .lean();
      return updated ? this.toDomainEntity(updated as unknown as IProduct) : null;
    } catch (error) {
      logger.error('ProductRepository.update error:', error);
      throw new Error('Lỗi khi cập nhật sản phẩm');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await ProductModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      logger.error('ProductRepository.delete error:', error);
      throw new Error('Lỗi khi xóa sản phẩm');
    }
  }

  async count(filters?: ProductFilters): Promise<number> {
    try {
      const filter = await this.buildFilter(filters);
      return await ProductModel.countDocuments(filter);
    } catch (error) {
      logger.error('ProductRepository.count error:', error);
      throw new Error('Lỗi khi đếm sản phẩm');
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await ProductModel.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      logger.error('ProductRepository.exists error:', error);
      return false;
    }
  }

  async findByCategory(category: string, pagination?: ProductPagination): Promise<PaginatedProducts> {
    return this.findAll({ category }, undefined, pagination);
  }

  async getCategories(): Promise<string[]> {
    try {
      const categories = await ProductModel.distinct('category') as Array<string | mongoose.Types.ObjectId>;
      return categories.map(c => String(c));
    } catch (error) {
      logger.error('ProductRepository.getCategories error:', error);
      throw new Error('Lỗi khi lấy danh sách danh mục');
    }
  }

  async search(query: string, pagination?: ProductPagination): Promise<PaginatedProducts> {
    return this.findAll({ search: query }, undefined, pagination);
  }

  async getFeatured(limit: number = 10): Promise<ProductEntity[]> {
    try {
      const products = await ProductModel.find({
        rating: { $gte: 4.0 },
        reviewCount: { $gte: 20 }
      })
        .sort({ rating: -1, reviewCount: -1 })
        .limit(limit)
        .lean();

      return products.map(p => this.toDomainEntity(p as unknown as IProduct));
    } catch (error) {
      logger.error('ProductRepository.getFeatured error:', error);
      throw new Error('Lỗi khi lấy sản phẩm nổi bật');
    }
  }

  async getNewest(limit: number = 10): Promise<ProductEntity[]> {
    try {
      const products = await ProductModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return products.map(p => this.toDomainEntity(p as unknown as IProduct));
    } catch (error) {
      logger.error('ProductRepository.getNewest error:', error);
      throw new Error('Lỗi khi lấy sản phẩm mới nhất');
    }
  }

  async getBestSelling(limit: number = 10): Promise<ProductEntity[]> {
    try {
      const products = await ProductModel.find()
        .sort({ reviewCount: -1, rating: -1 })
        .limit(limit)
        .lean();

      return products.map(p => this.toDomainEntity(p as unknown as IProduct));
    } catch (error) {
      logger.error('ProductRepository.getBestSelling error:', error);
      throw new Error('Lỗi khi lấy sản phẩm bán chạy');
    }
  }

  async updateStock(id: string, quantity: number): Promise<ProductEntity | null> {
    try {
      const updated = await ProductModel.findByIdAndUpdate(
        id,
        {
          $set: {
            stockQuantity: Math.max(0, quantity),
            inStock: quantity > 0
          }
        },
        { new: true }
      ).lean();

      return updated ? this.toDomainEntity(updated as unknown as IProduct) : null;
    } catch (error) {
      logger.error('ProductRepository.updateStock error:', error);
      throw new Error('Lỗi khi cập nhật tồn kho');
    }
  }

  async reduceStock(id: string, quantity: number): Promise<boolean> {
    try {
      const product = await ProductModel.findById(id);
      if (!product) {
        throw new Error('Không tìm thấy sản phẩm');
      }

      if (product.stockQuantity < quantity) {
        return false; // Not enough stock
      }

      product.stockQuantity -= quantity;
      product.inStock = product.stockQuantity > 0;
      await product.save();

      return true;
    } catch (error) {
      logger.error('ProductRepository.reduceStock error:', error);
      throw new Error('Lỗi khi giảm tồn kho');
    }
  }

  async addStock(id: string, quantity: number): Promise<ProductEntity | null> {
    try {
      const updated = await ProductModel.findByIdAndUpdate(
        id,
        {
          $inc: { stockQuantity: quantity },
          $set: { inStock: true }
        },
        { new: true }
      ).lean();

      return updated ? this.toDomainEntity(updated as unknown as IProduct) : null;
    } catch (error) {
      logger.error('ProductRepository.addStock error:', error);
      throw new Error('Lỗi khi thêm tồn kho');
    }
  }

  async updateRatingSummary(id: string, summary: { rating: number; reviewCount: number }): Promise<ProductEntity | null> {
    try {
      const updated = await ProductModel.findByIdAndUpdate(
        id,
        {
          $set: {
            rating: summary.rating,
            reviewCount: summary.reviewCount
          }
        },
        { new: true }
      ).lean();

      return updated ? this.toDomainEntity(updated as unknown as IProduct) : null;
    } catch (error) {
      logger.error('ProductRepository.updateRatingSummary error:', error);
      throw new Error('Lỗi khi cập nhật thống kê đánh giá');
    }
  }
}

