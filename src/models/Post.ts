import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPost extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  images: string[];
  cloudinaryPublicIds: string[];
  
  // Engagement metrics
  likes: Types.ObjectId[]; // Array of user IDs who liked
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  
  // Post metadata
  visibility: 'public' | 'friends' | 'private';
  isEdited: boolean;
  editedAt?: Date;
  
  // Sharing
  originalPostId?: Types.ObjectId; // If this is a shared post
  sharedBy?: Types.ObjectId; // User ID who shared
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID là bắt buộc'],
    index: true
  },
  content: {
    type: String,
    required: [true, 'Nội dung bài viết là bắt buộc'],
    maxlength: [10000, 'Nội dung bài viết không được vượt quá 10,000 ký tự'],
    trim: true
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(v: string[]) {
        return v.length <= 10;
      },
      message: 'Số lượng hình ảnh không được vượt quá 10'
    }
  },
  cloudinaryPublicIds: {
    type: [String],
    default: []
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  commentsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  sharesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  originalPostId: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  sharedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'posts'
});

// Indexes for efficient querying
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ visibility: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ likesCount: -1 });
PostSchema.index({ commentsCount: -1 });
PostSchema.index({ sharesCount: -1 });
PostSchema.index({ originalPostId: 1 });
PostSchema.index({ content: 'text' }); // Text index for search

// Compound index for feed queries
PostSchema.index({ visibility: 1, userId: 1, createdAt: -1 });

// Virtual for engagement rate
PostSchema.virtual('engagementRate').get(function(this: IPost) {
  const ageInHours = Math.max(1, Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60)));
  const totalEngagements = this.likesCount + this.commentsCount + this.sharesCount;
  return totalEngagements / ageInHours;
});

// Remove sensitive fields from JSON output
PostSchema.methods.toJSON = function() {
  const postObject = this.toObject();
  return postObject;
};

export const Post = mongoose.model<IPost>('Post', PostSchema);
