import mongoose from 'mongoose';
import { RegisterShopOwnerRequestModel } from '../../models/RegisterShopOwnerRequest';
import { IListRegisterShopOwnerFilter, IRegisterShopOwnerRepository } from '../../domain/repositories/IRegisterShopOwnerRepository';
import { IRegisterShopOwnerRequestEntity, RegisterShopOwnerRequestEntity } from '../../domain/entities/RegisterShopOwnerRequest.entity';
import { logger } from '../../shared/utils/logger';

export class RegisterShopOwnerRepository implements IRegisterShopOwnerRepository {
  private toDomain(model: any): RegisterShopOwnerRequestEntity {
    return new RegisterShopOwnerRequestEntity({
      id: String(model._id),
      userId: String(model.user_id),
      certificateUrl: model.certificateUrl,
      certificatePublicId: model.certificatePublicId,
      status: model.status,
      reviewMessage: model.reviewMessage ?? null,
      reviewedBy: model.reviewedBy ? String(model.reviewedBy) : null,
      reviewedAt: model.reviewedAt ?? null,
      userSnapshot: model.userSnapshot ?? null,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  async create(data: Omit<IRegisterShopOwnerRequestEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<RegisterShopOwnerRequestEntity> {
    try {
      const doc = await RegisterShopOwnerRequestModel.create({
        user_id: new mongoose.Types.ObjectId(data.userId),
        certificateUrl: data.certificateUrl,
        certificatePublicId: data.certificatePublicId,
        status: data.status,
        reviewMessage: data.reviewMessage ?? null,
        reviewedBy: data.reviewedBy ? new mongoose.Types.ObjectId(data.reviewedBy) : null,
        reviewedAt: data.reviewedAt ?? null,
        userSnapshot: data.userSnapshot ?? null
      });
      return this.toDomain(doc);
    } catch (error) {
      logger.error('RegisterShopOwnerRepository.create error:', error);
      throw new Error('Không thể tạo yêu cầu đăng ký shop owner');
    }
  }

  async findById(id: string): Promise<RegisterShopOwnerRequestEntity | null> {
    const doc = await RegisterShopOwnerRequestModel.findById(id).lean();
    return doc ? this.toDomain(doc) : null;
  }

  async findLatestByUserId(userId: string): Promise<RegisterShopOwnerRequestEntity | null> {
    const query: any = { $or: [] };
    if (mongoose.Types.ObjectId.isValid(userId)) {
      query.$or.push({ user_id: new mongoose.Types.ObjectId(userId) });
    }
    query.$or.push({ user_id: userId });

    const doc = await RegisterShopOwnerRequestModel.findOne(query.$or.length > 0 ? { $or: query.$or } : { user_id: userId })
      .sort({ createdAt: -1 })
      .lean();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(filter: IListRegisterShopOwnerFilter = {}): Promise<RegisterShopOwnerRequestEntity[]> {
    const query: any = {};
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.userId) {
      if (mongoose.Types.ObjectId.isValid(filter.userId)) {
        query.user_id = new mongoose.Types.ObjectId(filter.userId);
      } else {
        query.user_id = filter.userId;
      }
    }

    const cursor = RegisterShopOwnerRequestModel.find(query)
      .sort({ createdAt: -1 });

    if (filter.offset) {
      cursor.skip(filter.offset);
    }
    if (filter.limit) {
      cursor.limit(filter.limit);
    }

    const docs = await cursor.lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async count(filter: IListRegisterShopOwnerFilter = {}): Promise<number> {
    const query: any = {};
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.userId) {
      if (mongoose.Types.ObjectId.isValid(filter.userId)) {
        query.user_id = new mongoose.Types.ObjectId(filter.userId);
      } else {
        query.user_id = filter.userId;
      }
    }
    return RegisterShopOwnerRequestModel.countDocuments(query);
  }

  async update(id: string, data: Partial<Omit<IRegisterShopOwnerRequestEntity, 'id' | 'userId'>>): Promise<RegisterShopOwnerRequestEntity | null> {
    const update: any = { ...data };
    if (data.reviewedBy) {
      update.reviewedBy = new mongoose.Types.ObjectId(data.reviewedBy);
    }
    const doc = await RegisterShopOwnerRequestModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean();
    return doc ? this.toDomain(doc) : null;
  }
}
