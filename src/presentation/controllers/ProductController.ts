import { Request, Response } from 'express';
import { GetProductsUseCase } from '../../domain/usecases/product/GetProducts.usecase';
import { GetProductByIdUseCase } from '../../domain/usecases/product/GetProductById.usecase';
import { GetProductTraceabilityUseCase } from '../../domain/usecases/product/GetProductTraceability.usecase';
import { GetCategoriesUseCase } from '../../domain/usecases/product/GetCategories.usecase';
import { CreateProductUseCase } from '../../domain/usecases/product/CreateProduct.usecase';
import { UpdateProductUseCase } from '../../domain/usecases/product/UpdateProduct.usecase';
import { DeleteProductUseCase } from '../../domain/usecases/product/DeleteProduct.usecase';
import { UploadProductImagesUseCase } from '../../domain/usecases/product/UploadProductImages.usecase';
import { ProductMapper } from '../dto/product/Product.dto';
import { ProductFilters, ProductSorting, ProductPagination } from '../../domain/repositories/IProductRepository';
import { logger } from '../../shared/utils/logger';

/**
 * Product Controller - HTTP Layer
 * Handles HTTP requests and delegates to use cases
 */
export class ProductController {
  constructor(
    private getProductsUseCase: GetProductsUseCase,
    private getProductByIdUseCase: GetProductByIdUseCase,
    private getProductTraceabilityUseCase: GetProductTraceabilityUseCase,
    private getCategoriesUseCase: GetCategoriesUseCase,
    private createProductUseCase: CreateProductUseCase,
    private updateProductUseCase: UpdateProductUseCase,
    private deleteProductUseCase: DeleteProductUseCase,
    private uploadProductImagesUseCase: UploadProductImagesUseCase
  ) {}

  /**
   * GET /api/products
   * Get products with filtering, sorting and pagination
   */
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const { 
        q,           // search query
        category,
        farm,
        certified,
        minPrice,
        maxPrice,
        isOrganic,
        isFresh,
        inStock,
        province,
        minRating,
        sortBy,
        order,
        page = 1,
        limit = 20
      } = req.query;

      // Build filters
      const filters: ProductFilters = {};
      if (q) filters.search = q as string;
      if (category) filters.category = category as string;
      if (farm) filters.farm = farm as string;
      if (certified) filters.certified = certified as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (isOrganic !== undefined) filters.isOrganic = isOrganic === 'true';
      if (isFresh !== undefined) filters.isFresh = isFresh === 'true';
      if (inStock !== undefined) filters.inStock = inStock === 'true';
      if (province) filters.province = province as string;
      if (minRating) filters.minRating = parseFloat(minRating as string);

      // Build sorting
      const sorting: ProductSorting = {
        sortBy: (sortBy as any) || 'createdAt',
        order: (order as any) || 'desc'
      };

      // Build pagination
      const pagination: ProductPagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      // Execute use case
      const result = await this.getProductsUseCase.execute(filters, sorting, pagination);

      // Map to DTO
      const response = ProductMapper.toPaginatedDTO(
        result.products,
        result.total,
        result.page,
        result.limit,
        result.totalPages,
        true // Include computed fields
      );

