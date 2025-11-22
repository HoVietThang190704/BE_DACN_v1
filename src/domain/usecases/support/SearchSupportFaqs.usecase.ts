import { SupportFaq } from '../../entities/support/SupportFaq.entity';
import { SupportFaqRepository } from '../../../data/repositories/SupportFaqRepository';

export class SearchSupportFaqsUseCase {
  constructor(private readonly repository: SupportFaqRepository) {}

  async execute(query: string, locale?: string, userId?: string): Promise<SupportFaq[]> {
    return this.repository.search(query, locale, userId);
  }
}
