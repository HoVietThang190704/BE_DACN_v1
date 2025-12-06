import mongoose, { Document, Schema } from 'mongoose';

export type OTPType = 'phone' | 'email';

export interface IOTP extends Document {
  target: string;
  targetType: OTPType;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
}

const PHONE_REGEX = /^(\+84|84|0)[1-9][0-9]{8}$/;
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

const OTPSchema: Schema<IOTP> = new Schema({
  target: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(this: IOTP, value: string) {
        if (this.targetType === 'phone') {
          return PHONE_REGEX.test(value);
        }
        if (this.targetType === 'email') {
          return EMAIL_REGEX.test(value);
        }
        return false;
      },
      message: 'Thông tin xác thực không hợp lệ'
    }
  },
  targetType: {
    type: String,
    enum: ['phone', 'email'],
    required: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000),
    index: { expires: '5m' }
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

OTPSchema.index({ target: 1, targetType: 1, createdAt: -1 });

export const OTP = mongoose.model<IOTP>('OTP', OTPSchema);
