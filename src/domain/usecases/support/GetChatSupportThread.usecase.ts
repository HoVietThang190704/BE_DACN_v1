import { IChatSupportRepository } from '../../repositories/support/IChatSupportRepository';
import { IUserRepository } from '../../repositories/IUserRepository';
import { SupportChatThreadEntity } from '../../entities/support/ChatSupport.entity';

export class GetChatSupportThreadUseCase {
  constructor(
    private readonly chatRepository: IChatSupportRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(userId: string): Promise<SupportChatThreadEntity> {
    const targetUserId = userId?.trim();
    if (!targetUserId) {
      throw new Error('Missing user id');
    }

    let thread = await this.chatRepository.findByUserId(targetUserId, { includeMessages: true });
    if (thread) {
      return thread;
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.chatRepository.createThread({
      userId: targetUserId,
      userEmail: user.email,
      userName: typeof (user as any).getDisplayName === 'function'
        ? (user as any).getDisplayName()
        : (user.userName ?? user.email),
      userAvatar: user.avatar ?? null
    });

    thread = await this.chatRepository.findByUserId(targetUserId, { includeMessages: true });
    if (!thread) {
      throw new Error('Unable to load chat thread');
    }
    return thread;
  }
}
