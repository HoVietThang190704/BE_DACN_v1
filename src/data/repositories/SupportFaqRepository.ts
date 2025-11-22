import { SupportFaq, SupportFaqRecord, SupportedLocale } from '../../domain/entities/support/SupportFaq.entity';
import { supportFaqs } from '../../shared/data/supportFaqs';
import { SupportFaqFeedbackRepository, SupportFaqFeedbackResult } from './SupportFaqFeedbackRepository';

const normalizeLocale = (locale?: string): SupportedLocale => {
  if (!locale) return 'vi';
  const lower = locale.toLowerCase();
  if (lower.startsWith('en')) return 'en';
  return 'vi';
};

export class SupportFaqRepository {
  constructor(
    private readonly dataSource: SupportFaqRecord[] = supportFaqs,
    private readonly feedbackRepository?: SupportFaqFeedbackRepository
  ) {}

  async findAll(locale?: string, category?: string, userId?: string): Promise<SupportFaq[]> {
    const loc = normalizeLocale(locale);
    const filtered = category
      ? this.dataSource.filter((faq) => faq.category === category)
      : this.dataSource;

    const mapped = filtered.map((faq) => this.mapFaq(faq, loc));
    return this.applyFeedback(mapped, userId);
  }

  async search(query: string, locale?: string, userId?: string): Promise<SupportFaq[]> {
    const loc = normalizeLocale(locale);
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return this.findAll(loc, undefined, userId);
    }

    const matched = this.dataSource
      .filter((faq) => {
        const questionMatch = Object.values(faq.question).some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );
        const answerMatch = Object.values(faq.answer).some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );
        const keywordMatch = faq.keywords?.some((keyword) =>
          keyword.toLowerCase().includes(normalizedQuery)
        );
        return questionMatch || answerMatch || keywordMatch;
      })
      .map((faq) => this.mapFaq(faq, loc));

    return this.applyFeedback(matched, userId);
  }

  private mapFaq(record: SupportFaqRecord, locale: SupportedLocale): SupportFaq {
    return {
      id: record.id,
      category: record.category,
      question: record.question[locale] ?? record.question.vi,
      answer: record.answer[locale] ?? record.answer.vi,
      helpful: record.helpful,
      notHelpful: record.notHelpful,
    };
  }

  private async applyFeedback(faqs: SupportFaq[], userId?: string): Promise<SupportFaq[]> {
    if (!this.feedbackRepository || !faqs.length) {
      return faqs;
    }

    const feedbackMap = await this.feedbackRepository.getMany(
      faqs.map((faq) => faq.id),
      userId
    );

    return faqs.map((faq) => this.mergeFeedback(faq, feedbackMap.get(faq.id)));
  }

  private mergeFeedback(faq: SupportFaq, feedback?: SupportFaqFeedbackResult): SupportFaq {
    if (!feedback) {
      return faq;
    }

    return {
      ...faq,
      helpful: feedback.helpful,
      notHelpful: feedback.notHelpful,
      userVote: feedback.userVote ?? null,
    };
  }
}
