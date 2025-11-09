import { Request, Response } from 'express';
import { GetUserOrdersUseCase } from '../../domain/usecases/order/GetUserOrders.usecase';
import { GetOrderByIdUseCase } from '../../domain/usecases/order/GetOrderById.usecase';
import { CancelOrderUseCase } from '../../domain/usecases/order/CancelOrder.usecase';
import { GetOrderStatisticsUseCase } from '../../domain/usecases/order/GetOrderStatistics.usecase';
import { UpdatePaymentStatusUseCase } from '../../domain/usecases/order/UpdatePaymentStatusUseCase';
import { OrderMapper } from '../dto/order/Order.dto';
import { OrderFilters, OrderPagination } from '../../domain/repositories/IOrderRepository';
import { logger } from '../../shared/utils/logger';
import { PaymentMethod } from '../../domain/entities/Order.entity';

/**
 * Order Controller - Handle order-related HTTP requests
 */
export class OrderController {
  constructor(
    private getUserOrdersUseCase: GetUserOrdersUseCase,
    private getOrderByIdUseCase: GetOrderByIdUseCase,
    private cancelOrderUseCase: CancelOrderUseCase,
    private getOrderStatisticsUseCase: GetOrderStatisticsUseCase,
    private createOrderUseCase: CreateOrderUseCase,
    private updatePaymentStatusUseCase: UpdatePaymentStatusUseCase
  ) {}

  /**
   * GET /api/users/me/orders
   * Get user orders with filters and pagination
   */
  getUserOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
        return;
      }

      // Parse filters
      const filters: OrderFilters = {};
      if (req.query.status) filters.status = req.query.status as any;
      if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus as any;
      if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate as string);
      if (req.query.toDate) filters.toDate = new Date(req.query.toDate as string);

      // Parse pagination
      const pagination: OrderPagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      const result = await this.getUserOrdersUseCase.execute(userId, filters, pagination);

      res.status(200).json({
        message: 'Lấy danh sách đơn hàng thành công',
        data: {
          orders: OrderMapper.toArrayDTO(result.orders),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
          }
        }
      });
    } catch (error) {
      logger.error('Get user orders error:', error);
      res.status(500).json({ 
        message: 'Lỗi khi lấy danh sách đơn hàng',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * POST /api/users/me/orders
   * Create new order
   */
  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
        return;
      }

      const {
        cartItemIds,
        paymentMethod,
        note,
        voucherCode,
        shippingAddressId,
        shippingAddress,
        saveShippingAddress,
      } = req.body ?? {};

      if (!shippingAddressId && !shippingAddress) {
        res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ giao hàng' });
        return;
      }

      if (shippingAddress) {
        const requiredFields = ['recipientName', 'phone', 'address', 'ward', 'district', 'province'];
        const missing = requiredFields.filter((field) => !shippingAddress[field]);
        if (missing.length > 0) {
          res.status(400).json({ message: `Thiếu thông tin địa chỉ: ${missing.join(', ')}` });
          return;
        }
      }

      const paymentMethodList: PaymentMethod[] = ['cod', 'momo', 'zalopay', 'vnpay', 'card'];
      if (paymentMethod && !paymentMethodList.includes(paymentMethod)) {
        res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
        return;
      }

      const order = await this.createOrderUseCase.execute({
        userId,
        cartItemIds: Array.isArray(cartItemIds) ? cartItemIds : undefined,
        paymentMethod,
        note,
        voucherCode,
        shippingAddressId,
        shippingAddress,
        saveShippingAddress,
      });

      res.status(201).json({
        message: 'Tạo đơn hàng thành công',
        data: OrderMapper.toDTO(order),
      });
    } catch (error) {
      logger.error('Create order error:', error);

      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: 'Lỗi khi tạo đơn hàng' });
    }
  };

  /**
   * GET /api/users/me/orders/:id
   * Get order by ID (with ownership check)
   */
  getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
        return;
      }

      const { id } = req.params;

      const order = await this.getOrderByIdUseCase.execute(id, userId);
      
      res.status(200).json({
        message: 'Lấy thông tin đơn hàng thành công',
        data: OrderMapper.toDTO(order)
      });
    } catch (error) {
      logger.error('Get order by ID error:', error);
      
      if (error instanceof Error && 
          (error.message.includes('Không tìm thấy') || 
           error.message.includes('không có quyền'))) {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(500).json({ 
        message: 'Lỗi khi lấy thông tin đơn hàng',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * POST /api/users/me/orders/:id/cancel
   * Cancel order
   */
  cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
        return;
      }

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length === 0) {
        res.status(400).json({ message: 'Vui lòng nhập lý do hủy đơn' });
        return;
      }

      const order = await this.cancelOrderUseCase.execute(id, userId, reason);
      
      res.status(200).json({
        message: 'Hủy đơn hàng thành công',
        data: OrderMapper.toDTO(order)
      });
    } catch (error) {
      logger.error('Cancel order error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Không tìm thấy') || 
            error.message.includes('không có quyền')) {
          res.status(404).json({ message: error.message });
          return;
        }
        if (error.message.includes('Không thể hủy')) {
          res.status(400).json({ message: error.message });
          return;
        }
      }

      res.status(500).json({ 
        message: 'Lỗi khi hủy đơn hàng',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/users/me/orders/statistics
   * Get order statistics
   */
  getOrderStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
        return;
      }

      const statistics = await this.getOrderStatisticsUseCase.execute(userId);
      
      res.status(200).json({
        message: 'Lấy thống kê đơn hàng thành công',
        data: statistics
      });
    } catch (error) {
      logger.error('Get order statistics error:', error);
      res.status(500).json({ 
        message: 'Lỗi khi lấy thống kê đơn hàng',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * PUT /api/users/me/orders/:id/payment-status
   * Update order payment status
   */
  updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
        return;
      }

      const orderId = req.params.id;
      const { paymentStatus } = req.body;

      if (!paymentStatus || !['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
        res.status(400).json({ message: 'Trạng thái thanh toán không hợp lệ' });
        return;
      }

      // For demo purposes, we'll just update the payment status
      // In a real implementation, this would integrate with payment gateway
      const updatedOrder = await this.updatePaymentStatusUseCase.execute({
        orderId,
        paymentStatus
      });

      res.status(200).json({
        message: 'Cập nhật trạng thái thanh toán thành công',
        data: OrderMapper.toDTO(updatedOrder)
      });
    } catch (error) {
      logger.error('Update payment status error:', error);
      res.status(500).json({ 
        message: 'Lỗi khi cập nhật trạng thái thanh toán',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
