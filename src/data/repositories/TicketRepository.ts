import { Ticket } from '../../models/Ticket';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

const toObjectIdOrNull = (value?: string | null) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

const normalizeReference = (value?: unknown) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

export class TicketRepository {
  async create(data: any) {
    try {
      const relatedShopId = toObjectIdOrNull(data.relatedShopId);
      const relatedOrderId = toObjectIdOrNull(data.relatedOrderId);
      const assignedToId = toObjectIdOrNull(data.assignedTo);

      const relatedShopReference = normalizeReference(data.relatedShopReference)
        ?? (!relatedShopId && data.relatedShopId ? String(data.relatedShopId) : null);

      const relatedOrderReference = normalizeReference(data.relatedOrderReference)
        ?? (!relatedOrderId && data.relatedOrderId ? String(data.relatedOrderId) : null);

      const payload: any = {
        title: data.title,
        description: data.description || '',
        type: data.type || 'support',
        priority: data.priority || 'medium',
    status: data.status || 'open',
    created_by: new mongoose.Types.ObjectId(data.createdBy),
    assigned_to: assignedToId,
        related_shop_id: relatedShopId,
        related_shop_reference: relatedShopReference,
        related_order_id: relatedOrderId,
        related_order_reference: relatedOrderReference,
        tags: data.tags || [],
        attachments: data.attachments || []
      };

      const ticketNumber = normalizeReference(data.ticketNumber);
      if (ticketNumber) {
        payload.ticket_number = ticketNumber;
      }

      if (typeof data.isPublic === 'boolean') {
        payload.is_public = data.isPublic;
      }

      const doc = await Ticket.create(payload);
      return doc;
    } catch (error) {
      logger.error('TicketRepository.create error:', error);
      throw new Error('Lỗi khi tạo ticket');
    }
  }

  async findById(id: string) {
    try {
      const doc = await Ticket.findById(id)
        .populate({ path: 'created_by', select: 'name email' })
        .populate({ path: 'assigned_to', select: 'name email' })
        .lean();
      return doc || null;
    } catch (error) {
      logger.error('TicketRepository.findById error:', error);
      throw new Error('Lỗi khi lấy ticket');
    }
  }

  async find(filter: any = {}, limit = 50, offset = 0) {
    try {
      // Populate created_by and assigned_to to include reviewer/creator info
      const docs = await Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate({ path: 'created_by', select: 'name email' })
        .populate({ path: 'assigned_to', select: 'name email' })
        .lean();
      return docs;
    } catch (error) {
      logger.error('TicketRepository.find error:', error);
      throw new Error('Lỗi khi lấy danh sách ticket');
    }
  }

  async assign(id: string, userId: string) {
    try {
      const updated = await Ticket.findByIdAndUpdate(id, { $set: { assigned_to: new mongoose.Types.ObjectId(userId) } }, { new: true })
        .populate({ path: 'created_by', select: 'name email' })
        .populate({ path: 'assigned_to', select: 'name email' })
        .lean();
      return updated || null;
    } catch (error) {
      logger.error('TicketRepository.assign error:', error);
      throw new Error('Lỗi khi phân công ticket');
    }
  }

  async setStatus(id: string, status: string, resolvedBy?: string | null, resolutionMessage?: string | null) {
    try {
      const update: any = { status };
      if (status === 'resolved' || status === 'closed') {
        update.resolved_at = new Date();
        update.resolution_message = resolutionMessage || null;
      }
      const updated = await Ticket.findByIdAndUpdate(id, { $set: update }, { new: true })
        .populate({ path: 'created_by', select: 'name email' })
        .populate({ path: 'assigned_to', select: 'name email' })
        .lean();
      return updated || null;
    } catch (error) {
      logger.error('TicketRepository.setStatus error:', error);
      throw new Error('Lỗi khi cập nhật trạng thái ticket');
    }
  }

  async incrementCommentsCount(ticketId: string, delta = 1) {
    try {
      await Ticket.findByIdAndUpdate(ticketId, { $inc: { comments_count: delta } });
    } catch (error) {
      logger.error('TicketRepository.incrementCommentsCount error:', error);
    }
  }
}
