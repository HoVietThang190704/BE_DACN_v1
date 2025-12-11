/**
 * User Entity - Pure domain object
 * Contains user business logic, no framework dependencies
 */
export interface IUserEntity {
  id?: string;
  email: string;
  userName?: string;
  password: string;
  phone?: string;
  avatar?: string;
  cloudinaryPublicId?: string;
  facebookID?: string;
  googleId?: string;
  address?: {
    province?: string;
    district?: string;
    commune?: string;
    street?: string;
    detail?: string;
  };
  role: 'customer' | 'shop_owner' | 'admin';
  isVerified: boolean;
  dateOfBirth?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  locked?: boolean;
}

export class UserEntity implements IUserEntity {
  constructor(
    public email: string,
    public password: string,
    public role: 'customer' | 'shop_owner' | 'admin' = 'customer',
    public isVerified: boolean = false,
    public id?: string,
    public userName?: string,
    public phone?: string,
    public avatar?: string,
    public cloudinaryPublicId?: string,
    public facebookID?: string,
    public googleId?: string,
    public address?: {
      province?: string;
      district?: string;
      commune?: string;
      street?: string;
      detail?: string;
    },
    public dateOfBirth?: Date,
    public createdAt?: Date,
    public updatedAt?: Date,
    public locked?: boolean
  ) {}

  /**
   * Domain logic: Check if user is a customer
   */
  isCustomer(): boolean {
    return this.role === 'customer';
  }

  /**
   * Domain logic: Check if user is a shop owner
   */
  isShopOwner(): boolean {
    return this.role === 'shop_owner';
  }

  /**
   * Domain logic: Check if user is an admin
   */
  isAdmin(): boolean {
    return this.role === 'admin';
  }

  /**
   * Domain logic: Check if user can access admin panel
   */
  canAccessAdminPanel(): boolean {
    return this.isAdmin() && this.isVerified;
  }

  /**
   * Domain logic: Check if user can manage products
   */
  canManageProducts(): boolean {
    return (this.isShopOwner() || this.isAdmin()) && this.isVerified;
  }

  /**
   * Domain logic: Check if profile is complete
   */
  isProfileComplete(): boolean {
    return !!(
      this.userName &&
      this.phone &&
      this.dateOfBirth &&
      this.isVerified
    );
  }

  /**
   * Domain logic: Get user display name
   */
  getDisplayName(): string {
    return this.userName || this.email.split('@')[0];
  }

  /**
   * Domain logic: Convert to plain object (for response)
   */
  toObject(): Omit<IUserEntity, 'password'> {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}
