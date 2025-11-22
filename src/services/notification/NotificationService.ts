import { Notification, INotification } from '../../models/Notification';
import { User } from '../../models/users/User';
import { Shop } from '../../models/Shop';
import { getIO } from '../socket/socketManager';
import { logger } from '../../shared/utils/logger';
import mongoose, { FilterQuery } from 'mongoose';

export interface SendNotificationInput {
  audience: 'user' | 'shop' | 'all_users' | 'all_shops';
  targetId?: string; // when audience === 'user' or 'shop'
  type?: string;
  title: string;
  message: string;
  payload?: any;
}

export type NotificationStatusFilter = 'all' | 'read' | 'unread';

export interface ListNotificationsInput {
  userId: string;
  role: string;
  targetUserId?: string;
  page?: number;
  limit?: number;
  status?: NotificationStatusFilter;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  hasUnread: boolean;
  latestNotification: NotificationDTO | null;
  latestUnreadAt: Date | null;
}

export interface NotificationListResult {
  items: NotificationDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
}

export interface NotificationDTO {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  payload: any;
  isRead: boolean;
  readAt: Date | null | undefined;
  createdAt: Date | undefined;
}

export class NotificationService {
  private normalizeObjectId(value?: string | mongoose.Types.ObjectId | null) {
    if (!value) {
      return null;
    }
    if (value instanceof mongoose.Types.ObjectId) {
      return value;
    }
    if (mongoose.Types.ObjectId.isValid(value)) {
      return new mongoose.Types.ObjectId(value);
    }
    return null;
  }

  private mapNotification(doc: (INotification & { _id: mongoose.Types.ObjectId }) | null): NotificationDTO | null {
    if (!doc) {
      return null;
    }
    return {
      id: String(doc._id),
      userId: String(doc.userId),
      type: doc.type || 'system',
      title: doc.title,
      message: doc.message,
      payload: doc.payload ?? null,
      isRead: Boolean(doc.isRead),
      readAt: doc.readAt ?? null,
      createdAt: doc.createdAt,
    };
  }

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

  async listUserNotifications(options: ListNotificationsInput): Promise<NotificationListResult> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(5, options.limit ?? 10));
    const targetId = options.role === 'admin' && options.targetUserId ? options.targetUserId : options.userId;
    const normalizedUserId = this.normalizeObjectId(targetId);

    if (!normalizedUserId) {
      throw new Error('Invalid user identifier');
    }

    const baseQuery: FilterQuery<INotification> = { userId: normalizedUserId };
    const listQuery: FilterQuery<INotification> = { ...baseQuery };
    if (options.status === 'read') {
      listQuery.isRead = true;
    }
    if (options.status === 'unread') {
      listQuery.isRead = false;
    }

    const skip = (page - 1) * limit;

    const [docs, total, unreadCount] = await Promise.all([
      Notification.find(listQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(listQuery),
      Notification.countDocuments({ ...baseQuery, isRead: false }),
    ]);

    const items = docs.map((doc) => this.mapNotification(doc as any)).filter(Boolean) as NotificationDTO[];
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        unreadCount,
      },
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationDTO | null> {
    const normalizedUserId = this.normalizeObjectId(userId);
    const normalizedNotificationId = this.normalizeObjectId(notificationId);

    if (!normalizedUserId || !normalizedNotificationId) {
      throw new Error('Invalid identifier supplied');
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: normalizedNotificationId, userId: normalizedUserId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    ).lean();

    return this.mapNotification(updated as any);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const normalizedUserId = this.normalizeObjectId(userId);
    if (!normalizedUserId) {
      throw new Error('Invalid user identifier');
    }

    const result = await Notification.updateMany(
      { userId: normalizedUserId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return (result && 'modifiedCount' in result ? result.modifiedCount : (result as any)?.nModified) || 0;
  }

  async getSummary(userId: string): Promise<NotificationSummary> {
    const normalizedUserId = this.normalizeObjectId(userId);
    if (!normalizedUserId) {
      throw new Error('Invalid user identifier');
    }

    const [total, unread, latest, latestUnread] = await Promise.all([
      Notification.countDocuments({ userId: normalizedUserId }),
      Notification.countDocuments({ userId: normalizedUserId, isRead: false }),
      Notification.findOne({ userId: normalizedUserId }).sort({ createdAt: -1 }).lean(),
      Notification.findOne({ userId: normalizedUserId, isRead: false }).sort({ createdAt: -1 }).lean(),
    ]);

    return {
      total,
      unread,
      hasUnread: unread > 0,
      latestNotification: this.mapNotification(latest as any),
      latestUnreadAt: latestUnread?.createdAt ?? null,
    };
  }
}

export const notificationService = new NotificationService();
