import { Request, Response } from 'express';
import { GetUserProfileUseCase } from '../../domain/usecases/user/GetUserProfile.usecase';
import { UpdateUserProfileUseCase } from '../../domain/usecases/user/UpdateUserProfile.usecase';
import { UserMapper } from '../dto/user/User.dto';
import { logger } from '../../shared/utils/logger';

/**
 * User Controller
 * Handles HTTP requests for user endpoints
 */
export class UserController {
  constructor(
    private getUserProfileUseCase: GetUserProfileUseCase,
    private updateUserProfileUseCase: UpdateUserProfileUseCase
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
}
