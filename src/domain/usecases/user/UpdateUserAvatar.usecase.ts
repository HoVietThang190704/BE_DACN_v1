import { IUserRepository } from '../../repositories/IUserRepository';
import { uploadToCloudinary, deleteFromCloudinary } from '../../../shared/utils/cloudinary';

export class UpdateUserAvatarUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    userId: string,
    file: Express.Multer.File
  ): Promise<{ avatar: string; message: string }> {
    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Upload new avatar to Cloudinary
    const { url: newAvatarUrl, publicId } = await uploadToCloudinary(file, 'avatars');

    // Delete old avatar from Cloudinary if exists
    if (user.avatar && user.avatar.includes('cloudinary')) {
      // Extract public_id from old avatar URL
      const urlParts = user.avatar.split('/');
      const publicIdWithExt = urlParts.slice(-2).join('/'); // folder/filename.ext
      const oldPublicId = publicIdWithExt.split('.')[0]; // Remove extension
      await deleteFromCloudinary(oldPublicId);
    }

    // Update user avatar in database
    await this.userRepository.update(userId, { avatar: newAvatarUrl });

    return {
      avatar: newAvatarUrl,
      message: 'Cập nhật ảnh đại diện thành công'
    };
  }
}
