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

  isCustomer(): boolean {
    return this.role === 'customer';
  }

  isShopOwner(): boolean {
    return this.role === 'shop_owner';
  }

  isAdmin(): boolean {
    return this.role === 'admin';
  }

  canAccessAdminPanel(): boolean {
    return this.isAdmin() && this.isVerified;
  }

  canManageProducts(): boolean {
    return (this.isShopOwner() || this.isAdmin()) && this.isVerified;
  }

  isProfileComplete(): boolean {
    return !!(
      this.userName &&
      this.phone &&
      this.dateOfBirth &&
      this.isVerified
    );
  }

  getDisplayName(): string {
    return this.userName || this.email.split('@')[0];
  }

  toObject(): Omit<IUserEntity, 'password'> {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}
