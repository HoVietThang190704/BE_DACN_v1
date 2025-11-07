import { Request, Response } from 'express';
import { CreateTicketUseCase } from '../../domain/usecases/ticket/CreateTicket.usecase';
import { GetTicketsUseCase } from '../../domain/usecases/ticket/GetTickets.usecase';
import { GetTicketByIdUseCase } from '../../domain/usecases/ticket/GetTicketById.usecase';
import { AssignTicketUseCase } from '../../domain/usecases/ticket/AssignTicket.usecase';
import { UpdateTicketStatusUseCase } from '../../domain/usecases/ticket/UpdateTicketStatus.usecase';
import { TicketCommentRepository } from '../../data/repositories/TicketCommentRepository';
import { TicketRepository } from '../../data/repositories/TicketRepository';
import { TicketMapper } from '../dto/ticket/Ticket.dto';
import { logger } from '../../shared/utils/logger';

export class TicketController {
  constructor(
    private createTicketUseCase: CreateTicketUseCase,
    private getTicketsUseCase: GetTicketsUseCase,
    private getTicketByIdUseCase: GetTicketByIdUseCase,
    private ticketCommentRepository?: TicketCommentRepository,
    private ticketRepository?: TicketRepository,
    private assignTicketUseCase?: AssignTicketUseCase,
    private updateTicketStatusUseCase?: UpdateTicketStatusUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as any;
      const createdBy = req.user?.userId;
      if (!createdBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const ticket = await this.createTicketUseCase.execute({ ...body, createdBy });
      res.status(201).json({ success: true, message: 'Ticket created', data: TicketMapper.toDTO(ticket) });
    } catch (error: any) {
      logger.error('TicketController.create error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi tạo ticket' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(String(req.query.limit || '50'), 10);
      const offset = parseInt(String(req.query.offset || '0'), 10);
      const filter: any = {};
      // if user not admin, show only own tickets
      const userRole = req.user?.role;
      if (userRole !== 'admin') {
        filter.created_by = req.user?.userId;
      } else {
        // admin filters
        if (req.query.status) filter.status = String(req.query.status);
        if (req.query.assignedTo) filter.assigned_to = String(req.query.assignedTo);
      }

      const docs = await this.getTicketsUseCase.execute(filter, limit, offset);
      const data = docs.map((d: any) => TicketMapper.toDTO(d));
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error('TicketController.list error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi lấy danh sách ticket' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await this.getTicketByIdUseCase.execute(id);
      if (!doc) {
        res.status(404).json({ success: false, message: 'Không tìm thấy ticket' });
        return;
      }
      res.status(200).json({ success: true, data: TicketMapper.toDTO(doc) });
    } catch (error: any) {
      logger.error('TicketController.getById error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi lấy ticket' });
    }
  }

  async addComment(req: Request, res: Response): Promise<void> {
    try {
      if (!this.ticketCommentRepository) {
        res.status(500).json({ success: false, message: 'Not implemented' });
        return;
      }
      const { id } = req.params;
      const { message, attachments, isInternal } = req.body as any;
      const authorId = req.user?.userId;
      if (!authorId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      // Only admin or agent can create internal comments
      const role = req.user?.role;
      if (isInternal && role !== 'admin' && role !== 'agent') {
        res.status(403).json({ success: false, message: 'Forbidden to create internal comment' });
        return;
      }
      const comment = await this.ticketCommentRepository.create({ ticketId: id, authorId, message, attachments, isInternal });
      // increment comments count
      if (this.ticketRepository) {
        await this.ticketRepository.incrementCommentsCount(id, 1);
      }
      res.status(201).json({ success: true, message: 'Comment added', data: comment });
    } catch (error: any) {
      logger.error('TicketController.addComment error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi thêm comment' });
    }
  }

  async assign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body as any;
      const userRole = req.user?.role;
      const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      // only admin can assign (route also protected but double-check)
  if (userRole !== 'admin') { res.status(403).json({ success: false, message: 'Only admin can assign tickets' }); return; }
  if (!this.assignTicketUseCase) { res.status(500).json({ success: false, message: 'Not implemented' }); return; }
      const updated = await this.assignTicketUseCase.execute(id, assignedTo);
      res.status(200).json({ success: true, message: 'Ticket assigned', data: TicketMapper.toDTO(updated) });
    } catch (error: any) {
      logger.error('TicketController.assign error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi gán ticket' });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, resolutionMessage } = req.body as any;
      const userRole = req.user?.role;
      const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
  if (!this.updateTicketStatusUseCase) { res.status(500).json({ success: false, message: 'Not implemented' }); return; }

      // fetch ticket to check assigned_to
      const ticket = await this.getTicketByIdUseCase.execute(id);
  if (!ticket) { res.status(404).json({ success: false, message: 'Ticket not found' }); return; }

      const isAssignedUser = ticket.assigned_to && String(ticket.assigned_to) === String(userId);
      if (userRole !== 'admin' && !isAssignedUser && userRole !== 'agent') {
        res.status(403).json({ success: false, message: 'Only admin or assigned agent can change status' }); return; }

      const resolvedBy = (status === 'resolved' || status === 'closed') ? userId : undefined;
      const updated = await this.updateTicketStatusUseCase.execute(id, status, resolvedBy, resolutionMessage);
      res.status(200).json({ success: true, message: 'Ticket status updated', data: TicketMapper.toDTO(updated) });
    } catch (error: any) {
      logger.error('TicketController.updateStatus error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi khi cập nhật trạng thái ticket' });
    }
  }
}
