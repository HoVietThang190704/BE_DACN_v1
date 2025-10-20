/**
 * Product Entity - Pure domain model without framework dependencies
 * Contains business logic and validation rules
 */

export interface IProductEntity {
  id: string;
  name: string;
  nameEn?: string;
  category: ProductCategory;
  price: number;
  unit: string;
  description: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  
  // Farm traceability
  farm: FarmInfo;
  
  // Quality & Certification
  certifications: Certification[];
  harvestDate: Date;
  shelfLife: number; // days
  
  // Nutritional info
  nutrition?: NutritionInfo;
  
  // Metadata
  isOrganic: boolean;
  isFresh: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory = 
  | 'vegetable' 
  | 'fruit' 
  | 'herb' 
  | 'grain' 
  | 'meat' 
  | 'seafood' 
  | 'dairy' 
  | 'organic';

export type Certification = 
  | 'VietGAP' 
  | 'GlobalGAP' 
  | 'Organic' 
  | 'HACCP' 
  | 'ISO22000';

export interface FarmInfo {
  name: string;
  location: {
    province: string;
    district: string;
    commune: string;
  };
  farmer: string;
  contact: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  vitamin: string[];
}

export class ProductEntity implements IProductEntity {
  id: string;
  name: string;
  nameEn?: string;
  category: ProductCategory;
  price: number;
  unit: string;
  description: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  farm: FarmInfo;
  certifications: Certification[];
  harvestDate: Date;
  shelfLife: number;
  nutrition?: NutritionInfo;
  isOrganic: boolean;
  isFresh: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IProductEntity) {
    this.id = data.id;
    this.name = data.name;
    this.nameEn = data.nameEn;
    this.category = data.category;
    this.price = data.price;
    this.unit = data.unit;
    this.description = data.description;
    this.images = data.images;
    this.inStock = data.inStock;
    this.stockQuantity = data.stockQuantity;
    this.farm = data.farm;
    this.certifications = data.certifications;
    this.harvestDate = data.harvestDate;
    this.shelfLife = data.shelfLife;
    this.nutrition = data.nutrition;
    this.isOrganic = data.isOrganic;
    this.isFresh = data.isFresh;
    this.rating = data.rating;
    this.reviewCount = data.reviewCount;
    this.tags = data.tags;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Business Logic Methods

  /**
   * Check if product is available for purchase
   */
  isAvailable(): boolean {
    return this.inStock && this.stockQuantity > 0 && this.isFreshEnough();
  }

  /**
   * Check if product is still fresh based on shelf life
   */
  isFreshEnough(): boolean {
    const daysSinceHarvest = this.getDaysSinceHarvest();
    return daysSinceHarvest <= this.shelfLife;
  }

  /**
   * Calculate days since harvest
   */
  getDaysSinceHarvest(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.harvestDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get remaining shelf life in days
   */
  getRemainingShelfLife(): number {
    const daysSinceHarvest = this.getDaysSinceHarvest();
    const remaining = this.shelfLife - daysSinceHarvest;
    return Math.max(0, remaining);
  }

  /**
   * Calculate freshness percentage (0-100)
   */
  getFreshnessPercentage(): number {
    const remaining = this.getRemainingShelfLife();
    const percentage = (remaining / this.shelfLife) * 100;
    return Math.min(100, Math.max(0, percentage));
  }

  /**
   * Check if product has specific certification
   */
  hasCertification(cert: Certification): boolean {
    return this.certifications.includes(cert);
  }

  /**
   * Check if product is certified organic
   */
  isCertifiedOrganic(): boolean {
    return this.isOrganic || this.hasCertification('Organic');
  }

  /**
   * Check if product has quality certifications
   */
  hasQualityCertifications(): boolean {
    return this.certifications.length > 0;
  }

  /**
   * Get full location string
   */
  getFullLocation(): string {
    const { commune, district, province } = this.farm.location;
    return `${commune}, ${district}, ${province}`;
  }

  /**
   * Check if price is valid
   */
  hasValidPrice(): boolean {
    return this.price > 0;
  }

  /**
   * Calculate discount price (if applicable)
   */
  calculateDiscountPrice(discountPercentage: number): number {
    if (discountPercentage <= 0 || discountPercentage > 100) {
      return this.price;
    }
    return this.price * (1 - discountPercentage / 100);
  }

  /**
   * Check if product is high-rated (4.0 or above)
   */
  isHighRated(): boolean {
    return this.rating >= 4.0;
  }

  /**
   * Check if product is popular (has many reviews)
   */
  isPopular(threshold: number = 50): boolean {
    return this.reviewCount >= threshold;
  }

  /**
   * Update stock quantity
   */
  updateStock(quantity: number): void {
    this.stockQuantity = Math.max(0, quantity);
    this.inStock = this.stockQuantity > 0;
  }

  /**
   * Reduce stock by quantity (for order processing)
   */
  reduceStock(quantity: number): boolean {
    if (quantity <= 0) {
      throw new Error('Số lượng phải lớn hơn 0');
    }
    
    if (this.stockQuantity < quantity) {
      return false; // Not enough stock
    }
    
    this.stockQuantity -= quantity;
    this.inStock = this.stockQuantity > 0;
    return true;
  }

  /**
   * Add stock quantity
   */
  addStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Số lượng phải lớn hơn 0');
    }
    
    this.stockQuantity += quantity;
    this.inStock = true;
  }

  /**
   * Update rating after new review
   */
  updateRating(newRating: number): void {
    if (newRating < 0 || newRating > 5) {
      throw new Error('Đánh giá phải từ 0 đến 5 sao');
    }
    
    const totalRating = this.rating * this.reviewCount + newRating;
    this.reviewCount += 1;
    this.rating = totalRating / this.reviewCount;
  }

  /**
   * Validate product data
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Tên sản phẩm không được để trống');
    }

    if (this.price <= 0) {
      errors.push('Giá sản phẩm phải lớn hơn 0');
    }

    if (!this.unit || this.unit.trim().length === 0) {
      errors.push('Đơn vị tính không được để trống');
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push('Mô tả sản phẩm không được để trống');
    }

    if (this.shelfLife <= 0) {
      errors.push('Hạn sử dụng phải lớn hơn 0');
    }

    if (!this.farm || !this.farm.name) {
      errors.push('Thông tin nông trại không được để trống');
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
