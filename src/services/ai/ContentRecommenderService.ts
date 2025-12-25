import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';

export interface RecommenderHit {
  id: string;
  name?: string;
  price?: number;
  image?: string | null;
  score: number;
}

interface ProductRecommendResponse {
  recommendations?: Array<{
    id?: string;
    name?: string;
    price?: number;
    image?: string | null;
    score?: number;
  }>;
}

export class ContentRecommenderService {
  private readonly client: AxiosInstance | null;
  private readonly baseUrl: string;

  constructor(baseUrl: string = config.RECOMMENDER_BASE_URL) {
    this.baseUrl = (baseUrl || '').replace(/\/$/, '');
    if (!this.baseUrl) {
      logger.warn('[ContentRecommenderService] RECOMMENDER_BASE_URL is not configured');
      this.client = null;
    } else {
      this.client = axios.create({
        baseURL: this.baseUrl,
        timeout: Math.max(1000, config.RECOMMENDER_TIMEOUT_MS || 5000),
      });
      logger.info(`[ContentRecommenderService] Using ${this.baseUrl}`);
    }
  }

  isEnabled(): boolean {
    return Boolean(this.client);
  }

  async recommendByProduct(productId: string, limit: number = 6): Promise<RecommenderHit[]> {
    if (!productId) {
      throw new Error('Mã sản phẩm là bắt buộc');
    }
    const client = this.ensureClient();
    const k = this.normalizeLimit(limit);

    try {
      const { data } = await client.get<ProductRecommendResponse>(`/recommend/${encodeURIComponent(productId)}`, {
        params: { k },
      });
      return this.mapResponse(data);
    } catch (error: unknown) {
      throw this.handleError(error, 'Không thể lấy gợi ý sản phẩm tương tự');
    }
  }

  async recommendByText(text: string, limit: number = 6): Promise<RecommenderHit[]> {
    const query = text?.trim();
    if (!query) {
      throw new Error('Từ khóa tìm kiếm là bắt buộc');
    }
    const client = this.ensureClient();
    const k = this.normalizeLimit(limit);

    try {
      const { data } = await client.get<ProductRecommendResponse>('/recommend_by_text', {
        params: { text: query, k },
      });
      return this.mapResponse(data);
    } catch (error: unknown) {
      throw this.handleError(error, 'Không thể lấy gợi ý theo nội dung mô tả');
    }
  }

  private ensureClient(): AxiosInstance {
    if (!this.client) {
      throw new Error('Dịch vụ gợi ý chưa được cấu hình. Vui lòng thiết lập RECOMMENDER_BASE_URL.');
    }
    return this.client;
  }

  private mapResponse(payload?: ProductRecommendResponse): RecommenderHit[] {
    if (!payload || !Array.isArray(payload.recommendations)) {
      return [];
    }
    return payload.recommendations
      .map((item) => ({
        id: item.id ? String(item.id) : '',
        name: item.name,
        price: item.price,
        image: item.image,
        score: typeof item.score === 'number' ? item.score : 0,
      }))
      .filter((entry) => Boolean(entry.id));
  }

  private normalizeLimit(value?: number): number {
    if (!value || Number.isNaN(value)) {
      return 6;
    }
    return Math.min(20, Math.max(1, Math.floor(value)));
  }

  private handleError(error: unknown, fallbackMessage: string): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const detail = error.response?.data && typeof error.response.data === 'object'
        ? JSON.stringify(error.response.data)
        : error.message;
      logger.warn('[ContentRecommenderService] axios error', { status, detail });
      if (status === 404) {
        return new Error('Không tìm thấy dữ liệu phù hợp trong dịch vụ gợi ý');
      }
      if (status === 400) {
        return new Error('Tham số yêu cầu không hợp lệ khi gọi dịch vụ gợi ý');
      }
    } else {
      logger.error('[ContentRecommenderService] unexpected error', error);
    }
    return new Error(fallbackMessage);
  }
}
