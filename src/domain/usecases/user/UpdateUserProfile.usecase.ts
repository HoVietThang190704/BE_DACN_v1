import { IUserRepository } from '../../repositories/IUserRepository';
import { UserEntity } from '../../entities/User.entity';

export interface UpdateProfileInput {
  userId: string;
  userName?: string;
  phone?: string;
  dateOfBirth?: Date;
  avatar?: string | null;
  address?: {
    province?: string;
    district?: string;
    commune?: string;
    street?: string;
    detail?: string;
  } | null;
  role?: string;
  isVerified?: boolean;
}

/**
 * Update User Profile Use Case
 * Business logic for updating user profile
 */
export class UpdateUserProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: UpdateProfileInput): Promise<UserEntity> {
    // 1. Validate input
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    // 2. Check if user exists
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 3. Validate phone uniqueness if provided and different from current
    if (input.phone && input.phone !== user.phone) {
      const phoneExists = await this.userRepository.phoneExists(input.phone);
      if (phoneExists) {
        throw new Error('Phone number already in use');
      }

      // Validate phone format
      const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8}$/;
      if (!phoneRegex.test(input.phone)) {
        throw new Error('Invalid phone number format');
      }
    }

    // 4. Validate userName if provided
    if (input.userName !== undefined) {
      if (input.userName.length < 1) {
        throw new Error('User name cannot be empty');
      }
      if (input.userName.length > 50) {
        throw new Error('User name cannot exceed 50 characters');
      }
    }

    // 5. Validate date of birth if provided
    if (input.dateOfBirth) {
      const age = this.calculateAge(input.dateOfBirth);
      if (age < 13) {
        throw new Error('User must be at least 13 years old');
      }
      if (age > 150) {
        throw new Error('Invalid date of birth');
      }
    }

    // 6. Prepare update data
    const updateData: Partial<UserEntity> = {};
    if (input.userName !== undefined) updateData.userName = input.userName;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.dateOfBirth !== undefined) updateData.dateOfBirth = input.dateOfBirth;
    if (input.avatar !== undefined) updateData.avatar = input.avatar as any;
    if (input.address !== undefined) (updateData as any).address = input.address;
    if (input.role !== undefined) updateData.role = input.role as "customer" | "shop_owner" | "admin";
    if (input.isVerified !== undefined) updateData.isVerified = input.isVerified;

    // 7. Update user
    const updatedUser = await this.userRepository.update(input.userId, updateData);

    if (!updatedUser) {
      throw new Error('Failed to update user profile');
    }

    return updatedUser;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}
