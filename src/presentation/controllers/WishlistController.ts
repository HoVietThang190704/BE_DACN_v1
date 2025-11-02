import { Request, Response } from 'express';
import { GetWishlistUseCase } from '../../domain/usecases/wishlist/GetWishlist.usecase';
import { AddWishlistItemUseCase } from '../../domain/usecases/wishlist/AddWishlistItem.usecase';
import { RemoveWishlistItemUseCase } from '../../domain/usecases/wishlist/RemoveWishlistItem.usecase';
import { ToggleWishlistItemUseCase } from '../../domain/usecases/wishlist/ToggleWishlistItem.usecase';
import { logger } from '../../shared/utils/logger';

export class WishlistController {
  constructor(
    private getWishlistUseCase: GetWishlistUseCase,
    private addWishlistItemUseCase: AddWishlistItemUseCase,
    private removeWishlistItemUseCase: RemoveWishlistItemUseCase,
    private toggleWishlistItemUseCase: ToggleWishlistItemUseCase
  ) {}

  async getWishlist(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const w = await this.getWishlistUseCase.execute(userId);
      res.status(200).json({ success: true, data: w.toJSON() });
    } catch (error: any) {
      logger.error('WishlistController.getWishlist error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi lấy danh sách yêu thích' });
    }
  }

  async addItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { productId, note } = req.body;
      const w = await this.addWishlistItemUseCase.execute(userId, productId, note);
      res.status(200).json({ success: true, message: 'Thêm vào yêu thích thành công', data: w.toJSON() });
    } catch (error: any) {
      logger.error('WishlistController.addItem error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi thêm vào yêu thích' });
    }
  }

  async removeItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { productId } = req.params;
      const w = await this.removeWishlistItemUseCase.execute(userId, productId);
      if (!w) {
        res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại trong danh sách yêu thích' });
        return;
      }
      res.status(200).json({ success: true, message: 'Xóa khỏi yêu thích thành công', data: w.toJSON() });
    } catch (error: any) {
      logger.error('WishlistController.removeItem error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa khỏi yêu thích' });
    }
  }

  async toggleItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { productId } = req.params;
      const w = await this.toggleWishlistItemUseCase.execute(userId, productId);
      res.status(200).json({ success: true, message: 'Toggled wishlist', data: w.toJSON() });
    } catch (error: any) {
      logger.error('WishlistController.toggleItem error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi toggle wishlist' });
    }
  }
}
