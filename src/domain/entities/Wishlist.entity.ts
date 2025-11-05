export interface WishlistItemEntity {
  id: string;
  productId: string;
  addedAt?: Date;
  note?: string;
}

export interface IWishlistEntity {
  id: string;
  userId: string;
  items: WishlistItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export class WishlistEntity implements IWishlistEntity {
  id: string;
  userId: string;
  items: WishlistItemEntity[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IWishlistEntity) {
    this.id = data.id;
    this.userId = data.userId;
    this.items = data.items || [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  toJSON(): IWishlistEntity {
    return {
      id: this.id,
      userId: this.userId,
      items: this.items,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
