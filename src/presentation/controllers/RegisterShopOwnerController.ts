import { Request, Response } from 'express';
import { SubmitRegisterShopOwnerRequestUseCase } from '../../domain/usecases/registerShopOwner/SubmitRegisterShopOwnerRequest.usecase';
import { GetMyRegisterShopOwnerRequestUseCase } from '../../domain/usecases/registerShopOwner/GetMyRegisterShopOwnerRequest.usecase';
import { ListRegisterShopOwnerRequestsUseCase } from '../../domain/usecases/registerShopOwner/ListRegisterShopOwnerRequests.usecase';
import { ReviewRegisterShopOwnerRequestUseCase } from '../../domain/usecases/registerShopOwner/ReviewRegisterShopOwnerRequest.usecase';
import { RegisterShopOwnerRequestMapper } from '../dto/registerShopOwner/RegisterShopOwnerRequest.dto';
import { logger } from '../../shared/utils/logger';

export class RegisterShopOwnerController {
  constructor(
    private submitUseCase: SubmitRegisterShopOwnerRequestUseCase,
    private getMineUseCase: GetMyRegisterShopOwnerRequestUseCase,
    private listUseCase: ListRegisterShopOwnerRequestsUseCase,
    private reviewUseCase: ReviewRegisterShopOwnerRequestUseCase
  ) {}

  async submit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, message: 'Vui lòng tải lên giấy chứng nhận' });
        return;
      }

      const request = await this.submitUseCase.execute({
        userId,
        certificateFile: req.file
      });

      res.status(201).json({
        success: true,
        message: 'Gửi yêu cầu thành công',
        data: RegisterShopOwnerRequestMapper.toDTO(request)
      });
    } catch (error: any) {
      logger.error('Submit register shop owner error:', error);
      res.status(400).json({
        success: false,
        message: error?.message || 'Không thể gửi yêu cầu'
      });
    }
  }

  async getMine(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const request = await this.getMineUseCase.execute(userId);
      res.json({
        success: true,
        data: request ? RegisterShopOwnerRequestMapper.toDTO(request) : null
      });
    } catch (error) {
      logger.error('Get register request error:', error);
      res.status(500).json({ success: false, message: 'Không thể lấy thông tin yêu cầu' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { status, page = '1', limit = '20' } = req.query;
      const pageNumber = Math.max(1, parseInt(String(page), 10) || 1);
      const limitNumber = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
      const filterStatus = typeof status === 'string' && ['pending', 'approved', 'rejected'].includes(status)
        ? (status as 'pending' | 'approved' | 'rejected')
        : undefined;

      const result = await this.listUseCase.execute({
        status: filterStatus,
        limit: limitNumber,
        offset: (pageNumber - 1) * limitNumber
      });

      res.json({
        success: true,
        data: result.data.map((item) => RegisterShopOwnerRequestMapper.toDTO(item)),
        meta: {
          total: result.total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(result.total / limitNumber)
        }
      });
    } catch (error) {
      logger.error('List register requests error:', error);
      res.status(500).json({ success: false, message: 'Không thể lấy danh sách yêu cầu' });
    }
  }

  async review(req: Request, res: Response): Promise<void> {
    try {
      const reviewerId = req.user?.userId;
      if (!reviewerId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { status, reviewMessage } = req.body;

      const updated = await this.reviewUseCase.execute({
        requestId: id,
        reviewerId,
        status,
        reviewMessage
      });

      res.json({
        success: true,
        message: 'Cập nhật trạng thái thành công',
        data: RegisterShopOwnerRequestMapper.toDTO(updated)
      });
    } catch (error: any) {
      logger.error('Review register request error:', error);
      res.status(400).json({ success: false, message: error?.message || 'Không thể cập nhật trạng thái' });
    }
  }
}
