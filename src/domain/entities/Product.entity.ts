export interface ProductOwnerInfo {
  id: string;
  email?: string;
  userName?: string;
  role?: 'customer' | 'shop_owner' | 'admin';
  avatar?: string;
}

export interface ProductCategoryInfo {
  id: string;
  name?: string;
  slug?: string;
}

export interface IProductEntity {
  id: string;
  name: string;
  nameEn?: string;
  category: ProductCategoryInfo;
  owner: ProductOwnerInfo;
  price: number;
  unit: string;
  description: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  sold: number;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductEntity implements IProductEntity {
  id: string;
  name: string;
  nameEn?: string;
  category: ProductCategoryInfo;
  owner: ProductOwnerInfo;
  price: number;
  unit: string;
  description: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  sold: number;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IProductEntity) {
    this.id = data.id;
    this.name = data.name;
    this.nameEn = data.nameEn;
    this.category = data.category;
    this.owner = data.owner;
    this.price = data.price;
    this.unit = data.unit;
    this.description = data.description;
    this.images = data.images;
    this.inStock = data.inStock;
    this.stockQuantity = data.stockQuantity;
    this.sold = data.sold;
    this.tags = data.tags;
    this.rating = data.rating;
    this.reviewCount = data.reviewCount;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  isAvailable(): boolean {
    return this.inStock && this.stockQuantity > 0;
  }

  hasValidPrice(): boolean {
    return this.price > 0;
  }

  isHighRated(): boolean {
    return this.rating >= 4;
  }

  isPopular(threshold: number = 50): boolean {
    return this.reviewCount >= threshold;
  }

  updateStock(quantity: number): void {
    this.stockQuantity = Math.max(0, quantity);
    this.inStock = this.stockQuantity > 0;
  }

  reduceStock(quantity: number): boolean {
    if (quantity <= 0) {
      throw new Error('Số lượng phải lớn hơn 0');
    }

    if (this.stockQuantity < quantity) {
      return false;
    }

    this.stockQuantity -= quantity;
    this.inStock = this.stockQuantity > 0;
    return true;
  }

  addStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Số lượng phải lớn hơn 0');
    }

    this.stockQuantity += quantity;
    this.inStock = true;
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Tên sản phẩm không được để trống');
    }

    if (!this.category || !this.category.id) {
      errors.push('Danh mục sản phẩm không hợp lệ');
    }

    if (!this.owner || !this.owner.id) {
      errors.push('Thông tin người đăng không hợp lệ');
    }

    if (!this.hasValidPrice()) {
      errors.push('Giá sản phẩm phải lớn hơn 0');
    }

    if (!this.unit || this.unit.trim().length === 0) {
      errors.push('Đơn vị tính không được để trống');
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push('Mô tả sản phẩm không được để trống');
    }

    if (this.stockQuantity < 0) {
      errors.push('Số lượng tồn kho không hợp lệ');
    }

    if (this.rating < 0 || this.rating > 5) {
      errors.push('Đánh giá phải từ 0 đến 5 sao');
    }

    if (this.reviewCount < 0) {
      errors.push('Số lượt đánh giá không hợp lệ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
