import { uploadToCloudinary } from '../../../shared/utils/cloudinary';
import { IRegisterShopOwnerRepository } from '../../repositories/IRegisterShopOwnerRepository';
import { IUserRepository } from '../../repositories/IUserRepository';
import { IRegisterShopOwnerRequestEntity, RegisterShopOwnerRequestEntity } from '../../entities/RegisterShopOwnerRequest.entity';

export class SubmitRegisterShopOwnerRequestUseCase {
  constructor(
    private registerRepo: IRegisterShopOwnerRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(params: {
    userId: string;
    certificateFile: Express.Multer.File;
  }): Promise<RegisterShopOwnerRequestEntity> {
    const { userId, certificateFile } = params;

    if (!certificateFile) {
      throw new Error('Vui lòng tải lên hình ảnh giấy chứng nhận');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }
    if (user.role !== 'customer') {
      throw new Error('Chỉ khách hàng mới có thể đăng ký trở thành chủ shop');
    }

    const existingRequest = await this.registerRepo.findLatestByUserId(userId);
    if (existingRequest && existingRequest.status === 'pending') {
      throw new Error('Bạn đã gửi yêu cầu và đang chờ duyệt');
    }
    if (existingRequest && existingRequest.status === 'approved') {
      throw new Error('Yêu cầu của bạn đã được duyệt. Vui lòng đăng nhập lại để sử dụng quyền shop owner');
    }

    const { url, publicId } = await uploadToCloudinary(certificateFile, 'shop-owner-certificates');

    const payload: Omit<IRegisterShopOwnerRequestEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      certificateUrl: url,
      certificatePublicId: publicId,
      status: 'pending',
      reviewMessage: null,
      reviewedAt: null,
      reviewedBy: null,
      userSnapshot: {
        name: user.userName || undefined,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    };

    return this.registerRepo.create(payload);
  }
}
