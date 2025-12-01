import mongoose from 'mongoose';
import { ChatSupport, IChatSupport, IChatSupportMessage } from '../../models/ChatSupport';
import { logger } from '../../shared/utils/logger';
import {
  AppendMessageInput,
  AppendMessageResult,
  CreateThreadInput,
  IChatSupportRepository,
  ListThreadsFilters
} from '../../domain/repositories/support/IChatSupportRepository';
import {
  SupportChatMessageEntity,
  SupportChatThreadEntity,
  SupportChatSender
} from '../../domain/entities/support/ChatSupport.entity';

const toObjectId = (value: string): mongoose.Types.ObjectId | null => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }
  return new mongoose.Types.ObjectId(value);
};

const normalizeDate = (value?: Date | string | null): Date | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export class ChatSupportRepository implements IChatSupportRepository {
  private mapMessage(doc: IChatSupportMessage | (IChatSupportMessage & { _id: mongoose.Types.ObjectId }) | any): SupportChatMessageEntity {
    return {
      id: (doc._id || doc.id || '').toString(),
      sender: doc.sender,
      senderId: doc.sender_id ? doc.sender_id.toString() : null,
      senderName: doc.sender_name ?? null,
      senderRole: doc.sender_role ?? null,
      content: doc.content,
      attachments: Array.isArray(doc.attachments) ? doc.attachments.map((item: any) => ({
        url: item.url,
        filename: item.filename ?? null
      })) : [],
      createdAt: normalizeDate(doc.createdAt) ?? new Date()
    };
  }

  private mapThread(doc: IChatSupport, options: { includeMessages?: boolean } = {}): SupportChatThreadEntity {
    const base: SupportChatThreadEntity = {
      id: (doc?._id || '').toString(),
      userId: doc.user_id?.toString() || '',
      userEmail: doc.user_email,
      userName: doc.user_name ?? null,
      userAvatar: doc.user_avatar ?? null,
      lastMessage: doc.last_message ?? null,
      lastSender: doc.last_sender ?? null,
      lastMessageAt: normalizeDate(doc.last_message_at) ?? null,
      unreadByAdmin: doc.unread_by_admin ?? 0,
      unreadByUser: doc.unread_by_user ?? 0,
      createdAt: normalizeDate(doc.createdAt) ?? new Date(),
      updatedAt: normalizeDate(doc.updatedAt) ?? new Date()
    };

    if (options.includeMessages) {
      const messages = Array.isArray(doc.messages) ? doc.messages : [];
      base.messages = messages
        .map((message) => this.mapMessage(message))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    return base;
  }

  async findByUserId(userId: string, options?: { includeMessages?: boolean }): Promise<SupportChatThreadEntity | null> {
    const objectId = toObjectId(userId);
    if (!objectId) {
      return null;
    }

    const query = ChatSupport.findOne({ user_id: objectId });
    if (!options?.includeMessages) {
      query.select('-messages');
    }

    const doc = await query.lean<IChatSupport>().exec();
    return doc ? this.mapThread(doc, { includeMessages: !!options?.includeMessages }) : null;
  }

  async createThread(payload: CreateThreadInput): Promise<SupportChatThreadEntity> {
    const objectId = toObjectId(payload.userId);
    if (!objectId) {
      throw new Error('Invalid user id');
    }

    try {
      const doc = await ChatSupport.create({
        user_id: objectId,
        user_email: payload.userEmail.toLowerCase(),
        user_name: payload.userName ?? null,
        user_avatar: payload.userAvatar ?? null
      });
      return this.mapThread(doc, { includeMessages: true });
    } catch (error: any) {
      if (error?.code === 11000) {
        const existing = await ChatSupport.findOne({ user_id: objectId }).lean<IChatSupport>().exec();
        if (existing) {
          return this.mapThread(existing);
        }
      }
      logger.error('ChatSupportRepository.createThread error:', error);
      throw new Error('Unable to create chat thread');
    }
  }

  async appendMessage(payload: AppendMessageInput): Promise<AppendMessageResult> {
    const objectId = toObjectId(payload.userId);
    if (!objectId) {
      throw new Error('Invalid user id');
    }

    const now = new Date();
    const senderObjectId = payload.senderId ? toObjectId(payload.senderId) : null;

    const messageDoc = {
      sender: payload.sender,
      sender_id: senderObjectId ?? undefined,
      sender_name: payload.senderName ?? null,
      sender_role: payload.senderRole ?? null,
      content: payload.content,
      attachments: Array.isArray(payload.attachments) ? payload.attachments.map((item) => ({
        url: item.url,
        filename: item.filename ?? null
      })) : []
    };

    const updated = await ChatSupport.findOneAndUpdate(
      { user_id: objectId },
      {
        $push: { messages: messageDoc },
        $set: {
          last_message: payload.content,
          last_sender: payload.sender,
          last_message_at: now,
          updatedAt: now
        },
        $inc: {
          unread_by_admin: payload.sender === 'user' ? 1 : 0,
          unread_by_user: payload.sender === 'admin' ? 1 : 0
        }
      },
      { new: true }
    ).lean<IChatSupport>().exec();

    if (!updated) {
      throw new Error('Chat thread not found');
    }

    const latestRaw = Array.isArray(updated.messages)
      ? updated.messages[updated.messages.length - 1]
      : null;

    if (!latestRaw) {
      throw new Error('Message not persisted');
    }

    const thread = this.mapThread(updated, { includeMessages: false });
    const message = this.mapMessage(latestRaw);

    return { message, thread };
  }

  async markAsRead(userId: string, actor: SupportChatSender): Promise<SupportChatThreadEntity | null> {
    const objectId = toObjectId(userId);
    if (!objectId) {
      return null;
    }

    const field = actor === 'admin' ? 'unread_by_admin' : 'unread_by_user';

    const doc = await ChatSupport.findOneAndUpdate(
      { user_id: objectId },
      { $set: { [field]: 0 } },
      { new: true }
    ).select('-messages').lean<IChatSupport>().exec();

    return doc ? this.mapThread(doc) : null;
  }

  async listThreads(filters?: ListThreadsFilters): Promise<SupportChatThreadEntity[]> {
    const query: Record<string, unknown> = {};

    if (filters?.search) {
      const keyword = filters.search.trim();
      if (keyword) {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        query.$or = [
          { user_name: regex },
          { user_email: regex }
        ];
      }
    }

    const limit = Math.min(Math.max(filters?.limit ?? 20, 1), 100);
    const offset = Math.max(filters?.offset ?? 0, 0);

    const docs = await ChatSupport.find(query)
      .select('-messages')
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean<IChatSupport[]>()
      .exec();

    return docs.map((doc) => this.mapThread(doc));
  }
}
