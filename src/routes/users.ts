import { Router } from 'express';

export const userRoutes = Router();

// GET /api/users/profile
userRoutes.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Tính năng profile sẽ được triển khai sau khi hoàn thành auth module'
  });
});

// PUT /api/users/profile
userRoutes.put('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Tính năng cập nhật profile sẽ được triển khai sau khi hoàn thành auth module'
  });
});

// GET /api/users/addresses
userRoutes.get('/addresses', (req, res) => {
  res.json({
    success: true,
    message: 'Quản lý địa chỉ giao hàng sẽ được triển khai trong Sprint tiếp theo'
  });
});