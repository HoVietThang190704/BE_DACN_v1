import { Request, Response } from 'express';
import { GetUserOrdersUseCase } from '../../domain/usecases/order/GetUserOrders.usecase';
import { GetOrderByIdUseCase } from '../../domain/usecases/order/GetOrderById.usecase';
import { CancelOrderUseCase } from '../../domain/usecases/order/CancelOrder.usecase';
import { GetOrderStatisticsUseCase } from '../../domain/usecases/order/GetOrderStatistics.usecase';
import { UpdatePaymentStatusUseCase } from '../../domain/usecases/order/UpdatePaymentStatusUseCase';
import { CreateOrderUseCase } from '../../domain/usecases/order/CreateOrder.usecase';
import { GetManagedOrdersUseCase } from '../../domain/usecases/order/GetManagedOrders.usecase';
import { GetManagedOrderByIdUseCase } from '../../domain/usecases/order/GetManagedOrderById.usecase';
import { UpdateOrderStatusUseCase } from '../../domain/usecases/order/UpdateOrderStatus.usecase';
import { ConfirmOrderDeliveredUseCase } from '../../domain/usecases/order/ConfirmOrderDelivered.usecase';
import { GetUsersByIdsUseCase } from '../../domain/usecases/user/GetUsersByIds.usecase';
import { OrderMapper } from '../dto/order/Order.dto';
import { ManagedOrderDTO, ManagedOrderMapper } from '../dto/order/ShopOrder.dto';
import { OrderFilters, OrderPagination } from '../../domain/repositories/IOrderRepository';
import { logger } from '../../shared/utils/logger';
import { voucherService } from '../../services/voucher/VoucherService';
import { OrderStatus, PaymentMethod, OrderEntity } from '../../domain/entities/Order.entity';

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
    private updatePaymentStatusUseCase: UpdatePaymentStatusUseCase,
    private getManagedOrdersUseCase: GetManagedOrdersUseCase,
    private getManagedOrderByIdUseCase: GetManagedOrderByIdUseCase,
    private updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private confirmOrderDeliveredUseCase: ConfirmOrderDeliveredUseCase,
    private getUsersByIdsUseCase: GetUsersByIdsUseCase
  ) {}

  private resolveManagerId(
    userId: string,
    role: string | undefined,
    explicitManagerId?: string
  ): string {
    if (role === 'admin') {
      if (explicitManagerId) {
        return explicitManagerId;
      }
      throw new Error('MANAGER_ID_REQUIRED_FOR_ADMIN');
    }

    return userId;
  }

  private async mapManagedOrdersWithCustomers(orders: OrderEntity[]): Promise<ManagedOrderDTO[]> {
    if (orders.length === 0) {
      return [];
    }

    const userIds = Array.from(new Set(orders.map(order => order.userId)));
    const customers = userIds.length > 0
      ? await this.getUsersByIdsUseCase.execute(userIds)
      : [];

    const customerMap = new Map(customers.map(customer => [customer.id, customer] as const));

    return orders.map(order => ManagedOrderMapper.toDTO(order, customerMap.get(order.userId)));
  }

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
   * GET /api/users/me/manage/orders
   * Get orders managed by the authenticated seller (or admin when specifying managerId)
   */
  getManagedOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
        return;
      }

      if (role !== 'shop_owner' && role !== 'admin') {
        res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
        return;
      }

      const queryManagerId = typeof req.query.managerId === 'string' ? req.query.managerId : undefined;

      let managerId: string;
      try {
        managerId = this.resolveManagerId(userId, role, queryManagerId);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'MANAGER_ID_REQUIRED_FOR_ADMIN') {
            res.status(400).json({ message: 'Vui lòng cung cấp managerId khi quản trị viên truy cập' });
            return;
          }
        }
        throw error;
      }

      const filters: OrderFilters = {};
      if (req.query.status) filters.status = req.query.status as OrderStatus;
      if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus as string;
      if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate as string);
      if (req.query.toDate) filters.toDate = new Date(req.query.toDate as string);
      if (req.query.search) filters.search = req.query.search as string;
      if (req.query.orderNumber) filters.orderNumber = req.query.orderNumber as string;

      const pagination: OrderPagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      const result = await this.getManagedOrdersUseCase.execute(managerId, filters, pagination);
      const orders = await this.mapManagedOrdersWithCustomers(result.orders);

      res.status(200).json({
        message: 'Lấy danh sách đơn hàng thành công',
        data: {
          orders,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
          }
        }
      });
    } catch (error) {
      logger.error('Get managed orders error:', error);
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
        productId,
        quantity,
        livestreamId,
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

      const paymentMethodList: PaymentMethod[] = ['cod', 'vnpay'];
      if (paymentMethod && !paymentMethodList.includes(paymentMethod)) {
        res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
        return;
      }

      const executeParams: any = {
        userId,
        cartItemIds: Array.isArray(cartItemIds) ? cartItemIds : undefined,
        paymentMethod,
        note,
        voucherCode,
        shippingAddressId,
        shippingAddress,
        saveShippingAddress,
      };

      if (productId) {
        executeParams.productId = productId;
        executeParams.quantity = typeof quantity === 'number' ? quantity : Number(quantity || 1);
      }

      if (livestreamId) {
        executeParams.livestreamId = livestreamId;
      }

      let order = await this.createOrderUseCase.execute(executeParams);
      if (voucherCode) {
        try {
          const orderTotalForVoucher = order.subtotal + order.shippingFee;
          const result = await voucherService.redeem(userId, voucherCode, { orderId: order.id, cartTotal: orderTotalForVoucher });
          if (result && typeof result.discount === 'number' && result.discount > 0) {
            try {
              await this.createOrderUseCase['orderRepository'].updateTotals(order.id, result.discount, result.newTotal);
              try {
                const refreshed = await this.createOrderUseCase['orderRepository'].findById(order.id);
                if (refreshed) order = refreshed;
              } catch (e) {
              }
            } catch (updErr) {
              logger.warn('Failed to update order totals after voucher redemption', updErr);
            }
          }
        } catch (e) {
          logger.warn('Failed to redeem voucher after order creation', e);
        }
      }

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
   * GET /api/users/me/manage/orders/:id
   * Get managed order detail
   */
  getManagedOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
        return;
      }

      if (role !== 'shop_owner' && role !== 'admin') {
        res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
        return;
      }

      const { id } = req.params;
      const queryManagerId = typeof req.query.managerId === 'string' ? req.query.managerId : undefined;

      let managerId: string;
      try {
        managerId = this.resolveManagerId(userId, role, queryManagerId);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'MANAGER_ID_REQUIRED_FOR_ADMIN') {
            res.status(400).json({ message: 'Vui lòng cung cấp managerId khi quản trị viên truy cập' });
            return;
          }
        }
        throw error;
      }

      const order = await this.getManagedOrderByIdUseCase.execute(id, managerId);
      const [dto] = await this.mapManagedOrdersWithCustomers([order]);

      res.status(200).json({
        message: 'Lấy thông tin đơn hàng thành công',
        data: dto
      });
    } catch (error) {
      logger.error('Get managed order by ID error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Không tìm thấy')) {
          res.status(404).json({ message: error.message });
          return;
        }
        if (error.message.includes('không có quyền')) {
          res.status(403).json({ message: error.message });
          return;
        }
      }

      res.status(500).json({
        message: 'Lỗi khi lấy thông tin đơn hàng',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * PATCH /api/users/me/manage/orders/:id/status
   * Update order status for managed order
   */
  updateManagedOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
        return;
      }

      if (role !== 'shop_owner' && role !== 'admin') {
        res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
        return;
      }

      const { id } = req.params;
      const queryManagerId = typeof req.query.managerId === 'string' ? req.query.managerId : undefined;

      let managerId: string;
      try {
        managerId = this.resolveManagerId(userId, role, queryManagerId);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'MANAGER_ID_REQUIRED_FOR_ADMIN') {
            res.status(400).json({ message: 'Vui lòng cung cấp managerId khi quản trị viên truy cập' });
            return;
          }
        }
        throw error;
      }

      const payload = req.body ?? {};
      const statusValue = payload.status as OrderStatus | undefined;
      const trackingNumber = payload.trackingNumber as string | undefined;
      const estimatedDelivery = payload.estimatedDelivery as string | Date | undefined;
      const note = payload.note as string | undefined;

      if (!statusValue) {
        res.status(400).json({ message: 'Vui lòng cung cấp trạng thái mới' });
        return;
      }

      const allowedStatuses: OrderStatus[] = [
        'pending',
        'confirmed',
        'preparing',
        'shipping',
        'delivered',
        'cancelled',
        'refunded'
      ];

      if (!allowedStatuses.includes(statusValue)) {
        res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        return;
      }

      const updatedOrder = await this.updateOrderStatusUseCase.execute({
        orderId: id,
        managerId,
        status: statusValue,
        trackingNumber,
        estimatedDelivery,
        note
      });

      const [dto] = await this.mapManagedOrdersWithCustomers([updatedOrder]);

      res.status(200).json({
        message: 'Cập nhật trạng thái đơn hàng thành công',
        data: dto
      });
    } catch (error) {
      logger.error('Update managed order status error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Không tìm thấy')) {
          res.status(404).json({ message: error.message });
          return;
        }
        if (error.message.includes('không có quyền')) {
          res.status(403).json({ message: error.message });
          return;
        }
        if (error.message.includes('Không thể chuyển trạng thái')) {
          res.status(400).json({ message: error.message });
          return;
        }
      }

      res.status(500).json({
        message: 'Lỗi khi cập nhật trạng thái đơn hàng',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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

  /**
   * POST /api/users/me/orders/:id/confirm-delivered
   * Allow user to confirm delivery
   */
  confirmOrderDelivered = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
        return;
      }

      const { id } = req.params;
      const note = typeof req.body?.note === 'string' ? req.body.note : undefined;

      const order = await this.confirmOrderDeliveredUseCase.execute(id, userId, note);

      res.status(200).json({
        message: 'Xác nhận đã nhận hàng thành công',
        data: OrderMapper.toDTO(order)
      });
    } catch (error) {
      logger.error('Confirm order delivered error:', error);

      if (error instanceof Error) {
        if (error.message.includes('Không tìm thấy')) {
          res.status(404).json({ message: error.message });
          return;
        }

        if (error.message.includes('không có quyền') || error.message.includes('Chỉ có thể xác nhận')) {
          res.status(400).json({ message: error.message });
          return;
        }
      }

      res.status(500).json({
        message: 'Lỗi khi xác nhận giao hàng',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
