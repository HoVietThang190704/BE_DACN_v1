import { SupportFaq } from '../../entities/support/SupportFaq.entity';
import { SupportFaqRepository } from '../../../data/repositories/SupportFaqRepository';

export class GetSupportFaqsUseCase {
  constructor(private readonly repository: SupportFaqRepository) {}

  async execute(params: { locale?: string; category?: string; userId?: string } = {}): Promise<SupportFaq[]> {
    const { locale, category, userId } = params;
    return this.repository.findAll(locale, category, userId);
  }
}
