import { IUserRepository } from '../../repositories/IUserRepository';
import { UserEntity } from '../../entities/User.entity';

/**
 * Get User Profile Use Case
 * Business logic for retrieving user profile
 */
export class GetUserProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserEntity> {
    // Validate input
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get user from repository
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
