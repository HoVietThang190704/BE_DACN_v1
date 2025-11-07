import { TicketRepository } from '../../../data/repositories/TicketRepository';

export class GetTicketByIdUseCase {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(id: string) {
    return this.ticketRepository.findById(id);
  }
}
