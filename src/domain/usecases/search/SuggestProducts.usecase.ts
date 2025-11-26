import { IProductRepository } from '../../repositories/IProductRepository';
import { ElasticsearchService, ProductSuggestion } from '../../../services/search/elasticsearch.service';
import { logger } from '../../../shared/utils/logger';

const MIN_LENGTH = 1;
const DEFAULT_LIMIT = 8;

export class SuggestProductsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly elasticsearchService?: ElasticsearchService
  ) {}

  async execute(text: string, limit: number = DEFAULT_LIMIT): Promise<ProductSuggestion[]> {
    const keyword = (text ?? '').trim();
    if (keyword.length < MIN_LENGTH) {
      return [];
    }
    // Try Elasticsearch first and then fill from Mongo if ES returned fewer than requested
    let final: ProductSuggestion[] = [];

    if (this.elasticsearchService?.isEnabled()) {
      try {
        const esItems = await this.elasticsearchService.suggestProducts(keyword, limit);
        final.push(...esItems.slice(0, limit));
      } catch (error) {
        logger.warn('[SuggestProductsUseCase] Elasticsearch suggest failed, will fallback to Mongo', error);
      }
    }

    if (final.length < limit) {
      try {
        // Use a slightly larger fetch so we can merge and dedupe
        const fallbackLimit = Math.max(limit * 2, limit + 5);
        const fallback = await this.productRepository.search(keyword, { page: 1, limit: fallbackLimit });

        const existing = new Set(final.map(f => String(f.id)));
        for (const p of fallback.products) {
          if (final.length >= limit) break;
          if (existing.has(String(p.id))) continue;
          existing.add(String(p.id));
          final.push({ id: p.id, name: p.name, price: p.price, image: p.images?.[0] });
        }
      } catch (err) {
        logger.warn('[SuggestProductsUseCase] fallback Mongo suggestion failed', err);
      }
    }

    return final.slice(0, limit);
  }
}
