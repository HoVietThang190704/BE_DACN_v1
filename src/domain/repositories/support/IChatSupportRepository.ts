import { SupportChatMessageEntity, SupportChatThreadEntity, SupportChatSender } from '../../entities/support/ChatSupport.entity';

export interface AppendMessageInput {
  userId: string;
  content: string;
  sender: SupportChatSender;
  senderId?: string;
  senderName?: string | null;
  senderRole?: string | null;
  attachments?: { url: string; filename?: string | null }[];
}

export interface CreateThreadInput {
  userId: string;
  userEmail: string;
  userName?: string | null;
  userAvatar?: string | null;
}

export interface ListThreadsFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AppendMessageResult {
  message: SupportChatMessageEntity;
  thread: SupportChatThreadEntity;
}

export interface IChatSupportRepository {
  findByUserId(userId: string, options?: { includeMessages?: boolean }): Promise<SupportChatThreadEntity | null>;
  createThread(payload: CreateThreadInput): Promise<SupportChatThreadEntity>;
  appendMessage(payload: AppendMessageInput): Promise<AppendMessageResult>;
  markAsRead(userId: string, actor: SupportChatSender): Promise<SupportChatThreadEntity | null>;
  listThreads(filters?: ListThreadsFilters): Promise<SupportChatThreadEntity[]>;
}
