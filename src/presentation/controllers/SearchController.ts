import { Request, Response } from 'express';
import { GlobalSearchUseCase } from '../../domain/usecases/search/GlobalSearch.usecase';
import { SuggestProductsUseCase } from '../../domain/usecases/search/SuggestProducts.usecase';
import { SearchMapper } from '../dto/search/Search.dto';
import { logger } from '../../shared/utils/logger';
import { elasticsearchService } from '../../services/search';

export class SearchController {
  constructor(
    private readonly globalSearchUseCase: GlobalSearchUseCase,
    private readonly suggestProductsUseCase: SuggestProductsUseCase
  ) {}

  async search(req: Request, res: Response): Promise<void> {
    try {
  const rawQuery = req.query.q;
  const queryValue = typeof rawQuery === 'string' ? rawQuery : Array.isArray(rawQuery) ? rawQuery[0] : '';
  const query = typeof queryValue === 'string' ? queryValue : String(queryValue ?? '');

      const parseLimit = (value: unknown): number | undefined => {
        if (typeof value === 'string' && value.trim().length > 0) {
          const parsed = Number.parseInt(value, 10);
          if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
          }
        }
        return undefined;
      };

      const productsLimit = parseLimit(req.query.productsLimit);
      const postsLimit = parseLimit(req.query.postsLimit);
      const usersLimit = parseLimit(req.query.usersLimit);

      const result = await this.globalSearchUseCase.execute(query, {
        productsLimit,
        postsLimit,
        usersLimit
      });

      res.status(200).json({
        success: true,
        data: SearchMapper.toDTO(result)
      });
    } catch (error: any) {
      const message = error?.message || 'Lỗi khi tìm kiếm dữ liệu';
      const statusCode = message.includes('từ khóa') ? 400 : 500;
      logger.error('SearchController.search error:', error);
      res.status(statusCode).json({
        success: false,
        message
      });
    }
  }

  async suggest(req: Request, res: Response): Promise<void> {
    try {
      const rawText = req.query.text ?? req.query.q ?? '';
      const rawValue = Array.isArray(rawText) ? rawText[0] : rawText;
      const text = String(rawValue ?? '');
      const limitParam = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;
      const limit = Number.isFinite(limitParam) && (limitParam as number) > 0 ? (limitParam as number) : 8;

      const suggestions = await this.suggestProductsUseCase.execute(text, limit);

      res.status(200).json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      logger.error('SearchController.suggest error:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy gợi ý tìm kiếm'
      });
    }
  }

  async inspect(req: Request, res: Response): Promise<void> {
    try {
      const rawText = req.query.text ?? req.query.q ?? '';
      const rawValue = Array.isArray(rawText) ? rawText[0] : rawText;
      const text = String(rawValue ?? '');

      const limitParam = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;
      const limit = Number.isFinite(limitParam) && (limitParam as number) > 0 ? (limitParam as number) : 12;

      const esSuggest = elasticsearchService?.isEnabled() ? await elasticsearchService.suggestProducts(text, limit).catch((e: any) => { logger.warn('ES suggest failed', e); return []; }) : [];
      const esSearch = elasticsearchService?.isEnabled() ? await elasticsearchService.searchProducts(text, { limit: 50, page: 1 }).catch((e: any) => { logger.warn('ES search failed', e); return null; }) : null;

      // merged suggestions (current production behaviour)
      const mergedSuggest = await this.suggestProductsUseCase.execute(text, limit).catch(e => { logger.warn('merged suggest failed', e); return []; });

      // global search (products/posts/users) to compare
      const global = await this.globalSearchUseCase.execute(text, { productsLimit: 50, postsLimit: 20, usersLimit: 20 }).catch(e => { logger.warn('global search failed', e); return null; });

      res.status(200).json({ success: true, data: { query: text, esSuggest, esSearch, mergedSuggest, global } });
    } catch (error) {
      logger.error('SearchController.inspect error:', error);
      res.status(500).json({ success: false, message: 'Không thể inspect tìm kiếm' });
    }
  }
}
