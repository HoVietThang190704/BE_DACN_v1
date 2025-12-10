import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { HttpStatus } from '../constants/httpStatus';

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục'
      });
      return;
    }

    const userRole = req.user.role;
    
    if (!roles.includes(userRole)) {
      logger.warn(`Authorization failed for user ${req.user.userId}: required ${roles.join(', ')}, has ${userRole}`);
      
      res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
      return;
    }

    next();
  };
};

export const isAdmin = authorizeRoles('admin');

export const isShopOwnerOrAdmin = authorizeRoles('shop_owner', 'admin');

export const isAuthenticated = authorizeRoles('customer', 'shop_owner', 'admin');
