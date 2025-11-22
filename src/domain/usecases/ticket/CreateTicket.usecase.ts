import { TicketRepository } from '../../../data/repositories/TicketRepository';
import { logger } from '../../../shared/utils/logger';

export type CreateTicketDTO = {
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  relatedShopId?: string;
  relatedOrderId?: string;
  relatedShopReference?: string;
  relatedOrderReference?: string;
  attachments?: any[];
  isPublic?: boolean;
  createdBy: string;
};

export class CreateTicketUseCase {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(input: CreateTicketDTO) {
    // minimal validation here; route-level zod handles most
    const data: any = {
      title: input.title,
      description: input.description || '',
      type: input.type || 'support',
      priority: input.priority || 'medium',
      createdBy: input.createdBy,
      relatedShopId: input.relatedShopId,
      relatedOrderId: input.relatedOrderId,
      relatedShopReference: input.relatedShopReference,
      relatedOrderReference: input.relatedOrderReference,
      attachments: input.attachments || [],
      isPublic: input.isPublic ?? true
    };

    const ticket = await this.ticketRepository.create(data);
    logger.info(`Ticket created: ${ticket._id} - ${ticket.title}`);
    return ticket;
  }
}
