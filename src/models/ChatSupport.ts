import mongoose, { Schema, Document } from 'mongoose';

export type ChatSupportSender = 'user' | 'admin';

export interface IChatSupportAttachment {
  url: string;
  filename?: string | null;
}

export interface IChatSupportMessage extends Document {
  sender: ChatSupportSender;
  sender_id?: mongoose.Types.ObjectId | null;
  sender_name?: string | null;
  sender_role?: string | null;
  content: string;
  attachments: IChatSupportAttachment[];
  createdAt: Date;
}

export interface IChatSupport extends Document {
  user_id: mongoose.Types.ObjectId;
  user_email: string;
  user_name?: string | null;
  user_avatar?: string | null;
  last_message?: string | null;
  last_sender?: ChatSupportSender | null;
  last_message_at?: Date | null;
  unread_by_admin: number;
  unread_by_user: number;
  messages: IChatSupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IChatSupportAttachment>({
  url: { type: String, required: true, trim: true },
  filename: { type: String, default: null }
}, { _id: false });

const MessageSchema = new Schema<IChatSupportMessage>({
  sender: { type: String, enum: ['user', 'admin'], required: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  sender_name: { type: String, default: null },
  sender_role: { type: String, default: null },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  attachments: { type: [AttachmentSchema], default: [] }
}, {
  _id: true,
  timestamps: { createdAt: true, updatedAt: false }
});

const ChatSupportSchema = new Schema<IChatSupport>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  user_email: { type: String, required: true, trim: true, lowercase: true },
  user_name: { type: String, default: null },
  user_avatar: { type: String, default: null },
  last_message: { type: String, default: null },
  last_sender: { type: String, enum: ['user', 'admin'], default: null },
  last_message_at: { type: Date, default: null },
  unread_by_admin: { type: Number, default: 0 },
  unread_by_user: { type: Number, default: 0 },
  messages: { type: [MessageSchema], default: [] }
}, {
  timestamps: true,
  collection: 'Chat_Support'
});

ChatSupportSchema.index({ updatedAt: -1 });
ChatSupportSchema.index({ user_name: 1, user_email: 1 });

export const ChatSupport = mongoose.model<IChatSupport>('ChatSupport', ChatSupportSchema);
