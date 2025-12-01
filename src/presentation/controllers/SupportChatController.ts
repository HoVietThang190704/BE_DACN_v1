import { Request, Response } from 'express';
import { GetChatSupportThreadUseCase } from '../../domain/usecases/support/GetChatSupportThread.usecase';
import { SendChatSupportMessageUseCase } from '../../domain/usecases/support/SendChatSupportMessage.usecase';
import { ListChatSupportThreadsUseCase } from '../../domain/usecases/support/ListChatSupportThreads.usecase';
import { MarkChatSupportThreadReadUseCase } from '../../domain/usecases/support/MarkChatSupportThreadRead.usecase';
import { emitSupportChatMessage, emitSupportChatThreadUpdate } from '../../services/chat/supportChatEvents';
import { logger } from '../../shared/utils/logger';
import { SupportChatThreadEntity, SupportChatMessageEntity } from '../../domain/entities/support/ChatSupport.entity';

const mapMessageResponse = (message: SupportChatMessageEntity) => ({
  id: message.id,
  sender: message.sender,
  senderId: message.senderId,
  senderName: message.senderName,
  senderRole: message.senderRole,
  content: message.content,
  attachments: message.attachments,
  createdAt: message.createdAt?.toISOString() ?? new Date().toISOString()
});

const mapThreadResponse = (thread: SupportChatThreadEntity, includeMessages = false) => ({
  threadId: thread.id,
  userId: thread.userId,
  userEmail: thread.userEmail,
  userName: thread.userName,
  userAvatar: thread.userAvatar,
  lastMessage: thread.lastMessage,
  lastSender: thread.lastSender,
  lastMessageAt: thread.lastMessageAt?.toISOString() ?? null,
  unreadByAdmin: thread.unreadByAdmin,
  unreadByUser: thread.unreadByUser,
  createdAt: thread.createdAt?.toISOString() ?? null,
  updatedAt: thread.updatedAt?.toISOString() ?? null,
  messages: includeMessages && thread.messages ? thread.messages.map(mapMessageResponse) : undefined
});

export class SupportChatController {
  constructor(
    private readonly getThreadUseCase: GetChatSupportThreadUseCase,
    private readonly sendMessageUseCase: SendChatSupportMessageUseCase,
    private readonly listThreadsUseCase: ListChatSupportThreadsUseCase,
    private readonly markThreadReadUseCase: MarkChatSupportThreadReadUseCase
  ) {}

  async getMyThread(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const thread = await this.getThreadUseCase.execute(req.user.userId);
      res.json({ success: true, data: mapThreadResponse(thread, true) });
    } catch (error: any) {
      logger.error('SupportChatController.getMyThread error:', error);
      res.status(500).json({ success: false, message: error?.message || 'Failed to load chat thread' });
    }
  }

  async sendMyMessage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const result = await this.sendMessageUseCase.execute({
        targetUserId: req.user.userId,
        senderId: req.user.userId,
        senderRole: 'user',
        content: req.body.content
      });

      emitSupportChatMessage(result.thread, result.message);

      res.status(201).json({
        success: true,
        data: {
          message: mapMessageResponse(result.message),
          thread: mapThreadResponse(result.thread)
        }
      });
    } catch (error: any) {
      logger.error('SupportChatController.sendMyMessage error:', error);
      res.status(500).json({ success: false, message: error?.message || 'Failed to send message' });
    }
  }

  async markMyThreadRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const thread = await this.markThreadReadUseCase.execute(req.user.userId, 'user');
      if (thread) {
        emitSupportChatThreadUpdate(thread);
      }
      res.json({ success: true, data: thread ? mapThreadResponse(thread) : null });
    } catch (error: any) {
      logger.error('SupportChatController.markMyThreadRead error:', error);
      res.status(500).json({ success: false, message: error?.message || 'Failed to update chat status' });
    }
  }

  async listThreads(req: Request, res: Response): Promise<void> {
    try {
      const limitRaw = req.query.limit ? Number(req.query.limit) : undefined;
      const offsetRaw = req.query.offset ? Number(req.query.offset) : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const filters = {
        limit: typeof limitRaw === 'number' && Number.isFinite(limitRaw) ? limitRaw : undefined,
        offset: typeof offsetRaw === 'number' && Number.isFinite(offsetRaw) ? offsetRaw : undefined,
        search
      };
      const threads = await this.listThreadsUseCase.execute(filters);
      res.json({ success: true, data: threads.map((thread) => mapThreadResponse(thread)) });
    } catch (error: any) {
      logger.error('SupportChatController.listThreads error:', error);
      res.status(500).json({ success: false, message: error?.message || 'Failed to list chat threads' });
    }
  }

  async getThreadByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const thread = await this.getThreadUseCase.execute(userId);
      res.json({ success: true, data: mapThreadResponse(thread, true) });
    } catch (error: any) {
      logger.error('SupportChatController.getThreadByUser error:', error);
      res.status(500).json({ success: false, message: error?.message || 'Failed to load chat thread' });
    }
  }

  async sendAdminMessage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { userId } = req.params;
      const result = await this.sendMessageUseCase.execute({
        targetUserId: userId,
        senderId: req.user.userId,
        senderRole: 'admin',
        content: req.body.content
      });

      emitSupportChatMessage(result.thread, result.message);

      res.status(201).json({
        success: true,
        data: {
          message: mapMessageResponse(result.message),
          thread: mapThreadResponse(result.thread)
        }
      });
    } catch (error: any) {
      logger.error('SupportChatController.sendAdminMessage error:', error);
      res.status(500).json({ success: false, message: error?.message || 'Failed to send message' });
    }
  }

  async markThreadReadByAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const thread = await this.markThreadReadUseCase.execute(userId, 'admin');
      if (thread) {
        emitSupportChatThreadUpdate(thread);
      }
      res.json({ success: true, data: thread ? mapThreadResponse(thread) : null });
    } catch (error: any) {
      logger.error('SupportChatController.markThreadReadByAdmin error:', error);
      res.status(500).json({ success: false, message: error?.message || 'Failed to update chat status' });
    }
  }
}
