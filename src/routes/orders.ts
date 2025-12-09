import { Router } from 'express';
import { Order } from '../models/Order';

export const orderRoutes = Router();

// GET /api/orders - lấy tất cả đơn hàng (admin)
orderRoutes.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find()
        .populate("userId", "userName email")
        .populate("managerId", "userName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments()
    ]);

    // Đảm bảo mỗi order có trường id
    const ordersWithId = orders.map(order => {
      return {
        ...order,
        id: order._id ? order._id.toString() : undefined
      };
    });

    res.status(200).json({
      message: 'Lấy danh sách tất cả đơn hàng thành công',
      data: {
        orders: ordersWithId,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách đơn hàng',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

orderRoutes.get('/quote-shipping', (req, res) => {
  const cartId = req.query.cartId || 'demo';
  const items = req.query.items ? parseInt(req.query.items as string) : 1;
  const destination = req.query.destination || 'campus';
  let baseFee = 15000;
  let speedMultiplier = 1;
  const speed = req.query.speed as string;
  switch (speed) {
    case 'express':
      speedMultiplier = 2;
      break;
    case 'fast': 
      speedMultiplier = 1.5;
      break;
    case 'standard':
    default:
      speedMultiplier = 1;
      break;
  }
  if (destination === 'campus') {
    baseFee *= 0.8; 
  }
  const totalFee = Math.round(baseFee * speedMultiplier);
  res.json({
    success: true,
    data: {
      cartId,
      shippingOptions: [
        {
          type: 'standard',
          name: 'Giao hàng tiêu chuẩn',
          fee: Math.round(baseFee),
          estimatedTime: '1-2 ngày',
          description: 'Giao hàng trong giờ hành chính'
        },
        {
          type: 'fast', 
          name: 'Giao hàng nhanh',
          fee: Math.round(baseFee * 1.5),
          estimatedTime: '4-8 giờ',
          description: 'Giao hàng trong ngày'
        },
        {
          type: 'express',
          name: 'Giao hàng hỏa tốc', 
          fee: Math.round(baseFee * 2),
          estimatedTime: '2-4 giờ',
          description: 'Giao hàng khẩn cấp'
        }
      ],
      selectedOption: {
        type: speed || 'standard',
        fee: totalFee,
        freeShippingThreshold: 200000,
        campusDiscount: destination === 'campus' ? '20%' : null
      }
    }
  });
});

// POST /api/orders
orderRoutes.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Tính năng đặt hàng sẽ được triển khai sau khi hoàn thành auth và cart modules'
  });
});

// GET /api/orders/:id/tracking
orderRoutes.get('/:id/tracking', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      orderId: id,
      status: 'preparing',
      timeline: [
        { stage: 'confirmed', time: '2025-09-26T10:00:00Z', completed: true },
        { stage: 'preparing', time: '2025-09-26T10:30:00Z', completed: true },
        { stage: 'shipping', time: null, completed: false },
        { stage: 'delivered', time: null, completed: false }
      ],
      estimatedDelivery: '2025-09-27T16:00:00Z'
    }
  });
});

// PATCH /api/orders/:id/status - cập nhật trạng thái đơn hàng
orderRoutes.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  if (!id || id === 'undefined') {
    return res.status(400).json({ message: 'Thiếu hoặc sai orderId' });
  }
  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    // Kiểm tra trạng thái hợp lệ
    type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled' | 'refunded';
    const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Trạng thái không hợp lệ: ${status}` });
    }
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['shipping', 'cancelled'],
      shipping: ['delivered', 'refunded'],
      delivered: [],
      cancelled: [],
      refunded: []
    };
    const currentStatus = order.status as OrderStatus;
    const nextStatus = status as OrderStatus;
    if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
      return res.status(400).json({ message: `Không thể chuyển trạng thái từ ${order.status} sang ${status}` });
    }
    // Lưu trạng thái cũ vào history
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: 'manager', // hoặc lấy từ auth
      note: note || ''
    });
    order.status = status;
    await order.save();
    return res.json({ success: true, message: 'Cập nhật trạng thái thành công', data: order });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});