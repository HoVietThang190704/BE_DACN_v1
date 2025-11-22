import { Request, Response } from 'express';
import { GetSupportFaqsUseCase } from '../../domain/usecases/support/GetSupportFaqs.usecase';
import { SearchSupportFaqsUseCase } from '../../domain/usecases/support/SearchSupportFaqs.usecase';
import { VoteSupportFaqUseCase } from '../../domain/usecases/support/VoteSupportFaq.usecase';
import { SupportFaqVoteType } from '../../domain/entities/support/SupportFaq.entity';
import { logger } from '../../shared/utils/logger';

export class SupportController {
  constructor(
    private readonly getSupportFaqsUseCase: GetSupportFaqsUseCase,
    private readonly searchSupportFaqsUseCase: SearchSupportFaqsUseCase,
    private readonly voteSupportFaqUseCase: VoteSupportFaqUseCase
  ) {}

  async getFaqs(req: Request, res: Response): Promise<void> {
    try {
      const locale = typeof req.query.lang === 'string' ? req.query.lang : undefined;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const userId = req.user?.userId;
      const faqs = await this.getSupportFaqsUseCase.execute({ locale, category, userId });
      res.status(200).json({ success: true, data: faqs });
    } catch (error: any) {
      logger.error('SupportController.getFaqs error:', error);
      res.status(500).json({ success: false, message: error?.message || 'Failed to load FAQs' });
    }
  }

  async searchFaqs(req: Request, res: Response): Promise<void> {
    try {
      const locale = typeof req.query.lang === 'string' ? req.query.lang : undefined;
      const query = typeof req.query.q === 'string' ? req.query.q : '';
      const userId = req.user?.userId;
      const faqs = await this.searchSupportFaqsUseCase.execute(query, locale, userId);
      res.status(200).json({ success: true, data: faqs });
    } catch (error: any) {
      logger.error('SupportController.searchFaqs error:', error);
      res.status(500).json({ success: false, message: error?.message || 'Failed to search FAQs' });
    }
  }

  async voteFaq(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { vote } = req.body as { vote?: SupportFaqVoteType };
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!vote || (vote !== 'helpful' && vote !== 'not_helpful')) {
        res.status(400).json({ success: false, message: 'Invalid vote value' });
        return;
      }

      const result = await this.voteSupportFaqUseCase.execute(id, userId, vote);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      logger.error('SupportController.voteFaq error:', error);
      res.status(500).json({ success: false, message: error?.message || 'Failed to submit feedback' });
    }
  }
}
