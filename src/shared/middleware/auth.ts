import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../../config';
import { User } from '../../models/users/User';
import { logger } from '../utils/logger';
import { HttpStatus } from '../constants/httpStatus';
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;   
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Không tìm thấy token xác thực. Vui lòng đăng nhập.'
      });
    }
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, config.JWT_SECRET as string) as {
      userId: string;
      email: string;
      role: string;
    };
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Người dùng không tồn tại.'
      });
    }
    if (!user.isVerified && config.NODE_ENV === 'production') {
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email.'
      });
    }
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    return next();
  } catch (error: any) {
    logger.error('Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Token không hợp lệ.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Lỗi xác thực. Vui lòng thử lại sau.'
    });
  }
};

/**
 * Middleware to check if user has specific role
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Bạn cần đăng nhập để truy cập.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Bạn không có quyền truy cập tính năng này.'
      });
    }

    return next();
  };
};
