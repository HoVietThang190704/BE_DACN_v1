import { ProductEntity, ProductCategory, Certification, FarmInfo, NutritionInfo } from '../../entities/Product.entity';
import { IProductRepository } from '../../repositories/IProductRepository';
import { logger } from '../../../shared/utils/logger';

/**
 * Use Case: Update Product
 * Business logic for updating an existing product
 */

export interface UpdateProductInput {
  name?: string;
  nameEn?: string;
  category?: ProductCategory;
  price?: number;
  unit?: string;
  description?: string;
  stockQuantity?: number;
  
  // Farm info
  farm?: Partial<FarmInfo>;
  
  // Quality
  certifications?: Certification[];
  harvestDate?: Date;
  shelfLife?: number;
  
  // Nutritional
  nutrition?: NutritionInfo;
  
  // Flags
  isOrganic?: boolean;
  isFresh?: boolean;
  tags?: string[];
  inStock?: boolean;
}

export class UpdateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(productId: string, input: UpdateProductInput): Promise<ProductEntity> {
    // Check if product exists
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    // Validate input
    this.validateInput(input);

    // Build update data
    const updateData: Partial<ProductEntity> = {};

    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.nameEn !== undefined) updateData.nameEn = input.nameEn.trim();
    if (input.category !== undefined) updateData.category = input.category;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.unit !== undefined) updateData.unit = input.unit.trim();
    if (input.description !== undefined) updateData.description = input.description.trim();
    
    // Stock management
    if (input.stockQuantity !== undefined) {
      updateData.stockQuantity = input.stockQuantity;
      updateData.inStock = input.stockQuantity > 0;
    }
    if (input.inStock !== undefined) updateData.inStock = input.inStock;

    // Farm info - merge with existing
    if (input.farm) {
      updateData.farm = {
        ...existingProduct.farm,
        ...input.farm
      } as FarmInfo;
    }

    if (input.certifications !== undefined) updateData.certifications = input.certifications;
    
    // Harvest date validation
    if (input.harvestDate !== undefined) {
      if (input.harvestDate > new Date()) {
        throw new Error('Ngày thu hoạch không thể trong tương lai');
      }
      updateData.harvestDate = input.harvestDate;
    }
    
    if (input.shelfLife !== undefined) updateData.shelfLife = input.shelfLife;
    if (input.nutrition !== undefined) updateData.nutrition = input.nutrition;
    if (input.isOrganic !== undefined) updateData.isOrganic = input.isOrganic;
    if (input.isFresh !== undefined) updateData.isFresh = input.isFresh;
    if (input.tags !== undefined) updateData.tags = input.tags;

    // Update product
    const updatedProduct = await this.productRepository.update(productId, updateData);

    if (!updatedProduct) {
      throw new Error('Không thể cập nhật sản phẩm');
    }

    logger.info(`Product updated: ${productId} - ${updatedProduct.name}`);

    return updatedProduct;
  }

  private validateInput(input: UpdateProductInput): void {
    const errors: string[] = [];

    // Name validation
    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        errors.push('Tên sản phẩm không được để trống');
      }
      if (input.name.trim().length > 200) {
        errors.push('Tên sản phẩm không được vượt quá 200 ký tự');
      }
    }

    // Price validation
    if (input.price !== undefined) {
      if (input.price <= 0) {
        errors.push('Giá sản phẩm phải lớn hơn 0');
      }
      if (input.price > 100000000) {
        errors.push('Giá sản phẩm không hợp lệ');
      }
    }

    // Unit validation
    if (input.unit !== undefined && input.unit.trim().length === 0) {
      errors.push('Đơn vị tính không được để trống');
    }

    // Description validation
    if (input.description !== undefined) {
      if (input.description.trim().length === 0) {
        errors.push('Mô tả sản phẩm không được để trống');
      }
      if (input.description.trim().length < 20) {
        errors.push('Mô tả sản phẩm phải có ít nhất 20 ký tự');
      }
    }

    // Stock validation
    if (input.stockQuantity !== undefined && input.stockQuantity < 0) {
      errors.push('Số lượng tồn kho không thể âm');
    }

    // Shelf life validation
    if (input.shelfLife !== undefined) {
      if (input.shelfLife <= 0) {
        errors.push('Hạn sử dụng phải lớn hơn 0');
      }
      if (input.shelfLife > 365) {
        errors.push('Hạn sử dụng không được vượt quá 365 ngày');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}
