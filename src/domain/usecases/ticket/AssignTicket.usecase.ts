import { TicketRepository } from '../../../data/repositories/TicketRepository';

export class AssignTicketUseCase {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(ticketId: string, assigneeId: string) {
    return this.ticketRepository.assign(ticketId, assigneeId);
  }
}
