import { TicketRepository } from '../../../data/repositories/TicketRepository';

export class UpdateTicketStatusUseCase {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(ticketId: string, status: string, resolvedBy?: string | null, resolutionMessage?: string | null) {
    return this.ticketRepository.setStatus(ticketId, status, resolvedBy || undefined, resolutionMessage || undefined);
  }
}
