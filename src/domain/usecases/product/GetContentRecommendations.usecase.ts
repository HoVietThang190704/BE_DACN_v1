import { IProductRepository } from '../../repositories/IProductRepository';
import { ProductEntity } from '../../entities/Product.entity';
import { ContentRecommenderService, RecommenderHit } from '../../../services/ai/ContentRecommenderService';
import { logger } from '../../../shared/utils/logger';

export interface HydratedRecommendation {
  id: string;
  score: number;
  product: ProductEntity;
  fallback?: {
    name?: string;
    price?: number;
    image?: string | null;
  };
}

export interface ProductRecommendationPayload {
  source: ProductEntity;
  recommendations: HydratedRecommendation[];
}

export interface TextRecommendationPayload {
  query: string;
  recommendations: HydratedRecommendation[];
}

export class GetContentRecommendationsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly recommenderService: ContentRecommenderService
  ) {}

  async recommendByProduct(productId: string, limit: number = 6): Promise<ProductRecommendationPayload> {
    if (!productId) {
      throw new Error('Mã sản phẩm là bắt buộc');
    }

    const [product, hits] = await Promise.all([
      this.ensureProduct(productId),
      this.fetchByProduct(productId, limit),
    ]);

    const recommendations = await this.hydrateRecommendations(hits);
    return {
      source: product,
      recommendations,
    };
  }

  async recommendByText(text: string, limit: number = 6): Promise<TextRecommendationPayload> {
    const query = text?.trim();
    if (!query) {
      throw new Error('Nội dung tìm kiếm là bắt buộc');
    }

    const hits = await this.fetchByText(query, limit);
    const recommendations = await this.hydrateRecommendations(hits);

    return {
      query,
      recommendations,
    };
  }

  private async ensureProduct(productId: string): Promise<ProductEntity> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }
    return product;
  }

  private async fetchByProduct(productId: string, limit: number): Promise<RecommenderHit[]> {
    if (!this.recommenderService.isEnabled()) {
      throw new Error('Dịch vụ gợi ý sản phẩm chưa được cấu hình.');
    }
    return this.recommenderService.recommendByProduct(productId, limit);
  }

  private async fetchByText(text: string, limit: number): Promise<RecommenderHit[]> {
    if (!this.recommenderService.isEnabled()) {
      throw new Error('Dịch vụ gợi ý sản phẩm chưa được cấu hình.');
    }
    return this.recommenderService.recommendByText(text, limit);
  }

  private async hydrateRecommendations(hits: RecommenderHit[]): Promise<HydratedRecommendation[]> {
    if (!hits.length) {
      return [];
    }

    const uniqueIds = Array.from(new Set(hits.map((hit) => hit.id).filter(Boolean)));
    const products = await Promise.all(uniqueIds.map((id) => this.productRepository.findById(id).catch((error) => {
      logger.warn('[GetContentRecommendationsUseCase] Failed to hydrate product', { id, error: error instanceof Error ? error.message : error });
      return null;
    })));

    const productMap = new Map<string, ProductEntity>();
    uniqueIds.forEach((id, index) => {
      const product = products[index];
      if (product) {
        productMap.set(id, product);
      } else {
        logger.warn('[GetContentRecommendationsUseCase] Missing product in database for recommendation', { id });
      }
    });

    return hits
      .map((hit) => {
        const product = productMap.get(hit.id);
        if (!product) {
          return null;
        }
        return {
          id: hit.id,
          score: hit.score,
          product,
          fallback: {
            name: hit.name,
            price: hit.price,
            image: hit.image,
          },
        } as HydratedRecommendation;
      })
      .filter((item): item is HydratedRecommendation => Boolean(item));
  }
}
