import { UserEntity } from '../entities/User.entity';

export interface IUserRepository {
  create(user: UserEntity): Promise<UserEntity>;

  findById(id: string): Promise<UserEntity | null>;

  findByEmail(email: string): Promise<UserEntity | null>;

  findByPhone(phone: string): Promise<UserEntity | null>;

  findManyByIds(ids: string[]): Promise<UserEntity[]>;

  update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null>;

  delete(id: string): Promise<boolean>;

  findAll(filters?: {
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
  }): Promise<UserEntity[]>;

  count(filters?: {
    role?: string;
    roles?: string[];
    isVerified?: boolean;
    searchTerm?: string;
    createdFrom?: Date | string;
    createdTo?: Date | string;
  }): Promise<number>;

  emailExists(email: string): Promise<boolean>;

  phoneExists(phone: string): Promise<boolean>;

  updatePassword(id: string, hashedPassword: string): Promise<boolean>;

  setResetPasswordToken(email: string, token: string, expires: Date): Promise<boolean>;

  findByResetPasswordToken(token: string): Promise<UserEntity | null>;

  clearResetPasswordToken(id: string): Promise<boolean>;
}
