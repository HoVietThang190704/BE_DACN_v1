import { Request, Response } from 'express';
import { HttpStatus } from '../../shared/constants/httpStatus';
import { CreateShopUseCase } from '../../domain/usecases/shop/CreateShop.usecase';
import { UpdateShopUseCase } from '../../domain/usecases/shop/UpdateShop.usecase';
import { DeleteShopUseCase } from '../../domain/usecases/shop/DeleteShop.usecase';
import { GetShopByIdUseCase } from '../../domain/usecases/shop/GetShopById.usecase';
import { FindPendingShopsUseCase } from '../../domain/usecases/shop/FindPendingShops.usecase';
import { ApproveShopUseCase } from '../../domain/usecases/shop/ApproveShop.usecase';
import { RejectShopUseCase } from '../../domain/usecases/shop/RejectShop.usecase';
import { ShopMapper } from '../dto/shop/Shop.dto';
import { logger } from '../../shared/utils/logger';

export class ShopController {
  constructor(
    private createShopUseCase: CreateShopUseCase,
    private updateShopUseCase: UpdateShopUseCase,
    private deleteShopUseCase: DeleteShopUseCase,
    private getShopByIdUseCase: GetShopByIdUseCase,
    private findPendingShopsUseCase?: FindPendingShopsUseCase,
    private approveShopUseCase?: ApproveShopUseCase,
    private rejectShopUseCase?: RejectShopUseCase
  ) {}

  async createShop(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId: bodyOwnerId, shopName, story, slug, isActive } = req.body as any;
      const ownerId = bodyOwnerId || (req.user ? req.user.userId : undefined);
      if (!ownerId) {
          res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Bạn cần đăng nhập để tạo shop' });
        return;
      }
      const shop = await this.createShopUseCase.execute({ ownerId, shopName, story, slug, isActive });
      const dto = ShopMapper.toDTO(shop);
      res.status(201).json({ success: true, message: 'Tạo shop thành công', data: dto });
    } catch (error: any) {
      logger.error('ShopController.createShop error:', error);
      if (error.message && (error.message.includes('Slug đã tồn tại') || error.message.includes('không được để trống') || error.message.includes('không hợp lệ'))) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Lỗi khi tạo shop' });
    }
  }

  async updateShop(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { shopName, story, slug, isActive } = req.body as any;
      // ownership check: only owner or admin can update
      const existing = await this.getShopByIdUseCase.execute(id);
      if (!existing) {
          res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Không tìm thấy shop' });
        return;
      }
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (userRole !== 'admin' && existing.ownerId !== userId) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật shop này' });
        return;
      }

      const shop = await this.updateShopUseCase.execute(id, { shopName, story, slug, isActive } as any);
      if (!shop) {
        res.status(404).json({ success: false, message: 'Không tìm thấy shop' });
        return;
      }
      const dto = ShopMapper.toDTO(shop);
        res.status(HttpStatus.OK).json({ success: true, message: 'Cập nhật shop thành công', data: dto });
    } catch (error: any) {
      logger.error('ShopController.updateShop error:', error);
      if (error.message && (error.message.includes('Slug đã tồn tại') || error.message.includes('không được để trống') || error.message.includes('không hợp lệ'))) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Lỗi khi cập nhật shop' });
    }
  }

  async deleteShop(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await this.getShopByIdUseCase.execute(id);
      if (!existing) {
          res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Không tìm thấy shop' });
        return;
      }
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (userRole !== 'admin' && existing.ownerId !== userId) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền xóa shop này' });
        return;
      }

      await this.deleteShopUseCase.execute(id);
      res.status(200).json({ success: true, message: 'Xóa shop thành công' });
    } catch (error: any) {
      logger.error('ShopController.deleteShop error:', error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Lỗi khi xóa shop' });
    }
  }

  async getShopById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const shop = await this.getShopByIdUseCase.execute(id);
      if (!shop) {
          res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Không tìm thấy shop' });
        return;
      }
      const dto = ShopMapper.toDTO(shop);
      res.status(200).json({ success: true, data: dto });
    } catch (error: any) {
      logger.error('ShopController.getShopById error:', error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Lỗi khi lấy shop' });
    }
  }

  // Admin: list pending shops
  async listPending(req: Request, res: Response): Promise<void> {
    try {
      if (!this.findPendingShopsUseCase) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Not implemented' });
        return;
      }
      const limit = parseInt(String(req.query.limit || '50'), 10);
      const offset = parseInt(String(req.query.offset || '0'), 10);
      const shops = await this.findPendingShopsUseCase.execute(limit, offset);
      const data = shops.map(s => ShopMapper.toDTO(s));
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error('ShopController.listPending error:', error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Lỗi khi lấy danh sách shop chờ duyệt' });
    }
  }

  // Admin: approve a pending shop
  async approveShop(req: Request, res: Response): Promise<void> {
    try {
      if (!this.approveShopUseCase) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Not implemented' });
        return;
      }
      const { id } = req.params;
      const reviewerId = req.user?.userId;
      if (!reviewerId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { reviewMessage } = req.body as any;
      const shop = await this.approveShopUseCase.execute(id, reviewerId, reviewMessage);
      if (!shop) {
          res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Không tìm thấy shop' });
        return;
      }
      res.status(200).json({ success: true, message: 'Duyệt shop thành công', data: ShopMapper.toDTO(shop) });
    } catch (error: any) {
      logger.error('ShopController.approveShop error:', error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Lỗi khi duyệt shop' });
    }
  }

  // Admin: reject a pending shop
  async rejectShop(req: Request, res: Response): Promise<void> {
    try {
      if (!this.rejectShopUseCase) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Not implemented' });
        return;
      }
      const { id } = req.params;
      const reviewerId = req.user?.userId;
      if (!reviewerId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { reviewMessage } = req.body as any;
      const shop = await this.rejectShopUseCase.execute(id, reviewerId, reviewMessage);
      if (!shop) {
          res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Không tìm thấy shop' });
        return;
      }
      res.status(200).json({ success: true, message: 'Từ chối shop thành công', data: ShopMapper.toDTO(shop) });
    } catch (error: any) {
      logger.error('ShopController.rejectShop error:', error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Lỗi khi từ chối shop' });
    }
  }
}
