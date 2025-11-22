import { Request, Response } from 'express';
import { notificationService, NotificationStatusFilter } from '../../services/notification/NotificationService';
import { logger } from '../../shared/utils/logger';

export class NotificationController {
  async send(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as any;
      const { audience, targetId, type, title, message, payload } = body;
      if (!audience || !title || !message) {
        res.status(400).json({ success: false, message: 'Missing audience/title/message' });
        return;
      }

      const result = await notificationService.send({ audience, targetId, type, title, message, payload });
      if (!result) {
        res.status(400).json({ success: false, message: 'Failed to send notification' });
        return;
      }
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      logger.error('NotificationController.send error:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }

  // admin endpoint to broadcast to all users or all shops
  async broadcast(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as any;
      const { audience, type, title, message, payload } = body;
      if (!audience || !title || !message) {
        res.status(400).json({ success: false, message: 'Missing audience/title/message' });
        return;
      }
      if (audience !== 'all_users' && audience !== 'all_shops') {
        res.status(400).json({ success: false, message: 'Invalid audience for broadcast' });
        return;
      }

      const result = await notificationService.send({ audience, type, title, message, payload });
      if (!result) {
        res.status(400).json({ success: false, message: 'Failed to broadcast notification' });
        return;
      }
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      logger.error('NotificationController.broadcast error:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
  // user endpoint to list their notifications
  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(100, Math.max(5, parseInt(String(req.query.limit ?? '10'), 10)));
      const rawStatus = String(req.query.status ?? 'all').toLowerCase() as NotificationStatusFilter;
      const status: NotificationStatusFilter = ['all', 'read', 'unread'].includes(rawStatus) ? rawStatus : 'all';
      const targetUserId = role === 'admin' ? (req.query.userId as string | undefined) : undefined;

      const result = await notificationService.listUserNotifications({
        userId,
        role,
        targetUserId,
        page,
        limit,
        status,
      });

      res.status(200).json({ success: true, data: result.items, meta: result.meta });
    } catch (err: any) {
      logger.error('NotificationController.list error:', err);
      const status = err?.message?.toLowerCase().includes('invalid') ? 400 : 500;
      res.status(status).json({ success: false, message: err?.message || 'Internal error' });
    }
  }

  async markRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const updated = await notificationService.markAsRead(userId, id);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Not found' });
        return;
      }

      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      logger.error('NotificationController.markRead error:', err);
      const status = err?.message?.toLowerCase().includes('invalid') ? 400 : 500;
      res.status(status).json({ success: false, message: err?.message || 'Internal error' });
    }
  }

  async markAllRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const updated = await notificationService.markAllAsRead(userId);
      res.status(200).json({ success: true, data: { updated } });
    } catch (err: any) {
      logger.error('NotificationController.markAllRead error:', err);
      const status = err?.message?.toLowerCase().includes('invalid') ? 400 : 500;
      res.status(status).json({ success: false, message: err?.message || 'Internal error' });
    }
  }

  async summary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const data = await notificationService.getSummary(userId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      logger.error('NotificationController.summary error:', err);
      const status = err?.message?.toLowerCase().includes('invalid') ? 400 : 500;
      res.status(status).json({ success: false, message: err?.message || 'Internal error' });
    }
  }
}

export const notificationController = new NotificationController();
