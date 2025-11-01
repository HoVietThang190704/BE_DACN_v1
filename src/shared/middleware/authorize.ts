import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Authorization middleware
 * Checks if user has required role(s)
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục'
      });
      return;
    }

    // Check if user has required role
    const userRole = req.user.role;
    
    if (!roles.includes(userRole)) {
      logger.warn(`Authorization failed for user ${req.user.userId}: required ${roles.join(', ')}, has ${userRole}`);
      
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
      return;
    }

    next();
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = authorizeRoles('admin');

/**
 * Check if user is shop owner or admin
 */
export const isShopOwnerOrAdmin = authorizeRoles('shop_owner', 'admin');

/**
 * Check if user is customer, shop owner or admin (any authenticated user)
 */
export const isAuthenticated = authorizeRoles('customer', 'shop_owner', 'admin');
