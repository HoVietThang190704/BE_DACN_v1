import { Router } from 'express';

export const authRoutes = Router();

// POST /api/auth/register
authRoutes.post('/register', (req, res) => {
  res.json({
    success: true,
    message: 'Tính năng đăng ký sẽ được triển khai trong Sprint tiếp theo',
    todo: [
      'JWT token generation',
      'Email/SMS OTP verification',
      'Password hashing with bcrypt',
      'Student verification system'
    ]
  });
});

// POST /api/auth/login
authRoutes.post('/login', (req, res) => {
  res.json({
    success: true,
    message: 'Tính năng đăng nhập sẽ được triển khai trong Sprint tiếp theo'
  });
});

// POST /api/auth/logout
authRoutes.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});