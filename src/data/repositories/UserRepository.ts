import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserEntity } from '../../domain/entities/User.entity';
import { User as UserModel, IUser } from '../../models/users/User';
import { logger } from '../../shared/utils/logger';
import mongoose from 'mongoose';

export class UserRepository implements IUserRepository {
  async create(user: UserEntity): Promise<UserEntity> {
    const newUser = new UserModel({
      email: user.email,
      password: user.password,
      userName: user.userName,
      phone: user.phone,
      avatar: user.avatar,
      cloudinaryPublicId: user.cloudinaryPublicId,
      facebookID: user.facebookID,
      googleId: user.googleId,
      address: (user as any).address,
      role: user.role,
      isVerified: user.isVerified,
      date_of_birth: user.dateOfBirth
    });

    const savedUser = await newUser.save();
    return this.mapToEntity(savedUser);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await UserModel.findById(id);
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    return user ? this.mapToEntity(user) : null;
  }

  async findByGoogleId(googleId: string): Promise<UserEntity | null> {
    const user = await UserModel.findOne({ googleId });
    return user ? this.mapToEntity(user) : null;
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    const user = await UserModel.findOne({ phone });
    return user ? this.mapToEntity(user) : null;
  }

  async findManyByIds(ids: string[]): Promise<UserEntity[]> {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length === 0) {
      return [];
    }

    const objectIds = uniqueIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      return [];
    }

    const users = await UserModel.find({ _id: { $in: objectIds } });
    return users.map(user => this.mapToEntity(user));
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null> {
    const updateData: any = {};
    if (data.userName !== undefined) updateData.userName = data.userName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.cloudinaryPublicId !== undefined) updateData.cloudinaryPublicId = data.cloudinaryPublicId;
    if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
    if (data.role !== undefined) updateData.role = data.role;
    if ((data as any).address !== undefined) updateData.address = (data as any).address;

    const user = await UserModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return user ? this.mapToEntity(user) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async findAll(filters?: {
    role?: string;
    roles?: string[];
    isVerified?: boolean;
    searchTerm?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    createdFrom?: Date | string;
    createdTo?: Date | string;
  }): Promise<UserEntity[]> {
    const query: any = {};

    // role / roles
    if (filters?.roles && Array.isArray(filters.roles) && filters.roles.length > 0) {
      query.role = { $in: filters.roles };
    } else if (filters?.role) {
      query.role = filters.role;
    }

    if (filters?.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }

    // search
    if (filters?.searchTerm) {
      query.$or = [
        { email: { $regex: filters.searchTerm, $options: 'i' } },
        { userName: { $regex: filters.searchTerm, $options: 'i' } },
        { phone: { $regex: filters.searchTerm, $options: 'i' } }
      ];
    }

    // createdAt range
    if (filters?.createdFrom || filters?.createdTo) {
      query.createdAt = {};
      if (filters.createdFrom) query.createdAt.$gte = new Date(filters.createdFrom as any);
      if (filters.createdTo) query.createdAt.$lte = new Date(filters.createdTo as any);
    }

    let queryBuilder = UserModel.find(query);

    // sorting
    if (filters?.sortBy) {
      const order = filters.sortOrder === 'asc' ? 1 : -1;
      const sortObj: any = {};
      sortObj[filters.sortBy] = order;
      queryBuilder = queryBuilder.sort(sortObj);
    } else {
      queryBuilder = queryBuilder.sort({ createdAt: -1 });
    }

    if (filters?.limit) {
      queryBuilder = queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder = queryBuilder.skip(filters.offset);
    }

    const users = await queryBuilder.exec();
    return users.map(user => this.mapToEntity(user));
  }

  async count(filters?: {
    role?: string;
    roles?: string[];
    isVerified?: boolean;
    searchTerm?: string;
    createdFrom?: Date | string;
    createdTo?: Date | string;
  }): Promise<number> {
    const query: any = {};

    if (filters?.roles && Array.isArray(filters.roles) && filters.roles.length > 0) {
      query.role = { $in: filters.roles };
    } else if (filters?.role) {
      query.role = filters.role;
    }

    if (filters?.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }

    if (filters?.searchTerm) {
      query.$or = [
        { email: { $regex: filters.searchTerm, $options: 'i' } },
        { userName: { $regex: filters.searchTerm, $options: 'i' } },
        { phone: { $regex: filters.searchTerm, $options: 'i' } }
      ];
    }

    if (filters?.createdFrom || filters?.createdTo) {
      query.createdAt = {};
      if (filters.createdFrom) query.createdAt.$gte = new Date(filters.createdFrom as any);
      if (filters.createdTo) query.createdAt.$lte = new Date(filters.createdTo as any);
    }

    return UserModel.countDocuments(query);
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  async phoneExists(phone: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ phone });
    return count > 0;
  }

  private mapToEntity(model: IUser): UserEntity {
    return new UserEntity(
      model.email,
      model.password,
      model.role,
      model.isVerified,
      model._id.toString(),
      model.userName,
      model.phone,
      model.avatar,
      model.cloudinaryPublicId,
      model.facebookID,
      model.googleId,
      // address
      (model as any).address,
      // dateOfBirth
      model.date_of_birth,
      model.createdAt,
      model.updatedAt
    );
  }

  async updatePassword(id: string, hashedPassword: string): Promise<boolean> {
    try {
      const result = await UserModel.updateOne(
        { _id: id },
        { $set: { password: hashedPassword } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('UserRepository.updatePassword error:', error);
      return false;
    }
  }

  async setResetPasswordToken(email: string, token: string, expires: Date): Promise<boolean> {
    try {
      const result = await UserModel.updateOne(
        { email },
        {
          $set: {
            resetPasswordToken: token,
            resetPasswordExpires: expires
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('UserRepository.setResetPasswordToken error:', error);
      return false;
    }
  }

  async findByResetPasswordToken(token: string): Promise<UserEntity | null> {
    try {
      const user = await UserModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });

      if (!user) return null;

      return this.mapToEntity(user);
    } catch (error) {
      logger.error('UserRepository.findByResetPasswordToken error:', error);
      return null;
    }
  }

  async clearResetPasswordToken(id: string): Promise<boolean> {
    try {
      const result = await UserModel.updateOne(
        { _id: id },
        {
          $unset: {
            resetPasswordToken: '',
            resetPasswordExpires: ''
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('UserRepository.clearResetPasswordToken error:', error);
      return false;
    }
  }
}
