import { IAddressRepository } from '../../domain/repositories/IAddressRepository';
import { AddressEntity } from '../../domain/entities/Address.entity';
import { Address, IAddress } from '../../models/Address';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export class AddressRepository implements IAddressRepository {
  
  private toDomainEntity(model: IAddress): AddressEntity {
    return new AddressEntity({
      id: String(model._id),
      userId: String(model.userId),
      recipientName: model.recipientName,
      phone: model.phone,
      address: model.address,
      ward: model.ward,
      district: model.district,
      province: model.province,
      isDefault: model.isDefault,
      label: model.label,
      note: model.note,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  async findById(id: string): Promise<AddressEntity | null> {
    try {
      const address = await Address.findById(id).lean();
      return address ? this.toDomainEntity(address as unknown as IAddress) : null;
    } catch (error) {
      logger.error('AddressRepository.findById error:', error);
      throw new Error('Lỗi khi tìm địa chỉ');
    }
  }

  async findByUserId(userId: string): Promise<AddressEntity[]> {
    try {
      const addresses = await Address.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ isDefault: -1, createdAt: -1 })
        .lean();

      return addresses.map(a => this.toDomainEntity(a as unknown as IAddress));
    } catch (error) {
      logger.error('AddressRepository.findByUserId error:', error);
      throw new Error('Lỗi khi lấy danh sách địa chỉ');
    }
  }

  async getDefaultAddress(userId: string): Promise<AddressEntity | null> {
    try {
      const address = await Address.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        isDefault: true
      }).lean();

      return address ? this.toDomainEntity(address as unknown as IAddress) : null;
    } catch (error) {
      logger.error('AddressRepository.getDefaultAddress error:', error);
      throw new Error('Lỗi khi lấy địa chỉ mặc định');
    }
  }

  async create(address: Omit<import('../../domain/entities/Address.entity').IAddressEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AddressEntity> {
    try {
      const count = await this.countByUserId(address.userId);
      const isFirstAddress = count === 0;

      const newAddress = await Address.create({
        ...address,
        userId: new mongoose.Types.ObjectId(address.userId),
        isDefault: isFirstAddress ? true : address.isDefault
      });

      return this.toDomainEntity(newAddress as IAddress);
    } catch (error) {
      logger.error('AddressRepository.create error:', error);
      throw new Error('Lỗi khi tạo địa chỉ');
    }
  }

  async update(id: string, userId: string, data: Partial<AddressEntity>): Promise<AddressEntity | null> {
    try {
      const updated = await Address.findOneAndUpdate(
        { _id: id, userId: new mongoose.Types.ObjectId(userId) },
        { $set: data },
        { new: true, runValidators: true }
      ).lean();

      return updated ? this.toDomainEntity(updated as unknown as IAddress) : null;
    } catch (error) {
      logger.error('AddressRepository.update error:', error);
      throw new Error('Lỗi khi cập nhật địa chỉ');
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const address = await Address.findOne({
        _id: id,
        userId: new mongoose.Types.ObjectId(userId)
      });
      if (!address) {
        return false;
      }
      const result = await Address.findOneAndDelete({
        _id: id,
        userId: new mongoose.Types.ObjectId(userId)
      });
      if (result && result.isDefault) {
        const firstAddress = await Address.findOne({
          userId: new mongoose.Types.ObjectId(userId)
        }).sort({ createdAt: 1 });
        if (firstAddress) {
          await Address.findByIdAndUpdate(firstAddress._id, { isDefault: true });
        }
      }
      return result !== null;
    } catch (error) {
      logger.error('AddressRepository.delete error:', error);
      throw new Error('Lỗi khi xóa địa chỉ');
    }
  }
  
  async setDefault(id: string, userId: string): Promise<AddressEntity | null> {
    try {
      await Address.updateMany(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $set: { isDefault: false } }
      );
      const updated = await Address.findOneAndUpdate(
        { _id: id, userId: new mongoose.Types.ObjectId(userId) },
        { $set: { isDefault: true } },
        { new: true }
      ).lean();
      return updated ? this.toDomainEntity(updated as unknown as IAddress) : null;
    } catch (error) {
      logger.error('AddressRepository.setDefault error:', error);
      throw new Error('Lỗi khi đặt địa chỉ mặc định');
    }
  }

  async countByUserId(userId: string): Promise<number> {
    try {
      return await Address.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    } catch (error) {
      logger.error('AddressRepository.countByUserId error:', error);
      return 0;
    }
  }

  async belongsToUser(id: string, userId: string): Promise<boolean> {
    try {
      const count = await Address.countDocuments({
        _id: id,
        userId: new mongoose.Types.ObjectId(userId)
      });
      return count > 0;
    } catch (error) {
      logger.error('AddressRepository.belongsToUser error:', error);
      return false;
    }
  }
}
