import { 
  IProductRepository, 
  ProductFilters, 
  ProductSorting, 
  ProductPagination,
  PaginatedProducts 
} from '../../domain/repositories/IProductRepository';
import { ProductEntity } from '../../domain/entities/Product.entity';
import { Product as ProductModel, IProduct } from '../../models/Product';
import { logger } from '../../shared/utils/logger';

/**
 * Product Repository Implementation using Mongoose
 */
export class ProductRepository implements IProductRepository {
  
  /**
   * Map Mongoose document to Domain Entity
   */
  private toDomainEntity(model: IProduct): ProductEntity {
    return new ProductEntity({
      id: String(model._id),
      name: model.name,
      nameEn: model.nameEn,
      category: model.category,
      price: model.price,
      unit: model.unit,
      description: model.description,
      images: model.images,
      inStock: model.inStock,
      stockQuantity: model.stockQuantity,
      farm: model.farm,
      certifications: model.certifications,
      harvestDate: model.harvestDate,
      shelfLife: model.shelfLife,
      nutrition: model.nutrition,
      isOrganic: model.isOrganic,
      isFresh: model.isFresh,
      rating: model.rating,
      reviewCount: model.reviewCount,
      tags: model.tags,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  /**
   * Build Mongoose filter from ProductFilters
   */
  private buildFilter(filters?: ProductFilters): any {
    const filter: any = {};

    if (!filters) return filter;

    // Text search
    if (filters.search) {
      filter.$text = { $search: filters.search };
    }

    // Category
    if (filters.category) {
      filter.category = filters.category;
    }

    // Farm name
    if (filters.farm) {
      filter['farm.name'] = new RegExp(filters.farm, 'i');
    }

    // Certification
    if (filters.certified) {
      filter.certifications = filters.certified;
    }

    // Price range
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filter.price = {};
      if (filters.minPrice !== undefined) {
        filter.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        filter.price.$lte = filters.maxPrice;
      }
    }

    // Boolean filters
    if (filters.isOrganic !== undefined) {
      filter.isOrganic = filters.isOrganic;
    }

    if (filters.isFresh !== undefined) {
      filter.isFresh = filters.isFresh;
    }

    if (filters.inStock !== undefined) {
      filter.inStock = filters.inStock;
    }

    // Province
    if (filters.province) {
      filter['farm.location.province'] = new RegExp(filters.province, 'i');
    }

    // Minimum rating
    if (filters.minRating !== undefined) {
      filter.rating = { $gte: filters.minRating };
    }

    return filter;
  }

  /**
   * Build Mongoose sort from ProductSorting
   */
  private buildSort(sorting?: ProductSorting): any {
    if (!sorting) {
      return { createdAt: -1 }; // Default: newest first
    }

    const order = sorting.order === 'asc' ? 1 : -1;
    return { [sorting.sortBy]: order };
  }

  async findById(id: string): Promise<ProductEntity | null> {
    try {
      const product = await ProductModel.findById(id).lean();
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
      const filter = this.buildFilter(filters);
      const sort = this.buildSort(sorting);
      
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      // Get products and total count in parallel
      const [products, total] = await Promise.all([
        ProductModel.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
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
      const newProduct = await ProductModel.create(product);
      return this.toDomainEntity(newProduct as IProduct);
    } catch (error) {
      logger.error('ProductRepository.create error:', error);
      throw new Error('Lỗi khi tạo sản phẩm');
    }
  }

  async update(id: string, data: Partial<ProductEntity>): Promise<ProductEntity | null> {
    try {
      const updated = await ProductModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      ).lean();

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
      const filter = this.buildFilter(filters);
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

  async findByFarm(farmName: string, pagination?: ProductPagination): Promise<PaginatedProducts> {
    return this.findAll({ farm: farmName }, undefined, pagination);
  }

  async findOrganic(pagination?: ProductPagination): Promise<PaginatedProducts> {
    return this.findAll({ isOrganic: true }, undefined, pagination);
  }

  async findFresh(pagination?: ProductPagination): Promise<PaginatedProducts> {
    return this.findAll({ isFresh: true }, undefined, pagination);
  }

  async findByCertification(certification: string, pagination?: ProductPagination): Promise<PaginatedProducts> {
    return this.findAll({ certified: certification }, undefined, pagination);
  }

  async findByProvince(province: string, pagination?: ProductPagination): Promise<PaginatedProducts> {
    return this.findAll({ province }, undefined, pagination);
  }

  async getCategories(): Promise<string[]> {
    try {
      const categories = await ProductModel.distinct('category');
      return categories;
    } catch (error) {
      logger.error('ProductRepository.getCategories error:', error);
      throw new Error('Lỗi khi lấy danh sách danh mục');
    }
  }

  async getProvinces(): Promise<string[]> {
    try {
      const provinces = await ProductModel.distinct('farm.location.province');
      return provinces as string[];
    } catch (error) {
      logger.error('ProductRepository.getProvinces error:', error);
      throw new Error('Lỗi khi lấy danh sách tỉnh thành');
    }
  }

  async getCertifications(): Promise<string[]> {
    try {
      const certifications = await ProductModel.distinct('certifications');
      return certifications;
    } catch (error) {
      logger.error('ProductRepository.getCertifications error:', error);
      throw new Error('Lỗi khi lấy danh sách chứng nhận');
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
}
