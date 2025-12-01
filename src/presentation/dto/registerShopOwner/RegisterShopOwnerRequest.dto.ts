import { RegisterShopOwnerRequestEntity } from '../../../domain/entities/RegisterShopOwnerRequest.entity';

export interface RegisterShopOwnerRequestDTO {
  id: string;
  userId: string;
  certificateUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewMessage?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userSnapshot?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: Record<string, unknown>;
  } | null;
}

export class RegisterShopOwnerRequestMapper {
  static toDTO(entity: RegisterShopOwnerRequestEntity): RegisterShopOwnerRequestDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      certificateUrl: entity.certificateUrl,
      status: entity.status,
      reviewMessage: entity.reviewMessage ?? null,
      reviewedBy: entity.reviewedBy ?? null,
      reviewedAt: entity.reviewedAt ? entity.reviewedAt.toISOString() : null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      userSnapshot: entity.userSnapshot ?? null
    };
  }
}
