import mongoose, { Schema, Document } from 'mongoose';
import { SupportFaqVoteType } from '../domain/entities/support/SupportFaq.entity';

interface SupportFaqVote {
  user_id: mongoose.Types.ObjectId;
  vote: SupportFaqVoteType;
  created_at: Date;
}

export interface ISupportFaqFeedback extends Document {
  faq_id: string;
  helpful_count: number;
  not_helpful_count: number;
  votes: SupportFaqVote[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportFaqVoteSchema = new Schema<SupportFaqVote>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vote: { type: String, enum: ['helpful', 'not_helpful'], required: true },
  created_at: { type: Date, default: Date.now },
});

const SupportFaqFeedbackSchema = new Schema<ISupportFaqFeedback>(
  {
    faq_id: { type: String, required: true, unique: true, index: true },
    helpful_count: { type: Number, default: 0 },
    not_helpful_count: { type: Number, default: 0 },
    votes: { type: [SupportFaqVoteSchema], default: [] },
  },
  { timestamps: true }
);

export const SupportFaqFeedback = mongoose.model<ISupportFaqFeedback>(
  'SupportFaqFeedback',
  SupportFaqFeedbackSchema
);
