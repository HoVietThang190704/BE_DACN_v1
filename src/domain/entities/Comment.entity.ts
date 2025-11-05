/**
 * Comment Entity - Pure domain model for post comments (3-level nesting support)
 * Contains business logic and validation rules
 */

export interface ICommentEntity {
  id: string;
  postId: string;
  userId: string;
  content: string;
  images: string[];
  cloudinaryPublicIds: string[];
  
  // Nested comments (3 levels: comment -> reply -> nested reply)
  parentCommentId?: string; // null for top-level comments
  level: number; // 0 = top-level, 1 = reply, 2 = nested reply
  mentionedUserId?: string; // User being replied to
  
  // Engagement
  likes: string[]; // Array of user IDs who liked
  likesCount: number;
  repliesCount: number;
  
  // Metadata
  isEdited: boolean;
  editedAt?: Date;
  
  // Timestamps
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

  // Business Logic Methods

  /**
   * Check if this is a top-level comment
   */
  isTopLevel(): boolean {
    return this.level === 0 && !this.parentCommentId;
  }

  /**
   * Check if this is a reply to another comment
   */
  isReply(): boolean {
    return this.level === 1 && !!this.parentCommentId;
  }

  /**
   * Check if this is a nested reply (reply to a reply)
   */
  isNestedReply(): boolean {
    return this.level === 2 && !!this.parentCommentId;
  }

  /**
   * Check if comment can have more replies (max 3 levels)
   */
  canHaveReplies(): boolean {
    return this.level < 2;
  }

  /**
   * Check if user has liked this comment
   */
  isLikedBy(userId: string): boolean {
    return this.likes.includes(userId);
  }

  /**
   * Toggle like for a user
   */
  toggleLike(userId: string): boolean {
    const index = this.likes.indexOf(userId);
    
    if (index > -1) {
      // User already liked, remove like
      this.likes.splice(index, 1);
      this.likesCount = Math.max(0, this.likesCount - 1);
      return false; // unliked
    } else {
      // User hasn't liked yet, add like
      this.likes.push(userId);
      this.likesCount += 1;
      return true; // liked
    }
  }

  /**
   * Add a like from user
   */
  addLike(userId: string): boolean {
    if (this.isLikedBy(userId)) {
      return false; // Already liked
    }
    
    this.likes.push(userId);
    this.likesCount += 1;
    return true;
  }

  /**
   * Remove a like from user
   */
  removeLike(userId: string): boolean {
    const index = this.likes.indexOf(userId);
    
    if (index === -1) {
      return false; // Not liked yet
    }
    
    this.likes.splice(index, 1);
    this.likesCount = Math.max(0, this.likesCount - 1);
    return true;
  }

  /**
   * Increment replies count
   */
  incrementRepliesCount(): void {
    this.repliesCount += 1;
  }

  /**
   * Decrement replies count
   */
  decrementRepliesCount(): void {
    this.repliesCount = Math.max(0, this.repliesCount - 1);
  }

  /**
   * Check if comment has images
   */
  hasImages(): boolean {
    return this.images.length > 0;
  }

  /**
   * Check if user is owner of comment
   */
  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Check if user can edit this comment
   */
  canBeEditedBy(userId: string): boolean {
    return this.isOwnedBy(userId);
  }

  /**
   * Check if user can delete this comment
   */
  canBeDeletedBy(userId: string, isAdmin: boolean = false): boolean {
    return this.isOwnedBy(userId) || isAdmin;
  }

  /**
   * Update comment content
   */
  updateContent(newContent: string): void {
    if (!newContent || newContent.trim().length === 0) {
      throw new Error('Nội dung bình luận không được để trống');
    }

    this.content = newContent.trim();
    this.isEdited = true;
    this.editedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Update comment images
   */
  updateImages(images: string[], cloudinaryPublicIds: string[]): void {
    this.images = images;
    this.cloudinaryPublicIds = cloudinaryPublicIds;
    this.isEdited = true;
    this.editedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Get comment age in minutes
   */
  getAgeInMinutes(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.floor(diffTime / (1000 * 60));
  }

  /**
   * Get comment age in hours
   */
  getAgeInHours(): number {
    return Math.floor(this.getAgeInMinutes() / 60);
  }

  /**
   * Check if comment is recent (less than 1 hour old)
   */
  isRecent(): boolean {
    return this.getAgeInMinutes() < 60;
  }

  /**
   * Check if comment can be edited (within 15 minutes of creation)
   */
  canBeEditedWithinTimeLimit(): boolean {
    return this.getAgeInMinutes() <= 15;
  }

  /**
   * Validate comment data
   */
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
