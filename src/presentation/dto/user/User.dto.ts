/**
 * Data Transfer Objects for User endpoints
 */

export interface UpdateProfileRequestDto {
  userName?: string;
  phone?: string;
  dateOfBirth?: string;
  avatar?: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  userName?: string;
  phone?: string;
  avatar?: string;
  address?: {
    province?: string;
    district?: string;
    commune?: string;
    street?: string;
    detail?: string;
  };
  facebookId?: string;
  googleId?: string;
  role: string;
  isVerified: boolean;
  dateOfBirth?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  locked?: boolean;
}

export class UserMapper {
  static toResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      userName: user.userName,
      phone: user.phone,
      avatar: user.avatar,
      address: user.address,
      facebookId: user.facebookId || user.facebookID,
      googleId: user.googleId,
      role: user.role,
      isVerified: user.isVerified,
      dateOfBirth: user.dateOfBirth,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      locked: user.locked
    };
  }
}
