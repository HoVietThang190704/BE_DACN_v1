import { Product } from '../../models/Product';
import { logger } from '../../shared/utils/logger';

export class ProductService {
  static async getProducts() {
    try {
      const products = await Product.find({}).limit(10).lean();
      return { products };
    } catch (error) {
      logger.error('Error getting products:', error);
      return { products: [] };
    }
  }

  static async seedDatabase() {
    try {
      const count = await Product.countDocuments();
      if (count > 0) return;

      const sample = {
        name: 'Rau cải xanh',
        category: 'vegetable',
        price: 35000,
        unit: 'kg',
        description: 'Rau cải tươi sạch',
        inStock: true,
        stockQuantity: 50,
        farm: {
          name: 'Nông trại ABC',
          location: { province: 'Lâm Đồng', district: 'Đà Lạt', commune: 'Xuân An' },
          farmer: 'Nguyễn Văn A',
          contact: '0901234567'
        },
        certifications: ['VietGAP'],
        harvestDate: new Date(),
        shelfLife: 7,
        isOrganic: true,
        isFresh: true,
        rating: 4.8,
        reviewCount: 45,
        tags: ['rau', 'tươi sạch']
      };

      await Product.create(sample);
      logger.info('✅ Database seeded');
    } catch (error) {
      logger.error('Seed error:', error);
    }
  }
}