export interface IShopEntity {
  id: string;
  ownerId: string;
  shopName: string;
  story?: string;
  slug?: string | null;
  isActive: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  reviewMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ShopEntity implements IShopEntity {
  id: string;
  ownerId: string;
  shopName: string;
  story?: string;
  slug?: string | null;
  isActive: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  reviewMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IShopEntity) {
    this.id = data.id;
    this.ownerId = data.ownerId;
    this.shopName = data.shopName;
    this.story = data.story;
    this.slug = data.slug;
    this.isActive = data.isActive;
    this.status = data.status;
    this.submittedAt = data.submittedAt;
    this.approvedAt = data.approvedAt;
    this.approvedBy = data.approvedBy;
    this.reviewMessage = data.reviewMessage;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  toJSON(): IShopEntity {
    return {
      id: this.id,
      ownerId: this.ownerId,
      shopName: this.shopName,
      story: this.story,
      slug: this.slug,
      isActive: this.isActive,
      status: this.status,
      submittedAt: this.submittedAt,
      approvedAt: this.approvedAt,
      approvedBy: this.approvedBy,
      reviewMessage: this.reviewMessage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
