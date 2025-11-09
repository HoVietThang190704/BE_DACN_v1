import { Notification } from '../../models/Notification';
import { User } from '../../models/users/User';
import { Shop } from '../../models/Shop';
import { getIO } from '../socket/socketManager';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export interface SendNotificationInput {
  audience: 'user' | 'shop' | 'all_users' | 'all_shops';
  targetId?: string; // when audience === 'user' or 'shop'
  type?: string;
  title: string;
  message: string;
  payload?: any;
}

export class NotificationService {
  // For simplicity: persist only when audience === 'user' (single user)
  async send(input: SendNotificationInput) {
    try {
      const io = getIO();

      const notificationDto = {
        id: `notif_${Date.now()}`,
        type: input.type || 'system',
        title: input.title,
        message: input.message,
        payload: input.payload || null,
        createdAt: new Date().toISOString()
      } as any;

      if (input.audience === 'user' && input.targetId) {
        // persist to DB for user
        const doc = await Notification.create({
          userId: new mongoose.Types.ObjectId(input.targetId),
          type: input.type,
          title: input.title,
          message: input.message,
          payload: input.payload || null
        });

        const dto = { id: doc._id.toString(), title: doc.title, message: doc.message, payload: doc.payload, createdAt: doc.createdAt };
        io.to(`user:${input.targetId}`).emit('notification', dto);
        return dto;
      }

      // shop or broadcasts: only emit via websocket (no DB write)
      if (input.audience === 'shop' && input.targetId) {
        // targetId can be either a userId (shop owner) or a shopId
        // Try user lookup first
        try {
          const maybeUser = await User.findById(input.targetId).lean();
          if (maybeUser && maybeUser.role === 'shop_owner') {
            io.to(`shop:${String(maybeUser._id)}`).emit('notification', notificationDto);
            return notificationDto;
          }
        } catch (e) {
          // ignore and try shop lookup
        }

        // Try shop lookup
        try {
          const shop = await Shop.findById(input.targetId).lean();
          if (!shop) {
            logger.warn('NotificationService: shop not found for id ' + input.targetId);
            return null;
          }
          const ownerId = shop.owner_id;
          if (!ownerId) {
            logger.warn('NotificationService: shop has no owner: ' + input.targetId);
            return null;
          }
          io.to(`shop:${String(ownerId)}`).emit('notification', notificationDto);
          return notificationDto;
        } catch (e) {
          logger.error('NotificationService.shop lookup error', e);
          return null;
        }
      }

      if (input.audience === 'all_users') {
        try {
          // find customers and create persistent notifications for each, then emit
          const customers = await User.find({ role: 'customer' }).select('_id').lean();
          if (!customers || customers.length === 0) return { ...notificationDto, sentTo: 0 } as any;

          const docs = customers.map((c: any) => ({
            userId: c._id,
            type: input.type || 'system',
            title: input.title,
            message: input.message,
            payload: input.payload || null,
          }));

          // batch insert so offline users can see the notification later
          const inserted = await Notification.insertMany(docs);

          // emit each saved doc to the user's room (include the assigned _id and createdAt)
          for (const doc of inserted) {
            try {
              const dto = { id: String(doc._id), title: doc.title, message: doc.message, payload: doc.payload, createdAt: doc.createdAt };
              io.to(`user:${String(doc.userId)}`).emit('notification', dto);
            } catch (e) {
              logger.warn('NotificationService: emit to user room failed for ' + String(doc.userId), e);
            }
          }

          return { ...notificationDto, sentTo: inserted.length, persisted: inserted.length } as any;
        } catch (e) {
          logger.error('NotificationService.all_users error', e);
          return null;
        }
      }

      if (input.audience === 'all_shops') {
        try {
          // find all shop owners and persist notification for each
          const owners = await User.find({ role: 'shop_owner' }).select('_id').lean();
          if (!owners || owners.length === 0) return { ...notificationDto, sentTo: 0 } as any;

          const docs = owners.map((o: any) => ({
            userId: o._id,
            type: input.type || 'system',
            title: input.title,
            message: input.message,
            payload: input.payload || null,
          }));

          const inserted = await Notification.insertMany(docs);

          for (const doc of inserted) {
            try {
              const dto = { id: String(doc._id), title: doc.title, message: doc.message, payload: doc.payload, createdAt: doc.createdAt };
              io.to(`user:${String(doc.userId)}`).emit('notification', dto);
            } catch (e) {
              logger.warn('NotificationService: emit to shop owner room failed for ' + String(doc.userId), e);
            }
          }

          return { ...notificationDto, sentTo: inserted.length, persisted: inserted.length } as any;
        } catch (e) {
          logger.error('NotificationService.all_shops error', e);
          return null;
        }
      }

      logger.warn('NotificationService.send: invalid audience or missing targetId');
      return null;
    } catch (err) {
      logger.error('NotificationService.send error:', err);
      return null;
    }
  }
}

export const notificationService = new NotificationService();
