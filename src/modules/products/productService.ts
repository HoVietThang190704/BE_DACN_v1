// Temporary mock data - sẽ thay thế bằng database sau
const mockProducts = [
  {
    id: 'p1',
    name: 'Rau sạch A',
    price: 30000,
    stock: 12,
    category: 'vegetables',
    description: 'Rau sạch trồng theo tiêu chuẩn VietGAP',
    images: ['https://via.placeholder.com/400x300?text=Rau+sạch+A'],
    farmId: 'f1',
    farmName: 'Nông trại Xanh',
    certifications: ['VietGAP'],
    harvestDate: new Date('2025-09-25'),
    expiryDate: new Date('2025-09-30'),
    batchNumber: 'RX20250925001',
    isOrganic: true,
    nutritionInfo: {
      calories: 20,
      protein: 2.5,
      carbs: 4.0,
      fiber: 2.0
    },
    createdAt: new Date('2025-09-20')
  },
  {
    id: 'p2',
    name: 'Trứng gà ta',
    price: 45000,
    stock: 20,
    category: 'eggs',
    description: 'Trứng gà ta nuôi thả vườn, không hormone',
    images: ['https://via.placeholder.com/400x300?text=Trứng+gà+ta'],
    farmId: 'f2',
    farmName: 'Trang trại Hạnh Phúc',
    certifications: ['VietGAP', 'NoHormone'],
    harvestDate: new Date('2025-09-24'),
    expiryDate: new Date('2025-10-10'),
    batchNumber: 'TG20250924001',
    isOrganic: false,
    nutritionInfo: {
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11
    },
    createdAt: new Date('2025-09-18')
  },
  {
    id: 'p3',
    name: 'Cà chua bi hữu cơ',
    price: 55000,
    stock: 8,
    category: 'vegetables',
    description: 'Cà chua bi hữu cơ, ngọt tự nhiên',
    images: ['https://via.placeholder.com/400x300?text=Cà+chua+bi'],
    farmId: 'f3',
    farmName: 'Nông trại Hữu cơ Việt',
    certifications: ['GlobalGAP', 'Organic'],
    harvestDate: new Date('2025-09-26'),
    expiryDate: new Date('2025-10-03'),
    batchNumber: 'CC20250926001',
    isOrganic: true,
    nutritionInfo: {
      calories: 18,
      protein: 0.9,
      carbs: 3.9,
      fiber: 1.2
    },
    createdAt: new Date('2025-09-22')
  }
];

const mockCategories = [
  { id: 'vegetables', name: 'Rau củ quả', icon: '🥬' },
  { id: 'eggs', name: 'Trứng các loại', icon: '🥚' },
  { id: 'herbs', name: 'Rau thơm', icon: '🌿' },
  { id: 'fruits', name: 'Trái cây', icon: '🍎' },
  { id: 'dairy', name: 'Sản phẩm từ sữa', icon: '🥛' }
];

interface ProductFilters {
  search?: string;
  category?: string;
  farm?: string;
  certified?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface ProductSorting {
  sortBy: string;
  order: string;
}

interface ProductPagination {
  page: number;
  limit: number;
}

export class ProductService {
  async getProducts(
    filters: ProductFilters,
    sorting: ProductSorting,
    pagination: ProductPagination
  ) {
    let filteredProducts = [...mockProducts];

    // Apply filters
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.farmName.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.category) {
      filteredProducts = filteredProducts.filter(p => p.category === filters.category);
    }

    if (filters.farm) {
      filteredProducts = filteredProducts.filter(p => p.farmId === filters.farm);
    }

    if (filters.certified) {
      filteredProducts = filteredProducts.filter(p => 
        p.certifications.includes(filters.certified!)
      );
    }

    if (filters.minPrice) {
      filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!);
    }

    // Apply sorting
    filteredProducts.sort((a, b) => {
      let aVal, bVal;
      
      switch (sorting.sortBy) {
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'createdAt':
        default:
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
      }

      if (sorting.order === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });

    // Apply pagination
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const products = filteredProducts.slice(startIndex, endIndex);

    return {
      products,
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages
    };
  }

  async getProductById(id: string) {
    const product = mockProducts.find(p => p.id === id);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }
    return product;
  }

  async getProductTraceability(id: string) {
    const product = await this.getProductById(id);
    
    return {
      product: {
        id: product.id,
        name: product.name,
        batchNumber: product.batchNumber
      },
      farm: {
        id: product.farmId,
        name: product.farmName,
        location: 'Đà Lạt, Lâm Đồng',
        coordinates: { lat: 11.9404, lng: 108.4583 }
      },
      timeline: [
        {
          stage: 'Gieo trồng',
          date: new Date('2025-08-15'),
          description: 'Gieo hạt giống theo tiêu chuẩn VietGAP'
        },
        {
          stage: 'Chăm sóc',
          date: new Date('2025-09-01'),
          description: 'Tưới nước, bón phân hữu cơ'
        },
        {
          stage: 'Thu hoạch',
          date: product.harvestDate,
          description: 'Thu hoạch vào buổi sáng sớm'
        },
        {
          stage: 'Đóng gói',
          date: new Date('2025-09-25'),
          description: 'Đóng gói theo tiêu chuẩn vệ sinh'
        },
        {
          stage: 'Vận chuyển',
          date: new Date('2025-09-26'),
          description: 'Vận chuyển bằng xe lạnh đến kho'
        }
      ],
      certifications: product.certifications,
      qualityTests: [
        {
          testType: 'Pesticide Residue',
          result: 'Pass',
          date: new Date('2025-09-25'),
          details: 'Không phát hiện dư lượng thuốc bảo vệ thực vật'
        }
      ]
    };
  }

  async getCategories() {
    return mockCategories;
  }
}