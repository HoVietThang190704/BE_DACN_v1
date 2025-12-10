import { Router, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/users/User';
import { config } from '../config';
import { logger } from '../shared/utils/logger';
import { userController } from '../di/container';
import { HttpStatus } from '../shared/constants/httpStatus';
import { authenticate } from '../shared/middleware/auth';
import AuthGoogleController from '../presentation/controllers/AuthGoogleController';
import AuthFacebookController from '../presentation/controllers/AuthFacebookController';
import { OTPService } from '../services/OTPService';
import { initFirebaseAdmin, firebaseAdmin, firebaseInitialized } from '../lib/firebaseAdmin';

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
 *         address:
 *           type: object
 *           properties:
 *             province:
 *               type: string
 *               example: "Hà Nội"
 *             district:
 *               type: string
 *               example: "Ba Đình"
 *             commune:
 *               type: string
 *               example: "Phúc Xá"
 *             street:
 *               type: string
 *               example: "Đường ABC"
 *             detail:
 *               type: string
 *               example: "Số nhà 123"
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đăng ký thành công"
 *                 user:
 *                   type: object
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Email đã tồn tại
 */
authRoutes.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
  const { email, password, userName, phone, date_of_birth, address, otp } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Email và password là bắt buộc'
      });
    }

    if (!otp || String(otp).trim().length === 0) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Mã OTP là bắt buộc'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(HttpStatus.CONFLICT).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    const sanitizedOtp = String(otp).trim();
    if (sanitizedOtp.length !== 6) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Mã OTP không hợp lệ'
      });
    }

    const otpValid = await OTPService.verifyEmailOTP(email, sanitizedOtp);
    if (!otpValid) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Mã OTP không chính xác hoặc đã hết hạn'
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      userName,
      phone,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
      address: address || undefined,
      role: 'customer', // Mặc định là customer
      isVerified: true // Đã xác thực thông qua email OTP
    });

    await user.save();

    // Generate JWT tokens
    const payload = { userId: user._id, email: user.email, role: user.role };
  const secret = config.JWT_SECRET as string;
  // cast to library types to satisfy TypeScript overloads
  const accessToken = jwt.sign(payload, secret as jwt.Secret, { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }); // Use config value
  const refreshToken = jwt.sign(payload, secret as jwt.Secret, { expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }); // Use config value

    logger.info(`New user registered: ${email}`);

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Đăng ký thành công',
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        phone: user.phone,
        role: user.role,
        address: user.address
      },
      accessToken,
      refreshToken
    });

  } catch (error: any) {
    logger.error('Register error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: Object.values(error.errors).map((err: any) => err.message)
      });
    }

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đăng nhập thành công"
 *                 user:
 *                   type: object
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Thiếu thông tin đăng nhập
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 */
authRoutes.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Email và password là bắt buộc'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Check if user is verified (skip in development mode)
    if (!user.isVerified && config.NODE_ENV === 'production') {
      return res.status(HttpStatus.UNAUTHORIZED).json({
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
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Generate JWT tokens
    const payload = { userId: user._id, email: user.email, role: user.role };
  const secret = config.JWT_SECRET as string;
  // cast to library types to satisfy TypeScript overloads
  const accessToken = jwt.sign(payload, secret as jwt.Secret, { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }); // Use config value
  const refreshToken = jwt.sign(payload, secret as jwt.Secret, { expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }); // Use config value

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        phone: user.phone,
        address: user.address,
        facebookId: (user as any).facebookId || (user as any).facebookID,
        googleId: (user as any).googleId,
        role: user.role,
        isVerified: user.isVerified
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau'
    });
  }
});

/**
 * @swagger
 * /api/auth/google/token:
 *   post:
 *     summary: Đăng nhập bằng Google (accept id_token từ frontend)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_token
 *             properties:
 *               id_token:
 *                 type: string
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
authRoutes.post('/google/token', async (req: Request, res: Response) => {
  return AuthGoogleController.token(req, res);
});

/**
 * @swagger
 * /api/auth/facebook/token:
 *   post:
 *     summary: Đăng nhập bằng Facebook (accept access_token từ frontend)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - access_token
 *             properties:
 *               access_token:
 *                 type: string
 *                 example: "EAABwzLixnjYBO..."
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Facebook login successful"
 *                 user:
 *                   type: object
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Thiếu access_token
 *       401:
 *         description: Token không hợp lệ
 *       500:
 *         description: Lỗi server
 */
