import { database } from './connection';
import { Category } from '../../models/Category';
import { logger } from '../utils/logger';

/**
 * Seed sample categories with multi-level hierarchy
 */
async function seedCategories() {
  try {
    // Clear existing categories
    await Category.deleteMany({});
    logger.info('Đã xóa dữ liệu danh mục cũ');

    // Level 0 - Root Categories
    const vegRoot = await Category.create({
      name: 'Rau củ quả',
      nameEn: 'Vegetables',
      slug: 'rau-cu-qua',
      description: 'Các loại rau củ quả tươi sạch, hữu cơ',
      icon: '🥬',
      parentId: null,
      level: 0,
      order: 1,
      isActive: true,
      productCount: 15
    });

    const fruitRoot = await Category.create({
      name: 'Trái cây',
      nameEn: 'Fruits',
      slug: 'trai-cay',
      description: 'Trái cây tươi ngon, đa dạng chủng loại',
      icon: '🍎',
      parentId: null,
      level: 0,
      order: 2,
      isActive: true,
      productCount: 20
    });

    const meatRoot = await Category.create({
      name: 'Thịt tươi',
      nameEn: 'Fresh Meat',
      slug: 'thit-tuoi',
      description: 'Thịt tươi sạch, nguồn gốc rõ ràng',
      icon: '🥩',
      parentId: null,
      level: 0,
      order: 3,
      isActive: true,
      productCount: 10
    });

    const seafoodRoot = await Category.create({
      name: 'Hải sản',
      nameEn: 'Seafood',
      slug: 'hai-san',
      description: 'Hải sản tươi sống, đông lạnh',
      icon: '🦐',
      parentId: null,
      level: 0,
      order: 4,
      isActive: true,
      productCount: 8
    });

    const dairyRoot = await Category.create({
      name: 'Sữa & Trứng',
      nameEn: 'Dairy & Eggs',
      slug: 'sua-trung',
      description: 'Sản phẩm từ sữa và trứng',
      icon: '🥛',
      parentId: null,
      level: 0,
      order: 5,
      isActive: true,
      productCount: 12
    });

    logger.info('Đã tạo 5 danh mục root');

    // Level 1 - Vegetables subcategories
    const leafyVeg = await Category.create({
      name: 'Rau ăn lá',
      nameEn: 'Leafy Vegetables',
      slug: 'rau-an-la',
      description: 'Rau cải, xà lách, rau muống, rau dền...',
      icon: '🥬',
      parentId: vegRoot._id,
      level: 1,
      order: 1,
      isActive: true,
      productCount: 45
    });

    const rootVeg = await Category.create({
      name: 'Rau ăn củ',
      nameEn: 'Root Vegetables',
      slug: 'rau-an-cu',
      description: 'Cà rốt, củ cải, khoai tây, khoai lang...',
      icon: '🥕',
      parentId: vegRoot._id,
      level: 1,
      order: 2,
      isActive: true,
      productCount: 35
    });

    const fruitVeg = await Category.create({
      name: 'Rau ăn quả',
      nameEn: 'Fruit Vegetables',
      slug: 'rau-an-qua',
      description: 'Cà chua, dưa chuột, bí đao, mướp...',
      icon: '🍅',
      parentId: vegRoot._id,
      level: 1,
      order: 3,
      isActive: true,
      productCount: 30
    });

    const herbVeg = await Category.create({
      name: 'Rau gia vị',
      nameEn: 'Herbs & Spices',
      slug: 'rau-gia-vi',
      description: 'Rau thơm, hành, tỏi, gừng, sả...',
      icon: '🌿',
      parentId: vegRoot._id,
      level: 1,
      order: 4,
      isActive: true,
      productCount: 40
    });

    // Level 1 - Fruits subcategories
    const tropicalFruit = await Category.create({
      name: 'Trái cây nhiệt đới',
      nameEn: 'Tropical Fruits',
      slug: 'trai-cay-nhiet-doi',
      description: 'Xoài, dứa, chuối, đu đủ, mít...',
      icon: '🥭',
      parentId: fruitRoot._id,
      level: 1,
      order: 1,
      isActive: true,
      productCount: 30
    });

    const citrusFruit = await Category.create({
      name: 'Trái cây có múi',
      nameEn: 'Citrus Fruits',
      slug: 'trai-cay-co-mui',
      description: 'Cam, quýt, bưởi, chanh...',
      icon: '🍊',
      parentId: fruitRoot._id,
      level: 1,
      order: 2,
      isActive: true,
      productCount: 25
    });

    const berryFruit = await Category.create({
      name: 'Quả mọng',
      nameEn: 'Berries',
      slug: 'qua-mong',
      description: 'Dâu tây, việt quất, mâm xôi...',
      icon: '🍓',
      parentId: fruitRoot._id,
      level: 1,
      order: 3,
      isActive: true,
      productCount: 20
    });

    // Level 1 - Meat subcategories
    const pork = await Category.create({
      name: 'Thịt heo',
      nameEn: 'Pork',
      slug: 'thit-heo',
      description: 'Các loại thịt heo tươi',
      icon: '🥓',
      parentId: meatRoot._id,
      level: 1,
      order: 1,
      isActive: true,
      productCount: 15
    });

    const beef = await Category.create({
      name: 'Thịt bò',
      nameEn: 'Beef',
      slug: 'thit-bo',
      description: 'Các loại thịt bò tươi',
      icon: '🥩',
      parentId: meatRoot._id,
      level: 1,
      order: 2,
      isActive: true,
      productCount: 12
    });

    const chicken = await Category.create({
      name: 'Thịt gà',
      nameEn: 'Chicken',
      slug: 'thit-ga',
      description: 'Gà ta, gà công nghiệp',
      icon: '🍗',
      parentId: meatRoot._id,
      level: 1,
      order: 3,
      isActive: true,
      productCount: 18
    });

    logger.info('Đã tạo 10 danh mục level 1');

    // Level 2 - Leafy Vegetables subcategories
    const organicLeafy = await Category.create({
      name: 'Rau ăn lá hữu cơ',
      nameEn: 'Organic Leafy Vegetables',
      slug: 'rau-an-la-huu-co',
      description: 'Rau ăn lá được trồng theo tiêu chuẩn hữu cơ',
      icon: '🌱',
      parentId: leafyVeg._id,
      level: 2,
      order: 1,
      isActive: true,
      productCount: 20
    });

    const hydroponicLeafy = await Category.create({
      name: 'Rau ăn lá thủy canh',
      nameEn: 'Hydroponic Leafy Vegetables',
      slug: 'rau-an-la-thuy-canh',
      description: 'Rau sạch trồng bằng phương pháp thủy canh',
      icon: '💧',
      parentId: leafyVeg._id,
      level: 2,
      order: 2,
      isActive: true,
      productCount: 25
    });

    // Level 2 - Tropical Fruits subcategories
    const importedTropical = await Category.create({
      name: 'Trái cây nhiệt đới nhập khẩu',
      nameEn: 'Imported Tropical Fruits',
      slug: 'trai-cay-nhiet-doi-nhap-khau',
      description: 'Trái cây nhiệt đới từ Thái Lan, Philippines...',
      icon: '✈️',
      parentId: tropicalFruit._id,
      level: 2,
      order: 1,
      isActive: true,
      productCount: 15
    });

    const localTropical = await Category.create({
      name: 'Trái cây nhiệt đới Việt Nam',
      nameEn: 'Local Tropical Fruits',
      slug: 'trai-cay-nhiet-doi-viet-nam',
      description: 'Trái cây nhiệt đới đặc sản Việt Nam',
      icon: '🇻🇳',
      parentId: tropicalFruit._id,
      level: 2,
      order: 2,
      isActive: true,
      productCount: 15
    });

    logger.info('Đã tạo 4 danh mục level 2');

    const totalCategories = await Category.countDocuments();
    logger.info(`✅ Seed hoàn tất! Tổng cộng ${totalCategories} danh mục`);

    // Display tree structure
    logger.info('\n📊 Cấu trúc cây danh mục:');
    const allCategories = await Category.find().sort({ level: 1, order: 1 });
    allCategories.forEach((cat: any) => {
      const indent = '  '.repeat(cat.level);
      logger.info(`${indent}${cat.level === 0 ? '📁' : cat.level === 1 ? '📂' : '📄'} ${cat.name} (${cat.productCount} sản phẩm)`);
    });

  } catch (error) {
    logger.error('❌ Lỗi khi seed categories:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  database.connect()
    .then(() => seedCategories())
    .then(() => {
      logger.info('✅ Seed script hoàn tất');
      process.exit(0);
    })
    .catch((error: any) => {
      logger.error('❌ Seed script thất bại:', error);
      process.exit(1);
    });
}

export { seedCategories };
