import { Router } from 'express';
import { fetch } from 'undici';
export const router = Router();

router.get('/checkout-summary', async (req, res, next) => {
  try {
    const token = req.headers.authorization ?? '';
    const cartId = String(req.query.cartId || 'demo');
    const [cart, promo, ship] = await Promise.all([
      Promise.resolve({ subtotal: 100000 }),  // mock tạm cho chạy
      Promise.resolve({ discount: 15000 }),
      fetch(`${process.env.ORDER_URL}/quote-shipping?cartId=${cartId}`, 
        { headers: { authorization: token }
      }).then(r=>r.json())
    ]);
    const shippingData = ship as { fee: number };
    res.json({ 
      cart, 
      promo, 
      ship: shippingData, 
      total: cart.subtotal - promo.discount + shippingData.fee 
    });
  } catch (e) { next(e); }
});
