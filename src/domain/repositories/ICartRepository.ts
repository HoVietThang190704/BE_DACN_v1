import { CartEntity } from '../entities/Cart.entity';

export interface AddCartItemDTO {
  productId: string;
  shopId?: string;
  quantity: number;
  unit?: string;
  price?: number;
  title?: string;
  thumbnail?: string;
  attrs?: any;
}

export interface UpdateCartItemDTO {
  quantity?: number;
  unit?: string;
  price?: number;
  attrs?: any;
}

export interface ICartRepository {
  findByUserId(userId: string): Promise<CartEntity | null>;
  create(userId: string): Promise<CartEntity>;
  addItem(userId: string, item: AddCartItemDTO): Promise<CartEntity>;
  updateItem(userId: string, itemId: string, payload: UpdateCartItemDTO): Promise<CartEntity | null>;
  removeItem(userId: string, itemId: string): Promise<CartEntity | null>;
  clearCart(userId: string): Promise<boolean>;
}
