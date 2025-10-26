import { Request, Response } from 'express';
import { GetUserAddressesUseCase } from '../../domain/usecases/address/GetUserAddresses.usecase';
import { CreateAddressUseCase } from '../../domain/usecases/address/CreateAddress.usecase';
import { UpdateAddressUseCase } from '../../domain/usecases/address/UpdateAddress.usecase';
import { DeleteAddressUseCase } from '../../domain/usecases/address/DeleteAddress.usecase';
import { SetDefaultAddressUseCase } from '../../domain/usecases/address/SetDefaultAddress.usecase';
import { AddressMapper } from '../dto/address/Address.dto';
import { logger } from '../../shared/utils/logger';

/**
 * Address Controller - HTTP Layer
 */
export class AddressController {
  constructor(
    private getUserAddressesUseCase: GetUserAddressesUseCase,
    private createAddressUseCase: CreateAddressUseCase,
    private updateAddressUseCase: UpdateAddressUseCase,
    private deleteAddressUseCase: DeleteAddressUseCase,
    private setDefaultAddressUseCase: SetDefaultAddressUseCase
  ) {}

  /**
   * GET /api/users/me/addresses
   * Get all addresses of current user
   */
  async getUserAddresses(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const addresses = await this.getUserAddressesUseCase.execute(userId);
      const response = AddressMapper.toArrayDTO(addresses);

      res.status(200).json({
        success: true,
        data: response,
        meta: {
          total: addresses.length
        }
      });
    } catch (error: any) {
      logger.error('AddressController.getUserAddresses error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy danh sách địa chỉ'
      });
    }
  }

  /**
   * POST /api/users/me/addresses
   * Create new address
   */
  async createAddress(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { recipientName, phone, address, ward, district, province, isDefault, label, note } = req.body;

      const newAddress = await this.createAddressUseCase.execute({
        userId,
        recipientName,
        phone,
        address,
        ward,
        district,
        province,
        isDefault,
        label,
        note
      });

      const response = AddressMapper.toDTO(newAddress);

      logger.info(`Address created for user: ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Tạo địa chỉ thành công',
        data: response
      });
    } catch (error: any) {
      logger.error('AddressController.createAddress error:', error);
      
      if (error.message.includes('không được để trống') || error.message.includes('không hợp lệ')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo địa chỉ'
      });
    }
  }

  /**
   * PUT /api/users/me/addresses/:id
   * Update address
   */
  async updateAddress(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { recipientName, phone, address, ward, district, province, label, note } = req.body;

      const updated = await this.updateAddressUseCase.execute(id, userId, {
        recipientName,
        phone,
        address,
        ward,
        district,
        province,
        label,
        note
      });

      const response = AddressMapper.toDTO(updated);

      logger.info(`Address updated: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Cập nhật địa chỉ thành công',
        data: response
      });
    } catch (error: any) {
      logger.error('AddressController.updateAddress error:', error);
      
      if (error.message.includes('Không tìm thấy') || error.message.includes('không có quyền')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật địa chỉ'
      });
    }
  }

  /**
   * DELETE /api/users/me/addresses/:id
   * Delete address
   */
  async deleteAddress(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      await this.deleteAddressUseCase.execute(id, userId);

      logger.info(`Address deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Xóa địa chỉ thành công'
      });
    } catch (error: any) {
      logger.error('AddressController.deleteAddress error:', error);
      
      if (error.message.includes('Không tìm thấy') || error.message.includes('không có quyền')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa địa chỉ'
      });
    }
  }

  /**
   * PATCH /api/users/me/addresses/:id/default
   * Set address as default
   */
  async setDefaultAddress(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const updated = await this.setDefaultAddressUseCase.execute(id, userId);
      const response = AddressMapper.toDTO(updated);

      logger.info(`Default address set: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Đặt địa chỉ mặc định thành công',
        data: response
      });
    } catch (error: any) {
      logger.error('AddressController.setDefaultAddress error:', error);
      
      if (error.message.includes('Không tìm thấy') || error.message.includes('không có quyền')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi khi đặt địa chỉ mặc định'
      });
    }
  }
}
