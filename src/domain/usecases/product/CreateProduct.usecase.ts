import { ProductEntity } from '../../entities/Product.entity';
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
  category: string;
  price: number;
  unit: string;
  description: string;
  images?: string[];
  stockQuantity: number;
  tags?: string[];
}

export interface ProductOwnerContext {
  id: string;
  email: string;
  role: 'shop_owner' | 'admin' | 'customer';
  userName?: string;
}

export class CreateProductUseCase {
  constructor(
    private productRepository: IProductRepository,
    private categoryRepository: ICategoryRepository
  ) {}

  async execute(input: CreateProductInput, owner: ProductOwnerContext): Promise<ProductEntity> {
    logger.info('CreateProductUseCase.execute category:', input.category);
    this.validateInput(input, owner);

    const resolvedCategoryId = await this.resolveCategoryId(input.category);
    if (!resolvedCategoryId) {
      throw new Error('Danh mục không hợp lệ');
    }

    const normalizedTags = (input.tags || [])
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean);

    const stockQuantity = Math.max(0, input.stockQuantity);

    const productData: Omit<ProductEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      name: input.name.trim(),
      nameEn: input.nameEn?.trim(),
      category: {
        id: resolvedCategoryId
      },
      owner: {
        id: owner.id,
        email: owner.email,
        role: owner.role,
        userName: owner.userName
      },
      price: input.price,
      unit: input.unit.trim(),
      description: input.description.trim(),
      images: input.images || [],
      inStock: stockQuantity > 0,
      stockQuantity,
      tags: normalizedTags,
      rating: 0,
      reviewCount: 0
    } as unknown as Omit<ProductEntity, 'id' | 'createdAt' | 'updatedAt'>;

    const product = await this.productRepository.create(productData);

    logger.info(`Product created: ${product.id} - ${product.name}`);

    return product;
  }

  private async resolveCategoryId(category: string): Promise<string | null> {
    if (!category) return null;

    // direct lookup by id
    const byId = await this.categoryRepository.findById(category);
    if (byId) {
      return byId.id;
    }

    const all = await this.categoryRepository.findAll();
    const found = all.find(c => c.slug === category || c.name === category || c.nameEn === category);
    return found ? found.id : null;
  }

  private validateInput(input: CreateProductInput, owner: ProductOwnerContext): void {
    const errors: string[] = [];

    if (!input.name || input.name.trim().length === 0) {
      errors.push('Tên sản phẩm không được để trống');
    }
    if (input.name && input.name.trim().length > 200) {
      errors.push('Tên sản phẩm không được vượt quá 200 ký tự');
    }

    if (!input.price || input.price <= 0) {
      errors.push('Giá sản phẩm phải lớn hơn 0');
    }
    if (input.price && input.price > 100000000) {
      errors.push('Giá sản phẩm không hợp lệ');
    }

    if (!input.unit || input.unit.trim().length === 0) {
      errors.push('Đơn vị tính không được để trống');
    }

    if (!input.description || input.description.trim().length === 0) {
      errors.push('Mô tả sản phẩm không được để trống');
    }
    if (input.description && input.description.trim().length < 20) {
      errors.push('Mô tả sản phẩm phải có ít nhất 20 ký tự');
    }

    if (input.stockQuantity < 0) {
      errors.push('Số lượng tồn kho không thể âm');
    }

    if (!input.category) {
      errors.push('Danh mục không được để trống');
    }

    if (!owner || !owner.id) {
      errors.push('Người đăng không hợp lệ');
    }

    if (owner.role !== 'shop_owner' && owner.role !== 'admin') {
      errors.push('Bạn không có quyền đăng sản phẩm');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}
