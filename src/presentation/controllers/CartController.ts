import { Request, Response } from 'express';
import { GetCartUseCase } from '../../domain/usecases/cart/GetCart.usecase';
import { AddCartItemUseCase } from '../../domain/usecases/cart/AddCartItem.usecase';
import { UpdateCartItemUseCase } from '../../domain/usecases/cart/UpdateCartItem.usecase';
import { RemoveCartItemUseCase } from '../../domain/usecases/cart/RemoveCartItem.usecase';
import { ClearCartUseCase } from '../../domain/usecases/cart/ClearCart.usecase';
import { logger } from '../../shared/utils/logger';

export class CartController {
  constructor(
    private getCartUseCase: GetCartUseCase,
    private addCartItemUseCase: AddCartItemUseCase,
    private updateCartItemUseCase: UpdateCartItemUseCase,
    private removeCartItemUseCase: RemoveCartItemUseCase,
    private clearCartUseCase: ClearCartUseCase
  ) {}

  async getCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const cart = await this.getCartUseCase.execute(userId);
      res.status(200).json({ success: true, data: cart.toJSON() });
    } catch (error: any) {
      logger.error('CartController.getCart error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi lấy giỏ hàng' });
    }
  }

  async addItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const payload = req.body;
      const cart = await this.addCartItemUseCase.execute(userId, payload);
      res.status(200).json({ success: true, message: 'Thêm sản phẩm vào giỏ hàng thành công', data: cart.toJSON() });
    } catch (error: any) {
      logger.error('CartController.addItem error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi thêm sản phẩm vào giỏ hàng' });
    }
  }

  async updateItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { itemId } = req.params;
      const payload = req.body;
      const cart = await this.updateCartItemUseCase.execute(userId, itemId, payload);
      if (!cart) {
        res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại trong giỏ hàng' });
        return;
      }
      res.status(200).json({ success: true, message: 'Cập nhật sản phẩm thành công', data: cart.toJSON() });
    } catch (error: any) {
      logger.error('CartController.updateItem error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi cập nhật sản phẩm trong giỏ hàng' });
    }
  }

  async removeItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { itemId } = req.params;
      const cart = await this.removeCartItemUseCase.execute(userId, itemId);
      if (!cart) {
        res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại trong giỏ hàng' });
        return;
      }
      res.status(200).json({ success: true, message: 'Xóa sản phẩm thành công', data: cart.toJSON() });
    } catch (error: any) {
      logger.error('CartController.removeItem error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa sản phẩm khỏi giỏ hàng' });
    }
  }

  async clearCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      await this.clearCartUseCase.execute(userId);
      res.status(200).json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng' });
    } catch (error: any) {
      logger.error('CartController.clearCart error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa giỏ hàng' });
    }
  }
}
