import { Request, Response } from 'express';
import { GetUsersUseCase } from '../../domain/usecases/user/GetUsers.usecase';
import { UserMapper } from '../dto/user/User.dto';
import { logger } from '../../shared/utils/logger';

export class AdminUserController {
  constructor(private getUsersUseCase: GetUsersUseCase) {}

  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const roles = req.query.role && Array.isArray(req.query.role)
        ? (req.query.role as string[])
        : (req.query.roles as string[] | undefined);

      // support role (single) and role[]
      const roleSingle = typeof req.query.role === 'string' ? req.query.role : undefined;

      const isVerified = req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined;
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
      const createdFrom = req.query.createdFrom as string | undefined;
      const createdTo = req.query.createdTo as string | undefined;

      const result = await this.getUsersUseCase.execute({
        page,
        limit,
        roles: roles || undefined,
        role: roleSingle,
        isVerified,
        search,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        createdFrom,
        createdTo
      });

      const data = result.users.map(u => UserMapper.toResponseDto(u));

      res.json({
        success: true,
        message: 'Lấy danh sách người dùng thành công',
        data: {
          users: data,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: Math.ceil((result.total || 0) / result.limit)
          }
        }
      });
    } catch (error: any) {
      logger.error('AdminUserController.listUsers error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách người dùng' });
    }
  }
}
