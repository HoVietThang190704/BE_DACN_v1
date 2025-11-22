import { SupportFaqFeedbackRepository, SupportFaqFeedbackResult } from '../../../data/repositories/SupportFaqFeedbackRepository';
import { SupportFaqVoteType } from '../../entities/support/SupportFaq.entity';

export class VoteSupportFaqUseCase {
  constructor(private readonly repository: SupportFaqFeedbackRepository) {}

  async execute(faqId: string, userId: string, vote: SupportFaqVoteType): Promise<SupportFaqFeedbackResult> {
    if (!faqId) {
      throw new Error('FAQ id is required');
    }
    if (!userId) {
      throw new Error('User id is required');
    }
    if (vote !== 'helpful' && vote !== 'not_helpful') {
      throw new Error('Invalid vote value');
    }

    return this.repository.recordVote(faqId, userId, vote);
  }
}
