import { Request, Response } from 'express';
import { notificationService } from '../../services/notification/NotificationService';
import { Notification } from '../../models/Notification';
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

      // pagination support
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.min(1000, Math.max(10, parseInt(String(req.query.limit || '100'), 10)));
      const skip = (page - 1) * limit;

      let query: any = {};

      // Admins can view all notifications (optionally filtered by userId query)
      if (role === 'admin') {
        if (req.query.userId) {
          query.userId = req.query.userId;
        }
      } else {
        // shop_owner and customer only see their own notifications
        query.userId = userId;
      }

      const docs = await Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
      const total = await Notification.countDocuments(query);
      res.status(200).json({ success: true, data: docs, meta: { page, limit, total } });
    } catch (err: any) {
      logger.error('NotificationController.list error:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }

  async markRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const doc = await Notification.findById(id);
      if (!doc) { res.status(404).json({ success: false, message: 'Not found' }); return; }
      if (String(doc.userId) !== String(userId)) { res.status(403).json({ success: false, message: 'Forbidden' }); return; }
      doc.isRead = true;
      doc.readAt = new Date();
      await doc.save();
      res.status(200).json({ success: true, data: doc });
    } catch (err: any) {
      logger.error('NotificationController.markRead error:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
}

export const notificationController = new NotificationController();
