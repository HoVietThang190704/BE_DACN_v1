import { ProductEntity, ProductCategory, Certification, FarmInfo, NutritionInfo } from '../../entities/Product.entity';
import { IProductRepository } from '../../repositories/IProductRepository';
import { ICategoryRepository } from '../../repositories/ICategoryRepository';
import { logger } from '../../../shared/utils/logger';

/**
 * Use Case: Create Product
 * Business logic for creating a new product
 */

export interface CreateProductInput {
  name: string;
  nameEn?: string;
  category: ProductCategory;
  price: number;
  unit: string;
  description: string;
  images?: string[];
  stockQuantity: number;
  
  // Farm info
  farm: FarmInfo;
  
  // Quality
  certifications?: Certification[];
  harvestDate: Date;
  shelfLife: number;
  
  // Nutritional
  nutrition?: NutritionInfo;
  
  // Flags
  isOrganic?: boolean;
  isFresh?: boolean;
  tags?: string[];
}

export class CreateProductUseCase {
  constructor(
    private productRepository: IProductRepository,
    private categoryRepository: ICategoryRepository
  ) {}

  async execute(input: CreateProductInput): Promise<ProductEntity> {
    // If harvestDate is passed as a string (from JSON body), coerce to Date
    if (typeof (input as any).harvestDate === 'string') {
      (input as any).harvestDate = new Date((input as any).harvestDate);
    }

    // Validate input
    this.validateInput(input);

    // Validate harvest date (not in future)
    if (input.harvestDate > new Date()) {
      throw new Error('Ngày thu hoạch không thể trong tương lai');
    }

    // Calculate days since harvest
    const daysSinceHarvest = Math.ceil(
      (new Date().getTime() - input.harvestDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if product is still fresh
    if (daysSinceHarvest > input.shelfLife) {
      throw new Error('Sản phẩm đã hết hạn sử dụng');
    }

    // Create product data
    const productData: Omit<ProductEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      name: input.name.trim(),
      nameEn: input.nameEn?.trim(),
      category: input.category,
      price: input.price,
      unit: input.unit.trim(),
      description: input.description.trim(),
      images: input.images || [],
      inStock: input.stockQuantity > 0,
      stockQuantity: input.stockQuantity,
      farm: input.farm,
      certifications: input.certifications || [],
      harvestDate: input.harvestDate,
      shelfLife: input.shelfLife,
      nutrition: input.nutrition,
      isOrganic: input.isOrganic ?? false,
      isFresh: input.isFresh ?? true,
      rating: 0,
      reviewCount: 0,
      tags: input.tags || []
    } as any;

    // Create product
    const product = await this.productRepository.create(productData);

    // Update category product count
    // Note: This assumes category field in product contains category ID
    // Adjust based on your actual implementation
    // await this.categoryRepository.incrementProductCount(product.category);

    logger.info(`Product created: ${product.id} - ${product.name}`);

    return product;
  }

  private validateInput(input: CreateProductInput): void {
    const errors: string[] = [];

    // Name validation
    if (!input.name || input.name.trim().length === 0) {
      errors.push('Tên sản phẩm không được để trống');
    }
    if (input.name && input.name.trim().length > 200) {
      errors.push('Tên sản phẩm không được vượt quá 200 ký tự');
    }

    // Price validation
    if (!input.price || input.price <= 0) {
      errors.push('Giá sản phẩm phải lớn hơn 0');
    }
    if (input.price && input.price > 100000000) {
      errors.push('Giá sản phẩm không hợp lệ');
    }

    // Unit validation
    if (!input.unit || input.unit.trim().length === 0) {
      errors.push('Đơn vị tính không được để trống');
    }

    // Description validation
    if (!input.description || input.description.trim().length === 0) {
      errors.push('Mô tả sản phẩm không được để trống');
    }
    if (input.description && input.description.trim().length < 20) {
      errors.push('Mô tả sản phẩm phải có ít nhất 20 ký tự');
    }

    // Stock validation
    if (input.stockQuantity < 0) {
      errors.push('Số lượng tồn kho không thể âm');
    }

    // Farm validation
    if (!input.farm || !input.farm.name) {
      errors.push('Tên nông trại không được để trống');
    }
    if (!input.farm || !input.farm.farmer) {
      errors.push('Tên nông dân không được để trống');
    }
    if (!input.farm || !input.farm.location || !input.farm.location.province) {
      errors.push('Tỉnh/Thành của nông trại không được để trống');
    }
    // Mongoose schema requires district and commune inside farm.location
    if (!input.farm || !input.farm.location || !input.farm.location.district) {
      errors.push('Quận/Huyện của nông trại không được để trống');
    }
    if (!input.farm || !input.farm.location || !input.farm.location.commune) {
      errors.push('Xã/Phường của nông trại không được để trống');
    }
    // Contact is required in schema
    if (!input.farm || !input.farm.contact) {
      errors.push('Liên hệ nông trại không được để trống');
    }

    // Harvest date validation
    if (!input.harvestDate) {
      errors.push('Ngày thu hoạch không được để trống');
    }

    // Shelf life validation
    if (!input.shelfLife || input.shelfLife <= 0) {
      errors.push('Hạn sử dụng phải lớn hơn 0');
    }
    if (input.shelfLife && input.shelfLife > 365) {
      errors.push('Hạn sử dụng không được vượt quá 365 ngày');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}
