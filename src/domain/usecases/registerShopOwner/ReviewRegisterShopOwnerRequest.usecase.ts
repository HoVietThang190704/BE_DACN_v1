import { IRegisterShopOwnerRepository } from '../../repositories/IRegisterShopOwnerRepository';
import { IUserRepository } from '../../repositories/IUserRepository';
import { IRegisterShopOwnerRequestEntity, RegisterShopOwnerRequestEntity, RegisterShopOwnerRequestStatus } from '../../entities/RegisterShopOwnerRequest.entity';

export class ReviewRegisterShopOwnerRequestUseCase {
  constructor(
    private registerRepo: IRegisterShopOwnerRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(params: {
    requestId: string;
    reviewerId: string;
    status: Extract<RegisterShopOwnerRequestStatus, 'approved' | 'rejected'>;
    reviewMessage?: string;
  }): Promise<RegisterShopOwnerRequestEntity> {
    const { requestId, reviewerId, status, reviewMessage } = params;

    const request = await this.registerRepo.findById(requestId);
    if (!request) {
      throw new Error('Không tìm thấy yêu cầu');
    }

    if (request.status !== 'pending') {
      throw new Error('Yêu cầu đã được xử lý');
    }

    const updatePayload: Partial<Omit<IRegisterShopOwnerRequestEntity, 'id' | 'userId'>> = {
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewMessage: reviewMessage ?? null
    };

    if (status === 'approved') {
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        throw new Error('Không tìm thấy người dùng liên quan');
      }
      if (user.role !== 'customer') {
        throw new Error('Người dùng này không thể được duyệt vì đã có vai trò khác');
      }
      await this.userRepository.update(request.userId, { role: 'shop_owner' });
    }

    const updated = await this.registerRepo.update(requestId, updatePayload);
    if (!updated) {
      throw new Error('Không thể cập nhật trạng thái yêu cầu');
    }

    return updated;
  }
}