authRoutes.post('/facebook/token', async (req: Request, res: Response) => {
  return AuthFacebookController.token(req, res);
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
 *       properties:
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
authRoutes.post('/verify-email', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Email và token là bắt buộc'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).json({
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
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Token xác thực không hợp lệ'
      });
    }
  } catch (error) {
    logger.error('❌ Email verification error:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
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
authRoutes.post('/resend-verification', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này'
      });
    }

    if (user.isVerified) {
      return res.status(HttpStatus.BAD_REQUEST).json({
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
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Lỗi server khi gửi lại email xác thực'
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token refreshed successfully"
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid refresh token
 *       500:
 *         description: Server error
 */
authRoutes.post('/refresh', async (req: Request, res: Response): Promise<any> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token là bắt buộc'
      });
    }

    // Verify refresh token
    const secret = config.JWT_SECRET as string;
    const decoded = jwt.verify(refreshToken, secret) as { userId: string; email: string; role: string };

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ'
      });
    }

    // Generate new access token
    const payload = { userId: user._id, email: user.email, role: user.role };
  // cast to library types to satisfy TypeScript overloads
  const accessToken = jwt.sign(payload, secret as jwt.Secret, { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

    logger.info(`Token refreshed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken
    });

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn'
      });
    }

    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi refresh token'
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
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu (Xác nhận token)
 *     tags: [Auth]
 *     description: Đặt lại mật khẩu mới bằng reset token nhận được qua email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset password token
 *                 example: "abc123xyz789"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Mật khẩu mới
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới."
 *       400:
 *         description: Token không hợp lệ hoặc mật khẩu không đúng định dạng
 *       500:
 *         description: Lỗi server
 */
authRoutes.post('/reset-password', async (req: Request, res: Response) => {
  await userController.resetPassword(req, res);
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Đổi mật khẩu (Đã đăng nhập)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Đổi mật khẩu cho người dùng đã đăng nhập (yêu cầu xác thực mật khẩu cũ)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: Mật khẩu hiện tại
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Mật khẩu mới (phải khác mật khẩu cũ)
 *                 example: "newpassword456"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đổi mật khẩu thành công"
 *       400:
 *         description: Mật khẩu cũ không đúng hoặc mật khẩu mới không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Người dùng không tồn tại
 *       500:
 *         description: Lỗi server
 */
authRoutes.post('/change-password', authenticate, async (req: Request, res: Response) => {
  await userController.changePassword(req, res);
});

/**
 * @swagger
 * /api/auth/email/send-otp:
 *   post:
 *     summary: Gửi mã OTP xác thực email đăng ký
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
 *         description: OTP đã được gửi tới email
 *       400:
 *         description: Email không hợp lệ
 *       409:
 *         description: Email đã tồn tại
 *       500:
 *         description: Lỗi server
 */
authRoutes.post('/email/send-otp', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    const { otp, expiresAt } = await OTPService.createEmailOTP(normalizedEmail);
    const sent = await OTPService.sendEmailOTP(normalizedEmail, otp);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi OTP. Vui lòng thử lại sau.'
      });
    }

    const responseBody: Record<string, unknown> = {
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn',
      expiresAt
    };

    if (config.NODE_ENV === 'development') {
      responseBody.devOtp = otp;
    }

    return res.json(responseBody);
  } catch (error) {
    logger.error('Send email OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi OTP email'
    });
  }
});

/**
 * @swagger
 * /api/auth/password/forgot:
 *   post:
 *     summary: Gửi OTP đặt lại mật khẩu qua email
 *     tags: [Authentication]
 *     description: Người dùng nhập email, hệ thống sẽ gửi mã OTP để xác thực yêu cầu quên mật khẩu.
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
 *                 example: "customer@example.com"
 *     responses:
 *       200:
 *         description: Nếu email hợp lệ, OTP đã được gửi
 *       400:
 *         description: Email không hợp lệ
 *       500:
 *         description: Lỗi server khi gửi OTP
 */
authRoutes.post('/password/forgot', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    const baseResponse: Record<string, unknown> = {
      success: true,
      message: 'Nếu email hợp lệ, mã OTP đặt lại mật khẩu đã được gửi.'
    };

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${normalizedEmail}`);
      return res.json(baseResponse);
    }

    const { otp, expiresAt } = await OTPService.createEmailOTP(normalizedEmail, 'reset_password');
    const sent = await OTPService.sendPasswordResetEmailOTP(normalizedEmail, otp);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi OTP. Vui lòng thử lại sau.'
      });
    }

    baseResponse.expiresAt = expiresAt;

    if (config.NODE_ENV === 'development') {
      baseResponse.devOtp = otp;
    }

    return res.json(baseResponse);
  } catch (error) {
    logger.error('Send password reset OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý yêu cầu quên mật khẩu'
    });
  }
});

/**
 * @swagger
 * /api/auth/password/reset-with-otp:
 *   post:
 *     summary: Đặt lại mật khẩu bằng OTP gửi qua email
 *     tags: [Authentication]
 *     description: Xác thực mã OTP và cập nhật mật khẩu mới.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "customer@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "StrongPass123"
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: OTP không hợp lệ hoặc dữ liệu sai
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi server
 */
