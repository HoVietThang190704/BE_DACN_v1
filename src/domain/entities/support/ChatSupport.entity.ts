export type SupportChatSender = 'user' | 'admin';

export interface SupportChatAttachmentEntity {
  url: string;
  filename?: string | null;
}

export interface SupportChatMessageEntity {
  id: string;
  sender: SupportChatSender | 'system';
  senderId?: string | null;
  senderName?: string | null;
  senderRole?: string | null;
  content: string;
  attachments: SupportChatAttachmentEntity[];
  createdAt: Date;
}

export interface SupportChatThreadEntity {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string | null;
  userAvatar?: string | null;
  lastMessage?: string | null;
  lastSender?: SupportChatSender | null;
  lastMessageAt?: Date | null;
  unreadByAdmin: number;
  unreadByUser: number;
  messages?: SupportChatMessageEntity[];
  createdAt: Date;
  updatedAt: Date;
}
