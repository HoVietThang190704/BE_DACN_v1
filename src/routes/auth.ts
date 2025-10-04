import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { config } from '../config';
import { logger } from '../shared/utils/logger';

export const authRoutes = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           example: "password123"
 *         userName:
 *           type: string
 *           example: "Nguyễn Văn A"
 *         phone:
 *           type: string
 *           example: "0901234567"
 *         date_of_birth:
 *           type: string
 *           format: date
 *           example: "1990-01-01"
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           example: "password123"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         user:
 *           type: object
 *         token:
 *           type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Email đã tồn tại
 */
authRoutes.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, userName, phone, date_of_birth } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và password là bắt buộc'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      userName,
      phone,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
      role: 'customer', // Mặc định là customer
      isVerified: false // Mặc định chưa xác thực
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        phone: user.phone,
        role: user.role
      },
      token
    });

  } catch (error: any) {
    logger.error('Register error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: Object.values(error.errors).map((err: any) => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau'
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Thiếu thông tin đăng nhập
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 */
authRoutes.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và password là bắt buộc'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Check if user is verified (skip in development mode)
    if (!user.isVerified && config.NODE_ENV === 'production') {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực.'
      });
    }

    // In development mode, show warning but allow login
    if (!user.isVerified && config.NODE_ENV === 'development') {
      logger.warn(`⚠️ Login without verification in development: ${user.email}`);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      },
      token
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau'
    });
  }
});

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Xác thực email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               token:
 *                 type: string
 *                 example: "verification-token-here"
 *     responses:
 *       200:
 *         description: Xác thực thành công
 *       400:
 *         description: Token không hợp lệ
 *       404:
 *         description: Không tìm thấy user
 */
authRoutes.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: 'Email và token là bắt buộc'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    if (user.isVerified) {
      return res.json({
        success: true,
        message: 'Tài khoản đã được xác thực trước đó'
      });
    }

    // In a real app, you would verify the token here
    // For now, we'll accept any non-empty token
    if (token && token.length > 0) {
      user.isVerified = true;
      await user.save();

      logger.info(`✅ User verified: ${user.email}`);

      return res.json({
        success: true,
        message: 'Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Token xác thực không hợp lệ'
      });
    }
  } catch (error) {
    logger.error('❌ Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực email'
    });
  }
});

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Gửi lại email xác thực
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Email xác thực đã được gửi lại
 *       404:
 *         description: Không tìm thấy user
 *       400:
 *         description: Tài khoản đã được xác thực
 */
authRoutes.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản đã được xác thực'
      });
    }

    // In a real app, you would send verification email here
    logger.info(`📧 Resent verification email to: ${user.email}`);

    res.json({
      success: true,
      message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.',
      data: {
        email: user.email,
        // For development, provide a simple token
        verification_token: 'dev-token-' + Date.now()
      }
    });
  } catch (error) {
    logger.error('❌ Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi lại email xác thực'
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
authRoutes.post('/logout', (req: Request, res: Response) => {
  // In a real-world app, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Lấy thông tin profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin profile
 *       401:
 *         description: Không có quyền truy cập
 */
authRoutes.get('/profile', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Endpoint sẽ được bảo vệ bằng JWT middleware sau'
  });
});