      res.status(200).json({
        success: true,
        data: response.products,
        pagination: {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages
        }
      });
    } catch (error: any) {
      logger.error('ProductController.getProducts error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy danh sách sản phẩm'
      });
    }
  }

  /**
   * GET /api/products/:id
   * Get product by ID
   */
  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Execute use case
      const product = await this.getProductByIdUseCase.execute(id);

      // Map to DTO
      const response = ProductMapper.toDTO(product, true);

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error: any) {
      logger.error('ProductController.getProductById error:', error);
      
      if (error.message === 'Không tìm thấy sản phẩm') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy thông tin sản phẩm'
      });
    }
  }

  /**
   * GET /api/products/:id/traceability
   * Get product traceability information
   */
  async getProductTraceability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Execute use case
      const traceability = await this.getProductTraceabilityUseCase.execute(id);

      // Map to DTO
      const response = ProductMapper.toTraceabilityDTO(traceability);

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error: any) {
      logger.error('ProductController.getProductTraceability error:', error);
      
      if (error.message === 'Không tìm thấy sản phẩm') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy thông tin truy xuất nguồn gốc'
      });
    }
  }

  /**
   * GET /api/products/categories/list
   * Get all categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      // Execute use case
      const categories = await this.getCategoriesUseCase.execute();

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      logger.error('ProductController.getCategories error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy danh sách danh mục'
      });
    }
  }

  /**
   * POST /api/products
   * Create new product
   */
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const productData = req.body;

      // Execute use case
      const product = await this.createProductUseCase.execute(productData);

      // Map to DTO
      const response = ProductMapper.toDTO(product, true);

      logger.info(`Product created: ${product.id}`);

      res.status(201).json({
        success: true,
        message: 'Tạo sản phẩm thành công',
        data: response
      });
    } catch (error: any) {
      logger.error('ProductController.createProduct error:', error);

      if (error.message.includes('không được để trống') ||
          error.message.includes('phải') ||
          error.message.includes('không hợp lệ') ||
          error.message.includes('hết hạn')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo sản phẩm'
      });
    }
  }

  /**
   * PUT /api/products/:id
   * Update product
   */
  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Execute use case
      const product = await this.updateProductUseCase.execute(id, updateData);

      // Map to DTO
      const response = ProductMapper.toDTO(product, true);

      logger.info(`Product updated: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Cập nhật sản phẩm thành công',
        data: response
      });
    } catch (error: any) {
      logger.error('ProductController.updateProduct error:', error);

      if (error.message === 'Không tìm thấy sản phẩm') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error.message.includes('không được để trống') ||
          error.message.includes('phải') ||
          error.message.includes('không hợp lệ')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật sản phẩm'
      });
    }
  }

  /**
   * DELETE /api/products/:id
   * Delete product (soft delete)
   */
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Execute use case
      await this.deleteProductUseCase.execute(id);

      logger.info(`Product deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Xóa sản phẩm thành công'
      });
    } catch (error: any) {
      logger.error('ProductController.deleteProduct error:', error);

      if (error.message === 'Không tìm thấy sản phẩm') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error.message.includes('đã bị xóa')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa sản phẩm'
      });
    }
  }

  /**
   * POST /api/products/:id/images
   * Upload product images
   */
  async uploadImages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng chọn ít nhất một ảnh'
        });
        return;
      }

      // Execute use case
      const product = await this.uploadProductImagesUseCase.execute(id, files);

      // Map to DTO
      const response = ProductMapper.toDTO(product, true);

      logger.info(`Uploaded ${files.length} images for product: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Upload ảnh thành công',
        data: response
      });
    } catch (error: any) {
      logger.error('ProductController.uploadImages error:', error);

      if (error.message === 'Không tìm thấy sản phẩm') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error.message.includes('tối đa') ||
          error.message.includes('chọn') ||
          error.message.includes('định dạng') ||
          error.message.includes('vượt quá')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi khi upload ảnh'
      });
    }
  }

  /**
   * DELETE /api/products/:id/images
   * Delete a specific product image
   */
  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        res.status(400).json({
          success: false,
          message: 'URL ảnh là bắt buộc'
        });
        return;
      }

      // Execute use case
      const product = await this.uploadProductImagesUseCase.deleteImage(id, imageUrl);

      // Map to DTO
      const response = ProductMapper.toDTO(product, true);

      logger.info(`Deleted image from product: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Xóa ảnh thành công',
        data: response
      });
    } catch (error: any) {
      logger.error('ProductController.deleteImage error:', error);

      if (error.message === 'Không tìm thấy sản phẩm' ||
          error.message === 'Ảnh không tồn tại trong sản phẩm') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa ảnh'
      });
    }
  }

  /**
   * DELETE /api/products/:id/permanent
   * Permanently delete a product (Admin only)
   */
  async permanentDelete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Execute use case
      await this.deleteProductUseCase.permanentDelete(id);

      logger.info(`Product permanently deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Xóa sản phẩm vĩnh viễn thành công'
      });
    } catch (error: any) {
      logger.error('ProductController.permanentDelete error:', error);

      if (error.message === 'Không tìm thấy sản phẩm') {
        res.status(404).json({ success: false, message: error.message });
        return;
      }

      if (error.message.includes('Vui lòng xóa mềm') || error.message.includes('Không thể xóa vĩnh viễn')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }

      res.status(500).json({ success: false, message: 'Lỗi khi xóa vĩnh viễn sản phẩm' });
    }
  }
}
