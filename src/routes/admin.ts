import { Router } from 'express';
import { Order } from '../models/Order';
import { User } from '../models/users/User';
import { Shop } from '../models/Shop';

export const adminRoutes = Router();

// GET /api/admin/stats - Dashboard tổng hợp cho admin
adminRoutes.get('/stats', async (req, res) => {
  try {
    // Tổng doanh thu
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Tổng subscriptions (ví dụ: tổng số shop)
    const subscriptions = await Shop.countDocuments();

    // Tổng sales (số đơn hàng hoàn thành)
    const sales = await Order.countDocuments({ status: 'confirmed' });

    // Số người dùng đang active (ví dụ: đăng nhập trong 24h qua)
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const activeNow = await User.countDocuments({ lastLogin: { $gte: since } });

    // Dữ liệu overview (doanh thu từng tháng)
    const monthlyRevenue = await Order.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        total: { $sum: '$total' }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const overview = monthlyRevenue.map(item => ({
      name: `${item._id.month}/${item._id.year}`,
      total: item.total
    }));

    // Recent sales (5 đơn hàng gần nhất)
    const recentOrders = await Order.find({ status: 'confirmed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'userName email')
      .lean();
    const recentSales = recentOrders.map(order => {
      let name = 'Unknown';
      let email = '';
      if (order.userId && typeof order.userId === 'object' && 'userName' in order.userId && 'email' in order.userId) {
        name = (order.userId as any).userName || 'Unknown';
        email = (order.userId as any).email || '';
      }
      return {
        name,
        email,
        avatar: '/avatars/default.png',
        amount: `+$${order.total}`
      };
    });

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      subscriptions,
      sales,
      activeNow,
      overview,
      recentSales,
      recentSalesCount: recentSales.length,
      revenueChange: '+20.1% from last month',
      subscriptionsChange: '+180.1% from last month',
      salesChange: '+19% from last month',
      activeNowChange: '+201 since last hour'
    });
  } catch (err) {
    let message = 'Unknown error';
    if (err instanceof Error) message = err.message;
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: message });
  }
});
