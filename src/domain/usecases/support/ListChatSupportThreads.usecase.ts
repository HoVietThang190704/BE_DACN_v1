import { IChatSupportRepository, ListThreadsFilters } from '../../repositories/support/IChatSupportRepository';
import { SupportChatThreadEntity } from '../../entities/support/ChatSupport.entity';

export class ListChatSupportThreadsUseCase {
  constructor(private readonly chatRepository: IChatSupportRepository) {}

  async execute(filters?: ListThreadsFilters): Promise<SupportChatThreadEntity[]> {
    return this.chatRepository.listThreads(filters);
  }
}
