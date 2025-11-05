import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment extends Document {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  images: string[];
  cloudinaryPublicIds: string[];
  
  // Nested comments (3 levels)
  parentCommentId?: Types.ObjectId;
  level: number; // 0 = top-level, 1 = reply, 2 = nested reply
  mentionedUserId?: Types.ObjectId; // User being replied to
  
  // Engagement
  likes: Types.ObjectId[]; // Array of user IDs who liked
  likesCount: number;
  repliesCount: number;
  
  // Metadata
  isEdited: boolean;
  editedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post ID là bắt buộc'],
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID là bắt buộc'],
    index: true
  },
  content: {
    type: String,
    required: [true, 'Nội dung bình luận là bắt buộc'],
    maxlength: [2000, 'Nội dung bình luận không được vượt quá 2,000 ký tự'],
    trim: true
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(v: string[]) {
        return v.length <= 5;
      },
      message: 'Số lượng hình ảnh không được vượt quá 5'
    }
  },
  cloudinaryPublicIds: {
    type: [String],
    default: []
  },
  parentCommentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  level: {
    type: Number,
    required: true,
    min: 0,
    max: 2,
    default: 0
  },
  mentionedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
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
  repliesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'comments'
});

// Indexes for efficient querying
CommentSchema.index({ postId: 1, level: 1, createdAt: 1 });
CommentSchema.index({ postId: 1, parentCommentId: 1, createdAt: 1 });
CommentSchema.index({ parentCommentId: 1, createdAt: 1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ createdAt: -1 });
CommentSchema.index({ likesCount: -1 });

// Compound index for top-level comments
CommentSchema.index({ postId: 1, level: 1, likesCount: -1 });

// Remove sensitive fields from JSON output
CommentSchema.methods.toJSON = function() {
  const commentObject = this.toObject();
  return commentObject;
};

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
