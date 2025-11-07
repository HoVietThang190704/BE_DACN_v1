import { TicketComment } from '../../models/TicketComment';
import { logger } from '../../shared/utils/logger';

export class TicketCommentRepository {
  async create(data: any) {
    try {
      const doc = await TicketComment.create({
        ticket_id: data.ticketId,
        author_id: data.authorId,
        message: data.message,
        attachments: data.attachments || [],
        is_internal: data.isInternal || false
      });
      return doc;
    } catch (error) {
      logger.error('TicketCommentRepository.create error:', error);
      throw new Error('Lỗi khi tạo comment');
    }
  }

  async findByTicket(ticketId: string, limit = 100, offset = 0) {
    try {
      const docs = await TicketComment.find({ ticket_id: ticketId }).sort({ createdAt: 1 }).skip(offset).limit(limit).lean();
      return docs;
    } catch (error) {
      logger.error('TicketCommentRepository.findByTicket error:', error);
      throw new Error('Lỗi khi lấy comment');
    }
  }
}
