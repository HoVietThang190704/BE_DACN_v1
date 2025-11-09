/**
 * Product Review Entity - Domain model for product reviews with nested replies
 */

export interface IProductReviewEntity {
  id: string;
  productId: string;
  userId: string;
  rating?: number;
  content: string;
  images: string[];
  cloudinaryPublicIds: string[];
  parentReviewId?: string;
  level: number;
  mentionedUserId?: string;
  repliesCount: number;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductReviewEntity implements IProductReviewEntity {
  id: string;
  productId: string;
  userId: string;
  rating?: number;
  content: string;
  images: string[];
  cloudinaryPublicIds: string[];
  parentReviewId?: string;
  level: number;
  mentionedUserId?: string;
  repliesCount: number;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IProductReviewEntity) {
    this.id = data.id;
    this.productId = data.productId;
    this.userId = data.userId;
    this.rating = data.rating;
    this.content = data.content;
    this.images = data.images || [];
    this.cloudinaryPublicIds = data.cloudinaryPublicIds || [];
    this.parentReviewId = data.parentReviewId;
    this.level = data.level ?? 0;
    this.mentionedUserId = data.mentionedUserId;
    this.repliesCount = data.repliesCount ?? 0;
    this.isEdited = data.isEdited ?? false;
    this.editedAt = data.editedAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  isTopLevel(): boolean {
    return this.level === 0 && !this.parentReviewId;
  }

  isReply(): boolean {
    return this.level > 0;
  }

  canHaveReplies(): boolean {
    return this.level < 2;
  }

  updateContent(content: string, rating?: number): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Nội dung đánh giá không được để trống');
    }

    if (this.isTopLevel() && rating !== undefined) {
      this.rating = rating;
    }

    this.content = content.trim();
    this.isEdited = true;
    this.editedAt = new Date();
    this.updatedAt = new Date();
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.productId) {
      errors.push('Product ID không được để trống');
    }

    if (!this.userId) {
      errors.push('User ID không được để trống');
    }

    if (!this.content || this.content.trim().length === 0) {
      errors.push('Nội dung đánh giá không được để trống');
    }

    if (this.isTopLevel()) {
      if (this.rating === undefined || this.rating === null) {
        errors.push('Đánh giá sao không được để trống');
      } else if (this.rating < 1 || this.rating > 5) {
        errors.push('Đánh giá phải từ 1 đến 5 sao');
      } else if (!Number.isInteger(this.rating * 2)) {
        errors.push('Đánh giá chỉ chấp nhận increment 0.5');
      }
    } else if (this.rating !== undefined) {
      errors.push('Phản hồi không được phép có đánh giá sao');
    }

    if (this.level < 0 || this.level > 2) {
      errors.push('Level của đánh giá không hợp lệ');
    }

    if (this.level > 0 && !this.parentReviewId) {
      errors.push('Phản hồi phải có parentReviewId');
    }

    if (this.images.length > 5) {
      errors.push('Số lượng hình ảnh không được vượt quá 5');
    }

    if (this.images.length !== this.cloudinaryPublicIds.length) {
      errors.push('Số lượng hình ảnh và cloudinary IDs không khớp');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
