export type RegisterShopOwnerRequestStatus = 'pending' | 'approved' | 'rejected';

export interface IUserSnapshot {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    province?: string;
    district?: string;
    commune?: string;
    street?: string;
    detail?: string;
  };
}

export interface IRegisterShopOwnerRequestEntity {
  id: string;
  userId: string;
  certificateUrl: string;
  certificatePublicId: string;
  status: RegisterShopOwnerRequestStatus;
  reviewMessage?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  userSnapshot?: IUserSnapshot | null;
  createdAt: Date;
  updatedAt: Date;
}

export class RegisterShopOwnerRequestEntity implements IRegisterShopOwnerRequestEntity {
  id: string;
  userId: string;
  certificateUrl: string;
  certificatePublicId: string;
  status: RegisterShopOwnerRequestStatus;
  reviewMessage?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  userSnapshot?: IUserSnapshot | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IRegisterShopOwnerRequestEntity) {
    this.id = data.id;
    this.userId = data.userId;
    this.certificateUrl = data.certificateUrl;
    this.certificatePublicId = data.certificatePublicId;
    this.status = data.status;
    this.reviewMessage = data.reviewMessage ?? null;
    this.reviewedBy = data.reviewedBy ?? null;
    this.reviewedAt = data.reviewedAt ?? null;
    this.userSnapshot = data.userSnapshot ?? null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  toJSON(): IRegisterShopOwnerRequestEntity {
    return {
      id: this.id,
      userId: this.userId,
      certificateUrl: this.certificateUrl,
      certificatePublicId: this.certificatePublicId,
      status: this.status,
      reviewMessage: this.reviewMessage ?? null,
      reviewedBy: this.reviewedBy ?? null,
      reviewedAt: this.reviewedAt ?? null,
      userSnapshot: this.userSnapshot ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
