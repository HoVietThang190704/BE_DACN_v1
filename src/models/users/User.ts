import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  userName?: string;
  password: string;
  phone?: string;
  avatar?: string;
  cloudinaryPublicId?: string;
  facebookID?: string;
  googleId?: string;
  role: 'customer' | 'shop_owner' | 'admin';
  isVerified: boolean;
  date_of_birth?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Email không hợp lệ'
    ]
  },
  userName: {
    type: String,
    trim: true,
    maxlength: [50, 'Tên người dùng không được vượt quá 50 ký tự']
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },
  phone: {
    type: String,
    trim: true,
    match: [
      /^(\+84|84|0)[1-9][0-9]{8}$/,
      'Số điện thoại không hợp lệ'
    ]
  },
  avatar: {
    type: String
  },
  cloudinaryPublicId: {
    type: String
  },
  facebookID: {
    type: String
  },
  googleId: {
    type: String
  },
  role: {
    type: String,
    enum: ['customer', 'shop_owner', 'admin'],
    default: 'customer', // Mặc định là customer khi đăng ký
    validate: {
      validator: function(this: IUser, value: string) {
        // Chỉ cho phép thay đổi role thành admin thông qua database
        // Không cho phép set role = admin qua API register
        if (this.isNew && value === 'admin') {
          return false;
        }
        return true;
      },
      message: 'Không thể tự đặt vai trò admin khi đăng ký. Liên hệ quản trị viên để được cấp quyền.'
    }
  },
  isVerified: {
    type: Boolean,
    required: [true, 'Trạng thái xác thực là bắt buộc'],
    default: false // Mặc định chưa xác thực khi đăng ký
  },
  date_of_birth: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true, // Tự động tạo createdAt và updatedAt
  collection: 'users'
});

// Indexes (chỉ để lại một index cho email vì unique: true đã tạo index)
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isVerified: 1 });
UserSchema.index({ createdAt: -1 });

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.model<IUser>('User', UserSchema);