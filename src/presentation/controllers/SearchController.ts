import { Request, Response } from 'express';
import { GlobalSearchUseCase } from '../../domain/usecases/search/GlobalSearch.usecase';
import { SearchMapper } from '../dto/search/Search.dto';
import { logger } from '../../shared/utils/logger';

export class SearchController {
  constructor(private readonly globalSearchUseCase: GlobalSearchUseCase) {}

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
}
