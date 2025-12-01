import { IChatSupportRepository } from '../../repositories/support/IChatSupportRepository';
import { SupportChatSender, SupportChatThreadEntity } from '../../entities/support/ChatSupport.entity';

export class MarkChatSupportThreadReadUseCase {
  constructor(private readonly chatRepository: IChatSupportRepository) {}

  async execute(userId: string, actor: SupportChatSender): Promise<SupportChatThreadEntity | null> {
    if (!userId?.trim()) {
      throw new Error('Missing user id');
    }
    return this.chatRepository.markAsRead(userId, actor);
  }
}
