import { IUserRepository } from '../../repositories/IUserRepository';
import bcrypt from 'bcryptjs';

/**
 * Use Case: Reset Password
 * Validates reset token and updates password
 */
export class ResetPasswordUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(token: string, newPassword: string): Promise<void> {
    // 1. Validate token
    if (!token || token.trim().length === 0) {
      throw new Error('Token không hợp lệ');
    }

    // 2. Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    if (newPassword.length > 100) {
      throw new Error('Mật khẩu không được vượt quá 100 ký tự');
    }

    // 3. Find user by reset token
    const user = await this.userRepository.findByResetPasswordToken(token);
    
    if (!user) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }

    // 4. Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 5. Update password
    const updated = await this.userRepository.updatePassword(user.id!, hashedPassword);
    
    if (!updated) {
      throw new Error('Không thể cập nhật mật khẩu');
    }

    // 6. Clear reset token
    await this.userRepository.clearResetPasswordToken(user.id!);
  }
}
