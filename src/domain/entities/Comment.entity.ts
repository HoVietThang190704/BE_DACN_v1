export interface ICommentEntity {
  id: string;
  postId: string;
  userId: string;
  content: string;
  images: string[];
  cloudinaryPublicIds: string[];
  
  parentCommentId?: string;
  level: number;
  mentionedUserId?: string;
  
  likes: string[];
  likesCount: number;
  repliesCount: number;
  
  isEdited: boolean;
  editedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export class CommentEntity implements ICommentEntity {
  id: string;
  postId: string;
  userId: string;
  content: string;
  images: string[];
  cloudinaryPublicIds: string[];
  parentCommentId?: string;
  level: number;
  mentionedUserId?: string;
  likes: string[];
  likesCount: number;
  repliesCount: number;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: ICommentEntity) {
    this.id = data.id;
    this.postId = data.postId;
    this.userId = data.userId;
    this.content = data.content;
    this.images = data.images || [];
    this.cloudinaryPublicIds = data.cloudinaryPublicIds || [];
    this.parentCommentId = data.parentCommentId;
    this.level = data.level || 0;
    this.mentionedUserId = data.mentionedUserId;
    this.likes = data.likes || [];
    this.likesCount = data.likesCount || 0;
    this.repliesCount = data.repliesCount || 0;
    this.isEdited = data.isEdited || false;
    this.editedAt = data.editedAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  isTopLevel(): boolean {
    return this.level === 0 && !this.parentCommentId;
  }

  isReply(): boolean {
    return this.level === 1 && !!this.parentCommentId;
  }

  isNestedReply(): boolean {
    return this.level === 2 && !!this.parentCommentId;
  }

  canHaveReplies(): boolean {
    return this.level < 2;
  }

  isLikedBy(userId: string): boolean {
    return this.likes.includes(userId);
  }

  toggleLike(userId: string): boolean {
    const index = this.likes.indexOf(userId);
    
    if (index > -1) {
      this.likes.splice(index, 1);
      this.likesCount = Math.max(0, this.likesCount - 1);
      return false;
    } else {
      this.likes.push(userId);
      this.likesCount += 1;
      return true;
    }
  }

  addLike(userId: string): boolean {
    if (this.isLikedBy(userId)) {
      return false;
    }
    
    this.likes.push(userId);
    this.likesCount += 1;
    return true;
  }

  removeLike(userId: string): boolean {
    const index = this.likes.indexOf(userId);
    
    if (index === -1) {
      return false;
    }
    
    this.likes.splice(index, 1);
    this.likesCount = Math.max(0, this.likesCount - 1);
    return true;
  }

  incrementRepliesCount(): void {
    this.repliesCount += 1;
  }

  decrementRepliesCount(): void {
    this.repliesCount = Math.max(0, this.repliesCount - 1);
  }

  hasImages(): boolean {
    return this.images.length > 0;
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  canBeEditedBy(userId: string): boolean {
    return this.isOwnedBy(userId);
  }

  canBeDeletedBy(userId: string, isAdmin: boolean = false): boolean {
    return this.isOwnedBy(userId) || isAdmin;
  }

  updateContent(newContent: string): void {
    if (!newContent || newContent.trim().length === 0) {
      throw new Error('Nội dung bình luận không được để trống');
    }

    this.content = newContent.trim();
    this.isEdited = true;
    this.editedAt = new Date();
    this.updatedAt = new Date();
  }

  updateImages(images: string[], cloudinaryPublicIds: string[]): void {
    this.images = images;
    this.cloudinaryPublicIds = cloudinaryPublicIds;
    this.isEdited = true;
    this.editedAt = new Date();
    this.updatedAt = new Date();
  }

  getAgeInMinutes(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.floor(diffTime / (1000 * 60));
  }

  getAgeInHours(): number {
    return Math.floor(this.getAgeInMinutes() / 60);
  }

  isRecent(): boolean {
    return this.getAgeInMinutes() < 60;
  }

  canBeEditedWithinTimeLimit(): boolean {
    return this.getAgeInMinutes() <= 15;
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.postId || this.postId.trim().length === 0) {
      errors.push('Post ID không được để trống');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      errors.push('User ID không được để trống');
    }

    if (!this.content || this.content.trim().length === 0) {
      errors.push('Nội dung bình luận không được để trống');
    }

    if (this.content && this.content.length > 2000) {
      errors.push('Nội dung bình luận không được vượt quá 2,000 ký tự');
    }

    if (this.level < 0 || this.level > 2) {
      errors.push('Level của bình luận không hợp lệ (phải từ 0-2)');
    }

    if (this.level > 0 && !this.parentCommentId) {
      errors.push('Reply comment phải có parentCommentId');
    }

    if (this.images.length > 5) {
      errors.push('Số lượng hình ảnh không được vượt quá 5');
    }

    if (this.images.length !== this.cloudinaryPublicIds.length) {
      errors.push('Số lượng hình ảnh và public IDs không khớp');
    }

    if (this.likesCount < 0) {
      errors.push('Số lượt thích không hợp lệ');
    }

    if (this.repliesCount < 0) {
      errors.push('Số phản hồi không hợp lệ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