authRoutes.post('/password/reset-with-otp', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP và mật khẩu mới là bắt buộc'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    const sanitizedOtp = String(otp).trim();

    if (sanitizedOtp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không hợp lệ'
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có từ 6 đến 100 ký tự'
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const otpValid = await OTPService.verifyEmailOTP(normalizedEmail, sanitizedOtp, 'reset_password');

    if (!otpValid) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không chính xác hoặc đã hết hạn'
      });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.'
    });
  } catch (error) {
    logger.error('Reset password via OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đặt lại mật khẩu'
    });
  }
});

/**
 * @swagger
 * /api/auth/phone/send-otp:
 *   post:
 *     summary: Gửi mã OTP đến số điện thoại
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *     responses:
 *       200:
 *         description: OTP đã được gửi thành công
 *       400:
 *         description: Số điện thoại không hợp lệ
 *       500:
 *         description: Lỗi server
 */
authRoutes.post('/phone/send-otp', async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại là bắt buộc'
      });
    }

    // Validate phone format
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ'
      });
    }

    // Create OTP
    const { otp, expiresAt } = await OTPService.createOTP(phone);

    // Send OTP via SMS
    const sent = await OTPService.sendOTP(phone, otp);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi OTP. Vui lòng thử lại sau.'
      });
    }

    logger.info(`OTP sent to phone: ${phone}`);

    return res.json({
      success: true,
      message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
      expiresAt
    });
  } catch (error) {
    logger.error('Send OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi OTP'
    });
  }
});

/**
 * @swagger
 * /api/auth/phone/verify-otp:
 *   post:
 *     summary: Xác thực OTP và đăng nhập bằng số điện thoại
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       400:
 *         description: OTP không hợp lệ hoặc đã hết hạn
 *       500:
 *         description: Lỗi server
 */
authRoutes.post('/phone/verify-otp', async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại và mã OTP là bắt buộc'
      });
    }

    // Verify OTP
    const isValid = await OTPService.verifyOTP(phone, otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
      });
    }

    // Normalize phone
    const normalizedPhone = OTPService.normalizePhone(phone);

    // Find or create user
    let user = await User.findOne({ phone: normalizedPhone });

    if (!user) {
      // Create new user with phone login
      const randomPassword = crypto.randomBytes(20).toString('hex');
      user = new User({
        phone: normalizedPhone,
        email: `${normalizedPhone}@phone.local`, // Temporary email
        password: randomPassword,
        userName: `User_${normalizedPhone.substring(normalizedPhone.length - 4)}`,
        role: 'customer',
        isVerified: true // Phone verified via OTP
      });
      await user.save();
      logger.info(`New user created via phone OTP: ${normalizedPhone}`);
    }

    // Generate JWT tokens
    const payloadJwt = { userId: user._id, email: user.email, role: user.role };
    const secret = config.JWT_SECRET as string;
    const accessToken = jwt.sign(payloadJwt, secret as jwt.Secret, { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
    const refreshToken = jwt.sign(payloadJwt, secret as jwt.Secret, { expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

    return res.json({
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
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực OTP'
    });
  }
});

/**
 * Verify Firebase ID token (sent from client after phone auth) and create/login user
 */
authRoutes.post('/phone/firebase-verify', async (req: Request, res: Response): Promise<any> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'idToken is required' });
    }

    // Initialize firebase admin if not already
    initFirebaseAdmin();
    if (!firebaseInitialized()) {
      logger.error('Firebase Admin is not initialized');
      return res.status(500).json({ success: false, message: 'Firebase not configured on server' });
    }

    // Verify token
    let decoded: any;
    try {
      decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
    } catch (err) {
      logger.error('Firebase token verification failed:', err);
      return res.status(401).json({ success: false, message: 'Invalid Firebase ID token' });
    }

    const phoneNumber: string | undefined = decoded.phone_number || decoded.phone;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'No phone number in Firebase token' });
    }

    // Normalize phone
    const normalizedPhone = OTPService.normalizePhone(phoneNumber);

    // Find or create user
    let user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      const randomPassword = crypto.randomBytes(20).toString('hex');
      user = new User({
        phone: normalizedPhone,
        email: `${normalizedPhone}@phone.local`,
        password: randomPassword,
        userName: `User_${normalizedPhone.substring(normalizedPhone.length - 4)}`,
        role: 'customer',
        isVerified: true
      });
      await user.save();
      logger.info(`New user created via Firebase phone auth: ${normalizedPhone}`);
    }

    // Generate JWT tokens
    const payloadJwt = { userId: user._id, email: user.email, role: user.role };
    const secret = config.JWT_SECRET as string;
    const accessToken = jwt.sign(payloadJwt, secret as jwt.Secret, { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
    const refreshToken = jwt.sign(payloadJwt, secret as jwt.Secret, { expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

    return res.json({
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
      accessToken,
      refreshToken
    });

  } catch (error) {
    logger.error('Firebase verify error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi xác thực Firebase token' });
  }
});
