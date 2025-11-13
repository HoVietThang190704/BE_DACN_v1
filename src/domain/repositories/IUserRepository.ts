import { UserEntity } from '../entities/User.entity';

/**
 * User Repository Interface
 * Defines contract for user data operations
 * Implementation will be in data layer
 */
export interface IUserRepository {
  /**
   * Create a new user
   */
  create(user: UserEntity): Promise<UserEntity>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<UserEntity | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Find user by phone
   */
  findByPhone(phone: string): Promise<UserEntity | null>;

  findManyByIds(ids: string[]): Promise<UserEntity[]>;

  /**
   * Update user information
   */
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null>;

  /**
   * Delete user
   */
  delete(id: string): Promise<boolean>;

  /**
   * Find all users with optional filters
   */
  findAll(filters?: {
    role?: string;
    isVerified?: boolean;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserEntity[]>;

  /**
   * Count users with optional filters
   */
  count(filters?: {
    role?: string;
    isVerified?: boolean;
    searchTerm?: string;
  }): Promise<number>;

  /**
   * Check if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Check if phone exists
   */
  phoneExists(phone: string): Promise<boolean>;

  /**
   * Update password
   */
  updatePassword(id: string, hashedPassword: string): Promise<boolean>;

  /**
   * Set reset password token
   */
  setResetPasswordToken(email: string, token: string, expires: Date): Promise<boolean>;

  /**
   * Find user by reset password token
   */
  findByResetPasswordToken(token: string): Promise<UserEntity | null>;

  /**
   * Clear reset password token
   */
  clearResetPasswordToken(id: string): Promise<boolean>;
}
