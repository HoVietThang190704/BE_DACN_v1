import { SupportChatMessageEntity, SupportChatThreadEntity } from '../../domain/entities/support/ChatSupport.entity';
import { getIO } from '../socket/socketManager';
import { logger } from '../../shared/utils/logger';

const buildThreadSummary = (thread: SupportChatThreadEntity) => ({
  threadId: thread.id,
  userId: thread.userId,
  userEmail: thread.userEmail,
  userName: thread.userName,
  userAvatar: thread.userAvatar,
  lastMessage: thread.lastMessage,
  lastSender: thread.lastSender,
  lastMessageAt: thread.lastMessageAt,
  unreadByAdmin: thread.unreadByAdmin,
  unreadByUser: thread.unreadByUser
});

export const emitSupportChatMessage = (
  thread: SupportChatThreadEntity,
  message: SupportChatMessageEntity
): void => {
  try {
    const io = getIO();
    const summary = buildThreadSummary(thread);
    io.to(`support-chat:user:${thread.userId}`).emit('support-chat:new-message', {
      summary,
      message
    });
    io.to('support-chat:admins').emit('support-chat:new-message', {
      summary,
      message
    });
  } catch (error) {
    logger.error('emitSupportChatMessage error:', error);
  }
};

export const emitSupportChatThreadUpdate = (thread: SupportChatThreadEntity): void => {
  try {
    const io = getIO();
    const summary = buildThreadSummary(thread);
    io.to(`support-chat:user:${thread.userId}`).emit('support-chat:thread-update', summary);
    io.to('support-chat:admins').emit('support-chat:thread-update', summary);
  } catch (error) {
    logger.error('emitSupportChatThreadUpdate error:', error);
  }
};
