import { IUserRepository } from '../../repositories/IUserRepository';
import { UserEntity } from '../../entities/User.entity';

export interface SearchUsersOptions {
  limit?: number;
}

export interface SearchUsersResult {
  users: UserEntity[];
  hasMore: boolean;
  total: number;
  limit: number;
}

const MIN_QUERY_LENGTH = 1;
const DEFAULT_LIMIT = 6;

export class SearchUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: string, options: SearchUsersOptions = {}): Promise<SearchUsersResult> {
    const keyword = (query ?? '').trim();
    if (keyword.length === 0) {
      throw new Error('Từ khóa tìm kiếm không được để trống');
    }

    if (keyword.length < MIN_QUERY_LENGTH) {
      throw new Error(`Từ khóa tìm kiếm phải có ít nhất ${MIN_QUERY_LENGTH} ký tự`);
    }

    const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), 50);
    const fetchLimit = limit + 1;

    const users = await this.userRepository.findAll({
      searchTerm: keyword,
      limit: fetchLimit,
      offset: 0
    });

    const hasMore = users.length > limit;
    const trimmedUsers = hasMore ? users.slice(0, limit) : users;

    let total = trimmedUsers.length + (hasMore ? 1 : 0);
    try {
      total = await this.userRepository.count({ searchTerm: keyword });
    } catch {
    }

    return {
      users: trimmedUsers,
      hasMore,
      total,
      limit
    };
  }
}
