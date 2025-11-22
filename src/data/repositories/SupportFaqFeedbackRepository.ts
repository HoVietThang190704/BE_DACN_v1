import mongoose from 'mongoose';
import { SupportFaqVoteType } from '../../domain/entities/support/SupportFaq.entity';
import { SupportFaqFeedback, ISupportFaqFeedback } from '../../models/SupportFaqFeedback';

export interface SupportFaqFeedbackResult {
  faqId: string;
  helpful: number;
  notHelpful: number;
  userVote?: SupportFaqVoteType | null;
}

const toObjectId = (value: string) => new mongoose.Types.ObjectId(value);

export class SupportFaqFeedbackRepository {
  async getMany(faqIds: string[], userId?: string): Promise<Map<string, SupportFaqFeedbackResult>> {
    if (!faqIds.length) {
      return new Map();
    }

    const docs = await SupportFaqFeedback.find({ faq_id: { $in: faqIds } }).lean<ISupportFaqFeedback[]>();
    const result = new Map<string, SupportFaqFeedbackResult>();

    docs.forEach((doc) => {
      const feedback: SupportFaqFeedbackResult = {
        faqId: doc.faq_id,
        helpful: doc.helpful_count || 0,
        notHelpful: doc.not_helpful_count || 0,
        userVote: null,
      };

      if (userId) {
        const vote = doc.votes?.find((item) => String(item.user_id) === userId);
        if (vote) {
          feedback.userVote = vote.vote;
        }
      }

      result.set(doc.faq_id, feedback);
    });

    return result;
  }

  async recordVote(faqId: string, userId: string, vote: SupportFaqVoteType): Promise<SupportFaqFeedbackResult> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user identifier');
    }

    const userObjectId = toObjectId(userId);

    let doc = await SupportFaqFeedback.findOne({ faq_id: faqId });
    if (!doc) {
      doc = new SupportFaqFeedback({
        faq_id: faqId,
        helpful_count: 0,
        not_helpful_count: 0,
        votes: [],
      });
    }

    const existingVote = doc.votes.find((item) => item.user_id.equals(userObjectId));

    if (existingVote) {
      if (existingVote.vote === vote) {
        return {
          faqId,
          helpful: doc.helpful_count,
          notHelpful: doc.not_helpful_count,
          userVote: vote,
        };
      }

      if (existingVote.vote === 'helpful' && doc.helpful_count > 0) {
        doc.helpful_count -= 1;
      }
      if (existingVote.vote === 'not_helpful' && doc.not_helpful_count > 0) {
        doc.not_helpful_count -= 1;
      }

      existingVote.vote = vote;
      existingVote.created_at = new Date();
    } else {
      doc.votes.push({ user_id: userObjectId, vote, created_at: new Date() });
    }

    if (vote === 'helpful') {
      doc.helpful_count += 1;
    } else {
      doc.not_helpful_count += 1;
    }

    await doc.save();

    return {
      faqId,
      helpful: doc.helpful_count,
      notHelpful: doc.not_helpful_count,
      userVote: vote,
    };
  }
}
