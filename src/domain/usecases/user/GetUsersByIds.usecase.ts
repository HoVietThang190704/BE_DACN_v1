import { IUserRepository } from '../../repositories/IUserRepository';
import { UserEntity } from '../../entities/User.entity';

export class GetUsersByIdsUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(ids: string[]): Promise<UserEntity[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    return this.userRepository.findManyByIds(ids);
  }
}
