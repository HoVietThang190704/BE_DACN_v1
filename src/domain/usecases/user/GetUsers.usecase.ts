import { IUserRepository } from '../../repositories/IUserRepository';
import { UserEntity } from '../../entities/User.entity';

export interface GetUsersOptions {
  page?: number;
  limit?: number;
  roles?: string[];
  role?: string;
  isVerified?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

export interface GetUsersResult {
  users: UserEntity[];
  total: number;
  page: number;
  limit: number;
}

export class GetUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(options: GetUsersOptions = {}): Promise<GetUsersResult> {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 10, 1), 100);
    const offset = (page - 1) * limit;

    const users = await this.userRepository.findAll({
      roles: options.roles,
      role: options.role,
      isVerified: options.isVerified,
      searchTerm: options.search,
      limit,
      offset,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      createdFrom: options.createdFrom,
      createdTo: options.createdTo
    });

    const total = await this.userRepository.count({
      roles: options.roles,
      role: options.role,
      isVerified: options.isVerified,
      searchTerm: options.search,
      createdFrom: options.createdFrom,
      createdTo: options.createdTo
    });

    return {
      users,
      total,
      page,
      limit
    };
  }
}
