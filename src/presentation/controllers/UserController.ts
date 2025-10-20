import { Request, Response } from 'express';
import { GetUserProfileUseCase } from '../../domain/usecases/user/GetUserProfile.usecase';
import { UpdateUserProfileUseCase } from '../../domain/usecases/user/UpdateUserProfile.usecase';
import { ResetPasswordUseCase } from '../../domain/usecases/user/ResetPassword.usecase';
import { ChangePasswordUseCase } from '../../domain/usecases/user/ChangePassword.usecase';
import { UserMapper } from '../dto/user/User.dto';
import { logger } from '../../shared/utils/logger';

/**
 * User Controller
 * Handles HTTP requests for user endpoints
 */
export class UserController {
  constructor(
    private getUserProfileUseCase: GetUserProfileUseCase,
    private updateUserProfileUseCase: UpdateUserProfileUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
    private changePasswordUseCase: ChangePasswordUseCase
  ) {}

  /**
   * GET /api/users/me/profile
   * Get current user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const user = await this.getUserProfileUseCase.execute(userId);
      const userDto = UserMapper.toResponseDto(user);

      res.json({
        success: true,
        message: 'Lấy thông tin profile thành công',
        data: userDto
      });
    } catch (error: any) {
      logger.error('Get profile error:', error);

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin profile'
      });
    }
  }

  /**
   * PUT /api/users/me/profile
   * Update current user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { userName, phone, dateOfBirth, avatar } = req.body;

      const updatedUser = await this.updateUserProfileUseCase.execute({
        userId,
        userName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        avatar
      });

      const userDto = UserMapper.toResponseDto(updatedUser);

      logger.info(`User profile updated: ${updatedUser.email}`);

      res.json({
        success: true,
        message: 'Cập nhật profile thành công',
        data: userDto
      });
    } catch (error: any) {
      logger.error('Update profile error:', error);

      // Handle specific errors
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
        return;
      }

      if (
        error.message.includes('Phone number already in use') ||
        error.message.includes('Invalid phone number') ||
        error.message.includes('User name') ||
        error.message.includes('age') ||
        error.message.includes('date of birth')
      ) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật profile'
      });
    }
  }

  /**
   * POST /auth/reset-password
   * Reset password using token (public endpoint)
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Token và mật khẩu mới là bắt buộc'
        });
        return;
      }

      await this.resetPasswordUseCase.execute(token, newPassword);

      logger.info('Password reset successfully');

      res.json({
        success: true,
        message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.'
      });
    } catch (error: any) {
      logger.error('Reset password error:', error);

      if (
        error.message.includes('Token') ||
        error.message.includes('token') ||
        error.message.includes('hết hạn')
      ) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error.message.includes('Mật khẩu')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đặt lại mật khẩu'
      });
    }
  }

  /**
   * POST /api/users/me/change-password
   * Change password for authenticated user
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Mật khẩu cũ và mật khẩu mới là bắt buộc'
        });
        return;
      }

      await this.changePasswordUseCase.execute(userId, oldPassword, newPassword);

      logger.info(`Password changed for user: ${userId}`);

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error: any) {
      logger.error('Change password error:', error);

      if (error.message === 'Người dùng không tồn tại') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (
        error.message.includes('Mật khẩu') ||
        error.message.includes('password')
      ) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đổi mật khẩu'
      });
    }
  }
}
