import { Ticket } from '../../models/Ticket';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export class TicketRepository {
  async create(data: any) {
    try {
      const doc = await Ticket.create({
        ticket_number: data.ticketNumber || null,
        title: data.title,
        description: data.description || '',
        type: data.type || 'support',
        priority: data.priority || 'medium',
        status: data.status || 'open',
        created_by: new mongoose.Types.ObjectId(data.createdBy),
        assigned_to: data.assignedTo ? new mongoose.Types.ObjectId(data.assignedTo) : null,
        related_shop_id: data.relatedShopId ? new mongoose.Types.ObjectId(data.relatedShopId) : null,
        related_order_id: data.relatedOrderId ? new mongoose.Types.ObjectId(data.relatedOrderId) : null,
        tags: data.tags || [],
        attachments: data.attachments || []
      });
      return doc;
    } catch (error) {
      logger.error('TicketRepository.create error:', error);
      throw new Error('Lỗi khi tạo ticket');
    }
  }

  async findById(id: string) {
    try {
      const doc = await Ticket.findById(id).lean();
      return doc || null;
    } catch (error) {
      logger.error('TicketRepository.findById error:', error);
      throw new Error('Lỗi khi lấy ticket');
    }
  }

  async find(filter: any = {}, limit = 50, offset = 0) {
    try {
      const docs = await Ticket.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
      return docs;
    } catch (error) {
      logger.error('TicketRepository.find error:', error);
      throw new Error('Lỗi khi lấy danh sách ticket');
    }
  }

  async assign(id: string, userId: string) {
    try {
      const updated = await Ticket.findByIdAndUpdate(id, { $set: { assigned_to: new mongoose.Types.ObjectId(userId) } }, { new: true }).lean();
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
      const updated = await Ticket.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
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
