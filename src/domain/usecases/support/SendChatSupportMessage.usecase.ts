import { IChatSupportRepository } from '../../repositories/support/IChatSupportRepository';
import { IUserRepository } from '../../repositories/IUserRepository';
import { AppendMessageResult } from '../../repositories/support/IChatSupportRepository';
import { SupportChatSender } from '../../entities/support/ChatSupport.entity';

interface SendChatSupportMessageInput {
  targetUserId: string;
  senderId: string;
  senderRole: SupportChatSender;
  content: string;
}

export class SendChatSupportMessageUseCase {
  constructor(
    private readonly chatRepository: IChatSupportRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: SendChatSupportMessageInput): Promise<AppendMessageResult> {
    const trimmedContent = input.content?.trim();
    if (!trimmedContent) {
      throw new Error('Message content is required');
    }

    const targetUser = await this.userRepository.findById(input.targetUserId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    let thread = await this.chatRepository.findByUserId(input.targetUserId);
    if (!thread) {
      thread = await this.chatRepository.createThread({
        userId: input.targetUserId,
        userEmail: targetUser.email,
        userName: typeof (targetUser as any).getDisplayName === 'function'
          ? (targetUser as any).getDisplayName()
          : (targetUser.userName ?? targetUser.email),
        userAvatar: targetUser.avatar ?? null
      });
    }

    let senderName: string | null = null;
    if (input.senderRole === 'user') {
      senderName = typeof (targetUser as any).getDisplayName === 'function'
        ? (targetUser as any).getDisplayName()
        : (targetUser.userName ?? targetUser.email);
    } else {
      const adminUser = await this.userRepository.findById(input.senderId);
      senderName = adminUser
        ? (typeof (adminUser as any).getDisplayName === 'function'
            ? (adminUser as any).getDisplayName()
            : (adminUser.userName ?? adminUser.email))
        : 'Admin';
    }

    return this.chatRepository.appendMessage({
      userId: input.targetUserId,
      content: trimmedContent,
      sender: input.senderRole,
      senderId: input.senderId,
      senderName,
      senderRole: input.senderRole
    });
  }
}
