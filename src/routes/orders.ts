import { Router } from 'express';

export const orderRoutes = Router();

// GET /api/orders/quote-shipping
orderRoutes.get('/quote-shipping', (req, res) => {
  const cartId = req.query.cartId || 'demo';
  const items = req.query.items ? parseInt(req.query.items as string) : 1;
  const destination = req.query.destination || 'campus';
  
  // Basic shipping calculation
  let baseFee = 15000;
  let speedMultiplier = 1;
  
  // Delivery speed options
  const speed = req.query.speed as string;
  switch (speed) {
    case 'express': // Giao hỏa tốc (2-4h)
      speedMultiplier = 2;
      break;
    case 'fast': // Giao nhanh (4-8h)  
      speedMultiplier = 1.5;
      break;
    case 'standard': // Giao tiêu chuẩn (1-2 ngày)
    default:
      speedMultiplier = 1;
      break;
  }
  
  // Campus delivery discount
  if (destination === 'campus') {
    baseFee *= 0.8; // 20% discount for campus delivery
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