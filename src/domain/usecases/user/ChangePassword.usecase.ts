import { IUserRepository } from '../../repositories/IUserRepository';
import bcrypt from 'bcryptjs';

export class ChangePasswordUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID không hợp lệ');
    }

    if (!oldPassword || oldPassword.trim().length === 0) {
      throw new Error('Mật khẩu cũ không được để trống');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    if (newPassword.length > 100) {
      throw new Error('Mật khẩu mới không được vượt quá 100 ký tự');
    }

    if (oldPassword === newPassword) {
      throw new Error('Mật khẩu mới phải khác mật khẩu cũ');
    }

    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Mật khẩu cũ không đúng');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updated = await this.userRepository.updatePassword(userId, hashedPassword);
    
    if (!updated) {
      throw new Error('Không thể cập nhật mật khẩu');
    }
  }
}
