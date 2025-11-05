export interface CartItemEntity {
  id: string;
  productId: string;
  shopId?: string;
  quantity: number;
  unit?: string;
  price?: number;
  title?: string;
  thumbnail?: string;
  attrs?: any;
  addedAt?: Date;
}

export interface ICartEntity {
  id: string;
  userId: string;
  items: CartItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export class CartEntity implements ICartEntity {
  id: string;
  userId: string;
  items: CartItemEntity[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: ICartEntity) {
    this.id = data.id;
    this.userId = data.userId;
    this.items = data.items || [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  getTotalItems(): number {
    return this.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  }

  toJSON(): ICartEntity {
    return {
      id: this.id,
      userId: this.userId,
      items: this.items,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
