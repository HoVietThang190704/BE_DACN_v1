import { TicketRepository } from '../../../data/repositories/TicketRepository';

export class GetTicketsUseCase {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(filter: any = {}, limit = 50, offset = 0) {
    return this.ticketRepository.find(filter, limit, offset);
  }
}
